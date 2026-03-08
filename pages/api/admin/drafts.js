import { connectDB } from '../../../lib/mongodb';
import Draft from '../../../models/Draft';
import User from '../../../models/User'; // ← LINHA QUE FALTAVA
import { requireAdmin } from '../../../lib/auth';

async function handler(req, res) {
  try { await connectDB(); }
  catch (e) { return res.status(503).json({ error: 'Erro de conexão com banco de dados.' }); }

  try {

    // ── GET single draft with full conversation ──────────────────────
    if (req.method === 'GET' && req.query.id) {
      const draft = await Draft.findById(req.query.id).populate('userId', 'name email createdAt').lean();
      if (!draft) return res.status(404).json({ error: 'Não encontrado.' });

      // Parse conversation: convert stored assistant JSON back to readable Q&A pairs
      const conversation = [];
      let i = 0;
      while (i < draft.messages.length) {
        const m = draft.messages[i];
        if (m.role === 'assistant') {
          try {
            const parsed = JSON.parse(m.content);
            if (parsed.type === 'question') {
              // Get the preceding user answer if any
              const userMsg = i > 0 && draft.messages[i - 1].role === 'user'
                ? draft.messages[i - 1].content : null;
              conversation.push({
                type: 'qa',
                question: parsed.question,
                options: parsed.options || [],
                stage: parsed.stage,
                stageLabel: parsed.stageLabel,
                userAnswer: userMsg,
              });
            }
          } catch {
            // ignore parse errors
          }
        }
        i++;
      }

      return res.status(200).json({
        _id: draft._id,
        userId: draft.userId,
        completed: draft.completed,
        progress: draft.progress,
        diagnosis: draft.diagnosis,
        adminNotes: draft.adminNotes || '',
        adminStatus: draft.adminStatus || 'pendente',
        adminReviewedAt: draft.adminReviewedAt,
        conversation,
        messageCount: draft.messages.length,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
      });
    }

    // ── GET list of all drafts (completed + in progress) ─────────────
    if (req.method === 'GET') {
      const { page = 1, limit = 20, search = '', filter = 'all' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build query
      const query = {};
      if (filter === 'completed') query.completed = true;
      if (filter === 'pending')   query.completed = false;
      if (filter === 'pendente')        query.adminStatus = 'pendente';
      if (filter === 'em_analise')      query.adminStatus = 'em_analise';
      if (filter === 'proposta_enviada') query.adminStatus = 'proposta_enviada';
      if (filter === 'concluido')       query.adminStatus = 'concluido';

      const allDrafts = await Draft.find(query)
        .populate('userId', 'name email')
        .sort({ updatedAt: -1 })
        .lean();

      // Filter by search
      const filtered = search
        ? allDrafts.filter(d =>
            d.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
            d.userId?.email?.toLowerCase().includes(search.toLowerCase())
          )
        : allDrafts;

      const total = filtered.length;
      const paginated = filtered.slice(skip, skip + Number(limit));

      return res.status(200).json({
        drafts: paginated.map(d => ({
          _id: d._id,
          user: d.userId,
          completed: d.completed,
          progress: d.progress,
          adminStatus: d.adminStatus || 'pendente',
          adminNotes: d.adminNotes ? '★' : '',
          messageCount: d.messages.length,
          diagnosisPreview: d.diagnosis ? d.diagnosis.slice(0, 150) + '...' : '',
          updatedAt: d.updatedAt,
          createdAt: d.createdAt,
        })),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      });
    }

    // ── PATCH — update admin notes / status ──────────────────────────
    if (req.method === 'PATCH') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID obrigatório.' });

      const { adminNotes, adminStatus } = req.body;
      const update = { adminReviewedAt: new Date() };

      if (typeof adminNotes === 'string') update.adminNotes = adminNotes;
      if (adminStatus && ['pendente','em_analise','proposta_enviada','concluido'].includes(adminStatus)) {
        update.adminStatus = adminStatus;
      }

      const draft = await Draft.findByIdAndUpdate(id, update, { new: true })
        .populate('userId', 'name email').lean();

      if (!draft) return res.status(404).json({ error: 'Não encontrado.' });
      return res.status(200).json({ success: true, adminNotes: draft.adminNotes, adminStatus: draft.adminStatus });
    }

    // ── DELETE ───────────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID obrigatório.' });
      await Draft.findByIdAndDelete(id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método não permitido.' });

  } catch (e) {
    console.error('[drafts API]', e);
    return res.status(500).json({ error: e.message || 'Erro interno.' });
  }
}

export default requireAdmin(handler);