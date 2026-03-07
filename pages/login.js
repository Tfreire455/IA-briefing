import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import CircuitBg from '../components/CircuitBg';
import { redirectIfAuth } from '../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bootDone, setBootDone] = useState(false);
  const [bootText, setBootText] = useState('');

  useEffect(() => {
    const lines = ['BOOT TM_DEV v3.0...', 'LOADING PROTOCOLS...', 'SECURE CHANNEL OK.', 'AUTH READY.'];
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
      if (data.success) { router.push('/dashboard'); return; }
      setError(data.error || 'Credenciais inválidas.');
    } catch { setError('Erro de conexão.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Head><title>TM Dev — Acesso</title><meta name="robots" content="noindex"/></Head>
      <div style={{ minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px 16px',position:'relative' }}>
        <CircuitBg opacity={0.45}/>
        <div className="fixed inset-0 pointer-events-none" style={{ background:'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(14,165,233,0.07) 0%, transparent 70%)',zIndex:0 }}/>

        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.5 }}
          className="relative z-10 w-full" style={{ maxWidth:'400px' }}>

          {/* Logo */}
          <div style={{ textAlign:'center',marginBottom:'24px' }}>
            <div style={{ width:'56px',height:'56px',border:'1px solid rgba(6,238,245,0.5)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',boxShadow:'0 0 24px rgba(6,238,245,0.2)',position:'relative' }}>
              {[[-4,-4],[50,-4],[-4,50],[50,50]].map(([x,y],i)=>(
                <div key={i} style={{ position:'absolute',left:x,top:y,width:9,height:9,background:'var(--cyan)',clipPath:'polygon(50% 0%,100% 50%,50% 100%,0% 50%)',boxShadow:'0 0 6px var(--cyan)' }}/>
              ))}
              <span className="font-orb text-cglow" style={{ fontSize:'14px',fontWeight:900 }}>TM</span>
            </div>
            <h1 className="font-orb text-glow" style={{ fontSize:'20px',fontWeight:700,letterSpacing:'0.14em' }}>TM DEV</h1>
            <p className="font-mono" style={{ fontSize:'8px',color:'var(--tmuted)',letterSpacing:'0.28em',marginTop:'4px' }}>SECURE ACCESS PORTAL</p>
          </div>

          {/* Boot log */}
          <div style={{ background:'rgba(6,238,245,0.03)',border:'1px solid rgba(6,238,245,0.1)',padding:'10px 14px',marginBottom:'20px',minHeight:'72px' }}>
            <pre className="font-mono" style={{ fontSize:'8px',color:'rgba(6,238,245,0.5)',letterSpacing:'0.1em',whiteSpace:'pre-wrap',lineHeight:1.8 }}>
              {bootText}{!bootDone && <span style={{ animation:'_blink 1s step-end infinite',color:'var(--cyan)' }}>_</span>}
            </pre>
          </div>

          {/* Login form */}
          <div className="panel" style={{ padding:'28px' }}>
            <p className="tag" style={{ marginBottom:'20px' }}>Autenticação</p>

            {error && (
              <motion.div initial={{ opacity:0,x:-6 }} animate={{ opacity:1,x:0 }} className="alert alert-error" style={{ marginBottom:'16px' }}>
                <span>⚠</span><span>{error}</span>
              </motion.div>
            )}

            <div className="frow">
              <label className="flabel">Email</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'var(--tmuted)',fontFamily:'monospace',fontSize:'11px' }}>@</span>
                <input className="inp" type="email" placeholder="seu@email.com" value={email}
                  onChange={e=>{ setEmail(e.target.value); setError(''); }}
                  onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
                  style={{ paddingLeft:'30px' }} autoComplete="email"/>
              </div>
            </div>

            <div className="frow">
              <label className="flabel">Senha</label>
              <div style={{ position:'relative' }}>
                <input className="inp" type={showPass?'text':'password'} placeholder="••••••••" value={password}
                  onChange={e=>{ setPassword(e.target.value); setError(''); }}
                  onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
                  style={{ paddingRight:'44px' }} autoComplete="current-password"/>
                <button onClick={()=>setShowPass(s=>!s)} style={{ position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:showPass?'var(--cyan)':'var(--tmuted)',cursor:'pointer',fontFamily:'monospace',fontSize:'11px',transition:'color 0.2s' }}>
                  {showPass?'OC':'VR'}
                </button>
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}
              style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',marginTop:'4px' }}>
              {loading ? <><span className="spin" style={{ borderTopColor:'#fff' }}/><span>VERIFICANDO...</span></> : <span>ACESSAR SISTEMA →</span>}
            </button>

            <div style={{ textAlign:'center',marginTop:'18px' }}>
              <span className="font-mono" style={{ fontSize:'9px',color:'var(--tmuted)',letterSpacing:'0.12em' }}>
                NÃO TEM CONTA?{' '}
                <Link href="/register" style={{ color:'var(--cyan)',textDecoration:'none' }}>REGISTRAR</Link>
              </span>
            </div>
          </div>

          <div style={{ textAlign:'center',marginTop:'14px' }}>
            <Link href="/" className="font-mono" style={{ fontSize:'8px',color:'var(--tmuted)',letterSpacing:'0.15em',textDecoration:'none',transition:'color 0.2s' }}
              onMouseEnter={e=>e.target.style.color='var(--cyan)'} onMouseLeave={e=>e.target.style.color='var(--tmuted)'}>
              ← FORMULÁRIO PÚBLICO
            </Link>
          </div>
        </motion.div>
      </div>
      <style>{`@keyframes _blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </>
  );
}

export const getServerSideProps = redirectIfAuth();
