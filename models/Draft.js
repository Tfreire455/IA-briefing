import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  role:    { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
}, { _id: false });

const DraftSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  // Full OpenAI conversation history
  messages: [MessageSchema],

  // Last question shown to user (for display on resume)
  lastQuestion:  { type: String, default: '' },
  lastOptions:   { type: [String], default: [] },

  // Completed diagnosis
  completed:  { type: Boolean, default: false },
  diagnosis:  { type: String, default: '' },

  // Progress tracking (estimated 0–100)
  progress: { type: Number, default: 0 },
}, { timestamps: true });

DraftSchema.index({ userId: 1 });

export default mongoose.models.Draft || mongoose.model('Draft', DraftSchema);
