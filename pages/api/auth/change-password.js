import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';
import { requireAuth, validatePassword, signToken, setAuthCookie } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { currentPassword, newPassword, confirmPassword } = req.body || {};

  if (!currentPassword) return res.status(400).json({ field: 'currentPassword', error: 'Senha atual obrigatória.' });

  const pwErrors = validatePassword(newPassword);
  if (pwErrors.length) return res.status(400).json({ field: 'newPassword', error: pwErrors[0] });

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ field: 'confirmPassword', error: 'As senhas não coincidem.' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ field: 'newPassword', error: 'Nova senha deve ser diferente da atual.' });
  }

  await connectDB();
  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const valid = await user.verifyPassword(currentPassword);
  if (!valid) return res.status(401).json({ field: 'currentPassword', error: 'Senha atual incorreta.' });

  const passwordHash = await User.hashPassword(newPassword);
  await User.updateOne({ _id: user._id }, { passwordHash });

  // Re-issue token so session stays valid
  const token = signToken({ id: user._id, email: user.email, name: user.name, role: user.role });
  setAuthCookie(res, token);

  return res.status(200).json({ success: true, message: 'Senha alterada com sucesso!' });
}

export default requireAuth(handler);
