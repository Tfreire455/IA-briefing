import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';
import { requireAuth, validateEmail, signToken, setAuthCookie } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Método não permitido.' });

  const { name, email } = req.body || {};

  if (!name?.trim()) return res.status(400).json({ field: 'name', error: 'Nome é obrigatório.' });
  if (!validateEmail(email)) return res.status(400).json({ field: 'email', error: 'Email inválido.' });

  await connectDB();

  // Check email not taken by another user
  const conflict = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: req.user.id } });
  if (conflict) return res.status(409).json({ field: 'email', error: 'Email já em uso por outra conta.' });

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name: name.trim(), email: email.toLowerCase().trim() },
    { new: true }
  );

  // Re-issue token with updated info
  const token = signToken({ id: user._id, email: user.email, name: user.name, role: user.role });
  setAuthCookie(res, token);

  return res.status(200).json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    message: 'Perfil atualizado com sucesso!',
  });
}

export default requireAuth(handler);
