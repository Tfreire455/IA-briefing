import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';
import { requireAdmin } from '../../../lib/auth';

async function handler(req, res) {
  await connectDB();

  if (req.method === 'GET') {
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json(users.map(u => ({
      _id: u._id, name: u.name, email: u.email, role: u.role,
      active: u.active, lastLoginAt: u.lastLoginAt, createdAt: u.createdAt,
    })));
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (id === req.user.id) return res.status(400).json({ error: 'Não é possível excluir sua própria conta aqui.' });
    await User.findByIdAndDelete(id);
    return res.status(200).json({ success: true });
  }

  if (req.method === 'PATCH') {
    const { id } = req.query;
    const { role, active } = req.body;
    const update = {};
    if (role && ['admin', 'user'].includes(role)) update.role = role;
    if (typeof active === 'boolean') update.active = active;
    const user = await User.findByIdAndUpdate(id, update, { new: true });
    return res.status(200).json({ success: true, user });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}

export default requireAdmin(handler);
