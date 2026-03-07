import { connectDB } from '../../../lib/mongodb';
import User from '../../../models/User';
import { requireAdmin } from '../../../lib/auth';

async function handler(req, res) {
  try { await connectDB(); }
  catch (e) { return res.status(503).json({ error: 'Erro de conexão com banco de dados.' }); }

  try {
    if (req.method === 'GET') {
      const users = await User.find({}).sort({ createdAt: -1 }).lean();
      return res.status(200).json({
        users: users.map(u => ({
          _id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          active: u.active !== false,
          lastLoginAt: u.lastLoginAt,
          createdAt: u.createdAt,
        }))
      });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID obrigatório.' });
      if (id === req.user.id) return res.status(400).json({ error: 'Não é possível excluir sua própria conta.' });
      await User.findByIdAndDelete(id);
      return res.status(200).json({ success: true });
    }

    if (req.method === 'PATCH') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID obrigatório.' });
      const { role, active } = req.body;
      const update = {};
      if (role && ['admin', 'user'].includes(role)) update.role = role;
      if (typeof active === 'boolean') update.active = active;
      const updated = await User.findByIdAndUpdate(id, update, { new: true }).lean();
      if (!updated) return res.status(404).json({ error: 'Usuário não encontrado.' });
      return res.status(200).json({
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        active: updated.active !== false,
        lastLoginAt: updated.lastLoginAt,
        createdAt: updated.createdAt,
      });
    }

    return res.status(405).json({ error: 'Método não permitido.' });

  } catch (e) {
    console.error('[users API]', e);
    return res.status(500).json({ error: e.message || 'Erro interno.' });
  }
}

export default requireAdmin(handler);
