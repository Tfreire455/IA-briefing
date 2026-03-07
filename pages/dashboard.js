import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import CircuitBg from '../components/CircuitBg';
import { withAuthSSR } from '../lib/auth';

const fd = iso => iso ? new Date(iso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—';

function Toast({ t, type, onClose }) {
  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
      className={`toast toast-${type}`} onClick={onClose} style={{ cursor:'pointer' }}>
      <span>{type==='ok'?'✓':'⚠'}</span><span>{t}</span>
    </motion.div>
  );
}

// ── Users Panel ─────────────────────────────────────────────────────────────
function UsersPanel({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (t, type='ok') => { setToast({t,type}); setTimeout(()=>setToast(null), 3000); };

  useEffect(() => {
    fetch('/api/admin/users').then(r=>r.json()).then(d=>{ setUsers(d.users||[]); setLoading(false); });
  }, []);

  const patch = async (id, body) => {
    const r = await fetch(`/api/admin/users?id=${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const d = await r.json();
    setUsers(u=>u.map(x=>x._id===id?d:x));
    showToast('Usuário atualizado');
  };

  const del = async (id) => {
    if (!confirm('Excluir usuário?')) return;
    await fetch(`/api/admin/users?id=${id}`, { method:'DELETE' });
    setUsers(u=>u.filter(x=>x._id!==id));
    showToast('Usuário excluído');
  };

  return (
    <div className="panel-content">
      <div className="section-header">
        <p className="tag" style={{ marginBottom:'6px' }}>Gestão</p>
        <h2 className="font-orb section-title">
          <span className="text-grad">Usuários</span>
          <span className="font-mono count-badge">{users.length}</span>
        </h2>
        <div className="cyber-line" style={{ marginTop:'10px' }}/>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spin"/><span className="font-mono loading-txt">CARREGANDO...</span></div>
      ) : (
        <div className="table-wrap">
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
                    <div className="font-mono hide-mob-2" style={{ fontSize:'8px', color:'var(--tmuted)' }}>{u.email}</div>
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

// ── AI Briefings Panel ───────────────────────────────────────────────────────
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
  const [showDetail, setShowDetail] = useState(false);
  const searchRef = useRef(null);

  const fetchDrafts = async (q=search, p=page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({page:p, limit:15, search:q});
      const r = await fetch(`/api/admin/drafts?${params}`);
      const d = await r.json();
      setDrafts(d.drafts||[]); setTotal(d.total||0); setTotalPages(d.totalPages||1);
    } finally { setLoading(false); }
  };

  useEffect(()=>{ fetchDrafts(); },[page]);

  const handleSearch = (v) => {
    setSearch(v); clearTimeout(searchRef.current);
    searchRef.current = setTimeout(()=>{ setPage(1); fetchDrafts(v,1); }, 400);
  };

  const openDetail = async (id) => {
    setSelected(id); setDetail(null); setDetailLoading(true); setShowDetail(true);
    const r = await fetch(`/api/admin/drafts?id=${id}`);
    const d = await r.json();
    setDetail(d); setDetailLoading(false);
  };

  const closeDetail = () => { setShowDetail(false); setTimeout(()=>{ setSelected(null); setDetail(null); }, 300); };

  const renderDiagnosis = (text) => text?.split('\n').map((line,i)=>{
    const t = line.trim(); if (!t) return null;
    const isH = /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{4,}$/.test(t) && t.length < 60;
    return <p key={i} style={{ fontSize:isH?'clamp(8px,2vw,10px)':'clamp(11px,3vw,12px)', color:isH?'var(--cyan)':'var(--text)', fontFamily:isH?'Share Tech Mono, monospace':'Exo 2, sans-serif', letterSpacing:isH?'0.15em':'normal', marginBottom:isH?'8px':'4px', marginTop:isH?'14px':'0', lineHeight:1.65, fontWeight:isH?700:400 }}>{t}</p>;
  });

  return (
    <div className={`panel-content ${showDetail ? 'with-detail' : ''}`}>
      {/* List side */}
      <div className="list-side">
        <div className="section-header">
          <p className="tag" style={{ marginBottom:'6px' }}>Diagnósticos Gerados</p>
          <h2 className="font-orb section-title">
            <span className="text-grad">Briefings IA</span>
            <span className="font-mono count-badge">{total}</span>
          </h2>
          <div className="cyber-line" style={{ marginTop:'10px' }}/>
        </div>

        <div style={{ position:'relative', maxWidth:'300px', marginBottom:'14px' }}>
          <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--tmuted)', fontFamily:'monospace', fontSize:'11px', pointerEvents:'none' }}>◈</span>
          <input className="inp" placeholder="Buscar por nome ou email..." value={search}
            onChange={e=>handleSearch(e.target.value)} style={{ paddingLeft:'30px', paddingTop:'9px', paddingBottom:'9px' }}/>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="loading-center"><div className="spin"/><span className="font-mono loading-txt">CARREGANDO...</span></div>
          ) : drafts.length === 0 ? (
            <div className="empty-state"><span style={{ fontSize:'28px', color:'rgba(14,165,233,0.2)' }}>⬡</span><p className="font-mono" style={{ fontSize:'9px', color:'var(--tmuted)', letterSpacing:'0.18em' }}>NENHUM DIAGNÓSTICO</p></div>
          ) : (
            <table className="t-table">
              <thead><tr><th>#</th><th>CLIENTE</th><th className="hide-mob">EMAIL</th><th>DATA</th><th/></tr></thead>
              <tbody>
                {drafts.map((d,i)=>(
                  <motion.tr key={d._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                    className={selected===d._id?'sel':''} onClick={()=>openDetail(d._id)} style={{ cursor:'pointer' }}>
                    <td className="font-mono" style={{ fontSize:'8px', color:'var(--tmuted)' }}>{String((page-1)*15+i+1).padStart(3,'0')}</td>
                    <td style={{ color:'var(--tbright)', fontWeight:500, fontSize:'clamp(11px,3vw,13px)' }}>{d.user?.name||'—'}</td>
                    <td className="font-mono hide-mob" style={{ fontSize:'9px', color:'var(--tmuted)' }}>{d.user?.email||'—'}</td>
                    <td className="font-mono" style={{ fontSize:'8px', color:'var(--tmuted)', whiteSpace:'nowrap' }}>{fd(d.updatedAt)}</td>
                    <td style={{ color:selected===d._id?'var(--cyan)':'var(--tmuted)', fontSize:'14px' }}>›</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <span className="font-mono" style={{ fontSize:'8px', color:'var(--tmuted)', letterSpacing:'0.1em' }}>PÁG {page}/{totalPages}</span>
            <div style={{ display:'flex', gap:'6px' }}>
              <button className="btn btn-ghost btn-sm font-orb" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}>‹</button>
              <button className="btn btn-ghost btn-sm font-orb" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail slide panel */}
      <AnimatePresence>
        {showDetail && (
          <>
            <motion.div className="mob-overlay open" onClick={closeDetail}
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ display:'block', zIndex:150 }}/>
            <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}
              className="detail-pane">
              <div style={{ position:'absolute', top:-1, left:-1, width:14, height:14, borderTop:'2px solid var(--cyan)', borderLeft:'2px solid var(--cyan)', borderRadius:'4px 0 0 0' }}/>
              <div style={{ position:'absolute', bottom:-1, right:-1, width:14, height:14, borderBottom:'2px solid var(--cyan)', borderRight:'2px solid var(--cyan)', borderRadius:'0 0 4px 0' }}/>

              <div className="detail-header">
                <div style={{ minWidth:0 }}>
                  <p className="font-mono" style={{ fontSize:'clamp(7px,2vw,8px)', color:'var(--cyan)', letterSpacing:'0.18em', marginBottom:'4px' }}>DIAGNÓSTICO</p>
                  {detail && (
                    <>
                      <h3 className="font-orb" style={{ fontSize:'clamp(13px,3.5vw,15px)', fontWeight:700, color:'var(--tbright)', letterSpacing:'0.04em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{detail.userId?.name||'—'}</h3>
                      <p className="font-mono" style={{ fontSize:'clamp(8px,2vw,9px)', color:'var(--tmuted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{detail.userId?.email}</p>
                    </>
                  )}
                </div>
                <button onClick={closeDetail} className="btn-danger btn-sm font-orb" style={{ flexShrink:0 }}>✕</button>
              </div>

              <div className="detail-body">
                {detailLoading && <div className="loading-center"><div className="spin"/></div>}
                {detail && !detailLoading && (
                  <div>
                    <p className="tag" style={{ marginBottom:'14px' }}>DIAGNÓSTICO IA</p>
                    <div style={{ background:'rgba(6,238,245,0.02)', border:'1px solid rgba(14,165,233,0.07)', padding:'clamp(12px,3vw,16px)', borderRadius:'4px', lineHeight:1.8 }}>
                      {renderDiagnosis(detail.diagnosis)}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard({ user }) {
  const router = useRouter();
  const [view, setView] = useState('briefings');
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showToast = (t, type='ok') => { setToast({t,type}); setTimeout(()=>setToast(null), 3200); };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method:'POST' });
    router.push('/login');
  };

  const navItems = [
    { key:'briefings', icon:'◈', label:'Briefings IA', adminOnly:true },
    { key:'users', icon:'◆', label:'Usuários', adminOnly:true },
  ];

  const handleNav = (key) => { setView(key); setSidebarOpen(false); };

  return (
    <>
      <Head><title>TM Dev — Dashboard</title><meta name="robots" content="noindex"/></Head>
      <div style={{ background:'var(--bg)', minHeight:'100vh', position:'relative' }}>
        <CircuitBg opacity={0.18}/>

        <div className="dash-layout" style={{ position:'relative', zIndex:1 }}>

          {/* Mobile overlay */}
          <div className={`mob-overlay ${sidebarOpen?'open':''}`} onClick={()=>setSidebarOpen(false)}/>

          {/* Sidebar */}
          <aside className={`dash-sidebar ${sidebarOpen?'mob-open':''}`}>
            {/* Logo */}
            <div className="sidebar-logo">
              <div className="slogo-box">
                <span className="font-orb text-cglow" style={{ fontSize:'9px', fontWeight:700 }}>TM</span>
              </div>
              <div>
                <div className="font-orb" style={{ fontSize:'11px', fontWeight:700, color:'var(--tbright)', letterSpacing:'0.1em' }}>TM DEV</div>
                <div className="font-mono" style={{ fontSize:'6px', color:'var(--tmuted)', letterSpacing:'0.2em' }}>CONTROL PANEL</div>
              </div>
              {/* Close btn (mobile) */}
              <button className="sidebar-close" onClick={()=>setSidebarOpen(false)}>✕</button>
            </div>

            {/* User card */}
            <div className="sidebar-user">
              <div className="sidebar-avatar">
                <span className="font-orb" style={{ fontSize:'13px', color:'var(--blue)' }}>{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div style={{ minWidth:0 }}>
                <div className="font-exo" style={{ fontSize:'12px', color:'var(--tbright)', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</div>
                <span className={`badge badge-${user.role}`} style={{ fontSize:'7px' }}>{user.role}</span>
              </div>
            </div>

            {/* Nav */}
            <nav style={{ flex:1, padding:'8px 0', overflowY:'auto' }}>
              {navItems.filter(n=>!n.adminOnly||user.role==='admin').map(n=>(
                <div key={n.key} className={`nav-item ${view===n.key?'active':''}`} onClick={()=>handleNav(n.key)}>
                  <span style={{ fontSize:'14px', flexShrink:0 }}>{n.icon}</span>
                  <span>{n.label}</span>
                </div>
              ))}
            </nav>

            {/* Footer nav */}
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

          {/* Main content */}
          <div className="dash-main">
            {/* Top mobile bar */}
            <div className="mob-topbar">
              <button className={`ham-btn ${sidebarOpen?'open':''}`} onClick={()=>setSidebarOpen(s=>!s)}>
                <span/><span/><span/>
              </button>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <div className="slogo-box">
                  <span className="font-orb text-cglow" style={{ fontSize:'9px', fontWeight:700 }}>TM</span>
                </div>
                <span className="font-orb" style={{ fontSize:'11px', color:'var(--tbright)', letterSpacing:'0.1em' }}>TM DEV</span>
              </div>
              <span className="font-mono" style={{ fontSize:'clamp(8px,2.5vw,10px)', color:'var(--cyan)', letterSpacing:'0.1em' }}>
                {navItems.find(n=>n.key===view)?.label || 'DASHBOARD'}
              </span>
            </div>

            {/* Content */}
            {view === 'briefings' && user.role === 'admin' && <AIBriefingsPanel/>}
            {view === 'users' && user.role === 'admin' && <UsersPanel currentUserId={user.id}/>}
          </div>
        </div>

        <AnimatePresence>{toast && <Toast t={toast.t} type={toast.type} onClose={()=>setToast(null)}/>}</AnimatePresence>
      </div>

      <style>{`
        .sidebar-logo { display:flex; align-items:center; gap:10px; padding:16px 14px; border-bottom:1px solid var(--border); }
        .slogo-box { width:30px; height:30px; border:1px solid rgba(6,238,245,0.45); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 0 8px rgba(6,238,245,0.12); border-radius:3px; }
        .sidebar-close { display:none; margin-left:auto; background:none; border:none; color:var(--tmuted); cursor:pointer; font-size:14px; padding:4px; min-height:32px; min-width:32px; }
        .sidebar-user { display:flex; align-items:center; gap:10px; padding:12px 14px; border-bottom:1px solid var(--border); background:rgba(14,165,233,0.03); }
        .sidebar-avatar { width:32px; height:32px; background:rgba(14,165,233,0.12); border:1px solid rgba(14,165,233,0.22); display:flex; align-items:center; justify-content:center; flex-shrink:0; border-radius:3px; }

        .mob-topbar { display:none; align-items:center; justify-content:space-between; padding:0 clamp(10px,3vw,16px); height:var(--nav-h); background:rgba(2,11,22,0.95); border-bottom:1px solid var(--border); position:sticky; top:0; z-index:50; backdrop-filter:blur(14px); gap:10px; }

        .panel-content { padding:clamp(14px,3.5vw,24px); position:relative; }
        .with-detail { }
        .section-header { margin-bottom:clamp(14px,3.5vw,20px); }
        .section-title { font-size:clamp(1.3rem,4vw,1.9rem); font-weight:700; letter-spacing:0.04em; display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
        .count-badge { font-size:clamp(11px,3vw,13px); color:var(--tmuted); font-weight:400; letter-spacing:0.1em; }
        .loading-center { display:flex; justify-content:center; align-items:center; padding:clamp(30px,8vw,50px); gap:12px; }
        .loading-txt { font-size:9px; color:var(--tmuted); letter-spacing:0.15em; }
        .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:clamp(30px,8vw,50px) 20px; gap:10px; }
        .table-wrap { border:1px solid var(--border); border-radius:6px; overflow:hidden; overflow-x:auto; -webkit-overflow-scrolling:touch; }
        .pagination { display:flex; align-items:center; justify-content:space-between; margin-top:12px; }

        /* Detail pane */
        .detail-pane { position:fixed; top:0; right:0; bottom:0; width:min(480px, 100vw); background:var(--s1); border-left:1px solid var(--border); z-index:200; display:flex; flex-direction:column; box-shadow:-4px 0 32px rgba(0,0,0,0.5); }
        .detail-header { padding:clamp(12px,3.5vw,18px) clamp(14px,4vw,20px); border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; gap:12px; flex-shrink:0; }
        .detail-body { flex:1; overflow-y:auto; padding:clamp(14px,4vw,20px); }

        /* List side with detail */
        .list-side { }

        @media(max-width:768px){
          .mob-topbar { display:flex; }
          .sidebar-close { display:flex; align-items:center; justify-content:center; }
          .detail-pane { width:min(420px, calc(100vw - 0px)); }
        }
        @media(max-width:480px){
          .detail-pane { width:100vw; border-left:none; }
          .hide-mob-2 { display:none; }
        }
        @media(max-width:280px){
          .panel-content { padding:8px; }
          .mob-topbar { padding:0 8px; }
        }
      `}</style>
    </>
  );
}

export const getServerSideProps = withAuthSSR(async (ctx, user) => {
  return { props: { user } };
});
