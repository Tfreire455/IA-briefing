import { connectDB } from '../../../lib/mongodb';
import Briefing from '../../../models/Briefing';
import { requireAuth } from '../../../lib/auth';

async function handler(req, res) {
  const { id } = req.query;
  await connectDB();

  if (req.method === 'GET') {
    const b = await Briefing.findById(id).lean();
    if (!b) return res.status(404).json({ error: 'Não encontrado.' });
    return res.status(200).json(b);
  }

  if (req.method === 'PATCH') {
    const allowed = ['status', 'notes'];
    const update = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const b = await Briefing.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!b) return res.status(404).json({ error: 'Não encontrado.' });
    return res.status(200).json(b);
  }

  if (req.method === 'DELETE') {
    await Briefing.findByIdAndDelete(id);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}

export default requireAuth(handler);
