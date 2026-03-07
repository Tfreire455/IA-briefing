import { connectDB } from '../../../lib/mongodb';
import Briefing from '../../../models/Briefing';
import { requireAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  await connectDB();

  // PUBLIC: save new briefing
  if (req.method === 'POST') {
    const briefing = await Briefing.create({
      ...req.body,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
    return res.status(201).json({ success: true, id: briefing._id });
  }

  // PROTECTED: list briefings
  return requireAuth(async (req, res) => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });
    const { page = 1, limit = 15, search = '', status = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.$or = [
      { nome_completo: { $regex: search, $options: 'i' } },
      { cidade_estado: { $regex: search, $options: 'i' } },
      { nome_empresa: { $regex: search, $options: 'i' } },
    ];
    const [briefings, total] = await Promise.all([
      Briefing.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .select('nome_completo nome_empresa cidade_estado tipos_projetos status createdAt').lean(),
      Briefing.countDocuments(filter),
    ]);
    return res.status(200).json({ briefings, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  })(req, res);
}
