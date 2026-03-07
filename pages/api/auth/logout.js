import { clearAuthCookie } from '../../../lib/auth';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  clearAuthCookie(res);
  return res.status(200).json({ success: true });
}
