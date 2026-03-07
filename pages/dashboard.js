import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import CircuitBg from '../components/CircuitBg';
import { withAuthSSR } from '../lib/auth';

const SECTIONS = [
  { t:'IDENTIFICAÇÃO', f:[['nome_completo','Nome'],['tipo_atuacao','Tipo'],['nome_empresa','Empresa'],['cidade_estado','Cidade/Estado'],['abrangencia','Abrangência']] },
  { t:'SERVIÇOS', f:[['tipos_projetos','Tipos de Projetos'],['outros_projetos','Outros']] },
  { t:'EXPERIÊNCIA', f:[['anos_experiencia','Anos'],['quantidade_projetos','Projetos'],['obras_grandes','Obras Grandes'],['obras_detalhes','Detalhes']] },
  { t:'ESTRUTURA', f:[['equipe','Equipe'],['terceiriza','Terceiriza'],['projetos_mes_capacidade','Capacidade/Mês']] },
  { t:'PÚBLICO', f:[['publico_atual','Público Atual'],['publico_desejado','Público Desejado']] },
  { t:'CAPTAÇÃO', f:[['canais_captacao','Canais'],['captacao_detalhes','Detalhes']] },
  { t:'DIGITAL', f:[['tem_arquitetos_parceiros','Arquitetos'],['tem_construtoras_parceiras','Construtoras'],['quantidade_parceiros','Qtd. Parceiros'],['instagram','Instagram'],['facebook','Facebook'],['linkedin','LinkedIn'],['site','Site'],['portfolio','Portfólio']] },
  { t:'CONTEÚDO/ADS', f:[['posta_conteudo','Posta'],['frequencia_posts','Frequência'],['google_ads','Google Ads'],['meta_ads','Meta Ads'],['resultado_anuncios','Resultado']] },
  { t:'REGIÃO', f:[['regioes_captacao','Regiões'],['canal_primeiro_contato','Canal Contato'],['processo_atendimento','Atendimento']] },
  { t:'PROPOSTAS', f:[['formato_proposta','Formato'],['modelo_proposta','Modelo'],['projetos_fechados_mes','Atual/Mês'],['projetos_meta_mes','Meta/Mês']] },
  { t:'POSICIONAMENTO', f:[['conhece_concorrentes','Concorrentes'],['diferencial_concorrentes','Diff. Deles'],['seu_diferencial','Seu Diff.']] },
  { t:'OBJETIVOS', f:[['objetivos_negocio','Objetivos'],['objetivo_detalhado','Detalhado'],['informacoes_adicionais','Extra']] },
];
const STATUS = ['novo','em_analise','respondido'];
const SL = { novo:'NOVO', em_analise:'EM ANÁLISE', respondido:'RESPONDIDO' };
const fv = v => !v ? null : Array.isArray(v) ? (v.length ? v.join(' · ') : null) : String(v);
const fd = iso => iso ? new Date(iso).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—';

function Toast({ t, type, onClose }) {
  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}}
      className={`toast toast-${type}`} style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}} onClick={onClose}>
      <span>{type==='ok'?'✓':'⚠'}</span><span>{t}</span>
    </motion.div>
  );
}

// ─── Detail Pane ──────────────────────────────────────────────────────────────
function DetailPane({ id, onClose, onStatusChange }) {
  const [b, setB] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sec, setSec] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true); setSec(0);
    fetch(`/api/briefings/${id}`).then(r=>r.json()).then(d=>{ setB(d); setNotes(d.notes||''); setLoading(false); });
  }, [id]);

  const patch = async (patch) => {
    const r = await fetch(`/api/briefings/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch)});
    return r.json();
  };

  const handleStatus = async (s) => { const d = await patch({status:s}); setB(d); onStatusChange(id,s); };
  const handleNotes = async () => { setSaving(true); await patch({notes}); setSaving(false); };

  return (
    <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:20}} transition={{duration:0.28}}
      style={{display:'flex',flexDirection:'column',height:'100%',background:'var(--s1)',border:'1px solid var(--border)',position:'relative'}}>
      <div style={{position:'absolute',top:-1,left:-1,width:16,height:16,borderTop:'2px solid var(--cyan)',borderLeft:'2px solid var(--cyan)'}}/>
      <div style={{position:'absolute',bottom:-1,right:-1,width:16,height:16,borderBottom:'2px solid var(--cyan)',borderRight:'2px solid var(--cyan)'}}/>

      {/* Header */}
      <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
          <div>
            <p className="font-mono" style={{fontSize:'8px',color:'var(--cyan)',letterSpacing:'0.2em',marginBottom:'5px'}}>BRIEFING DETALHADO</p>
            {loading ? <div className="spin"/> : <h3 className="font-orb" style={{fontSize:'16px',fontWeight:700,color:'var(--tbright)',letterSpacing:'0.04em'}}>{b?.nome_completo||'—'}</h3>}
            {b?.cidade_estado && <p className="font-exo" style={{fontSize:'11px',color:'var(--tmuted)',marginTop:'3px'}}>📍 {b.cidade_estado}</p>}
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm font-orb" style={{borderColor:'rgba(239,68,68,0.3)',color:'var(--danger)'}}>✕</button>
        </div>
        {b && (
          <>
            <p className="font-mono" style={{fontSize:'8px',color:'var(--tmuted)',letterSpacing:'0.1em',marginBottom:'8px'}}>{fd(b.createdAt)}</p>
            <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
              {STATUS.map(s=>(
                <button key={s} onClick={()=>handleStatus(s)} className={`badge badge-${s}`}
                  style={{cursor:b.status===s?'default':'pointer',opacity:b.status===s?1:0.45,transition:'opacity 0.2s',border:'none',fontFamily:'Share Tech Mono,monospace'}}
                  onMouseEnter={e=>{if(b.status!==s)e.currentTarget.style.opacity='0.8'}}
                  onMouseLeave={e=>{if(b.status!==s)e.currentTarget.style.opacity='0.45'}}>
                  {SL[s]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Section tabs */}
      {b && (
        <div style={{display:'flex',gap:'1px',padding:'8px 20px',borderBottom:'1px solid var(--border)',flexShrink:0,overflowX:'auto'}}>
          {SECTIONS.map((s,i)=>(
            <button key={i} className={`tab-btn ${sec===i?'active':''}`} onClick={()=>setSec(i)}>{s.t}</button>
          ))}
          <button className={`tab-btn ${sec===SECTIONS.length?'active':''}`} onClick={()=>setSec(SECTIONS.length)}>NOTAS</button>
        </div>
      )}

      {/* Content */}
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
        {loading && <div style={{display:'flex',justifyContent:'center',padding:'40px'}}><div className="spin"/></div>}
        {b && sec < SECTIONS.length && (
          <AnimatePresence mode="wait">
            <motion.div key={sec} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.18}}>
              <p className="tag" style={{marginBottom:'12px'}}>{SECTIONS[sec].t}</p>
              {SECTIONS[sec].f.map(([k,label])=>{
                const val = fv(b[k]); if (!val) return null;
                return (
                  <div key={k} className="df">
                    <div className="dk">{label}</div>
                    <div className="dv">{val}</div>
                  </div>
                );
              })}
              {SECTIONS[sec].f.every(([k])=>!fv(b[k])) && (
                <p className="font-mono" style={{fontSize:'9px',color:'var(--tmuted)',letterSpacing:'0.15em',padding:'16px 0'}}>NENHUM DADO</p>
              )}
            </motion.div>
          </AnimatePresence>
        )}
        {b && sec === SECTIONS.length && (
          <div>
            <p className="tag" style={{marginBottom:'12px'}}>ANOTAÇÕES INTERNAS</p>
            <textarea className="inp" value={notes} onChange={e=>setNotes(e.target.value)} rows={8} placeholder="Notas internas sobre este briefing..."/>
            <button className="btn btn-primary btn-sm" onClick={handleNotes} disabled={saving} style={{marginTop:'10px',display:'flex',alignItems:'center',gap:'8px'}}>
              {saving?<><span className="spin" style={{borderTopColor:'#fff',width:'14px',height:'14px'}}/><span>SALVANDO...</span></>:<span>SALVAR NOTAS</span>}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Users Panel ──────────────────────────────────────────────────────────────
function UsersPanel({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (t, type='ok') => { setToast({t,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(()=>{
    fetch('/api/admin/users').then(r=>r.json()).then(d=>{ setUsers(Array.isArray(d)?d:[]); setLoading(false); });
  },[]);

  const patch = async (id, body) => {
    const r = await fetch(`/api/admin/users?id=${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    return r.json();
  };
  const del = async (id) => {
    if (!confirm('Excluir este usuário?')) return;
    await fetch(`/api/admin/users?id=${id}`,{method:'DELETE'});
    setUsers(u=>u.filter(x=>x._id!==id));
    showToast('Usuário excluído.');
  };
  const toggleRole = async (u) => {
    const role = u.role==='admin'?'user':'admin';
    await patch(u._id,{role});
    setUsers(list=>list.map(x=>x._id===u._id?{...x,role}:x));
    showToast(`${u.name} agora é ${role}.`);
  };
  const toggleActive = async (u) => {
    const active = !u.active;
    await patch(u._id,{active});
    setUsers(list=>list.map(x=>x._id===u._id?{...x,active}:x));
    showToast(`${u.name} ${active?'ativado':'desativado'}.`);
  };

  return (
    <div style={{padding:'24px',position:'relative',zIndex:1}}>
      <div style={{marginBottom:'24px'}}>
        <p className="tag" style={{marginBottom:'8px'}}>Gerenciamento de Usuários</p>
        <h2 className="font-orb" style={{fontSize:'1.6rem',fontWeight:700,color:'var(--tbright)',letterSpacing:'0.04em'}}>
          <span className="text-grad">Usuários</span>
        </h2>
        <div className="cyber-line" style={{marginTop:'14px'}}/>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
        <span className="font-mono" style={{fontSize:'9px',color:'var(--tmuted)',letterSpacing:'0.16em'}}>{users.length} USUÁRIO(S)</span>
        <Link href="/register" className="btn btn-primary btn-sm font-orb" style={{textDecoration:'none',display:'inline-flex',alignItems:'center'}}>
          + NOVO USUÁRIO
        </Link>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'40px'}}><div className="spin"/></div>
      ) : (
        <div style={{border:'1px solid var(--border)',overflow:'hidden'}}>
          <table className="t-table">
            <thead><tr><th>NOME</th><th>EMAIL</th><th>CARGO</th><th>STATUS</th><th>ÚLTIMO LOGIN</th><th>AÇÕES</th></tr></thead>
            <tbody>
              {users.map((u,i)=>(
                <motion.tr key={u._id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.04}} style={{cursor:'default'}}>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <div style={{width:'28px',height:'28px',background:'rgba(14,165,233,0.1)',border:'1px solid rgba(14,165,233,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <span className="font-orb" style={{fontSize:'10px',color:'var(--blue)'}}>{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span style={{color:'var(--tbright)',fontSize:'13px'}}>{u.name}</span>
                      {u._id===currentUserId && <span className="badge badge-active" style={{fontSize:'7px'}}>VOCÊ</span>}
                    </div>
                  </td>
                  <td style={{color:'var(--tmuted)',fontSize:'12px'}}>{u.email}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td><span className={`badge badge-${u.active?'active':'inactive'}`}>{u.active?'ATIVO':'INATIVO'}</span></td>
                  <td className="font-mono" style={{fontSize:'9px',color:'var(--tmuted)'}}>{fd(u.lastLoginAt)}</td>
                  <td>
                    <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                      {u._id!==currentUserId && <>
                        <button className="btn btn-ghost btn-sm font-orb" onClick={()=>toggleRole(u)} style={{padding:'5px 10px',fontSize:'8px'}}>
                          {u.role==='admin'?'→ USER':'→ ADMIN'}
                        </button>
                        <button className="btn btn-ghost btn-sm font-orb" onClick={()=>toggleActive(u)} style={{padding:'5px 10px',fontSize:'8px',borderColor:u.active?'rgba(239,68,68,0.3)':'rgba(74,222,128,0.3)',color:u.active?'var(--danger)':'var(--success)'}}>
                          {u.active?'DESATIVAR':'ATIVAR'}
                        </button>
                        <button className="btn-danger btn-sm" onClick={()=>del(u._id)}>✕</button>
                      </>}
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

// ─── AI Briefings Panel ───────────────────────────────────────────────────────
function AIBriefingsPanel() {
  const [drafts, setDrafts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const searchRef = useRef(null);

  const fetchDrafts = async (q=search, p=page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({page:p,limit:15,search:q});
      const r = await fetch(`/api/admin/drafts?${params}`);
      const d = await r.json();
      setDrafts(d.drafts||[]); setTotal(d.total||0); setTotalPages(d.totalPages||1);
    } finally { setLoading(false); }
  };

  useEffect(()=>{ fetchDrafts(); },[page]);

  const handleSearch = (v) => {
    setSearch(v); clearTimeout(searchRef.current);
    searchRef.current = setTimeout(()=>{ setPage(1); fetchDrafts(v,1); },400);
  };

  const openDetail = async (id) => {
    setSelected(id); setDetail(null); setDetailLoading(true);
    const r = await fetch(`/api/admin/drafts?id=${id}`);
    const d = await r.json();
    setDetail(d); setDetailLoading(false);
  };

  // Render diagnosis sections
  const renderDiagnosis = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      const isHeader = /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{4,}$/.test(trimmed) && trimmed.length < 60;
      return (
        <p key={i} style={{
          fontSize: isHeader ? '10px' : '12px',
          color: isHeader ? 'var(--cyan)' : 'var(--text)',
          fontFamily: isHeader ? 'Share Tech Mono, monospace' : 'Exo 2, sans-serif',
          letterSpacing: isHeader ? '0.18em' : 'normal',
          marginBottom: isHeader ? '8px' : '4px',
          marginTop: isHeader ? '16px' : '0',
          lineHeight: 1.6,
          fontWeight: isHeader ? 700 : 400,
        }}>{trimmed}</p>
      );
    });
  };

  return (
    <div style={{padding:'24px',position:'relative',zIndex:1,display:'flex',gap:'16px',flex:1,minHeight:0}}>
      <div style={{flex:selected?'0 0 46%':'1',minWidth:0,display:'flex',flexDirection:'column',gap:'16px'}}>
        <div>
          <p className="tag" style={{marginBottom:'8px'}}>Briefings via IA</p>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px'}}>
            <h2 className="font-orb" style={{fontSize:'clamp(1.4rem,3vw,2rem)',fontWeight:700,letterSpacing:'0.04em'}}>
              <span className="text-grad">Diagnósticos IA</span>
              <span className="font-mono" style={{fontSize:'13px',color:'var(--tmuted)',marginLeft:'12px',letterSpacing:'0.1em',fontWeight:400}}>{total} TOTAL</span>
            </h2>
          </div>
          <div className="cyber-line" style={{marginTop:'12px'}}/>
        </div>

        <div style={{position:'relative',maxWidth:'320px'}}>
          <span style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'var(--tmuted)',fontFamily:'monospace',fontSize:'11px'}}>◈</span>
          <input className="inp" placeholder="Buscar por nome ou email..." value={search}
            onChange={e=>handleSearch(e.target.value)} style={{paddingLeft:'30px',paddingTop:'9px',paddingBottom:'9px'}}/>
        </div>

        <div style={{border:'1px solid var(--border)',overflow:'hidden'}}>
          {loading ? (
            <div style={{display:'flex',justifyContent:'center',padding:'40px',gap:'12px'}}>
              <div className="spin"/><span className="font-mono" style={{fontSize:'9px',color:'var(--tmuted)',letterSpacing:'0.15em'}}>CARREGANDO...</span>
            </div>
          ) : drafts.length === 0 ? (
            <div style={{textAlign:'center',padding:'50px'}}>
              <div style={{fontSize:'28px',color:'rgba(14,165,233,0.2)',marginBottom:'10px'}}>⬡</div>
              <p className="font-mono" style={{fontSize:'9px',color:'var(--tmuted)',letterSpacing:'0.18em'}}>NENHUM DIAGNÓSTICO</p>
            </div>
          ) : (
            <table className="t-table">
              <thead><tr><th>#</th><th>CLIENTE</th><th>EMAIL</th><th>DATA</th><th/></tr></thead>
              <tbody>
                {drafts.map((d,i)=>(
                  <motion.tr key={d._id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.03}}
                    className={selected===d._id?'sel':''} onClick={()=>openDetail(d._id)} style={{cursor:'pointer'}}>
                    <td className="font-mono" style={{fontSize:'8px',color:'var(--tmuted)'}}>{String((page-1)*15+i+1).padStart(3,'0')}</td>
                    <td style={{color:'var(--tbright)',fontWeight:500,fontSize:'13px'}}>{d.user?.name||'—'}</td>
                    <td className="font-mono" style={{fontSize:'9px',color:'var(--tmuted)'}}>{d.user?.email||'—'}</td>
                    <td className="font-mono" style={{fontSize:'8px',color:'var(--tmuted)'}}>{fd(d.updatedAt)}</td>
                    <td style={{color:selected===d._id?'var(--cyan)':'var(--tmuted)',fontSize:'12px'}}>›</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages>1&&(
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span className="font-mono" style={{fontSize:'8px',color:'var(--tmuted)',letterSpacing:'0.1em'}}>PÁG {page}/{totalPages}</span>
            <div style={{display:'flex',gap:'6px'}}>
              <button className="btn btn-ghost btn-sm font-orb" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}>‹</button>
              <button className="btn btn-ghost btn-sm font-orb" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail pane */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:20}}
            style={{flex:'0 0 52%',minWidth:0,maxHeight:'calc(100vh - 180px)',overflow:'hidden',display:'flex',flexDirection:'column',background:'var(--s1)',border:'1px solid var(--border)',position:'relative'}}>
            <div style={{position:'absolute',top:-1,left:-1,width:16,height:16,borderTop:'2px solid var(--cyan)',borderLeft:'2px solid var(--cyan)'}}/>
            <div style={{position:'absolute',bottom:-1,right:-1,width:16,height:16,borderBottom:'2px solid var(--cyan)',borderRight:'2px solid var(--cyan)'}}/>

            <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <p className="font-mono" style={{fontSize:'8px',color:'var(--cyan)',letterSpacing:'0.2em',marginBottom:'4px'}}>DIAGNÓSTICO COMPLETO</p>
                {detail && (
                  <>
                    <h3 className="font-orb" style={{fontSize:'15px',fontWeight:700,color:'var(--tbright)',letterSpacing:'0.04em'}}>{detail.userId?.name||'—'}</h3>
                    <p className="font-mono" style={{fontSize:'8px',color:'var(--tmuted)',marginTop:'2px'}}>{detail.userId?.email}</p>
                  </>
                )}
              </div>
              <button onClick={()=>{ setSelected(null); setDetail(null); }} className="btn btn-ghost btn-sm font-orb" style={{borderColor:'rgba(239,68,68,0.3)',color:'var(--danger)'}}>✕</button>
            </div>

            <div style={{flex:1,overflowY:'auto',padding:'18px 20px'}}>
              {detailLoading && <div style={{display:'flex',justifyContent:'center',padding:'30px'}}><div className="spin"/></div>}
              {detail && !detailLoading && (
                <div>
                  <p className="tag" style={{marginBottom:'14px'}}>DIAGNÓSTICO GERADO PELA IA</p>
                  <div style={{background:'rgba(6,238,245,0.02)',border:'1px solid rgba(14,165,233,0.08)',padding:'16px',lineHeight:1.7}}>
                    {renderDiagnosis(detail.diagnosis)}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard({ user }) {
  const router = useRouter();
  const [view, setView] = useState('briefings');
  const [toast, setToast] = useState(null);

  const showToast = (t,type='ok') => { setToast({t,type}); setTimeout(()=>setToast(null),3200); };

  const handleLogout = async () => { await fetch('/api/auth/logout',{method:'POST'}); router.push('/login'); };

  const navItems = [
    { key:'briefings', icon:'◈', label:'Briefings IA', adminOnly:true },
    { key:'users', icon:'◆', label:'Usuários', adminOnly:true },
  ];

  return (
    <>
      <Head><title>TM Dev — Dashboard</title><meta name="robots" content="noindex"/></Head>
      <div style={{background:'var(--bg)',minHeight:'100vh',position:'relative'}}>
        <CircuitBg opacity={0.2}/>
        <div className="dash-layout" style={{position:'relative',zIndex:1}}>

          {/* Sidebar */}
          <aside className="dash-sidebar">
            <div style={{padding:'20px 16px',borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'32px',height:'32px',border:'1px solid rgba(6,238,245,0.45)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 0 10px rgba(6,238,245,0.12)'}}>
                  <span className="font-orb text-cglow" style={{fontSize:'9px',fontWeight:700}}>TM</span>
                </div>
                <div>
                  <div className="font-orb" style={{fontSize:'11px',fontWeight:700,color:'var(--tbright)',letterSpacing:'0.1em'}}>TM DEV</div>
                  <div className="font-mono" style={{fontSize:'6px',color:'var(--tmuted)',letterSpacing:'0.2em'}}>CONTROL PANEL</div>
                </div>
              </div>
            </div>

            {/* User card */}
            <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',background:'rgba(14,165,233,0.03)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'32px',height:'32px',background:'rgba(14,165,233,0.12)',border:'1px solid rgba(14,165,233,0.22)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <span className="font-orb" style={{fontSize:'12px',color:'var(--blue)'}}>{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <div style={{minWidth:0}}>
                  <div className="font-exo" style={{fontSize:'12px',color:'var(--tbright)',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name}</div>
                  <span className={`badge badge-${user.role}`} style={{fontSize:'7px'}}>{user.role}</span>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav style={{flex:1,padding:'10px 0'}}>
              {navItems.filter(n=>!n.adminOnly||user.role==='admin').map(n=>(
                <div key={n.key} className={`nav-item ${view===n.key?'active':''}`} onClick={()=>{ setView(n.key); }}>
                  <span style={{fontSize:'14px'}}>{n.icon}</span>
                  <span>{n.label}</span>
                </div>
              ))}
            </nav>

            {/* Footer nav */}
            <div style={{padding:'10px 0',borderTop:'1px solid var(--border)'}}>
              <Link href="/account" className="nav-item">
                <span style={{fontSize:'13px'}}>⚙</span><span>Minha Conta</span>
              </Link>
              <Link href="/" target="_blank" className="nav-item">
                <span style={{fontSize:'13px'}}>↗</span><span>Formulário</span>
              </Link>
              <div className="nav-item" onClick={handleLogout} style={{color:'rgba(248,113,113,0.6)'}}>
                <span style={{fontSize:'13px'}}>⏻</span><span>Sair</span>
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="dash-main" style={{display:'flex',flexDirection:'column'}}>
            {view==='briefings' && user.role==='admin' && (
              <AIBriefingsPanel/>
            )}

            {view==='users' && user.role==='admin' && (
              <UsersPanel currentUserId={user.id}/>
            )}
          </div>
        </div>

        <AnimatePresence>{toast&&<Toast t={toast.t} type={toast.type} onClose={()=>setToast(null)}/>}</AnimatePresence>
      </div>
    </>
  );
}

export const getServerSideProps = withAuthSSR(async (ctx, user) => {
  return { props: { user } };
});
