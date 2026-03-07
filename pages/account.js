import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import CircuitBg from '../components/CircuitBg';
import { withAuthSSR } from '../lib/auth';

function Toast({ msg, type, onClose }) {
  return (
    <motion.div initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:10 }}
      className={`toast toast-${type}`} style={{ display:'flex',alignItems:'center',gap:'10px' }}
      onClick={onClose} role="button">
      <span>{type==='ok'?'✓':'⚠'}</span><span>{msg}</span>
    </motion.div>
  );
}

function PasswordStrength({ password }) {
  const checks = [
    { label: 'Mín. 8 chars', ok: password.length >= 8 },
    { label: 'Maiúscula', ok: /[A-Z]/.test(password) },
    { label: 'Número', ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['', 'rgba(239,68,68,0.7)', 'rgba(250,204,21,0.7)', 'rgba(74,222,128,0.8)'];
  if (!password) return null;
  return (
    <div style={{ marginTop:'6px' }}>
      <div style={{ display:'flex',gap:'3px',marginBottom:'5px' }}>
        {[1,2,3].map(i=>(
          <div key={i} style={{ flex:1,height:'2px',background:score>=i?colors[score]:'rgba(14,165,233,0.15)',transition:'all 0.3s',boxShadow:score>=i?`0 0 5px ${colors[score]}`:'none' }}/>
        ))}
      </div>
      <div style={{ display:'flex',gap:'10px' }}>
        {checks.map(c=>(
          <span key={c.label} className="font-mono" style={{ fontSize:'8px',color:c.ok?'rgba(74,222,128,0.8)':'var(--tmuted)',transition:'color 0.2s' }}>
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

  // Profile state
  const [profile, setProfile] = useState({ name: initialUser.name, email: initialUser.email });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);

  // Password state
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Profile update ──────────────────────────────────────────────────
  const handleProfileSave = async () => {
    const errs = {};
    if (!profile.name.trim()) errs.name = 'Nome obrigatório.';
    if (!profile.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) errs.email = 'Email inválido.';
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }

    setProfileLoading(true); setProfileErrors({});
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.success) showToast('Perfil atualizado com sucesso!');
      else if (data.field) setProfileErrors({ [data.field]: data.error });
      else showToast(data.error || 'Erro ao atualizar.', 'err');
    } catch { showToast('Erro de conexão.', 'err'); }
    finally { setProfileLoading(false); }
  };

  // ── Password change ─────────────────────────────────────────────────
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
      const res = await fetch('/api/auth/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pw),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Senha alterada com sucesso!');
        setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else if (data.field) setPwErrors({ [data.field]: data.error });
      else showToast(data.error || 'Erro ao alterar senha.', 'err');
    } catch { showToast('Erro de conexão.', 'err'); }
    finally { setPwLoading(false); }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <>
      <Head><title>TM Dev — Minha Conta</title></Head>
      <div style={{ minHeight:'100vh',background:'var(--bg)',position:'relative' }}>
        <CircuitBg opacity={0.25}/>

        {/* Header */}
        <header style={{ position:'sticky',top:0,zIndex:50,background:'rgba(4,12,24,0.9)',borderBottom:'1px solid var(--border)',backdropFilter:'blur(14px)' }}>
          <div style={{ maxWidth:'900px',margin:'0 auto',padding:'13px 24px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'12px' }}>
              <div style={{ width:'34px',height:'34px',border:'1px solid rgba(6,238,245,0.45)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 10px rgba(6,238,245,0.12)' }}>
                <span className="font-orb text-cglow" style={{ fontSize:'9px',fontWeight:700 }}>TM</span>
              </div>
              <div>
                <span className="font-orb" style={{ fontSize:'12px',fontWeight:700,color:'var(--tbright)',letterSpacing:'0.1em' }}>TM DEV</span>
                <span className="font-mono" style={{ fontSize:'7px',color:'var(--tmuted)',letterSpacing:'0.2em',display:'block' }}>MINHA CONTA</span>
              </div>
            </div>
            <div style={{ display:'flex',gap:'10px',alignItems:'center' }}>
              <Link href="/dashboard" className="btn btn-ghost btn-sm font-orb" style={{ textDecoration:'none',display:'inline-flex',alignItems:'center' }}>
                ← DASHBOARD
              </Link>
              <button className="btn btn-ghost btn-sm font-orb" onClick={handleLogout} style={{ borderColor:'rgba(239,68,68,0.3)',color:'var(--danger)' }}>SAIR</button>
            </div>
          </div>
        </header>

        <main style={{ maxWidth:'900px',margin:'0 auto',padding:'36px 24px',position:'relative',zIndex:1 }}>
          {/* Page title */}
          <div style={{ marginBottom:'32px' }}>
            <p className="tag" style={{ marginBottom:'8px' }}>Configurações de Conta</p>
            <h1 className="font-orb" style={{ fontSize:'clamp(1.6rem,3vw,2.4rem)',fontWeight:700,letterSpacing:'0.04em' }}>
              <span className="text-grad">Meu Perfil</span>
            </h1>
            <div className="cyber-line" style={{ marginTop:'16px' }}/>
          </div>

          {/* User info bar */}
          <div className="panel" style={{ padding:'16px 20px',marginBottom:'28px',display:'flex',alignItems:'center',gap:'16px',flexWrap:'wrap' }}>
            <div style={{ width:'40px',height:'40px',background:'rgba(14,165,233,0.1)',border:'1px solid rgba(14,165,233,0.25)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <span className="font-orb text-glow" style={{ fontSize:'14px' }}>{initialUser.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <div className="font-orb" style={{ fontSize:'14px',color:'var(--tbright)',letterSpacing:'0.06em' }}>{initialUser.name}</div>
              <div className="font-mono" style={{ fontSize:'9px',color:'var(--tmuted)',letterSpacing:'0.1em' }}>{initialUser.email}</div>
            </div>
            <span className={`badge badge-${initialUser.role} ml-auto`}>{initialUser.role}</span>
          </div>

          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(380px, 1fr))',gap:'20px' }}>

            {/* ── Profile section ─────────────────────────────── */}
            <div className="panel" style={{ padding:'28px' }}>
              <p className="tag" style={{ marginBottom:'20px' }}>Dados Pessoais</p>

              <div className="frow">
                <label className="flabel">Nome Completo</label>
                <input className={`inp ${profileErrors.name?'error':''}`} value={profile.name}
                  onChange={e=>{ setProfile(p=>({...p,name:e.target.value})); setProfileErrors(e=>({...e,name:''})); }}
                  onKeyDown={e=>e.key==='Enter'&&handleProfileSave()}/>
                {profileErrors.name && <p className="font-mono" style={{ fontSize:'8px',color:'var(--danger)',marginTop:'4px',letterSpacing:'0.08em' }}>{profileErrors.name}</p>}
              </div>

              <div className="frow">
                <label className="flabel">Email</label>
                <input className={`inp ${profileErrors.email?'error':''}`} type="email" value={profile.email}
                  onChange={e=>{ setProfile(p=>({...p,email:e.target.value})); setProfileErrors(e=>({...e,email:''})); }}
                  onKeyDown={e=>e.key==='Enter'&&handleProfileSave()}/>
                {profileErrors.email && <p className="font-mono" style={{ fontSize:'8px',color:'var(--danger)',marginTop:'4px',letterSpacing:'0.08em' }}>{profileErrors.email}</p>}
              </div>

              <div className="frow">
                <label className="flabel">Cargo / Papel</label>
                <div className="inp" style={{ color:'var(--tmuted)',fontStyle:'italic',cursor:'not-allowed' }}>{initialUser.role} (gerenciado pelo admin)</div>
              </div>

              <button className="btn btn-primary" onClick={handleProfileSave} disabled={profileLoading}
                style={{ display:'flex',alignItems:'center',gap:'9px' }}>
                {profileLoading ? <><span className="spin" style={{ borderTopColor:'#fff' }}/><span>SALVANDO...</span></> : <span>SALVAR PERFIL</span>}
              </button>
            </div>

            {/* ── Change password ──────────────────────────────── */}
            <div className="panel" style={{ padding:'28px' }}>
              <p className="tag" style={{ marginBottom:'20px' }}>Alterar Senha</p>

              <div className="frow">
                <label className="flabel">Senha Atual</label>
                <div style={{ position:'relative' }}>
                  <input className={`inp ${pwErrors.currentPassword?'error':''}`}
                    type={showPw.current?'text':'password'} placeholder="Sua senha atual"
                    value={pw.currentPassword}
                    onChange={e=>{ setPw(p=>({...p,currentPassword:e.target.value})); setPwErrors(e=>({...e,currentPassword:''})); }}
                    style={{ paddingRight:'44px' }}/>
                  <button onClick={()=>setShowPw(s=>({...s,current:!s.current}))} style={{ position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:showPw.current?'var(--cyan)':'var(--tmuted)',cursor:'pointer',fontFamily:'monospace',fontSize:'11px',transition:'color 0.2s' }}>
                    {showPw.current?'OC':'VR'}
                  </button>
                </div>
                {pwErrors.currentPassword && <p className="font-mono" style={{ fontSize:'8px',color:'var(--danger)',marginTop:'4px',letterSpacing:'0.08em' }}>{pwErrors.currentPassword}</p>}
              </div>

              <div className="frow">
                <label className="flabel">Nova Senha</label>
                <div style={{ position:'relative' }}>
                  <input className={`inp ${pwErrors.newPassword?'error':''}`}
                    type={showPw.new?'text':'password'} placeholder="Mín. 8 chars, 1 maiúscula, 1 número"
                    value={pw.newPassword}
                    onChange={e=>{ setPw(p=>({...p,newPassword:e.target.value})); setPwErrors(e=>({...e,newPassword:''})); }}
                    style={{ paddingRight:'44px' }}/>
                  <button onClick={()=>setShowPw(s=>({...s,new:!s.new}))} style={{ position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:showPw.new?'var(--cyan)':'var(--tmuted)',cursor:'pointer',fontFamily:'monospace',fontSize:'11px',transition:'color 0.2s' }}>
                    {showPw.new?'OC':'VR'}
                  </button>
                </div>
                <PasswordStrength password={pw.newPassword}/>
                {pwErrors.newPassword && <p className="font-mono" style={{ fontSize:'8px',color:'var(--danger)',marginTop:'4px',letterSpacing:'0.08em' }}>{pwErrors.newPassword}</p>}
              </div>

              <div className="frow">
                <label className="flabel">Confirmar Nova Senha</label>
                <div style={{ position:'relative' }}>
                  <input className={`inp ${pwErrors.confirmPassword?'error':''}`}
                    type={showPw.confirm?'text':'password'} placeholder="Repita a nova senha"
                    value={pw.confirmPassword}
                    onChange={e=>{ setPw(p=>({...p,confirmPassword:e.target.value})); setPwErrors(e=>({...e,confirmPassword:''})); }}
                    style={{ paddingRight:'44px' }}/>
                  <button onClick={()=>setShowPw(s=>({...s,confirm:!s.confirm}))} style={{ position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:showPw.confirm?'var(--cyan)':'var(--tmuted)',cursor:'pointer',fontFamily:'monospace',fontSize:'11px',transition:'color 0.2s' }}>
                    {showPw.confirm?'OC':'VR'}
                  </button>
                </div>
                {pw.confirmPassword && pw.newPassword && (
                  <p className="font-mono" style={{ fontSize:'8px',marginTop:'4px',letterSpacing:'0.08em',color:pw.newPassword===pw.confirmPassword?'rgba(74,222,128,0.8)':'var(--danger)' }}>
                    {pw.newPassword===pw.confirmPassword?'✓ Senhas conferem':'✗ Senhas não conferem'}
                  </p>
                )}
                {pwErrors.confirmPassword && <p className="font-mono" style={{ fontSize:'8px',color:'var(--danger)',marginTop:'4px',letterSpacing:'0.08em' }}>{pwErrors.confirmPassword}</p>}
              </div>

              <button className="btn btn-primary" onClick={handlePasswordChange} disabled={pwLoading}
                style={{ display:'flex',alignItems:'center',gap:'9px' }}>
                {pwLoading ? <><span className="spin" style={{ borderTopColor:'#fff' }}/><span>ALTERANDO...</span></> : <span>ALTERAR SENHA</span>}
              </button>
            </div>
          </div>

          {/* Security info */}
          <div className="panel" style={{ padding:'20px',marginTop:'20px',display:'flex',gap:'32px',flexWrap:'wrap' }}>
            <div>
              <p className="font-mono" style={{ fontSize:'8px',color:'var(--tmuted)',letterSpacing:'0.18em',marginBottom:'4px' }}>ÚLTIMO LOGIN</p>
              <p className="font-exo" style={{ fontSize:'13px',color:'var(--text)' }}>
                {initialUser.lastLoginAt ? new Date(initialUser.lastLoginAt).toLocaleString('pt-BR') : 'Primeira sessão'}
              </p>
            </div>
            <div>
              <p className="font-mono" style={{ fontSize:'8px',color:'var(--tmuted)',letterSpacing:'0.18em',marginBottom:'4px' }}>CONTA CRIADA</p>
              <p className="font-exo" style={{ fontSize:'13px',color:'var(--text)' }}>
                {new Date(initialUser.createdAt).toLocaleString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="font-mono" style={{ fontSize:'8px',color:'var(--tmuted)',letterSpacing:'0.18em',marginBottom:'4px' }}>STATUS DA SESSÃO</p>
              <span className="badge badge-active">ATIVA</span>
            </div>
          </div>
        </main>

        <AnimatePresence>
          {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
        </AnimatePresence>
      </div>
    </>
  );
}

export const getServerSideProps = withAuthSSR(async (ctx, user) => {
  const { connectDB } = await import('../lib/mongodb');
  const User = (await import('../models/User')).default;
  await connectDB();
  const u = await User.findById(user.id).lean();
  if (!u) return { redirect: { destination: '/login', permanent: false } };
  return { props: { user: JSON.parse(JSON.stringify({ ...u, passwordHash: undefined })) } };
});
