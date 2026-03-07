import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import CircuitBg from '../components/CircuitBg';
import { redirectIfAuth } from '../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [bootDone, setBootDone] = useState(false);
  const [bootText, setBootText] = useState('');

  useEffect(() => {
    const lines = ['BOOT TM_DEV v4.0...', 'LOADING PROTOCOLS...', 'SECURE CHANNEL OK.', 'AUTH READY.'];
    let line = 0, char = 0, acc = '';
    const tick = () => {
      if (line >= lines.length) { setBootText('SYS READY ■'); setBootDone(true); return; }
      acc = lines.slice(0, line).join('\n') + (line ? '\n' : '') + lines[line].slice(0, char + 1);
      setBootText(acc); char++;
      if (char >= lines[line].length) { line++; char = 0; setTimeout(tick, 350); }
      else setTimeout(tick, 18);
    };
    tick();
  }, []);

  const handleSubmit = async () => {
    if (!email || !password) { setError('Preencha email e senha.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) { router.push('/'); return; }
      setError(data.error || 'Credenciais inválidas.');
    } catch { setError('Erro de conexão.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Head><title>TM Dev — Acesso</title><meta name="robots" content="noindex"/></Head>
      <div className="pg">
        <CircuitBg opacity={0.4}/>
        <div className="glow-bg"/>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} className="card">

          {/* Logo */}
          <div className="logo-area">
            <div className="logo-box">
              {[[-4,-4],[46,-4],[-4,46],[46,46]].map(([x,y],i)=>(
                <div key={i} className="ldot" style={{ left:x, top:y }}/>
              ))}
              <span className="font-orb text-cglow ls">TM</span>
            </div>
            <h1 className="font-orb text-glow lh">TM DEV</h1>
            <p className="font-mono" style={{ fontSize:'clamp(7px,2vw,9px)', color:'var(--tmuted)', letterSpacing:'0.25em' }}>SECURE ACCESS PORTAL</p>
          </div>

          {/* Boot terminal */}
          <div className="boot-box">
            <pre className="font-mono" style={{ fontSize:'clamp(7px,1.8vw,8px)', color:'rgba(6,238,245,0.5)', letterSpacing:'0.1em', whiteSpace:'pre-wrap', lineHeight:2 }}>
              {bootText}{!bootDone && <span className="cblink">_</span>}
            </pre>
          </div>

          {/* Form panel */}
          <div className="panel fp">
            <p className="tag" style={{ marginBottom:'clamp(14px,4vw,20px)' }}>Autenticação</p>

            {error && (
              <motion.div initial={{ opacity:0, x:-5 }} animate={{ opacity:1, x:0 }}
                className="alert alert-error" style={{ marginBottom:'14px' }}>
                <span>⚠</span><span>{error}</span>
              </motion.div>
            )}

            <div className="frow">
              <label className="flabel">Email</label>
              <div className="input-wrap">
                <span className="fi">@</span>
                <input className="inp" type="email" placeholder="seu@email.com" value={email}
                  onChange={e=>{ setEmail(e.target.value); setError(''); }}
                  onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
                  style={{ paddingLeft:'32px' }} autoComplete="email"/>
              </div>
            </div>

            <div className="frow">
              <label className="flabel">Senha</label>
              <div className="input-wrap">
                <input className="inp" type={showPass?'text':'password'} placeholder="••••••••" value={password}
                  onChange={e=>{ setPassword(e.target.value); setError(''); }}
                  onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
                  style={{ paddingRight:'50px' }} autoComplete="current-password"/>
                <button className="spb" onClick={()=>setShowPass(s=>!s)} type="button"
                  style={{ color:showPass?'var(--cyan)':'var(--tmuted)' }}>
                  {showPass?'OC':'VR'}
                </button>
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}
              style={{ width:'100%' }}>
              {loading
                ? <><span className="spin" style={{ borderTopColor:'#fff', width:'15px', height:'15px' }}/><span>VERIFICANDO...</span></>
                : <span>ACESSAR SISTEMA →</span>}
            </button>

            <div style={{ textAlign:'center', marginTop:'18px' }}>
              <span className="font-mono" style={{ fontSize:'clamp(8px,2.2vw,9px)', color:'var(--tmuted)', letterSpacing:'0.1em' }}>
                NÃO TEM CONTA?{' '}
                <Link href="/register" style={{ color:'var(--cyan)', textDecoration:'none' }}>REGISTRAR</Link>
              </span>
            </div>
          </div>

          <div style={{ textAlign:'center', marginTop:'14px' }}>
            <Link href="/" className="font-mono muted-link" style={{ fontSize:'clamp(7px,2vw,8px)', letterSpacing:'0.12em' }}>← INÍCIO</Link>
          </div>
        </motion.div>
      </div>

      <style>{`
        .pg { min-height:100vh; min-height:100dvh; background:var(--bg); display:flex; align-items:center; justify-content:center; padding:clamp(12px,4vw,40px) clamp(10px,3vw,20px); position:relative; overflow-x:hidden; }
        .glow-bg { position:fixed; inset:0; pointer-events:none; z-index:0; background:radial-gradient(ellipse 60% 60% at 50% 50%, rgba(14,165,233,0.07) 0%, transparent 70%); }
        .card { position:relative; z-index:10; width:100%; max-width:390px; }
        .logo-area { text-align:center; margin-bottom:clamp(14px,4vw,24px); }
        .logo-box { width:clamp(44px,12vw,54px); height:clamp(44px,12vw,54px); border:1px solid rgba(6,238,245,0.5); display:flex; align-items:center; justify-content:center; margin:0 auto clamp(10px,3vw,14px); box-shadow:0 0 24px rgba(6,238,245,0.2); position:relative; border-radius:4px; }
        .ldot { position:absolute; width:clamp(7px,2vw,9px); height:clamp(7px,2vw,9px); background:var(--cyan); clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%); box-shadow:0 0 6px var(--cyan); }
        .ls { font-size:clamp(12px,3.5vw,15px); font-weight:900; }
        .lh { font-size:clamp(16px,5vw,22px); font-weight:700; letter-spacing:0.12em; margin-bottom:4px; }
        .boot-box { background:rgba(6,238,245,0.025); border:1px solid rgba(6,238,245,0.1); border-radius:4px; padding:clamp(8px,2.5vw,12px) clamp(10px,3vw,14px); margin-bottom:clamp(14px,3.5vw,20px); min-height:clamp(52px,14vw,70px); }
        .cblink { animation:_blink 1s step-end infinite; color:var(--cyan); }
        .fp { padding:clamp(18px,5vw,30px); }
        .input-wrap { position:relative; }
        .fi { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--tmuted); font-family:monospace; font-size:12px; pointer-events:none; }
        .spb { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-family:monospace; font-size:clamp(9px,2.5vw,11px); transition:color 0.2s; padding:6px; min-height:32px; min-width:32px; }
        .muted-link { color:var(--tmuted); text-decoration:none; transition:color 0.2s; }
        .muted-link:hover { color:var(--cyan); }
        @keyframes _blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @media(max-width:280px){ .pg{ padding:8px; align-items:flex-start; padding-top:16px; } }
      `}</style>
    </>
  );
}

export const getServerSideProps = redirectIfAuth();
