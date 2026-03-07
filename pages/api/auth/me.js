import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';
import { requireAuth } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });
  await connectDB();
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  const { passwordHash, resetToken, resetTokenExpiry, ...safe } = user;
  return res.status(200).json(safe);
}

export default requireAuth(handler);
