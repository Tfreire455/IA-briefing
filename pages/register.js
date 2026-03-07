import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import CircuitBg from '../components/CircuitBg';
import { redirectIfAuth } from '../lib/auth';

function PasswordStrength({ password }) {
  const checks = [
    { label: 'Mín. 8 caracteres', ok: password.length >= 8 },
    { label: '1 letra maiúscula', ok: /[A-Z]/.test(password) },
    { label: '1 número', ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['', 'rgba(239,68,68,0.7)', 'rgba(250,204,21,0.7)', 'rgba(74,222,128,0.8)'];
  const labels = ['', 'FRACA', 'MÉDIA', 'FORTE'];

  if (!password) return null;
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ flex: 1, height: '2px', background: score >= i ? colors[score] : 'rgba(14,165,233,0.15)', transition: 'all 0.3s', boxShadow: score >= i ? `0 0 6px ${colors[score]}` : 'none' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {checks.map(c => (
          <span key={c.label} className="font-mono" style={{ fontSize: '8px', letterSpacing: '0.1em', color: c.ok ? 'rgba(74,222,128,0.8)' : 'var(--tmuted)', transition: 'color 0.2s' }}>
            {c.ok ? '✓' : '·'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', registerSecret: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [needsSecret, setNeedsSecret] = useState(!!process.env.NEXT_PUBLIC_HAS_SECRET);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); setServerError(''); };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Nome obrigatório.';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email inválido.';
    if (form.password.length < 8) errs.password = 'Mínimo 8 caracteres.';
    if (!/[A-Z]/.test(form.password)) errs.password = 'Inclua ao menos 1 maiúscula.';
    if (!/[0-9]/.test(form.password)) errs.password = 'Inclua ao menos 1 número.';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Senhas não coincidem.';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setServerError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { router.push('/dashboard'); return; }
      if (data.field) setErrors({ [data.field]: data.error });
      else setServerError(data.error || 'Erro ao registrar.');
    } catch { setServerError('Erro de conexão.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Head><title>TM Dev — Criar Conta</title><meta name="robots" content="noindex"/></Head>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', position: 'relative' }}>
        <CircuitBg opacity={0.38}/>
        <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(14,165,233,0.06) 0%, transparent 70%)', zIndex: 0 }}/>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative z-10 w-full" style={{ maxWidth: '460px' }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ width: '54px', height: '54px', border: '1px solid rgba(6,238,245,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 0 20px rgba(6,238,245,0.18)', position: 'relative' }}>
              {[[-4,-4],[48,-4],[-4,48],[48,48]].map(([x,y],i)=>(
                <div key={i} style={{ position:'absolute',left:x,top:y,width:8,height:8,background:'var(--cyan)',clipPath:'polygon(50% 0%,100% 50%,50% 100%,0% 50%)',boxShadow:'0 0 5px var(--cyan)' }}/>
              ))}
              <span className="font-orb text-cglow" style={{ fontSize:'13px',fontWeight:700 }}>TM</span>
            </div>
            <h1 className="font-orb text-glow" style={{ fontSize:'18px',fontWeight:700,letterSpacing:'0.14em' }}>TM DEV</h1>
            <p className="font-mono" style={{ fontSize:'8px',color:'var(--tmuted)',letterSpacing:'0.25em',marginTop:'4px' }}>CRIAR CONTA</p>
          </div>

          {/* Form panel */}
          <div className="panel" style={{ padding:'32px' }}>
            <p className="tag" style={{ marginBottom:'22px' }}>Novo Cadastro</p>

            {serverError && (
              <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} className="alert alert-error" style={{ marginBottom:'18px' }}>
                <span>⚠</span><span>{serverError}</span>
              </motion.div>
            )}

            {/* Name */}
            <div className="frow">
              <label className="flabel">Nome Completo *</label>
              <input className={`inp ${errors.name ? 'error' : ''}`} placeholder="Seu nome completo" value={form.name} onChange={e => set('name', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()}/>
              {errors.name && <p className="font-mono" style={{ fontSize:'8px',color:'var(--danger)',marginTop:'5px',letterSpacing:'0.08em' }}>{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="frow">
              <label className="flabel">Email *</label>
              <input className={`inp ${errors.email ? 'error' : ''}`} type="email" placeholder="seu@email.com" value={form.email} onChange={e => set('email', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()}/>
              {errors.email && <p className="font-mono" style={{ fontSize:'8px',color:'var(--danger)',marginTop:'5px',letterSpacing:'0.08em' }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="frow">
              <label className="flabel">Senha *</label>
              <div style={{ position:'relative' }}>
                <input className={`inp ${errors.password ? 'error' : ''}`} type={showPass ? 'text' : 'password'} placeholder="Mín. 8 chars, 1 maiúscula, 1 número" value={form.password} onChange={e => set('password', e.target.value)} style={{ paddingRight:'44px' }} onKeyDown={e => e.key === 'Enter' && handleSubmit()}/>
                <button onClick={() => setShowPass(s => !s)} style={{ position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:showPass?'var(--cyan)':'var(--tmuted)',cursor:'pointer',fontFamily:'monospace',fontSize:'11px',transition:'color 0.2s' }}>{showPass?'OC':'VR'}</button>
              </div>
              <PasswordStrength password={form.password}/>
              {errors.password && <p className="font-mono" style={{ fontSize:'8px',color:'var(--danger)',marginTop:'5px',letterSpacing:'0.08em' }}>{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div className="frow">
              <label className="flabel">Confirmar Senha *</label>
              <input className={`inp ${errors.confirmPassword ? 'error' : ''}`} type={showPass ? 'text' : 'password'} placeholder="Repita a senha" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()}/>
              {errors.confirmPassword && <p className="font-mono" style={{ fontSize:'8px',color:'var(--danger)',marginTop:'5px',letterSpacing:'0.08em' }}>{errors.confirmPassword}</p>}
            </div>

            {/* Register secret */}
            <div className="frow">
              <label className="flabel">Código de Convite</label>
              <input className={`inp ${errors.registerSecret ? 'error' : ''}`} type="password" placeholder="Código fornecido pelo admin (se aplicável)" value={form.registerSecret} onChange={e => set('registerSecret', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()}/>
              {errors.registerSecret && <p className="font-mono" style={{ fontSize:'8px',color:'var(--danger)',marginTop:'5px',letterSpacing:'0.08em' }}>{errors.registerSecret}</p>}
              <p className="font-mono" style={{ fontSize:'8px',color:'var(--tmuted)',marginTop:'5px',letterSpacing:'0.08em' }}>
                Deixe em branco se não houver código. O primeiro usuário vira admin automaticamente.
              </p>
            </div>

            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',marginTop:'8px' }}>
              {loading ? <><span className="spin" style={{ borderTopColor:'#fff' }}/><span>CRIANDO CONTA...</span></> : <span>CRIAR CONTA →</span>}
            </button>

            <div style={{ textAlign:'center',marginTop:'20px' }}>
              <span className="font-mono" style={{ fontSize:'9px',color:'var(--tmuted)',letterSpacing:'0.12em' }}>
                JÁ TEM CONTA?{' '}
                <Link href="/login" style={{ color:'var(--cyan)',textDecoration:'none' }}>ENTRAR</Link>
              </span>
            </div>
          </div>

          <div style={{ textAlign:'center',marginTop:'16px' }}>
            <Link href="/" className="font-mono" style={{ fontSize:'8px',color:'var(--tmuted)',letterSpacing:'0.15em',textDecoration:'none',transition:'color 0.2s' }}
              onMouseEnter={e=>e.target.style.color='var(--cyan)'} onMouseLeave={e=>e.target.style.color='var(--tmuted)'}>
              ← FORMULÁRIO PÚBLICO
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export const getServerSideProps = redirectIfAuth();
