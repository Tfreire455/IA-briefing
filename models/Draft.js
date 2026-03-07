import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  role:    { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
}, { _id: false });

const DraftSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  messages: [MessageSchema],
  lastQuestion:  { type: String, default: '' },
  lastOptions:   { type: [String], default: [] },
  completed:  { type: Boolean, default: false },
  diagnosis:  { type: String, default: '' },
  progress: { type: Number, default: 0 },
  adminNotes:      { type: String, default: '' },
  adminStatus:     { type: String, enum: ['pendente', 'em_analise', 'proposta_enviada', 'concluido'], default: 'pendente' },
  adminReviewedAt: { type: Date },
}, { timestamps: true });

// ⚠️ userId já tem index pelo unique:true acima — não repetir aqui
DraftSchema.index({ adminStatus: 1 });
DraftSchema.index({ completed: 1, updatedAt: -1 });

export default mongoose.models.Draft || mongoose.model('Draft', DraftSchema);