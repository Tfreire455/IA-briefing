import { connectDB } from '../../../lib/mongodb';
import Draft from '../../../models/Draft';
import { requireAdmin } from '../../../lib/auth';

async function handler(req, res) {
  try {
    await connectDB();
  } catch (e) {
    return res.status(503).json({ error: 'Erro de conexão com banco de dados.' });
  }

  try {
    if (req.method === 'GET') {
      const { id } = req.query;

      // Single draft detail
      if (id) {
        const draft = await Draft.findById(id).populate('userId', 'name email').lean();
        if (!draft) return res.status(404).json({ error: 'Não encontrado.' });
        return res.status(200).json(draft);
      }

      // List completed drafts
      const { page = 1, limit = 15, search = '' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const allDrafts = await Draft.find({ completed: true })
        .populate('userId', 'name email')
        .sort({ updatedAt: -1 })
        .lean();

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
          progress: d.progress,
          diagnosis: d.diagnosis ? d.diagnosis.slice(0, 200) + '...' : '',
          updatedAt: d.updatedAt,
        })),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      });
    }

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