import OpenAI from 'openai';
import { connectDB } from '../../lib/mongodb';
import Draft from '../../models/Draft';
import { requireAuth } from '../../lib/auth';

const SYSTEM_PROMPT = `Você é um consultor especialista em diagnóstico de negócios, marketing digital, automação empresarial e desenvolvimento de sistemas da TM Dev.

Seu objetivo é conduzir um briefing inteligente com um possível cliente, entendendo profundamente seu negócio para identificar oportunidades de:
• automação • sistemas personalizados • inteligência artificial • marketing digital
• geração de leads • presença online • otimização de processos • captação de clientes

REGRAS IMPORTANTES:
1. Faça APENAS UMA pergunta por vez.
2. Analise a resposta antes de gerar a próxima pergunta.
3. Adapte as perguntas ao tipo de negócio informado.
4. Aprofunde nas áreas importantes conforme o contexto.
5. Seja claro, profissional mas amigável.
6. Nunca repita perguntas já feitas.
7. Após pelo menos 8 trocas de perguntas e respostas, gere o diagnóstico final.

FLUXO:
Etapa 1 — Identificação do negócio (profissão, equipe, empresa, cidade)
Etapa 2 — Modelo de negócio (serviços, clientes, cobrança, atendimento, vendas)
Etapa 3 — Captação de clientes (redes sociais, anúncios, indicações, site)
Etapa 4 — Presença digital (site, portfólio, redes, conteúdo, marketing)
Etapa 5 — Processos internos (organização, sistemas, propostas, orçamentos)
Etapa 6 — Dor principal (maior dificuldade atual)
Etapa 7 — Objetivos (crescimento, clientes, faturamento, cliente ideal)
Etapa 8 — DIAGNÓSTICO FINAL

FORMATO DE RESPOSTA — OBRIGATÓRIO:
Responda SEMPRE em JSON puro, sem markdown, sem blocos de código.

Para perguntas normais:
{"type":"question","question":"Texto da pergunta aqui?","options":["Opção A","Opção B","Opção C","Opção D"],"progress":25}

Para o diagnóstico final (após coletar informações suficientes):
{"type":"diagnosis","diagnosis":"RESUMO DO NEGÓCIO\\n...\\n\\nPRINCIPAIS DESAFIOS\\n...\\n\\nOPORTUNIDADES\\n...\\n\\nAUTOMAÇÕES POSSÍVEIS\\n...\\n\\nESTRATÉGIAS DE MARKETING\\n...\\n\\nSISTEMAS OU FERRAMENTAS\\n...\\n\\nESTRATÉGIAS DE CAPTAÇÃO\\n...\\n\\nRECOMENDAÇÕES\\n...","progress":100}

REGRAS DO JSON:
- "options": entre 3 e 6 opções curtas e relevantes ao contexto do negócio
- "progress": número de 0 a 99 para perguntas, 100 para diagnóstico (aumente gradualmente)
- As opções devem ser práticas e específicas ao tipo de negócio identificado
- NUNCA inclua markdown, somente JSON puro`;

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { userMessage, selectedOptions = [], reset = false } = req.body || {};

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY não configurada no .env' });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  await connectDB();

  // ── Load or create draft ───────────────────────────────────────────
  let draft = await Draft.findOne({ userId: req.user.id });

  if (reset || !draft) {
    if (draft) await Draft.deleteOne({ userId: req.user.id });
    draft = new Draft({ userId: req.user.id, messages: [], progress: 0 });
  }

  // ── Build user message combining options + free text ──────────────
  let fullUserMessage = '';
  if (selectedOptions.length > 0) {
    fullUserMessage = selectedOptions.join(', ');
    if (userMessage?.trim()) fullUserMessage += ` — ${userMessage.trim()}`;
  } else if (userMessage?.trim()) {
    fullUserMessage = userMessage.trim();
  }

  if (!fullUserMessage) {
    // First call — no user message yet, just start the interview
    fullUserMessage = '__START__';
  }

  // Build messages array for OpenAI
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  // Add existing history
  draft.messages.forEach(m => messages.push({ role: m.role, content: m.content }));

  // Add new user message (skip on first start)
  if (fullUserMessage !== '__START__') {
    messages.push({ role: 'user', content: fullUserMessage });
    draft.messages.push({ role: 'user', content: fullUserMessage });
  }

  // On first call, send a trigger message
  if (draft.messages.length === 0) {
    const trigger = 'Inicie o briefing fazendo a primeira pergunta ao cliente.';
    messages.push({ role: 'user', content: trigger });
  }

  // ── Call OpenAI ────────────────────────────────────────────────────
  let parsed;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message.content;
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error('[chat] OpenAI error:', err);
    return res.status(500).json({ error: 'Erro ao comunicar com a IA. Verifique sua OPENAI_API_KEY.' });
  }

  // ── Save assistant response to history ────────────────────────────
  const assistantContent = JSON.stringify(parsed);
  draft.messages.push({ role: 'assistant', content: assistantContent });
  draft.progress = parsed.progress || draft.progress;

  if (parsed.type === 'question') {
    draft.lastQuestion = parsed.question;
    draft.lastOptions  = parsed.options || [];
    draft.completed    = false;
  } else if (parsed.type === 'diagnosis') {
    draft.completed = true;
    draft.diagnosis = parsed.diagnosis;
    draft.progress  = 100;
  }

  await draft.save();

  return res.status(200).json({ ...parsed, draftId: draft._id });
}

export default requireAuth(handler);
