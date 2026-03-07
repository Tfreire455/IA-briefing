import mongoose from 'mongoose';

const BriefingSchema = new mongoose.Schema({
  nome_completo: String, tipo_atuacao: String, nome_empresa: String,
  cidade_estado: String, abrangencia: String,
  tipos_projetos: [String], outros_projetos: String,
  anos_experiencia: String, quantidade_projetos: String,
  obras_grandes: String, obras_detalhes: String,
  equipe: String, terceiriza: String, projetos_mes_capacidade: String,
  publico_atual: [String], publico_desejado: [String],
  canais_captacao: [String], captacao_detalhes: String,
  tem_arquitetos_parceiros: String, tem_construtoras_parceiras: String,
  quantidade_parceiros: String, instagram: String, facebook: String,
  linkedin: String, site: String, portfolio: String,
  posta_conteudo: String, frequencia_posts: String,
  google_ads: String, meta_ads: String, resultado_anuncios: String,
  regioes_captacao: String, canal_primeiro_contato: [String],
  processo_atendimento: String, formato_proposta: [String],
  modelo_proposta: String, projetos_fechados_mes: String,
  projetos_meta_mes: String, conhece_concorrentes: String,
  diferencial_concorrentes: String, seu_diferencial: String,
  objetivos_negocio: [String], objetivo_detalhado: String,
  informacoes_adicionais: String,
  ip: String, userAgent: String,
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['novo','em_analise','respondido'], default: 'novo' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
}, { timestamps: true });

BriefingSchema.index({ createdAt: -1 });
BriefingSchema.index({ status: 1 });

export default mongoose.models.Briefing || mongoose.model('Briefing', BriefingSchema);
