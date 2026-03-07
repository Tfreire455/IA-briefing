import { connectDB } from '../../lib/mongodb';
import Briefing from '../../models/Briefing';
import { requireAuth } from '../../lib/auth';

/**
 * PROTECTED endpoint — user must be logged in to submit a briefing.
 * The briefing is automatically associated with the authenticated user.
 */
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    await connectDB();

    const briefing = await Briefing.create({
      ...req.body,
      submittedBy: req.user.id,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || '',
    });

    return res.status(201).json({ success: true, id: briefing._id });
  } catch (err) {
    console.error('[save-briefing]', err);
    return res.status(500).json({ error: 'Erro ao salvar. Tente novamente.' });
  }
}

export default requireAuth(handler);
