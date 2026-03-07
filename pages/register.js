import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import CircuitBg from '../components/CircuitBg';
import { redirectIfAuth } from '../lib/auth';

function PasswordStrength({ password }) {
  const checks = [
    { label: 'Mín. 8 caracteres', ok: password.length >= 8 },
    { label: '1 letra maiúscula', ok: /[A-Z]/.test(password) },
    { label: '1 número', ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['', 'rgba(239,68,68,0.8)', 'rgba(250,204,21,0.8)', 'rgba(74,222,128,0.9)'];
  if (!password) return null;
  return (
    <div style={{ marginTop:'8px' }}>
      <div style={{ display:'flex', gap:'3px', marginBottom:'6px' }}>
        {[1,2,3].map(i=>(
          <div key={i} style={{ flex:1, height:'2px', borderRadius:'1px', background: score>=i ? colors[score] : 'rgba(14,165,233,0.15)', transition:'all 0.3s', boxShadow: score>=i ? `0 0 6px ${colors[score]}` : 'none' }}/>
        ))}
      </div>
      <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
        {checks.map(c=>(
          <span key={c.label} className="font-mono" style={{ fontSize:'clamp(7px,2vw,8px)', letterSpacing:'0.08em', color: c.ok ? 'rgba(74,222,128,0.9)' : 'var(--tmuted)', transition:'color 0.2s' }}>
            {c.ok ? '✓' : '·'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name:'', email:'', password:'', confirmPassword:'', registerSecret:'' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k, v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})); setServerError(''); };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Nome obrigatório.';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email inválido.';
    if (form.password.length < 8) errs.password = 'Mínimo 8 caracteres.';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Inclua ao menos 1 maiúscula.';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Inclua ao menos 1 número.';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Senhas não coincidem.';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setServerError('');
    try {
      const res = await fetch('/api/auth/register', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { router.push('/'); return; }
      if (data.field) setErrors({ [data.field]: data.error });
      else setServerError(data.error || 'Erro ao registrar.');
    } catch { setServerError('Erro de conexão.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Head><title>TM Dev — Criar Conta</title><meta name="robots" content="noindex"/></Head>
      <div className="pg">
        <CircuitBg opacity={0.35}/>
        <div className="glow-bg"/>

        <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} className="card">

          {/* Logo */}
          <div className="logo-area">
            <div className="logo-box">
              {[[-4,-4],[46,-4],[-4,46],[46,46]].map(([x,y],i)=>(
                <div key={i} className="ldot" style={{ left:x, top:y }}/>
              ))}
              <span className="font-orb text-cglow" style={{ fontSize:'clamp(11px,3vw,14px)', fontWeight:900 }}>TM</span>
            </div>
            <h1 className="font-orb text-glow" style={{ fontSize:'clamp(15px,5vw,20px)', fontWeight:700, letterSpacing:'0.12em', marginBottom:'4px' }}>TM DEV</h1>
            <p className="font-mono" style={{ fontSize:'clamp(7px,2vw,9px)', color:'var(--tmuted)', letterSpacing:'0.22em' }}>CRIAR CONTA</p>
          </div>

          {/* Form panel */}
          <div className="panel fp">
            <p className="tag" style={{ marginBottom:'clamp(14px,4vw,20px)' }}>Novo Cadastro</p>

            {serverError && (
              <motion.div initial={{ opacity:0, y:-5 }} animate={{ opacity:1, y:0 }}
                className="alert alert-error" style={{ marginBottom:'16px' }}>
                <span>⚠</span><span>{serverError}</span>
              </motion.div>
            )}

            {/* Name */}
            <div className="frow">
              <label className="flabel">Nome Completo *</label>
              <input className={`inp ${errors.name?'error':''}`} placeholder="Seu nome completo"
                value={form.name} onChange={e=>set('name',e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
              {errors.name && <p className="err-msg">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="frow">
              <label className="flabel">Email *</label>
              <input className={`inp ${errors.email?'error':''}`} type="email" placeholder="seu@email.com"
                value={form.email} onChange={e=>set('email',e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
              {errors.email && <p className="err-msg">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="frow">
              <label className="flabel">Senha *</label>
              <div style={{ position:'relative' }}>
                <input className={`inp ${errors.password?'error':''}`}
                  type={showPass?'text':'password'} placeholder="Mín. 8 chars, 1 maiúscula, 1 número"
                  value={form.password} onChange={e=>set('password',e.target.value)}
                  style={{ paddingRight:'50px' }} onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
                <button className="spb" onClick={()=>setShowPass(s=>!s)} type="button"
                  style={{ color:showPass?'var(--cyan)':'var(--tmuted)' }}>
                  {showPass?'OC':'VR'}
                </button>
              </div>
              <PasswordStrength password={form.password}/>
              {errors.password && <p className="err-msg">{errors.password}</p>}
            </div>

            {/* Confirm */}
            <div className="frow">
              <label className="flabel">Confirmar Senha *</label>
              <div style={{ position:'relative' }}>
                <input className={`inp ${errors.confirmPassword?'error':''}`}
                  type={showPass?'text':'password'} placeholder="Repita a senha"
                  value={form.confirmPassword} onChange={e=>set('confirmPassword',e.target.value)}
                  style={{ paddingRight:'50px' }} onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
                <button className="spb" onClick={()=>setShowPass(s=>!s)} type="button"
                  style={{ color:showPass?'var(--cyan)':'var(--tmuted)' }}>
                  {showPass?'OC':'VR'}
                </button>
              </div>
              {errors.confirmPassword && <p className="err-msg">{errors.confirmPassword}</p>}
            </div>

            {/* Secret */}
            <div className="frow">
              <label className="flabel">Código de Convite</label>
              <input className={`inp ${errors.registerSecret?'error':''}`}
                type="password" placeholder="Código fornecido pelo admin (se houver)"
                value={form.registerSecret} onChange={e=>set('registerSecret',e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
              {errors.registerSecret && <p className="err-msg">{errors.registerSecret}</p>}
              <p className="font-mono" style={{ fontSize:'clamp(7px,1.8vw,8px)', color:'var(--tmuted)', marginTop:'5px', letterSpacing:'0.06em', lineHeight:1.6 }}>
                Deixe em branco se não houver código. O primeiro usuário vira admin automaticamente.
              </p>
            </div>

            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}
              style={{ width:'100%', marginTop:'6px' }}>
              {loading
                ? <><span className="spin" style={{ borderTopColor:'#fff', width:'15px', height:'15px' }}/><span>CRIANDO CONTA...</span></>
                : <span>CRIAR CONTA →</span>}
            </button>

            <div style={{ textAlign:'center', marginTop:'18px' }}>
              <span className="font-mono" style={{ fontSize:'clamp(8px,2.2vw,9px)', color:'var(--tmuted)', letterSpacing:'0.1em' }}>
                JÁ TEM CONTA?{' '}
                <Link href="/login" style={{ color:'var(--cyan)', textDecoration:'none' }}>ENTRAR</Link>
              </span>
            </div>
          </div>

          <div style={{ textAlign:'center', marginTop:'14px' }}>
            <Link href="/" className="font-mono muted-link" style={{ fontSize:'clamp(7px,2vw,8px)', letterSpacing:'0.12em' }}>← INÍCIO</Link>
          </div>
        </motion.div>
      </div>

      <style>{`
        .pg { min-height:100vh; min-height:100dvh; background:var(--bg); display:flex; align-items:center; justify-content:center; padding:clamp(16px,4vw,40px) clamp(10px,3vw,20px); position:relative; overflow-x:hidden; }
        .glow-bg { position:fixed; inset:0; pointer-events:none; z-index:0; background:radial-gradient(ellipse 60% 60% at 50% 50%, rgba(14,165,233,0.06) 0%, transparent 70%); }
        .card { position:relative; z-index:10; width:100%; max-width:440px; }
        .logo-area { text-align:center; margin-bottom:clamp(14px,3.5vw,22px); }
        .logo-box { width:clamp(44px,11vw,52px); height:clamp(44px,11vw,52px); border:1px solid rgba(6,238,245,0.5); display:flex; align-items:center; justify-content:center; margin:0 auto clamp(10px,3vw,12px); box-shadow:0 0 20px rgba(6,238,245,0.18); position:relative; border-radius:4px; }
        .ldot { position:absolute; width:clamp(6px,1.8vw,8px); height:clamp(6px,1.8vw,8px); background:var(--cyan); clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%); box-shadow:0 0 5px var(--cyan); }
        .fp { padding:clamp(18px,5vw,30px); }
        .spb { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-family:monospace; font-size:clamp(9px,2.5vw,11px); transition:color 0.2s; padding:6px; min-height:32px; min-width:32px; }
        .err-msg { font-family:'Share Tech Mono',monospace; font-size:clamp(7px,2vw,8px); color:var(--danger); margin-top:5px; letter-spacing:0.06em; }
        .muted-link { color:var(--tmuted); text-decoration:none; transition:color 0.2s; }
        .muted-link:hover { color:var(--cyan); }
        @media(max-width:280px){ .pg{ padding:8px; align-items:flex-start; padding-top:12px; } }
      `}</style>
    </>
  );
}

export const getServerSideProps = redirectIfAuth();
