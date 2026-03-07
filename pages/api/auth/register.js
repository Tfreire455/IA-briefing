import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';
import { signToken, setAuthCookie, validateEmail, validatePassword } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { name, email, password, confirmPassword, registerSecret } = req.body || {};

  // ── Basic validations ────────────────────────────────────────────────
  if (!name?.trim()) return res.status(400).json({ field: 'name', error: 'Nome é obrigatório.' });
  if (!validateEmail(email)) return res.status(400).json({ field: 'email', error: 'Email inválido.' });

  const pwErrors = validatePassword(password);
  if (pwErrors.length) return res.status(400).json({ field: 'password', error: pwErrors[0] });

  if (password !== confirmPassword) {
    return res.status(400).json({ field: 'confirmPassword', error: 'As senhas não coincidem.' });
  }

  // ── Register secret check ────────────────────────────────────────────
  const requiredSecret = process.env.REGISTER_SECRET;
  if (requiredSecret) {
    if (!registerSecret || registerSecret !== requiredSecret) {
      return res.status(403).json({ field: 'registerSecret', error: 'Código de convite inválido.' });
    }
  }

  await connectDB();

  // ── Check duplicate ──────────────────────────────────────────────────
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ field: 'email', error: 'Este email já está cadastrado.' });
  }

  // ── Create user ──────────────────────────────────────────────────────
  const userCount = await User.countDocuments();
  const role = userCount === 0 ? 'admin' : 'user'; // First user is admin

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role,
    lastLoginAt: new Date(),
  });

  const token = signToken({ id: user._id, email: user.email, name: user.name, role: user.role });
  setAuthCookie(res, token);

  return res.status(201).json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    message: role === 'admin'
      ? 'Conta criada com sucesso! Você é o primeiro admin.'
      : 'Conta criada com sucesso!',
  });
}
