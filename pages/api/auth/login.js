import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';
import { signToken, setAuthCookie, validateEmail } from '../../../lib/auth';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ field: 'email', error: 'Email inválido.' });
  }

  await connectDB();

  // ── Find user (select hidden fields) ───────────────────────────────
  const user = await User.findOne({ email: email.toLowerCase().trim() })
    .select('+passwordHash +failedAttempts +lockedUntil');

  if (!user) {
    // Constant-time to prevent email enumeration
    await new Promise((r) => setTimeout(r, 300));
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  if (!user.active) {
    return res.status(403).json({ error: 'Conta desativada. Entre em contato com o admin.' });
  }

  // ── Brute-force lockout ─────────────────────────────────────────────
  if (user.isLocked()) {
    const remaining = Math.ceil((user.lockedUntil - Date.now()) / 60000);
    return res.status(429).json({
      error: `Conta bloqueada. Tente novamente em ${remaining} minuto(s).`,
      locked: true,
    });
  }

  // ── Verify password ─────────────────────────────────────────────────
  const valid = await user.verifyPassword(password);

  if (!valid) {
    const attempts = (user.failedAttempts || 0) + 1;
    const update = { failedAttempts: attempts };

    if (attempts >= MAX_ATTEMPTS) {
      update.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      update.failedAttempts = 0;
      await User.updateOne({ _id: user._id }, update);
      return res.status(429).json({
        error: `Muitas tentativas. Conta bloqueada por ${LOCK_MINUTES} minutos.`,
        locked: true,
      });
    }

    await User.updateOne({ _id: user._id }, update);
    return res.status(401).json({
      error: `Credenciais inválidas. ${MAX_ATTEMPTS - attempts} tentativa(s) restante(s).`,
    });
  }

  // ── Success ─────────────────────────────────────────────────────────
  await User.updateOne({ _id: user._id }, {
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: new Date(),
  });

  const token = signToken({ id: user._id, email: user.email, name: user.name, role: user.role });
  setAuthCookie(res, token);

  return res.status(200).json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}
