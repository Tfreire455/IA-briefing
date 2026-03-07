import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import CircuitBg from '../components/CircuitBg';
import { withAuthSSR } from '../lib/auth';

function Toast({ msg, type, onClose }) {
  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
      className={`toast toast-${type}`} onClick={onClose} style={{ cursor:'pointer' }}>
      <span>{type==='ok'?'✓':'⚠'}</span><span>{msg}</span>
    </motion.div>
  );
}

function PasswordStrength({ password }) {
  const checks = [
    { label:'Mín. 8 chars', ok: password.length >= 8 },
    { label:'Maiúscula',    ok: /[A-Z]/.test(password) },
    { label:'Número',       ok: /[0-9]/.test(password) },
  ];
  const score  = checks.filter(c => c.ok).length;
  const colors = ['','rgba(239,68,68,0.8)','rgba(250,204,21,0.8)','rgba(74,222,128,0.9)'];
  if (!password) return null;
  return (
    <div style={{ marginTop:'7px' }}>
      <div style={{ display:'flex', gap:'3px', marginBottom:'6px' }}>
        {[1,2,3].map(i=>(
          <div key={i} style={{ flex:1, height:'2px', borderRadius:'1px', background:score>=i?colors[score]:'rgba(14,165,233,0.15)', transition:'all 0.3s', boxShadow:score>=i?`0 0 5px ${colors[score]}`:'none' }}/>
        ))}
      </div>
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
        {checks.map(c=>(
          <span key={c.label} className="font-mono" style={{ fontSize:'clamp(7px,2vw,8px)', letterSpacing:'0.07em', color:c.ok?'rgba(74,222,128,0.9)':'var(--tmuted)', transition:'color 0.2s' }}>
            {c.ok?'✓':'·'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AccountPage({ user: initialUser }) {
  const router = useRouter();
  const [toast, setToast] = useState(null);

  const [profile, setProfile] = useState({ name:initialUser.name, email:initialUser.email });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);

  const [pw, setPw] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState({ current:false, new:false, confirm:false });

  const showToast = (msg, type='ok') => { setToast({msg,type}); setTimeout(()=>setToast(null), 3500); };

  const handleProfileSave = async () => {
    const errs = {};
    if (!profile.name.trim()) errs.name = 'Nome obrigatório.';
    if (!profile.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) errs.email = 'Email inválido.';
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }
    setProfileLoading(true); setProfileErrors({});
    try {
      const res = await fetch('/api/auth/update-profile', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(profile) });
      const data = await res.json();
      if (data.success) showToast('Perfil atualizado com sucesso!');
      else if (data.field) setProfileErrors({ [data.field]:data.error });
      else showToast(data.error||'Erro ao atualizar.','err');
    } catch { showToast('Erro de conexão.','err'); }
    finally { setProfileLoading(false); }
  };

  const handlePasswordChange = async () => {
    const errs = {};
    if (!pw.currentPassword) errs.currentPassword = 'Senha atual obrigatória.';
    if (pw.newPassword.length < 8) errs.newPassword = 'Mínimo 8 caracteres.';
    else if (!/[A-Z]/.test(pw.newPassword)) errs.newPassword = 'Inclua 1 letra maiúscula.';
    else if (!/[0-9]/.test(pw.newPassword)) errs.newPassword = 'Inclua 1 número.';
    if (pw.newPassword !== pw.confirmPassword) errs.confirmPassword = 'Senhas não coincidem.';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwLoading(true); setPwErrors({});
    try {
      const res = await fetch('/api/auth/change-password', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(pw) });
      const data = await res.json();
      if (data.success) { showToast('Senha alterada com sucesso!'); setPw({ currentPassword:'', newPassword:'', confirmPassword:'' }); }
      else if (data.field) setPwErrors({ [data.field]:data.error });
      else showToast(data.error||'Erro ao alterar senha.','err');
    } catch { showToast('Erro de conexão.','err'); }
    finally { setPwLoading(false); }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method:'POST' });
    router.push('/login');
  };

  return (
    <>
      <Head><title>TM Dev — Minha Conta</title></Head>
      <div style={{ minHeight:'100vh', background:'var(--bg)', position:'relative' }}>
        <CircuitBg opacity={0.2}/>

        {/* ── Header ── */}
        <header className="acc-header">
          <div className="acc-header-inner">
            <div style={{ display:'flex', alignItems:'center', gap:'clamp(8px,2.5vw,12px)' }}>
              <div className="hlogo">
                <span className="font-orb text-cglow" style={{ fontSize:'8px', fontWeight:700 }}>TM</span>
              </div>
              <div>
                <span className="font-orb" style={{ fontSize:'clamp(10px,3vw,12px)', fontWeight:700, color:'var(--tbright)', letterSpacing:'0.1em', display:'block', lineHeight:1.2 }}>TM DEV</span>
                <span className="font-mono" style={{ fontSize:'clamp(5px,1.5vw,7px)', color:'var(--tmuted)', letterSpacing:'0.18em', display:'block' }}>MINHA CONTA</span>
              </div>
            </div>
            <div className="acc-header-actions">
              <Link href="/dashboard" className="btn btn-ghost btn-sm font-orb hbtn" style={{ textDecoration:'none' }}>← PAINEL</Link>
              <button className="btn btn-ghost btn-sm font-orb hbtn" onClick={handleLogout}
                style={{ borderColor:'rgba(239,68,68,0.3)', color:'var(--danger)' }}>SAIR</button>
            </div>
          </div>
        </header>

        <main className="acc-main">
          {/* Page title */}
          <div style={{ marginBottom:'clamp(20px,5vw,32px)' }}>
            <p className="tag" style={{ marginBottom:'8px' }}>Configurações de Conta</p>
            <h1 className="font-orb" style={{ fontSize:'clamp(1.4rem,5vw,2.2rem)', fontWeight:700, letterSpacing:'0.04em' }}>
              <span className="text-grad">Meu Perfil</span>
            </h1>
            <div className="cyber-line" style={{ marginTop:'14px' }}/>
          </div>

          {/* User info bar */}
          <div className="panel user-bar">
            <div className="user-avatar-big">
              <span className="font-orb text-glow" style={{ fontSize:'clamp(14px,4vw,18px)' }}>{initialUser.name.charAt(0).toUpperCase()}</span>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="font-orb" style={{ fontSize:'clamp(13px,3.5vw,15px)', color:'var(--tbright)', letterSpacing:'0.06em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{initialUser.name}</div>
              <div className="font-mono" style={{ fontSize:'clamp(8px,2vw,9px)', color:'var(--tmuted)', letterSpacing:'0.1em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{initialUser.email}</div>
            </div>
            <span className={`badge badge-${initialUser.role}`} style={{ flexShrink:0 }}>{initialUser.role}</span>
          </div>

          {/* Cards grid */}
          <div className="acc-grid">

            {/* ── Profile ── */}
            <div className="panel acc-card">
              <p className="tag" style={{ marginBottom:'clamp(14px,4vw,20px)' }}>Dados Pessoais</p>

              <div className="frow">
                <label className="flabel">Nome Completo</label>
                <input className={`inp ${profileErrors.name?'error':''}`} value={profile.name}
                  onChange={e=>{ setProfile(p=>({...p,name:e.target.value})); setProfileErrors(e=>({...e,name:''})); }}
                  onKeyDown={e=>e.key==='Enter'&&handleProfileSave()}/>
                {profileErrors.name && <p className="err-msg">{profileErrors.name}</p>}
              </div>

              <div className="frow">
                <label className="flabel">Email</label>
                <input className={`inp ${profileErrors.email?'error':''}`} type="email" value={profile.email}
                  onChange={e=>{ setProfile(p=>({...p,email:e.target.value})); setProfileErrors(e=>({...e,email:''})); }}
                  onKeyDown={e=>e.key==='Enter'&&handleProfileSave()}/>
                {profileErrors.email && <p className="err-msg">{profileErrors.email}</p>}
              </div>

              <div className="frow">
                <label className="flabel">Cargo / Papel</label>
                <div className="inp disabled-inp">{initialUser.role} (gerenciado pelo admin)</div>
              </div>

              <button className="btn btn-primary" onClick={handleProfileSave} disabled={profileLoading}>
                {profileLoading ? <><span className="spin" style={{ borderTopColor:'#fff', width:'14px', height:'14px' }}/><span>SALVANDO...</span></> : <span>SALVAR PERFIL</span>}
              </button>
            </div>

            {/* ── Password ── */}
            <div className="panel acc-card">
              <p className="tag" style={{ marginBottom:'clamp(14px,4vw,20px)' }}>Alterar Senha</p>

              {/* Current */}
              <div className="frow">
                <label className="flabel">Senha Atual</label>
                <div style={{ position:'relative' }}>
                  <input className={`inp ${pwErrors.currentPassword?'error':''}`}
                    type={showPw.current?'text':'password'} placeholder="Sua senha atual"
                    value={pw.currentPassword}
                    onChange={e=>{ setPw(p=>({...p,currentPassword:e.target.value})); setPwErrors(e=>({...e,currentPassword:''})); }}
                    style={{ paddingRight:'50px' }}/>
                  <button className="spb" onClick={()=>setShowPw(s=>({...s,current:!s.current}))} type="button"
                    style={{ color:showPw.current?'var(--cyan)':'var(--tmuted)' }}>
                    {showPw.current?'OC':'VR'}
                  </button>
                </div>
                {pwErrors.currentPassword && <p className="err-msg">{pwErrors.currentPassword}</p>}
              </div>

              {/* New */}
              <div className="frow">
                <label className="flabel">Nova Senha</label>
                <div style={{ position:'relative' }}>
                  <input className={`inp ${pwErrors.newPassword?'error':''}`}
                    type={showPw.new?'text':'password'} placeholder="Mín. 8 chars, 1 maiúscula, 1 número"
                    value={pw.newPassword}
                    onChange={e=>{ setPw(p=>({...p,newPassword:e.target.value})); setPwErrors(e=>({...e,newPassword:''})); }}
                    style={{ paddingRight:'50px' }}/>
                  <button className="spb" onClick={()=>setShowPw(s=>({...s,new:!s.new}))} type="button"
                    style={{ color:showPw.new?'var(--cyan)':'var(--tmuted)' }}>
                    {showPw.new?'OC':'VR'}
                  </button>
                </div>
                <PasswordStrength password={pw.newPassword}/>
                {pwErrors.newPassword && <p className="err-msg">{pwErrors.newPassword}</p>}
              </div>

              {/* Confirm */}
              <div className="frow">
                <label className="flabel">Confirmar Nova Senha</label>
                <div style={{ position:'relative' }}>
                  <input className={`inp ${pwErrors.confirmPassword?'error':''}`}
                    type={showPw.confirm?'text':'password'} placeholder="Repita a nova senha"
                    value={pw.confirmPassword}
                    onChange={e=>{ setPw(p=>({...p,confirmPassword:e.target.value})); setPwErrors(e=>({...e,confirmPassword:''})); }}
                    style={{ paddingRight:'50px' }}/>
                  <button className="spb" onClick={()=>setShowPw(s=>({...s,confirm:!s.confirm}))} type="button"
                    style={{ color:showPw.confirm?'var(--cyan)':'var(--tmuted)' }}>
                    {showPw.confirm?'OC':'VR'}
                  </button>
                </div>
                {pw.confirmPassword && pw.newPassword && (
                  <p className="font-mono" style={{ fontSize:'clamp(7px,2vw,8px)', marginTop:'4px', letterSpacing:'0.06em', color:pw.newPassword===pw.confirmPassword?'rgba(74,222,128,0.9)':'var(--danger)' }}>
                    {pw.newPassword===pw.confirmPassword?'✓ Senhas conferem':'✗ Senhas não conferem'}
                  </p>
                )}
                {pwErrors.confirmPassword && <p className="err-msg">{pwErrors.confirmPassword}</p>}
              </div>

              <button className="btn btn-primary" onClick={handlePasswordChange} disabled={pwLoading}>
                {pwLoading ? <><span className="spin" style={{ borderTopColor:'#fff', width:'14px', height:'14px' }}/><span>ALTERANDO...</span></> : <span>ALTERAR SENHA</span>}
              </button>
            </div>
          </div>

          {/* Security info */}
          <div className="panel sec-info">
            {[
              { label:'ÚLTIMO LOGIN', value:initialUser.lastLoginAt ? new Date(initialUser.lastLoginAt).toLocaleString('pt-BR') : 'Primeira sessão' },
              { label:'CONTA CRIADA', value:new Date(initialUser.createdAt).toLocaleString('pt-BR') },
            ].map(({ label, value }) => (
              <div key={label} className="sec-item">
                <p className="font-mono" style={{ fontSize:'clamp(7px,1.8vw,8px)', color:'var(--tmuted)', letterSpacing:'0.16em', marginBottom:'4px' }}>{label}</p>
                <p className="font-exo" style={{ fontSize:'clamp(11px,3vw,13px)', color:'var(--text)' }}>{value}</p>
              </div>
            ))}
            <div className="sec-item">
              <p className="font-mono" style={{ fontSize:'clamp(7px,1.8vw,8px)', color:'var(--tmuted)', letterSpacing:'0.16em', marginBottom:'4px' }}>STATUS</p>
              <span className="badge badge-active">ATIVA</span>
            </div>
          </div>
        </main>

        <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}</AnimatePresence>
      </div>

      <style>{`
        .acc-header { position:sticky; top:0; z-index:50; background:rgba(2,11,22,0.92); border-bottom:1px solid var(--border); backdrop-filter:blur(14px); }
        .acc-header-inner { max-width:860px; margin:0 auto; padding:0 clamp(10px,3vw,24px); height:var(--nav-h); display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .hlogo { width:28px; height:28px; border:1px solid rgba(6,238,245,0.45); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 0 8px rgba(6,238,245,0.12); border-radius:3px; }
        .acc-header-actions { display:flex; gap:6px; flex-shrink:0; }
        .hbtn { font-size:clamp(7px,2vw,9px) !important; padding:7px 10px !important; min-height:34px !important; }
        
        .acc-main { max-width:860px; margin:0 auto; padding:clamp(16px,4vw,36px) clamp(10px,3vw,24px) clamp(32px,6vw,60px); position:relative; z-index:1; }
        
        .user-bar { padding:clamp(12px,3.5vw,16px) clamp(14px,4vw,20px); margin-bottom:clamp(16px,4vw,24px); display:flex; align-items:center; gap:clamp(10px,3vw,16px); flex-wrap:wrap; }
        .user-avatar-big { width:clamp(36px,9vw,44px); height:clamp(36px,9vw,44px); background:rgba(14,165,233,0.1); border:1px solid rgba(14,165,233,0.22); display:flex; align-items:center; justify-content:center; flex-shrink:0; border-radius:4px; }
        
        .acc-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(clamp(260px,45vw,360px), 1fr)); gap:clamp(12px,3vw,18px); margin-bottom:clamp(12px,3vw,18px); }
        .acc-card { padding:clamp(16px,4.5vw,26px); }
        
        .sec-info { padding:clamp(14px,4vw,20px) clamp(16px,4vw,22px); display:flex; gap:clamp(16px,5vw,32px); flex-wrap:wrap; align-items:flex-start; }
        .sec-item { min-width:0; }

        .disabled-inp { color:var(--tmuted); font-style:italic; cursor:not-allowed; font-size:clamp(13px,3.5vw,15px); padding:12px 14px; }
        .spb { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-family:monospace; font-size:clamp(9px,2.5vw,11px); transition:color 0.2s; padding:6px; min-height:32px; min-width:32px; }
        .err-msg { font-family:'Share Tech Mono',monospace; font-size:clamp(7px,2vw,8px); color:var(--danger); margin-top:4px; letter-spacing:0.06em; }

        @media(max-width:480px){
          .acc-grid { grid-template-columns:1fr; }
          .sec-info { gap:14px; }
          .user-bar { flex-wrap:nowrap; }
        }
        @media(max-width:360px){
          .acc-header-actions .hbtn:first-child { display:none; }
          .user-bar { flex-wrap:wrap; }
        }
        @media(max-width:280px){
          .acc-main { padding:8px; }
          .acc-header-inner { padding:0 8px; }
          .acc-grid { gap:8px; }
          .acc-card { padding:12px; }
          .hbtn { padding:6px 8px !important; font-size:7px !important; }
        }
      `}</style>
    </>
  );
}

export const getServerSideProps = withAuthSSR(async (ctx, user) => {
  const { connectDB } = await import('../lib/mongodb');
  const User = (await import('../models/User')).default;
  await connectDB();
  const u = await User.findById(user.id).lean();
  if (!u) return { redirect: { destination:'/login', permanent:false } };
  return { props: { user: JSON.parse(JSON.stringify({ ...u, passwordHash:undefined })) } };
});
