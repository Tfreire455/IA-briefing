import OpenAI from 'openai';
import { connectDB } from '../../lib/mongodb';
import Draft from '../../models/Draft';
import { requireAuth } from '../../lib/auth';

const SYSTEM_PROMPT = `Você é um consultor da TM Dev, empresa especializada em sistemas, automação, IA e marketing digital.

Conduza um briefing OBJETIVO com o cliente em no MÁXIMO 12 perguntas. Seja direto e eficiente.

════════════════════════════════════
REGRAS CRÍTICAS — NUNCA IGNORE
════════════════════════════════════
1. UMA pergunta por vez. Jamais duas.
2. SEMPRE retorne entre 4 e 6 opções relevantes. NUNCA deixe "options" vazio ou com menos de 4 itens.
3. As opções devem ser ESPECÍFICAS e PRÁTICAS para o contexto do negócio.
4. Após no máximo 12 trocas (perguntas+respostas), gere o diagnóstico.
5. Adapte as opções com base nas respostas anteriores.
6. Tom: profissional, direto, amigável.

════════════════════════════════════
SEQUÊNCIA DE PERGUNTAS (12 no máx)
════════════════════════════════════

P1 — NEGÓCIO
"Qual é o seu segmento de atuação?"
options: [Alimentação/Restaurante, Beleza/Estética, Saúde/Clínica, Educação/Cursos, Imobiliário, Construção/Reforma, Jurídico/Contabilidade, Comércio/Varejo, Serviços B2B, Outro]

P2 — TAMANHO
"Qual o tamanho da sua operação hoje?"
options: baseadas no segmento respondido

P3 — FATURAMENTO
"Qual a faixa de faturamento mensal atual?"
options: [Até R$2k, R$5k–15k, R$15k–30k, R$30k–80k, R$80k–200k, Acima de R$200k]

P4 — CAPTAÇÃO
"Como você capta a maioria dos seus clientes hoje?"
options: [Indicação de clientes, Instagram/TikTok, Google/SEO, Tráfego pago (ads), WhatsApp ativo, Prospecção direta, Marketplace/iFood/etc, Outros]

P5 — REDES SOCIAIS
"Quais redes sociais você usa para o negócio?"
options: [Instagram, TikTok, Facebook, YouTube, LinkedIn, WhatsApp Business, Não uso redes sociais, Google Meu Negócio]

P6 — SITE E PRESENÇA DIGITAL
"Como está sua presença digital?"
options: [Tenho site atualizado e apareço no Google, Tenho site mas está desatualizado, Só tenho redes sociais, Não tenho site nem redes ativas, Tenho landing page/link na bio, Estou construindo do zero]

P7 — ATENDIMENTO
"Como você faz o atendimento e acompanhamento de clientes?"
options: [WhatsApp manual (só eu), Equipe de atendimento, CRM/sistema de vendas, Planilha no Excel/Google, Tudo na memória/agenda física, Chatbot ou automação já ativa]

P8 — MAIOR DOR
"Qual é o maior problema que trava o crescimento do seu negócio hoje?"
options: baseadas no que foi respondido (ex: Falta de clientes novos, Processos manuais e lentos, Pouca presença digital, Equipe desorganizada, Dificuldade em fechar vendas, Alto custo operacional, Não consigo escalar, Falta de tempo para tudo)

P9 — TECNOLOGIA/AUTOMAÇÃO
"Você já usa algum sistema ou automação no negócio?"
options: [Não uso nenhum sistema, Uso só WhatsApp e planilhas, Tenho sistema mas é limitado, Uso ferramentas mas de forma básica, Já tenho automações funcionando, Quero sair do zero em tecnologia]

P10 — INVESTIMENTO EM MARKETING
"Você investe em tráfego pago (Meta Ads, Google Ads)?"
options: [Não invisto nada, Invisto até R$500/mês, Invisto R$500–2k/mês, Invisto R$2k–5k/mês, Invisto acima de R$5k/mês, Já investi mas parei]

P11 — OBJETIVO PRINCIPAL
"Qual é o seu principal objetivo com a TM Dev?"
options: baseadas no perfil identificado (ex: Criar ou melhorar meu site, Automatizar atendimento via WhatsApp, Criar sistema de gestão personalizado, Melhorar captação de clientes, Estruturar marketing digital, Integrar IA no meu negócio, Tudo isso de forma integrada)

P12 — INVESTIMENTO E URGÊNCIA
"Qual é a sua disponibilidade de investimento mensal em tecnologia/marketing?"
options: [Até R$500/mês, R$500–1.500/mês, R$1.500–3.000/mês, R$3.000–6.000/mês, Acima de R$6.000/mês, Quero entender o custo antes]

APÓS A P12 → Gere o diagnóstico final.

════════════════════════════════════
FORMATO JSON — OBRIGATÓRIO
════════════════════════════════════
Para perguntas:
{"type":"question","question":"Texto da pergunta?","options":["Opção 1","Opção 2","Opção 3","Opção 4","Opção 5"],"progress":10,"stage":1,"stageLabel":"Negócio"}

REGRAS DO JSON:
- "options" SEMPRE com 4 a 6 itens. NUNCA array vazio. NUNCA menos que 4.
- "progress": 8 por pergunta (P1=8, P2=16, P3=24... P12=96, diagnóstico=100)
- "stage": número de 1 a 12
- "stageLabel": nome curto da etapa (ex: "Negócio", "Equipe", "Captação", etc)
- Adapte as opções ao negócio já identificado nas respostas anteriores
- JSON puro, sem markdown, sem texto fora do JSON

Para diagnóstico (após P12):
{"type":"diagnosis","diagnosis":"DADOS DO NEGÓCIO\n• ...\n\nPERFIL DO CLIENTE IDEAL\n• ...\n\nDIAGNÓSTICO DE PRESENÇA DIGITAL\n• ...\n\nDIAGNÓSTICO DE CAPTAÇÃO\n• ...\n\nPRINCIPAIS DORES IDENTIFICADAS\n• ...\n\nOPORTUNIDADES IMEDIATAS\n• ...\n\nAUTOMAÇÕES RECOMENDADAS\n• ...\n\nSISTEMAS RECOMENDADOS\n• ...\n\nESTRATÉGIA DE MARKETING DIGITAL\n• ...\n\nINVESTIMENTO ESTIMADO\n• ...\n\nPRÓXIMOS PASSOS\n• ...","progress":100}`;

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { userMessage, selectedOptions = [], reset = false } = req.body || {};

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY não configurada no .env' });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try { await connectDB(); }
  catch (e) { return res.status(503).json({ error: 'Erro de conexão com banco de dados.' }); }

  let draft = await Draft.findOne({ userId: req.user.id });

  if (reset || !draft) {
    if (draft) await Draft.deleteOne({ userId: req.user.id });
    draft = new Draft({ userId: req.user.id, messages: [], progress: 0 });
  }

  // Build user message
  let fullUserMessage = '';
  if (selectedOptions.length > 0) {
    fullUserMessage = selectedOptions.join(', ');
    if (userMessage?.trim()) fullUserMessage += ` — ${userMessage.trim()}`;
  } else if (userMessage?.trim()) {
    fullUserMessage = userMessage.trim();
  }

  const isFirstMessage = draft.messages.length === 0;

  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
  draft.messages.forEach(m => messages.push({ role: m.role, content: m.content }));

  if (!isFirstMessage && fullUserMessage) {
    messages.push({ role: 'user', content: fullUserMessage });
    draft.messages.push({ role: 'user', content: fullUserMessage });
  }

  if (isFirstMessage) {
    messages.push({ role: 'user', content: 'Inicie o briefing com a primeira pergunta. Lembre-se: SEMPRE inclua entre 4 e 6 opções no campo "options".' });
  }

  let parsed;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.5,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message.content;
    parsed = JSON.parse(raw);

    // Garantia de fallback: se options vier vazio ou ausente, injeta opções genéricas
    if (parsed.type === 'question') {
      if (!Array.isArray(parsed.options) || parsed.options.length < 2) {
        parsed.options = [
          'Sim, com certeza',
          'Sim, parcialmente',
          'Não ainda',
          'Não sei / Nunca pensei nisso',
          'Prefiro explicar melhor',
        ];
      }
    }

  } catch (err) {
    console.error('[chat] OpenAI error:', err);
    return res.status(500).json({ error: 'Erro ao comunicar com a IA. Verifique sua OPENAI_API_KEY.' });
  }

  draft.messages.push({ role: 'assistant', content: JSON.stringify(parsed) });
  draft.progress = parsed.progress || draft.progress;

  if (parsed.type === 'question') {
    draft.lastQuestion = parsed.question;
    draft.lastOptions  = parsed.options || [];
    draft.completed    = false;
  } else if (parsed.type === 'diagnosis') {
    draft.completed  = true;
    draft.diagnosis  = parsed.diagnosis;
    draft.progress   = 100;
    if (!draft.adminStatus || draft.adminStatus === 'pendente') {
      draft.adminStatus = 'pendente';
    }
  }

  await draft.save();
  return res.status(200).json({ ...parsed, draftId: draft._id });
}

export default requireAuth(handler);