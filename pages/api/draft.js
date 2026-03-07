
import Draft from '../../models/Draft';
import { requireAuth } from '../../lib/auth';
import { connectDB } from '../../lib/mongodb';

async function handler(req, res) {
  await connectDB();

  if (req.method === 'GET') {
    const draft = await Draft.findOne({ userId: req.user.id }).lean();
    if (!draft) return res.status(200).json({ draft: null });
    // Return safe version (no raw messages, just display info)
    return res.status(200).json({
      draft: {
        _id: draft._id,
        lastQuestion: draft.lastQuestion,
        lastOptions:  draft.lastOptions,
        completed:    draft.completed,
        diagnosis:    draft.diagnosis,
        progress:     draft.progress,
        messageCount: draft.messages.length,
        updatedAt:    draft.updatedAt,
      },
    });
  }

  if (req.method === 'DELETE') {
    await Draft.deleteOne({ userId: req.user.id });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}

export default requireAuth(handler);
