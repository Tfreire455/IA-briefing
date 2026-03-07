import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import CircuitBg from '../components/CircuitBg';
import { withAuthSSR } from '../lib/auth';

const fd = iso => iso
  ? new Date(iso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})
  : '—';

const STATUS_CONFIG = {
  pendente:         { label:'PENDENTE',         color:'rgba(14,165,233,0.8)',  bg:'rgba(14,165,233,0.1)',  border:'rgba(14,165,233,0.3)' },
  em_analise:       { label:'EM ANÁLISE',       color:'rgba(250,204,21,0.9)',  bg:'rgba(250,204,21,0.08)', border:'rgba(250,204,21,0.3)' },
  proposta_enviada: { label:'PROPOSTA ENVIADA', color:'rgba(168,85,247,0.9)',  bg:'rgba(168,85,247,0.08)', border:'rgba(168,85,247,0.3)' },
  concluido:        { label:'CONCLUÍDO',        color:'rgba(74,222,128,0.9)',  bg:'rgba(74,222,128,0.08)', border:'rgba(74,222,128,0.3)' },
};

function StatusBadge({ status, style = {} }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pendente;
  return (
    <span style={{
      fontFamily:'Share Tech Mono, monospace', fontSize:'clamp(6px,1.6vw,7px)',
      letterSpacing:'0.1em', textTransform:'uppercase', padding:'3px 8px',
      borderRadius:'3px', color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.border}`, whiteSpace:'nowrap', ...style
    }}>{cfg.label}</span>
  );
}

function Toast({ t, type, onClose }) {
  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
      className={`toast toast-${type}`} onClick={onClose} style={{ cursor:'pointer' }}>
      <span>{type==='ok'?'✓':'⚠'}</span><span>{t}</span>
    </motion.div>
  );
}

// ── Briefing Detail Pane ─────────────────────────────────────────────────────
function BriefingDetail({ draftId, onClose, onStatusChange }) {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('conversa'); // 'conversa' | 'diagnostico'
  const [notes, setNotes]           = useState('');
  const [status, setStatus]         = useState('pendente');
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const notesRef                    = useRef(null);

  useEffect(() => {
    if (!draftId) return;
    setLoading(true); setTab('conversa');
    fetch(`/api/admin/drafts?id=${draftId}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setNotes(d.adminNotes || '');
        setStatus(d.adminStatus || 'pendente');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [draftId]);

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    const r = await fetch(`/api/admin/drafts?id=${draftId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNotes: notes, adminStatus: status }),
    });
    const d = await r.json();
    if (d.success) {
      setSaved(true);
      onStatusChange?.(draftId, d.adminStatus);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Excluir este briefing permanentemente?')) return;
    await fetch(`/api/admin/drafts?id=${draftId}`, { method: 'DELETE' });
    onClose('deleted');
  };

  const renderDiagnosis = (text) => {
    if (!text) return <p style={{ color:'var(--tmuted)', fontSize:'13px' }}>Diagnóstico ainda não gerado.</p>;
    return text.split('\n').map((line, i) => {
      const t = line.trim();
      if (!t) return <div key={i} style={{ height:'8px' }}/>;
      const isHeader = /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s\(\)—]{4,}$/.test(t) && t.length < 80 && !t.startsWith('•');
      if (isHeader) return (
        <div key={i} style={{ marginTop:'18px', marginBottom:'8px' }}>
          <p className="font-mono" style={{ fontSize:'clamp(8px,2vw,10px)', color:'var(--cyan)', letterSpacing:'0.16em', fontWeight:700 }}>{t}</p>
          <div style={{ height:'1px', background:'linear-gradient(90deg,var(--cyan),transparent)', marginTop:'4px', opacity:0.3 }}/>
        </div>
      );
      const isBullet = t.startsWith('•') || t.startsWith('-');
      const clean    = t.replace(/^[•\-]\s*/,'');
      return (
        <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start', marginBottom:'5px' }}>
          {isBullet && <span style={{ color:'var(--cyan)', flexShrink:0, marginTop:'2px', fontSize:'10px' }}>◈</span>}
          <p className="font-exo" style={{ fontSize:'clamp(12px,3vw,13px)', color: isBullet ? 'var(--text)' : 'var(--tbright)', lineHeight:1.7 }}>{clean}</p>
        </div>
      );
    });
  };

  return (
    <div className="detail-pane">
      {/* Corner accents */}
      <div style={{ position:'absolute', top:-1, left:-1, width:14, height:14, borderTop:'2px solid var(--cyan)', borderLeft:'2px solid var(--cyan)', borderRadius:'4px 0 0 0', zIndex:1 }}/>
      <div style={{ position:'absolute', bottom:-1, right:-1, width:14, height:14, borderBottom:'2px solid var(--cyan)', borderRight:'2px solid var(--cyan)', borderRadius:'0 0 4px 0', zIndex:1 }}/>

      {/* Header */}
      <div className="detail-header">
        <div style={{ minWidth:0, flex:1 }}>
          <p className="font-mono" style={{ fontSize:'7px', color:'var(--cyan)', letterSpacing:'0.18em', marginBottom:'4px' }}>BRIEFING DO CLIENTE</p>
          {data && !loading && (
            <>
              <h3 className="font-orb" style={{ fontSize:'clamp(13px,3.5vw,16px)', fontWeight:700, color:'var(--tbright)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {data.userId?.name || '—'}
              </h3>
              <p className="font-mono" style={{ fontSize:'clamp(8px,2vw,9px)', color:'var(--tmuted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {data.userId?.email}
              </p>
            </>
          )}
        </div>
        <div style={{ display:'flex', gap:'6px', alignItems:'center', flexShrink:0 }}>
          {data && <StatusBadge status={status}/>}
          <button onClick={onClose} className="btn-danger btn-sm font-orb" style={{ padding:'6px 10px', minHeight:'30px', fontSize:'10px' }}>✕</button>
        </div>
      </div>

      {/* Meta row */}
      {data && !loading && (
        <div style={{ padding:'8px 16px', background:'rgba(14,165,233,0.03)', borderBottom:'1px solid var(--border)', display:'flex', gap:'16px', flexWrap:'wrap' }}>
          <span className="font-mono" style={{ fontSize:'8px', color:'var(--tmuted)', letterSpacing:'0.1em' }}>
            ◈ {data.messageCount} mensagens
          </span>
          <span className="font-mono" style={{ fontSize:'8px', color:'var(--tmuted)', letterSpacing:'0.1em' }}>
            ◆ {data.progress}% concluído
          </span>
          <span className="font-mono" style={{ fontSize:'8px', color:data.completed?'rgba(74,222,128,0.8)':'rgba(250,204,21,0.7)', letterSpacing:'0.1em' }}>
            {data.completed ? '✓ DIAGNÓSTICO GERADO' : '⏳ EM ANDAMENTO'}
          </span>
          <span className="font-mono" style={{ fontSize:'8px', color:'var(--tmuted)', letterSpacing:'0.1em' }}>
            {fd(data.updatedAt)}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 16px', gap:'4px' }}>
        {[
          { key:'conversa', label:'💬 CONVERSA' },
          { key:'diagnostico', label:'◈ DIAGNÓSTICO' },
          { key:'admin', label:'⚙ GESTÃO' },
        ].map(({ key, label }) => (
          <button key={key} className={`tab-btn ${tab===key?'active':''}`}
            onClick={() => setTab(key)} style={{ padding:'10px 14px' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="detail-body">
        {loading && (
          <div style={{ display:'flex', justifyContent:'center', padding:'40px' }}>
            <div className="spin" style={{ width:'28px', height:'28px' }}/>
          </div>
        )}

        {!loading && data && (
          <>
            {/* ── Conversation tab ── */}
            {tab === 'conversa' && (
              <div>
                {data.conversation.length === 0 ? (
                  <p className="font-mono" style={{ fontSize:'9px', color:'var(--tmuted)', letterSpacing:'0.12em', textAlign:'center', padding:'30px 0' }}>
                    NENHUMA CONVERSA REGISTRADA
                  </p>
                ) : (
                  data.conversation.map((item, i) => (
                    <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.03 }}
                      style={{ marginBottom:'20px', padding:'14px', background:'rgba(6,238,245,0.02)', border:'1px solid rgba(14,165,233,0.08)', borderRadius:'6px' }}>

                      {/* Stage label */}
                      {item.stageLabel && (
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                          <span className="font-mono" style={{ fontSize:'7px', color:'var(--cyan)', letterSpacing:'0.16em', background:'rgba(6,238,245,0.08)', padding:'2px 8px', borderRadius:'2px' }}>
                            ETAPA {item.stage || i+1} — {item.stageLabel?.toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Question */}
                      <div style={{ display:'flex', gap:'8px', alignItems:'flex-start', marginBottom:'10px' }}>
                        <div style={{ width:'24px', height:'24px', background:'rgba(6,238,245,0.1)', border:'1px solid rgba(6,238,245,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, borderRadius:'3px' }}>
                          <span className="font-orb" style={{ fontSize:'6px', color:'var(--cyan)', fontWeight:700 }}>IA</span>
                        </div>
                        <p className="font-exo" style={{ fontSize:'clamp(12px,3vw,13px)', color:'var(--tbright)', lineHeight:1.65, fontWeight:500 }}>
                          {item.question}
                        </p>
                      </div>

                      {/* Options */}
                      {item.options && item.options.length > 0 && (
                        <div style={{ marginLeft:'32px', marginBottom:'8px', display:'flex', flexWrap:'wrap', gap:'4px' }}>
                          {item.options.map((opt, j) => {
                            const selected = item.userAnswer?.includes(opt);
                            return (
                              <span key={j} className="font-mono" style={{
                                fontSize:'clamp(8px,2vw,9px)', padding:'3px 10px', borderRadius:'3px',
                                background: selected ? 'rgba(6,238,245,0.12)' : 'rgba(14,165,233,0.05)',
                                border: selected ? '1px solid rgba(6,238,245,0.4)' : '1px solid rgba(14,165,233,0.1)',
                                color: selected ? 'var(--cyan)' : 'var(--tmuted)',
                                letterSpacing:'0.06em',
                              }}>
                                {selected && '✓ '}{opt}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* User answer */}
                      {item.userAnswer && (
                        <div style={{ marginLeft:'32px', display:'flex', gap:'8px', alignItems:'flex-start' }}>
                          <div style={{ width:'24px', height:'24px', background:'rgba(14,165,233,0.1)', border:'1px solid rgba(14,165,233,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, borderRadius:'3px' }}>
                            <span className="font-orb" style={{ fontSize:'7px', color:'var(--blue)' }}>U</span>
                          </div>
                          <p className="font-exo" style={{ fontSize:'clamp(11px,3vw,12px)', color:'var(--text)', lineHeight:1.65, background:'rgba(14,165,233,0.05)', padding:'8px 12px', borderRadius:'4px', flex:1, border:'1px solid rgba(14,165,233,0.1)' }}>
                            {item.userAnswer}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* ── Diagnosis tab ── */}
            {tab === 'diagnostico' && (
              <div>
                {!data.completed ? (
                  <div style={{ textAlign:'center', padding:'30px 20px' }}>
                    <div style={{ fontSize:'32px', marginBottom:'12px', opacity:0.3 }}>⬡</div>
                    <p className="font-mono" style={{ fontSize:'9px', color:'var(--tmuted)', letterSpacing:'0.14em' }}>
                      BRIEFING EM ANDAMENTO — {data.progress}% COMPLETO
                    </p>
                    <p className="font-exo" style={{ fontSize:'12px', color:'var(--tmuted)', marginTop:'8px' }}>
                      O diagnóstico será gerado quando o usuário completar o briefing.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{ padding:'10px 14px', background:'rgba(74,222,128,0.06)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:'6px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ color:'var(--success)', fontSize:'14px' }}>✓</span>
                      <span className="font-mono" style={{ fontSize:'8px', color:'var(--success)', letterSpacing:'0.12em' }}>
                        DIAGNÓSTICO COMPLETO — {data.conversation.length} PERGUNTAS RESPONDIDAS
                      </span>
                    </div>
                    <div style={{ lineHeight:1.8 }}>
                      {renderDiagnosis(data.diagnosis)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Admin management tab ── */}
            {tab === 'admin' && (
              <div>
                {/* Status selector */}
                <div style={{ marginBottom:'20px' }}>
                  <label className="flabel" style={{ marginBottom:'10px' }}>Status do Briefing</label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <button key={key} onClick={() => setStatus(key)}
                        style={{
                          padding:'10px 12px', borderRadius:'5px', cursor:'pointer',
                          background: status===key ? cfg.bg : 'rgba(14,165,233,0.03)',
                          border: status===key ? `1px solid ${cfg.border}` : '1px solid rgba(14,165,233,0.1)',
                          color: status===key ? cfg.color : 'var(--tmuted)',
                          fontFamily:'Share Tech Mono, monospace', fontSize:'clamp(7px,2vw,8px)',
                          letterSpacing:'0.1em', transition:'all 0.2s',
                          textAlign:'left', display:'flex', alignItems:'center', gap:'6px',
                        }}>
                        <span style={{ fontSize:'10px' }}>{status===key ? '◉' : '○'}</span>
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Admin notes */}
                <div style={{ marginBottom:'16px' }}>
                  <label className="flabel" style={{ marginBottom:'8px' }}>Notas Internas (visível apenas para admins)</label>
                  <textarea
                    ref={notesRef}
                    className="inp"
                    rows={8}
                    placeholder="Adicione suas notas sobre este cliente, análise do briefing, ideias de proposta, valores discutidos, próximos passos, etc..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    style={{ resize:'vertical', minHeight:'180px', fontSize:'13px', lineHeight:1.7 }}
                  />
                </div>

                {/* User info */}
                <div style={{ marginBottom:'16px', padding:'12px 14px', background:'rgba(6,238,245,0.02)', border:'1px solid rgba(14,165,233,0.08)', borderRadius:'6px' }}>
                  <p className="font-mono" style={{ fontSize:'7px', color:'var(--cyan)', letterSpacing:'0.15em', marginBottom:'10px' }}>DADOS DO CLIENTE</p>
                  <div style={{ display:'grid', gap:'6px' }}>
                    {[
                      { k:'Nome', v: data.userId?.name },
                      { k:'Email', v: data.userId?.email },
                      { k:'Iniciou em', v: fd(data.createdAt) },
                      { k:'Última atividade', v: fd(data.updatedAt) },
                      { k:'Perguntas respondidas', v: `${data.conversation.length} de 15` },
                      { k:'Progresso', v: `${data.progress}%` },
                    ].map(({ k, v }) => (
                      <div key={k} style={{ display:'flex', gap:'8px', alignItems:'baseline' }}>
                        <span className="font-mono" style={{ fontSize:'8px', color:'var(--tmuted)', letterSpacing:'0.1em', flexShrink:0, minWidth:'120px' }}>{k}:</span>
                        <span className="font-exo" style={{ fontSize:'12px', color:'var(--tbright)' }}>{v || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  <button className="btn btn-primary font-orb" onClick={handleSave} disabled={saving}
                    style={{ flex:1, minWidth:'120px' }}>
                    {saving ? (
                      <><span className="spin" style={{ borderTopColor:'#fff', width:'14px', height:'14px' }}/><span>SALVANDO...</span></>
                    ) : saved ? (
                      <span style={{ color:'rgba(74,222,128,0.9)' }}>✓ SALVO!</span>
                    ) : (
                      <span>SALVAR NOTAS</span>
                    )}
                  </button>
                  <button className="btn-danger font-orb" onClick={handleDelete}
                    style={{ padding:'11px 16px', fontSize:'8px' }}>
                    EXCLUIR
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Briefings Panel ──────────────────────────────────────────────────────────
function BriefingsPanel() {
  const [drafts, setDrafts]         = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [toast, setToast]           = useState(null);
  const searchDebounce              = useRef(null);

  const showToast = (t, type='ok') => { setToast({t,type}); setTimeout(()=>setToast(null),3000); };

  const fetchDrafts = useCallback(async (q=search, p=page, f=filter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page:p, limit:20, search:q, filter:f });
      const r = await fetch(`/api/admin/drafts?${params}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setDrafts(d.drafts||[]); setTotal(d.total||0); setTotalPages(d.totalPages||1);
    } catch(e) { showToast(e.message||'Erro ao carregar','err'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDrafts(search, page, filter); }, [page, filter]);

  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => { setPage(1); fetchDrafts(v, 1, filter); }, 400);
  };

  const handleFilterChange = (f) => { setFilter(f); setPage(1); fetchDrafts(search, 1, f); };

  const openDetail = (id) => { setSelectedId(id); setShowDetail(true); };

  const closeDetail = (reason) => {
    setShowDetail(false);
    if (reason === 'deleted') {
      setSelectedId(null);
      fetchDrafts(search, page, filter);
      showToast('Briefing excluído');
    } else {
      setTimeout(() => setSelectedId(null), 300);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    setDrafts(ds => ds.map(d => d._id === id ? {...d, adminStatus: newStatus} : d));
    showToast('Status atualizado');
  };

  const FILTERS = [
    { key:'all', label:'TODOS' },
    { key:'completed', label:'COMPLETOS' },
    { key:'pending', label:'EM ANDAMENTO' },
    { key:'pendente', label:'PENDENTE' },
    { key:'em_analise', label:'EM ANÁLISE' },
    { key:'proposta_enviada', label:'PROPOSTA' },
    { key:'concluido', label:'CONCLUÍDO' },
  ];

  return (
    <div style={{ padding:'clamp(14px,3.5vw,24px)', position:'relative', minHeight:'100%' }}>
      {/* Header */}
      <div style={{ marginBottom:'clamp(14px,3.5vw,20px)' }}>
        <p className="tag" style={{ marginBottom:'6px' }}>Análise e Gestão</p>
        <h2 className="font-orb" style={{ fontSize:'clamp(1.3rem,4vw,1.9rem)', fontWeight:700, letterSpacing:'0.04em', display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
          <span className="text-grad">Briefings</span>
          <span className="font-mono" style={{ fontSize:'clamp(11px,3vw,13px)', color:'var(--tmuted)', fontWeight:400 }}>{total}</span>
        </h2>
        <div className="cyber-line" style={{ marginTop:'10px' }}/>
      </div>

      {/* Search */}
      <div style={{ position:'relative', maxWidth:'320px', marginBottom:'12px' }}>
        <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--tmuted)', fontSize:'11px', pointerEvents:'none' }}>◈</span>
        <input className="inp" placeholder="Buscar por nome ou email..." value={search}
          onChange={e=>handleSearch(e.target.value)}
          style={{ paddingLeft:'30px', paddingTop:'9px', paddingBottom:'9px' }}/>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginBottom:'14px', overflowX:'auto', paddingBottom:'4px' }}>
        {FILTERS.map(f => (
          <button key={f.key} className={`tab-btn ${filter===f.key?'active':''}`}
            onClick={() => handleFilterChange(f.key)}
            style={{ whiteSpace:'nowrap', padding:'5px 10px' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ border:'1px solid var(--border)', borderRadius:'6px', overflow:'hidden', overflowX:'auto' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'50px', gap:'12px' }}>
            <div className="spin"/><span className="font-mono" style={{ fontSize:'9px', color:'var(--tmuted)', letterSpacing:'0.15em' }}>CARREGANDO...</span>
          </div>
        ) : drafts.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'50px', gap:'10px' }}>
            <span style={{ fontSize:'28px', color:'rgba(14,165,233,0.2)' }}>⬡</span>
            <p className="font-mono" style={{ fontSize:'9px', color:'var(--tmuted)', letterSpacing:'0.18em' }}>NENHUM BRIEFING ENCONTRADO</p>
          </div>
        ) : (
          <table className="t-table">
            <thead>
              <tr>
                <th>#</th>
                <th>CLIENTE</th>
                <th className="hide-mob">EMAIL</th>
                <th>PROGRESSO</th>
                <th>STATUS</th>
                <th className="hide-mob">DATA</th>
                <th/>
              </tr>
            </thead>
            <tbody>
              {drafts.map((d, i) => (
                <motion.tr key={d._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.02 }}
                  className={selectedId===d._id?'sel':''} onClick={() => openDetail(d._id)}
                  style={{ cursor:'pointer' }}>
                  <td className="font-mono" style={{ fontSize:'8px', color:'var(--tmuted)', whiteSpace:'nowrap' }}>
                    {String((page-1)*20+i+1).padStart(3,'0')}
                  </td>
                  <td>
                    <div style={{ fontWeight:500, color:'var(--tbright)', fontSize:'clamp(11px,3vw,13px)' }}>{d.user?.name||'—'}</div>
                    {d.adminNotes && <span style={{ fontSize:'9px', color:'var(--warn)' }}>★ tem notas</span>}
                  </td>
                  <td className="hide-mob font-mono" style={{ fontSize:'9px', color:'var(--tmuted)' }}>{d.user?.email||'—'}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <div style={{ width:'clamp(40px,10vw,60px)', height:'4px', background:'rgba(14,165,233,0.1)', borderRadius:'2px', overflow:'hidden' }}>
                        <div style={{ width:`${d.progress}%`, height:'100%', background: d.completed ? 'var(--success)' : 'var(--blue)', borderRadius:'2px', transition:'width 0.4s' }}/>
                      </div>
                      <span className="font-mono" style={{ fontSize:'clamp(7px,1.8vw,8px)', color: d.completed ? 'var(--success)' : 'var(--tmuted)', whiteSpace:'nowrap' }}>
                        {d.completed ? '✓ OK' : `${d.progress}%`}
                      </span>
                    </div>
                  </td>
                  <td><StatusBadge status={d.adminStatus}/></td>
                  <td className="hide-mob font-mono" style={{ fontSize:'8px', color:'var(--tmuted)', whiteSpace:'nowrap' }}>{fd(d.updatedAt)}</td>
                  <td style={{ color: selectedId===d._id ? 'var(--cyan)' : 'var(--tmuted)', fontSize:'16px' }}>›</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'12px' }}>
          <span className="font-mono" style={{ fontSize:'8px', color:'var(--tmuted)', letterSpacing:'0.1em' }}>PÁG {page}/{totalPages} — {total} BRIEFINGS</span>
          <div style={{ display:'flex', gap:'6px' }}>
            <button className="btn btn-ghost btn-sm font-orb" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}>‹</button>
            <button className="btn btn-ghost btn-sm font-orb" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}>›</button>
          </div>
        </div>
      )}

      {/* Detail overlay */}
      <AnimatePresence>
        {showDetail && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => closeDetail()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:150, backdropFilter:'blur(2px)' }}/>
            <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
              transition={{ type:'tween', duration:0.3 }}
              style={{ position:'fixed', top:0, right:0, bottom:0, width:'min(600px, 100vw)', zIndex:200 }}>
              <BriefingDetail
                draftId={selectedId}
                onClose={closeDetail}
                onStatusChange={handleStatusChange}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>{toast && <Toast t={toast.t} type={toast.type} onClose={()=>setToast(null)}/>}</AnimatePresence>
    </div>
  );
}

// ── Users Panel ──────────────────────────────────────────────────────────────
function UsersPanel({ currentUserId }) {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]   = useState(null);

  const showToast = (t, type='ok') => { setToast({t,type}); setTimeout(()=>setToast(null), 3000); };

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r=>r.json())
      .then(d=>{ setUsers(Array.isArray(d) ? d : (d.users||[])); setLoading(false); });
  }, []);

  const patch = async (id, body) => {
    const r = await fetch(`/api/admin/users?id=${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const d = await r.json();
    if (d._id) setUsers(u=>u.map(x=>x._id===id ? d : x));
    showToast('Usuário atualizado');
  };

  const del = async (id) => {
    if (!confirm('Excluir usuário permanentemente?')) return;
    await fetch(`/api/admin/users?id=${id}`, { method:'DELETE' });
    setUsers(u=>u.filter(x=>x._id!==id));
    showToast('Usuário excluído');
  };

  return (
    <div style={{ padding:'clamp(14px,3.5vw,24px)' }}>
      <div style={{ marginBottom:'clamp(14px,3.5vw,20px)' }}>
        <p className="tag" style={{ marginBottom:'6px' }}>Gestão</p>
        <h2 className="font-orb" style={{ fontSize:'clamp(1.3rem,4vw,1.9rem)', fontWeight:700, letterSpacing:'0.04em', display:'flex', alignItems:'center', gap:'12px' }}>
          <span className="text-grad">Usuários</span>
          <span className="font-mono" style={{ fontSize:'clamp(11px,3vw,13px)', color:'var(--tmuted)', fontWeight:400 }}>{users.length}</span>
        </h2>
        <div className="cyber-line" style={{ marginTop:'10px' }}/>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'50px', gap:'12px' }}>
          <div className="spin"/><span className="font-mono" style={{ fontSize:'9px', color:'var(--tmuted)', letterSpacing:'0.15em' }}>CARREGANDO...</span>
        </div>
      ) : (
        <div style={{ border:'1px solid var(--border)', borderRadius:'6px', overflow:'hidden', overflowX:'auto' }}>
          <table className="t-table">
            <thead><tr>
              <th>#</th><th>NOME</th>
              <th className="hide-mob">EMAIL</th>
              <th>CARGO</th>
              <th className="hide-mob">STATUS</th>
              <th>AÇÕES</th>
            </tr></thead>
            <tbody>
              {users.map((u,i)=>(
                <motion.tr key={u._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}>
                  <td className="font-mono" style={{ fontSize:'8px', color:'var(--tmuted)' }}>{String(i+1).padStart(2,'0')}</td>
                  <td>
                    <div style={{ fontWeight:500, color:'var(--tbright)', fontSize:'clamp(11px,3vw,13px)' }}>{u.name}</div>
                    <div className="font-mono" style={{ fontSize:'8px', color:'var(--tmuted)', display:'block' }}>{u.email}</div>
                  </td>
                  <td className="hide-mob" style={{ fontSize:'12px', color:'var(--tmuted)' }}>{u.email}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td className="hide-mob"><span className={`badge badge-${u.active!==false?'active':'inactive'}`}>{u.active!==false?'ATIVO':'INATIVO'}</span></td>
                  <td>
                    <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                      {u._id !== currentUserId && (
                        <>
                          <button className="btn-danger btn-sm font-orb" style={{ fontSize:'7px', padding:'5px 8px', minHeight:'30px' }}
                            onClick={()=>patch(u._id,{role:u.role==='admin'?'user':'admin'})}>
                            {u.role==='admin'?'▼USER':'▲ADM'}
                          </button>
                          <button className="btn-danger btn-sm font-orb" style={{ fontSize:'7px', padding:'5px 8px', minHeight:'30px' }}
                            onClick={()=>patch(u._id,{active:!(u.active!==false)})}>
                            {u.active!==false?'DESAT':'ATIVAR'}
                          </button>
                          <button className="btn-danger btn-sm font-orb" style={{ fontSize:'7px', padding:'5px 8px', minHeight:'30px', borderColor:'rgba(239,68,68,0.6)' }}
                            onClick={()=>del(u._id)}>✕</button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>{toast && <Toast t={toast.t} type={toast.type} onClose={()=>setToast(null)}/>}</AnimatePresence>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard({ user }) {
  const router = useRouter();
  const [view, setView]             = useState('briefings');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method:'POST' });
    router.push('/login');
  };

  const navItems = [
    { key:'briefings', icon:'◈', label:'Briefings' },
    { key:'users',     icon:'◆', label:'Usuários' },
  ];

  const handleNav = (key) => { setView(key); setSidebarOpen(false); };

  return (
    <>
      <Head><title>TM Dev — Dashboard</title><meta name="robots" content="noindex"/></Head>
      <div style={{ background:'var(--bg)', minHeight:'100vh', position:'relative' }}>
        <CircuitBg opacity={0.15}/>

        <div className="dash-layout" style={{ position:'relative', zIndex:1 }}>

          {/* Mobile overlay */}
          <div className={`mob-overlay ${sidebarOpen?'open':''}`} onClick={()=>setSidebarOpen(false)}/>

          {/* Sidebar */}
          <aside className={`dash-sidebar ${sidebarOpen?'mob-open':''}`}>
            <div className="sl">
              <div className="slb"><span className="font-orb text-cglow" style={{ fontSize:'9px', fontWeight:700 }}>TM</span></div>
              <div>
                <div className="font-orb" style={{ fontSize:'11px', fontWeight:700, color:'var(--tbright)', letterSpacing:'0.1em' }}>TM DEV</div>
                <div className="font-mono" style={{ fontSize:'6px', color:'var(--tmuted)', letterSpacing:'0.2em' }}>CONTROL PANEL</div>
              </div>
              <button className="sc" onClick={()=>setSidebarOpen(false)}>✕</button>
            </div>

            <div className="su">
              <div className="sa"><span className="font-orb" style={{ fontSize:'13px', color:'var(--blue)' }}>{user.name.charAt(0).toUpperCase()}</span></div>
              <div style={{ minWidth:0 }}>
                <div className="font-exo" style={{ fontSize:'12px', color:'var(--tbright)', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</div>
                <span className={`badge badge-${user.role}`} style={{ fontSize:'7px' }}>{user.role}</span>
              </div>
            </div>

            <nav style={{ flex:1, padding:'8px 0', overflowY:'auto' }}>
              {navItems.map(n=>(
                <div key={n.key} className={`nav-item ${view===n.key?'active':''}`} onClick={()=>handleNav(n.key)}>
                  <span style={{ fontSize:'14px', flexShrink:0 }}>{n.icon}</span>
                  <span>{n.label}</span>
                </div>
              ))}
            </nav>

            <div style={{ padding:'8px 0', borderTop:'1px solid var(--border)' }}>
              <Link href="/account" className="nav-item" onClick={()=>setSidebarOpen(false)}>
                <span style={{ fontSize:'13px' }}>⚙</span><span>Minha Conta</span>
              </Link>
              <Link href="/" className="nav-item" onClick={()=>setSidebarOpen(false)}>
                <span style={{ fontSize:'13px' }}>↗</span><span>Briefing</span>
              </Link>
              <div className="nav-item" onClick={handleLogout} style={{ color:'rgba(248,113,113,0.55)' }}>
                <span style={{ fontSize:'13px' }}>⏻</span><span>Sair</span>
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="dash-main">
            {/* Mobile topbar */}
            <div className="mob-topbar">
              <button className={`ham-btn ${sidebarOpen?'open':''}`} onClick={()=>setSidebarOpen(s=>!s)}>
                <span/><span/><span/>
              </button>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <div className="slb"><span className="font-orb text-cglow" style={{ fontSize:'9px', fontWeight:700 }}>TM</span></div>
                <span className="font-orb" style={{ fontSize:'11px', color:'var(--tbright)', letterSpacing:'0.1em' }}>TM DEV</span>
              </div>
              <span className="font-mono" style={{ fontSize:'clamp(8px,2.5vw,10px)', color:'var(--cyan)', letterSpacing:'0.1em' }}>
                {navItems.find(n=>n.key===view)?.label || 'DASHBOARD'}
              </span>
            </div>

            {view === 'briefings' && <BriefingsPanel/>}
            {view === 'users' && <UsersPanel currentUserId={user.id}/>}
          </div>
        </div>
      </div>

      <style>{`
        .sl { display:flex; align-items:center; gap:10px; padding:16px 14px; border-bottom:1px solid var(--border); }
        .slb { width:30px; height:30px; border:1px solid rgba(6,238,245,0.45); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 0 8px rgba(6,238,245,0.12); border-radius:3px; }
        .sc { display:none; margin-left:auto; background:none; border:none; color:var(--tmuted); cursor:pointer; font-size:14px; padding:4px; min-height:32px; min-width:32px; }
        .su { display:flex; align-items:center; gap:10px; padding:12px 14px; border-bottom:1px solid var(--border); background:rgba(14,165,233,0.03); }
        .sa { width:32px; height:32px; background:rgba(14,165,233,0.12); border:1px solid rgba(14,165,233,0.22); display:flex; align-items:center; justify-content:center; flex-shrink:0; border-radius:3px; }

        .mob-topbar { display:none; align-items:center; justify-content:space-between; padding:0 clamp(10px,3vw,16px); height:var(--nav-h); background:rgba(2,11,22,0.95); border-bottom:1px solid var(--border); position:sticky; top:0; z-index:50; backdrop-filter:blur(14px); gap:10px; }

        .detail-pane { position:absolute; top:0; left:0; right:0; bottom:0; background:var(--s1); border-left:1px solid var(--border); display:flex; flex-direction:column; }
        .detail-header { padding:clamp(12px,3.5vw,16px) clamp(14px,4vw,18px); border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; gap:12px; flex-shrink:0; background:rgba(6,238,245,0.02); }
        .detail-body { flex:1; overflow-y:auto; padding:clamp(14px,4vw,18px); }

        @media(max-width:768px){
          .mob-topbar { display:flex; }
          .sc { display:flex; align-items:center; justify-content:center; }
        }
        @media(max-width:480px){
          .hide-mob { display:none; }
        }
        @media(max-width:280px){
          .mob-topbar { padding:0 8px; }
        }
      `}</style>
    </>
  );
}

export const getServerSideProps = withAuthSSR(async (ctx, user) => {
  return { props: { user } };
});
