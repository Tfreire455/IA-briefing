import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import CircuitBg from '../components/CircuitBg';
import { withAuthSSR } from '../lib/auth';

// ── Typing animation ───────────────────────────────────────────────────────
function TypingText({ text, onDone, speed = 18 }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    setDisplayed(''); setDone(false); idx.current = 0;
    if (!text) return;
    const iv = setInterval(() => {
      idx.current++;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) { clearInterval(iv); setDone(true); onDone?.(); }
    }, speed);
    return () => clearInterval(iv);
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && <span style={{ animation:'_blink 0.8s step-end infinite', color:'var(--cyan)' }}>▌</span>}
    </span>
  );
}

// ── Progress ring ──────────────────────────────────────────────────────────
function ProgressRing({ pct = 0, size = 48 }) {
  const r = size/2 - 4, c = 2 * Math.PI * r;
  const dash = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(14,165,233,0.12)" strokeWidth="2.5"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#pg)" strokeWidth="2.5"
        strokeDasharray={c} strokeDashoffset={dash} strokeLinecap="round"
        style={{ transform:'rotate(-90deg)', transformOrigin:'50% 50%', transition:'stroke-dashoffset 0.6s ease' }}/>
      <defs>
        <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0EA5E9"/><stop offset="100%" stopColor="#06EEF5"/>
        </linearGradient>
      </defs>
      <text x={size/2} y={size/2+4} textAnchor="middle" fill="var(--cyan)" fontFamily="Orbitron" fontSize="9" fontWeight="700">{pct}%</text>
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
const SECTION_ICONS = {
  'DADOS DO NEGÓCIO': '◆',
  'PERFIL DO CLIENTE': '◉',
  'DIAGNÓSTICO DE PRESENÇA': '⬡',
  'DIAGNÓSTICO DE CAPTAÇÃO': '◇',
  'DIAGNÓSTICO DE PROCESSOS': '⚙',
  'PRINCIPAIS DORES': '⚠',
  'OPORTUNIDADES IMEDIATAS': '★',
  'OPORTUNIDADES DE MÉDIO': '◆',
  'AUTOMAÇÕES': '⚙',
  'SISTEMAS': '⬡',
  'ESTRATÉGIA DE MARKETING': '◇',
  'ESTRATÉGIA DE CAPTAÇÃO': '◉',
  'ANÁLISE DE CONCORRÊNCIA': '◈',
  'NÍVEL DE URGÊNCIA': '⚠',
  'INVESTIMENTO': '★',
  'PRÓXIMOS PASSOS': '→',
  'RESUMO': '◈',
  'OPORTUNIDADES': '◆',
  'ESTRATÉGIAS': '◇',
  'RECOMENDAÇÕES': '★',
};

function parseDiagnosis(text) {
  const sections = [];
  let current = null;
  text.split('\n').forEach(line => {
    const t = line.trim(); if (!t) return;
    const matchKey = Object.keys(SECTION_ICONS).find(k => t.toUpperCase().startsWith(k));
    if (matchKey) {
      if (current) sections.push(current);
      current = { title:t, icon:SECTION_ICONS[matchKey], items:[] };
    } else if (current) { current.items.push(t); }
  });
  if (current) sections.push(current);
  if (!sections.length) sections.push({ title:'DIAGNÓSTICO COMPLETO', icon:'◈', items: text.split('\n').filter(Boolean) });
  return sections;
}

// ── PDF Export — abrir nova aba estilizada + auto print ────────────────────
function exportPDF(diagnosis, userName) {
  const sections = parseDiagnosis(diagnosis);
  const now = new Date().toLocaleString('pt-BR');

  const sectionsHTML = sections.map(sec => `
    <div class="section">
      <div class="section-head">
        <span class="section-icon">${sec.icon}</span>
        <span class="section-title">${sec.title}</span>
      </div>
      <div class="section-body">
        ${sec.items.map(item => {
          const isBullet = item.startsWith('•') || item.startsWith('-') || item.startsWith('*');
          const clean = item.replace(/^[•\-*]\s*/, '');
          return isBullet
            ? `<div class="item"><div class="bullet"></div><p class="item-text">${clean}</p></div>`
            : `<p class="item-head">${clean}</p>`;
        }).join('')}
      </div>
    </div>`).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Diagnóstico TM Dev — ${userName}</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Exo+2:wght@300;400;500;600&family=Share+Tech+Mono&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
@page{size:A4;margin:12mm 14mm 16mm;}
body{
  background:#020B16;color:#CBD5E1;
  font-family:'Exo 2',sans-serif;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
  font-size:11px;
}

/* ── Page header ── */
.page-header{
  background:linear-gradient(135deg,rgba(6,238,245,0.07) 0%,rgba(14,165,233,0.04) 50%,transparent 100%);
  border:1px solid rgba(6,238,245,0.3);
  border-radius:8px;
  padding:20px 24px 18px;
  margin-bottom:14px;
  position:relative;
  overflow:hidden;
}
.page-header::after{
  content:'';position:absolute;bottom:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,rgba(6,238,245,0.5),rgba(14,165,233,0.2),transparent);
}
.header-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;}
.logo-row{display:flex;align-items:center;gap:12px;}
.logo-box{
  width:38px;height:38px;
  border:1.5px solid rgba(6,238,245,0.55);
  border-radius:5px;display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 16px rgba(6,238,245,0.2);
  flex-shrink:0;
}
.logo-tm{font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;color:#06EEF5;text-shadow:0 0 8px rgba(6,238,245,0.5);}
.brand-name{font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;color:#F0F9FF;letter-spacing:0.12em;display:block;line-height:1.2;}
.brand-sub{font-family:'Share Tech Mono',monospace;font-size:6.5px;color:rgba(148,163,184,0.6);letter-spacing:0.22em;display:block;margin-top:2px;}
.title-block{text-align:right;}
.title-label{font-family:'Share Tech Mono',monospace;font-size:6.5px;color:rgba(6,238,245,0.65);letter-spacing:0.2em;display:block;margin-bottom:3px;}
.title-main{font-family:'Orbitron',sans-serif;font-size:15px;font-weight:700;color:#F0F9FF;letter-spacing:0.05em;display:block;margin-bottom:2px;}
.title-client{font-family:'Exo 2',sans-serif;font-size:12px;color:rgba(14,165,233,0.9);display:block;font-weight:500;}
.header-meta{display:flex;gap:14px;flex-wrap:wrap;border-top:1px solid rgba(14,165,233,0.1);padding-top:10px;}
.meta-item{font-family:'Share Tech Mono',monospace;font-size:7px;color:rgba(148,163,184,0.6);letter-spacing:0.1em;}
.meta-item b{color:rgba(14,165,233,0.8);font-weight:normal;}

/* ── Sections ── */
.section{
  background:rgba(14,165,233,0.03);
  border:1px solid rgba(14,165,233,0.1);
  border-left:2.5px solid rgba(6,238,245,0.45);
  border-radius:0 6px 6px 0;
  padding:12px 14px;
  margin-bottom:10px;
  break-inside:avoid;
}
.section-head{display:flex;align-items:center;gap:9px;margin-bottom:9px;padding-bottom:7px;border-bottom:1px solid rgba(14,165,233,0.07);}
.section-icon{font-size:12px;color:#06EEF5;text-shadow:0 0 5px rgba(6,238,245,0.4);flex-shrink:0;line-height:1;}
.section-title{font-family:'Orbitron',sans-serif;font-size:7.5px;font-weight:700;color:#F0F9FF;letter-spacing:0.13em;text-transform:uppercase;}
.section-body{display:flex;flex-direction:column;gap:4px;}
.item{display:flex;gap:8px;align-items:flex-start;}
.bullet{width:4px;height:4px;background:#06EEF5;flex-shrink:0;margin-top:5px;transform:rotate(45deg);box-shadow:0 0 3px rgba(6,238,245,0.4);}
.item-text{font-family:'Exo 2',sans-serif;font-size:10px;color:#CBD5E1;line-height:1.7;}
.item-head{font-family:'Exo 2',sans-serif;font-size:10.5px;color:#E2E8F0;line-height:1.65;font-weight:500;margin-bottom:2px;}

/* ── Footer ── */
.page-footer{
  margin-top:16px;padding:10px 16px;
  border-top:1px solid rgba(14,165,233,0.12);
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  break-inside:avoid;
}
.footer-brand{font-family:'Orbitron',sans-serif;font-size:8px;color:rgba(6,238,245,0.5);letter-spacing:0.1em;}
.footer-note{font-family:'Share Tech Mono',monospace;font-size:6.5px;color:rgba(148,163,184,0.35);letter-spacing:0.07em;text-align:right;line-height:1.6;}

/* ── Corner decorations ── */
.c{position:fixed;width:9px;height:9px;}
.c-tl{top:12mm;left:14mm;border-top:1.5px solid rgba(6,238,245,0.25);border-left:1.5px solid rgba(6,238,245,0.25);}
.c-tr{top:12mm;right:14mm;border-top:1.5px solid rgba(6,238,245,0.25);border-right:1.5px solid rgba(6,238,245,0.25);}
.c-bl{bottom:16mm;left:14mm;border-bottom:1.5px solid rgba(6,238,245,0.25);border-left:1.5px solid rgba(6,238,245,0.25);}
.c-br{bottom:16mm;right:14mm;border-bottom:1.5px solid rgba(6,238,245,0.25);border-right:1.5px solid rgba(6,238,245,0.25);}
</style>
</head>
<body>
<div class="c c-tl"></div><div class="c c-tr"></div>
<div class="c c-bl"></div><div class="c c-br"></div>

<div class="page-header">
  <div class="header-top">
    <div class="logo-row">
      <div class="logo-box"><span class="logo-tm">TM</span></div>
      <div>
        <span class="brand-name">TM DEV</span>
        <span class="brand-sub">DIAGNÓSTICO EMPRESARIAL IA</span>
      </div>
    </div>
    <div class="title-block">
      <span class="title-label">◈ RELATÓRIO PERSONALIZADO</span>
      <span class="title-main">SEU DIAGNÓSTICO</span>
      <span class="title-client">${userName}</span>
    </div>
  </div>
  <div class="header-meta">
    <span class="meta-item">◆ GERADO EM: <b>${now}</b></span>
    <span class="meta-item">◈ CLIENTE: <b>${userName}</b></span>
    <span class="meta-item">⬡ PLATAFORMA: <b>TM Dev Briefing IA</b></span>
    <span class="meta-item">★ STATUS: <b>DIAGNÓSTICO COMPLETO</b></span>
  </div>
</div>

${sectionsHTML}

<div class="page-footer">
  <span class="footer-brand">TM DEV © ${new Date().getFullYear()}</span>
  <span class="footer-note">
    Este diagnóstico foi gerado automaticamente pela IA da TM Dev<br/>
    com base nas respostas fornecidas durante a sessão de briefing.
  </span>
</div>

<script>
  document.fonts.ready.then(function(){
    setTimeout(function(){ window.print(); }, 800);
  });
</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { alert('Permita pop-ups para este site para exportar o PDF.'); return; }
  win.document.write(html);
  win.document.close();
}

// ── Diagnosis view ─────────────────────────────────────────────────────────
function DiagnosisView({ text, userName, onRestart }) {
  const sections = parseDiagnosis(text);

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="diag-wrap">
      <div style={{ textAlign:'center', marginBottom:'clamp(24px,5vw,40px)' }}>
        <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:180, delay:0.1 }}
          className="diag-check-box">
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
            <path d="M7 18L15 26L29 11" stroke="#06EEF5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
        <p className="tag" style={{ justifyContent:'center', marginBottom:'10px' }}>ANÁLISE COMPLETA</p>
        <h2 className="font-orb" style={{ fontSize:'clamp(1.4rem,5vw,2.6rem)', fontWeight:700, marginBottom:'10px' }}>
          <span className="text-grad">SEU DIAGNÓSTICO</span>
        </h2>
        <p className="font-exo" style={{ fontSize:'clamp(12px,3vw,14px)', color:'var(--tmuted)', maxWidth:'400px', margin:'0 auto', lineHeight:1.7 }}>
          Preparado pela <strong style={{ color:'var(--tbright)' }}>TM Dev</strong> para <strong style={{ color:'var(--tbright)' }}>{userName}</strong>
        </p>
        <div className="cyber-line" style={{ marginTop:'18px' }}/>
      </div>

      <div className="diag-grid">
        {sections.map((sec,i) => (
          <motion.div key={i} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}
            className="panel" style={{ padding:'clamp(14px,4vw,22px)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
              <span style={{ fontSize:'clamp(16px,4vw,20px)', color:'var(--cyan)', textShadow:'0 0 8px var(--cyan)', flexShrink:0 }}>{sec.icon}</span>
              <h3 className="font-orb" style={{ fontSize:'clamp(9px,2.5vw,11px)', fontWeight:700, letterSpacing:'0.12em', color:'var(--tbright)', lineHeight:1.3 }}>{sec.title}</h3>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              {sec.items.map((item,j) => {
                const isBullet = item.startsWith('•')||item.startsWith('-')||item.startsWith('*');
                const cleaned = item.replace(/^[•\-*]\s*/,'');
                return (
                  <div key={j} style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}>
                    {isBullet && <span style={{ width:'4px', height:'4px', background:'var(--cyan)', flexShrink:0, marginTop:'8px', clipPath:'polygon(50% 0%,100% 50%,50% 100%,0% 50%)' }}/>}
                    <p className="font-exo" style={{ fontSize:'clamp(12px,3vw,13px)', color:isBullet?'var(--text)':'var(--tbright)', lineHeight:1.65, fontWeight:isBullet?400:500 }}>{cleaned}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="diag-actions">
        <button className="btn btn-ghost font-orb" onClick={onRestart}>↺ NOVO BRIEFING</button>
        <button className="btn btn-primary font-orb" onClick={() => exportPDF(text, userName)}>
          <span>↓ EXPORTAR PDF</span>
        </button>
      </div>
    </motion.div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function BriefingPage({ user }) {
  const router = useRouter();
  const [phase, setPhase]               = useState('loading');
  const [existingDraft, setExistingDraft] = useState(null);
  const [question, setQuestion]         = useState('');
  const [options, setOptions]           = useState([]);
  const [progress, setProgress]         = useState(0);
  const [selected, setSelected]         = useState([]);
  const [freeText, setFreeText]         = useState('');
  const [sending, setSending]           = useState(false);
  const [typingDone, setTypingDone]     = useState(false);
  const [error, setError]               = useState('');
  const [diagnosis, setDiagnosis]       = useState('');
  const [history, setHistory]           = useState([]);
  const textRef  = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/draft');
        const d = await r.json();
        if (d.draft && d.draft.messageCount > 0) {
          setExistingDraft(d.draft);
          if (d.draft.completed) { setDiagnosis(d.draft.diagnosis); setPhase('diagnosis'); }
          else { setPhase('hero'); }
        } else { setPhase('hero'); }
      } catch { setPhase('hero'); }
    })();
  }, []);

  useEffect(() => {
    if (phase === 'chat') setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 100);
  }, [history, typingDone]);

  // Auto-focus textarea after typing finishes
  useEffect(() => {
    if (typingDone && phase === 'chat') setTimeout(() => textRef.current?.focus(), 200);
  }, [typingDone]);

  const toggleOpt = (opt) => setSelected(s => s.includes(opt) ? s.filter(x=>x!==opt) : [...s, opt]);

  const sendMessage = useCallback(async () => {
    const hasContent = selected.length > 0 || freeText.trim();
    if (!hasContent || sending) return;
    setSending(true); setError(''); setTypingDone(false);
    const userMsg = selected.length > 0
      ? selected.join(', ') + (freeText.trim() ? ` — ${freeText.trim()}` : '')
      : freeText.trim();
    setHistory(h => [...h, { role:'user', content:userMsg }]);
    setSelected([]); setFreeText('');
    try {
      const r = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ userMessage:freeText.trim(), selectedOptions:selected }),
      });
      if (r.status === 401) { router.push('/login'); return; }
      const data = await r.json();
      if (data.error) { setError(data.error); setSending(false); return; }
      if (data.type === 'diagnosis') {
        setDiagnosis(data.diagnosis); setProgress(100); setPhase('diagnosis');
      } else {
        setQuestion(data.question || '');
        setOptions(data.options || []);
        setProgress(data.progress || 0);
        setHistory(h => [...h, { role:'assistant', content:data.question }]);
      }
    } catch { setError('Erro de conexão. Tente novamente.'); }
    finally { setSending(false); }
  }, [selected, freeText, sending, router]);

  const startChat = async (resume = false) => {
    setPhase('chat'); setHistory([]); setProgress(0); setQuestion(''); setOptions([]);
    setSelected([]); setFreeText(''); setSending(true); setTypingDone(false); setError('');
    try {
      const r = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ reset:!resume, userMessage:'', selectedOptions:[] }),
      });
      if (r.status === 401) { router.push('/login'); return; }
      const data = await r.json();
      if (data.error) { setError(data.error); setSending(false); return; }
      if (data.type === 'question') {
        setQuestion(data.question || '');
        setOptions(data.options || []);
        setProgress(data.progress || 0);
        setHistory([{ role:'assistant', content:data.question }]);
      }
    } catch { setError('Erro de conexão.'); }
    finally { setSending(false); }
  };

  const handleRestart = async () => {
    await fetch('/api/draft', { method:'DELETE' });
    setExistingDraft(null); setDiagnosis(''); setHistory([]); setPhase('hero');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method:'POST' });
    router.push('/login');
  };

  // canSend: não precisa de typingDone — usuário pode digitar enquanto a IA ainda está "digitando"
  const canSend = (selected.length > 0 || freeText.trim().length > 0) && !sending;
  const firstName = user.name.split(' ')[0].toUpperCase();

  return (
    <>
      <Head><title>TM Dev — Briefing IA</title></Head>
      <div style={{ background:'var(--bg)', minHeight:'100vh', position:'relative' }}>
        <CircuitBg opacity={0.25}/>
        <div className="top-glow"/>

        {/* ── Header ── */}
        <header className="site-header">
          <div className="header-inner">
            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
              <div className="hlogo">
                <span className="font-orb text-cglow" style={{ fontSize:'9px', fontWeight:700 }}>TM</span>
              </div>
              <div className="hlogo-text">
                <span className="font-orb" style={{ fontSize:'clamp(10px,2.8vw,12px)', fontWeight:700, color:'var(--tbright)', letterSpacing:'0.1em', display:'block', lineHeight:1.2 }}>TM DEV</span>
                <span className="font-mono" style={{ fontSize:'clamp(6px,1.5vw,7px)', color:'var(--tmuted)', letterSpacing:'0.2em', display:'block' }}>AI BRIEFING</span>
              </div>
            </div>
            <div className="header-right">
              {phase === 'chat' && <div className="prog-area"><ProgressRing pct={progress} size={42}/></div>}
              <div className="user-chip">
                <div className="user-avatar">
                  <span className="font-orb" style={{ fontSize:'9px', color:'var(--blue)' }}>{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <span className="user-name font-exo">{firstName}</span>
              </div>
              {user.role === 'admin' && (
                <Link href="/dashboard" className="btn btn-ghost btn-sm font-orb header-btn" style={{ textDecoration:'none' }}>PAINEL</Link>
              )}
              <button className="btn btn-ghost btn-sm font-orb header-btn" onClick={handleLogout}
                style={{ borderColor:'rgba(239,68,68,0.3)', color:'var(--danger)' }}>SAIR</button>
            </div>
          </div>
          {phase === 'chat' && <div className="prog-track"><div className="prog-fill" style={{ width:`${progress}%` }}/></div>}
        </header>

        <AnimatePresence mode="wait">

          {/* ── Loading ── */}
          {phase === 'loading' && (
            <motion.div key="loading" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ minHeight:'calc(100vh - var(--nav-h))', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:1 }}>
              <div style={{ textAlign:'center' }}>
                <div className="spin" style={{ width:'30px', height:'30px', margin:'0 auto 12px', borderWidth:'3px' }}/>
                <p className="font-mono" style={{ fontSize:'8px', color:'var(--tmuted)', letterSpacing:'0.2em' }}>CARREGANDO...</p>
              </div>
            </motion.div>
          )}

          {/* ── Hero ── */}
          {phase === 'hero' && (
            <motion.div key="hero" initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
              className="hero-wrap">
              <div style={{ display:'flex', justifyContent:'center', marginBottom:'clamp(18px,4vw,28px)' }}>
                <div className="ai-icon">
                  {[[-5,-5],[68,-5],[-5,68],[68,68]].map(([x,y],i)=>(
                    <div key={i} style={{ position:'absolute', left:x, top:y, width:'clamp(8px,2.2vw,10px)', height:'clamp(8px,2.2vw,10px)', background:'var(--cyan)', clipPath:'polygon(50% 0%,100% 50%,50% 100%,0% 50%)', boxShadow:'0 0 6px var(--cyan)' }}/>
                  ))}
                  <span className="font-orb text-cglow" style={{ fontSize:'clamp(16px,4vw,20px)', fontWeight:900 }}>IA</span>
                </div>
              </div>
              <p className="tag" style={{ justifyContent:'center', marginBottom:'12px' }}>TM Dev — Briefing com IA</p>
              <h1 className="font-orb hero-title"><span className="text-grad">OLÁ, {firstName}!</span></h1>
              <h2 className="font-orb hero-sub">DIAGNÓSTICO INTELIGENTE DO SEU NEGÓCIO</h2>
              <p className="font-exo hero-desc">
                Nossa IA conduz uma entrevista personalizada, adapta as perguntas ao seu negócio e gera um diagnóstico completo com oportunidades de crescimento.
              </p>
              <div className="features-grid">
                {[['◈','Perguntas Adaptativas'],['◆','Análise em Tempo Real'],['⬡','Diagnóstico Completo']].map(([icon,t])=>(
                  <div key={t} className="panel panel-hover feat-card">
                    <div style={{ fontSize:'clamp(18px,4.5vw,22px)', color:'var(--cyan)', marginBottom:'8px' }}>{icon}</div>
                    <div className="font-mono" style={{ fontSize:'clamp(6px,1.8vw,7px)', color:'var(--tmuted)', letterSpacing:'0.08em', lineHeight:1.5 }}>{t}</div>
                  </div>
                ))}
              </div>
              {existingDraft && !existingDraft.completed && (
                <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="panel draft-banner">
                  <div style={{ flex:1, minWidth:0 }}>
                    <p className="font-mono" style={{ fontSize:'clamp(7px,1.8vw,8px)', color:'var(--cyan)', letterSpacing:'0.12em', marginBottom:'4px' }}>◈ RASCUNHO SALVO</p>
                    <p className="font-exo" style={{ fontSize:'clamp(11px,3vw,12px)', color:'var(--text)', marginBottom:'3px' }}>
                      Briefing em andamento — {existingDraft.progress}% concluído
                    </p>
                    <p className="font-mono" style={{ fontSize:'clamp(7px,1.8vw,8px)', color:'var(--tmuted)', letterSpacing:'0.06em' }}>
                      {new Date(existingDraft.updatedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <button className="btn btn-primary btn-sm font-orb" onClick={()=>startChat(true)} style={{ flexShrink:0 }}>CONTINUAR</button>
                </motion.div>
              )}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
                <button className="btn btn-primary font-orb hero-cta" onClick={()=>startChat(false)}>
                  <span>{existingDraft && !existingDraft.completed ? 'NOVO BRIEFING' : 'INICIAR BRIEFING →'}</span>
                </button>
                {existingDraft && !existingDraft.completed && (
                  <button className="font-mono discard-btn"
                    onClick={()=>{ fetch('/api/draft',{method:'DELETE'}); setExistingDraft(null); }}>
                    descartar rascunho
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Chat ── */}
          {phase === 'chat' && (
            <motion.div key="chat" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="chat-wrap">

              {/* Message history */}
              {history.length > 1 && (
                <div className="history">
                  {history.slice(0,-1).map((m,i)=>(
                    <div key={i} className={`msg-row ${m.role}`}>
                      {m.role === 'assistant' ? (
                        <>
                          <div className="msg-avatar ai-av"><span className="font-orb" style={{ fontSize:'7px', color:'var(--cyan)' }}>IA</span></div>
                          <p className="font-exo msg-text ai-text">{m.content}</p>
                        </>
                      ) : (
                        <>
                          <div className="msg-bubble">
                            <p className="font-exo msg-text user-text">{m.content}</p>
                          </div>
                          <div className="msg-avatar user-av"><span className="font-orb" style={{ fontSize:'8px', color:'var(--blue)' }}>{user.name.charAt(0)}</span></div>
                        </>
                      )}
                    </div>
                  ))}
                  <div className="cyber-line" style={{ margin:'10px 0' }}/>
                </div>
              )}

              {/* Current question */}
              {question && (
                <div className="msg-row assistant current-q">
                  <div className="msg-avatar ai-av active-av">
                    <span className="font-orb text-cglow" style={{ fontSize:'7px', fontWeight:700 }}>IA</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p className="font-mono" style={{ fontSize:'clamp(6px,1.6vw,7px)', color:'var(--cyan)', letterSpacing:'0.18em', marginBottom:'7px' }}>TM DEV CONSULTOR</p>
                    <p className="font-exo" style={{ fontSize:'clamp(14px,3.8vw,16px)', color:'var(--tbright)', lineHeight:1.65 }}>
                      <TypingText text={question} onDone={()=>setTypingDone(true)} speed={15}/>
                    </p>
                  </div>
                </div>
              )}

              {/* Thinking dots */}
              {sending && !question && (
                <div className="msg-row assistant">
                  <div className="msg-avatar ai-av"><span className="font-orb" style={{ fontSize:'7px', color:'var(--cyan)' }}>IA</span></div>
                  <div style={{ display:'flex', gap:'5px', alignItems:'center', paddingTop:'4px' }}>
                    {[0,1,2].map(i=>(
                      <div key={i} style={{ width:'7px', height:'7px', borderRadius:'50%', background:'var(--cyan)', animation:`_dot 1.2s ease-in-out ${i*0.2}s infinite` }}/>
                    ))}
                  </div>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────────────
                  ÁREA DE RESPOSTA — aparece assim que a IA termina de "digitar"
                  Sempre mostra o textarea. Opções são bonus quando a IA retorna.
                ────────────────────────────────────────────────────────────── */}
              <AnimatePresence>
                {typingDone && !sending && (
                  <motion.div
                    key="answer"
                    initial={{ opacity:0, y:14 }}
                    animate={{ opacity:1, y:0 }}
                    exit={{ opacity:0, y:6 }}
                    className="answer-area"
                  >
                    {/* Opções de múltipla escolha — só quando a IA retornar opções */}
                    {options.length > 0 && (
                      <div style={{ marginBottom:'16px' }}>
                        <p className="flabel" style={{ marginBottom:'10px' }}>Selecione uma ou mais opções:</p>
                        <div className="opts-grid">
                          {options.map(opt => {
                            const on = selected.includes(opt);
                            return (
                              <motion.div key={opt} whileTap={{ scale:0.97 }}
                                className={`opt ${on?'on':''}`} onClick={()=>toggleOpt(opt)}>
                                <span className={`chk-box ${on?'on':''}`}>
                                  {on && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </span>
                                <span>{opt}</span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Campo de texto — SEMPRE presente */}
                    <div style={{ marginBottom:'14px' }}>
                      <p className="flabel" style={{ marginBottom:'8px' }}>
                        {options.length > 0 ? 'Ou adicione detalhes:' : 'Escreva sua resposta:'}
                      </p>
                      <div style={{ position:'relative' }}>
                        <textarea
                          ref={textRef}
                          className="inp"
                          rows={options.length > 0 ? 2 : 3}
                          placeholder={
                            options.length > 0
                              ? 'Complemento opcional (ou responda só com as opções acima)...'
                              : 'Digite aqui sua resposta...'
                          }
                          value={freeText}
                          onChange={e => setFreeText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && canSend) sendMessage(); }}
                          style={{ paddingBottom:'30px', resize:'none' }}
                        />
                        <span className="font-mono kbd-hint">Ctrl+Enter para enviar</span>
                      </div>
                    </div>

                    {error && (
                      <div className="alert alert-error" style={{ marginBottom:'12px' }}>
                        <span>⚠</span><span>{error}</span>
                      </div>
                    )}

                    {/* Send row */}
                    <div className="send-row">
                      <div style={{ display:'flex', alignItems:'center', gap:'7px', minWidth:0 }}>
                        <div className="status-dot"/>
                        <span className="font-mono status-txt">
                          {selected.length > 0
                            ? `${selected.length} selecionada${selected.length > 1 ? 's' : ''}`
                            : freeText.trim()
                              ? 'Resposta digitada'
                              : options.length > 0 ? 'Selecione ou escreva' : 'Aguardando sua resposta'}
                        </span>
                      </div>
                      <button className="btn btn-primary font-orb" onClick={sendMessage} disabled={!canSend}>
                        {sending
                          ? <><span className="spin" style={{ borderTopColor:'#fff', width:'14px', height:'14px' }}/><span>ENVIANDO...</span></>
                          : <span>RESPONDER →</span>}
                      </button>
                    </div>

                    <p className="font-mono autosave-note">◈ RASCUNHO SALVO AUTOMATICAMENTE</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={bottomRef}/>
            </motion.div>
          )}

          {/* ── Diagnosis ── */}
          {phase === 'diagnosis' && (
            <motion.div key="diagnosis" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ position:'relative', zIndex:1 }}>
              <DiagnosisView text={diagnosis} userName={user.name} onRestart={handleRestart}/>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <style>{`
        .top-glow { position:fixed; inset:0; pointer-events:none; z-index:0; background:radial-gradient(ellipse 70% 40% at 50% 0%, rgba(14,165,233,0.07) 0%, transparent 70%); }

        /* Header */
        .site-header { position:sticky; top:0; z-index:50; background:rgba(2,11,22,0.92); border-bottom:1px solid var(--border); backdrop-filter:blur(14px); }
        .header-inner { max-width:820px; margin:0 auto; padding:0 clamp(10px,3vw,20px); height:var(--nav-h); display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .hlogo { width:30px; height:30px; border:1px solid rgba(6,238,245,0.45); display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(6,238,245,0.12); border-radius:3px; flex-shrink:0; }
        .header-right { display:flex; align-items:center; gap:6px; }
        .prog-area { display:flex; align-items:center; }
        .user-chip { display:flex; align-items:center; gap:6px; padding:4px 10px; background:rgba(14,165,233,0.06); border:1px solid rgba(14,165,233,0.15); border-radius:4px; }
        .user-avatar { width:20px; height:20px; background:rgba(14,165,233,0.15); border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .user-name { font-size:clamp(9px,2.5vw,11px); color:var(--text); }
        .header-btn { font-size:clamp(7px,2vw,9px) !important; padding:7px 12px !important; min-height:34px !important; }

        /* Hero */
        .hero-wrap { max-width:640px; margin:0 auto; padding:clamp(28px,7vw,60px) clamp(12px,4vw,24px) clamp(40px,8vw,60px); position:relative; z-index:1; text-align:center; }
        .ai-icon { width:clamp(60px,16vw,76px); height:clamp(60px,16vw,76px); border:1px solid rgba(6,238,245,0.45); display:flex; align-items:center; justify-content:center; position:relative; box-shadow:0 0 32px rgba(6,238,245,0.18); border-radius:6px; }
        .hero-title { font-size:clamp(1.7rem,7vw,3.2rem); font-weight:700; line-height:1.1; margin-bottom:10px; }
        .hero-sub { font-size:clamp(0.75rem,3vw,1.2rem); color:var(--text); letter-spacing:0.06em; font-weight:500; margin-bottom:16px; }
        .hero-desc { font-size:clamp(12px,3.2vw,14px); color:var(--tmuted); line-height:1.75; max-width:480px; margin:0 auto clamp(24px,6vw,36px); }
        .features-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:clamp(6px,2vw,10px); max-width:440px; margin:0 auto clamp(20px,5vw,32px); }
        .feat-card { padding:clamp(12px,3vw,16px) clamp(8px,2vw,10px); text-align:center; }
        .draft-banner { padding:clamp(14px,3.5vw,18px) clamp(14px,3.5vw,20px); margin-bottom:clamp(16px,4vw,22px); display:flex; align-items:center; gap:12px; flex-wrap:wrap; text-align:left; }
        .hero-cta { padding:clamp(13px,3.5vw,16px) clamp(28px,8vw,52px); font-size:clamp(9px,2.5vw,11px); width:min(100%, 300px); }
        .discard-btn { background:none; border:none; font-size:clamp(7px,2vw,8px); color:rgba(239,68,68,0.45); letter-spacing:0.1em; cursor:pointer; transition:color 0.2s; padding:4px; }
        .discard-btn:hover { color:var(--danger); }

        /* Chat */
        .chat-wrap { max-width:720px; margin:0 auto; padding:clamp(16px,4vw,32px) clamp(10px,3vw,20px) 100px; position:relative; z-index:1; }
        .history { display:flex; flex-direction:column; gap:clamp(6px,2vw,10px); margin-bottom:clamp(16px,4vw,24px); }
        .msg-row { display:flex; gap:clamp(8px,2.5vw,12px); align-items:flex-start; }
        .msg-row.user { justify-content:flex-end; }
        .msg-avatar { width:clamp(26px,7vw,32px); height:clamp(26px,7vw,32px); display:flex; align-items:center; justify-content:center; flex-shrink:0; border-radius:3px; margin-top:2px; }
        .ai-av { background:rgba(6,238,245,0.08); border:1px solid rgba(6,238,245,0.2); }
        .active-av { background:rgba(6,238,245,0.12); border-color:rgba(6,238,245,0.3); box-shadow:0 0 10px rgba(6,238,245,0.15); }
        .user-av { background:rgba(14,165,233,0.1); border:1px solid rgba(14,165,233,0.2); }
        .msg-text { font-size:clamp(12px,3.2vw,13px); line-height:1.65; }
        .ai-text { color:rgba(203,213,225,0.45); padding-top:3px; }
        .user-text { color:rgba(203,213,225,0.65); }
        .msg-bubble { max-width:75%; padding:clamp(8px,2.5vw,10px) clamp(10px,3vw,14px); background:rgba(14,165,233,0.07); border:1px solid rgba(14,165,233,0.18); border-radius:6px 0 6px 6px; }
        .current-q { margin-bottom:clamp(16px,4vw,24px); }

        /* Answer area */
        .answer-area { background:rgba(6,238,245,0.025); border:1px solid rgba(14,165,233,0.14); border-radius:8px; padding:clamp(14px,4vw,20px); margin-top:4px; }
        .opts-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(clamp(140px, 40vw, 200px), 1fr)); gap:clamp(5px,1.5vw,7px); }
        .kbd-hint { position:absolute; bottom:9px; right:10px; font-size:clamp(6px,1.8vw,7px); color:var(--tmuted); letter-spacing:0.08em; pointer-events:none; }
        .send-row { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; }
        .status-dot { width:5px; height:5px; border-radius:50%; background:rgba(74,222,128,0.8); box-shadow:0 0 5px rgba(74,222,128,0.6); animation:_pulse 2s ease-in-out infinite; flex-shrink:0; }
        .status-txt { font-size:clamp(7px,2vw,8px); color:var(--tmuted); letter-spacing:0.08em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .autosave-note { font-size:clamp(6px,1.8vw,7px); color:rgba(14,165,233,0.25); letter-spacing:0.1em; margin-top:10px; text-align:right; }

        /* Diagnosis */
        .diag-wrap { max-width:800px; margin:0 auto; padding:clamp(20px,5vw,36px) clamp(12px,4vw,24px); position:relative; z-index:1; }
        .diag-check-box { width:clamp(60px,15vw,80px); height:clamp(60px,15vw,80px); border:1px solid rgba(6,238,245,0.5); display:flex; align-items:center; justify-content:center; margin:0 auto clamp(14px,3.5vw,20px); box-shadow:0 0 28px rgba(6,238,245,0.22); border-radius:6px; }
        .diag-grid { display:grid; gap:clamp(10px,2.5vw,14px); }
        .diag-actions { display:flex; gap:clamp(8px,2.5vw,12px); justify-content:center; margin-top:clamp(24px,5vw,36px); flex-wrap:wrap; }

        @keyframes _blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes _dot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        @keyframes _pulse { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }

        @media(max-width:480px){
          .prog-area { display:none; }
          .user-name { display:none; }
          .features-grid { gap:6px; }
          .opts-grid { grid-template-columns:1fr 1fr; }
          .send-row { flex-direction:column; align-items:stretch; }
          .send-row .btn { width:100%; justify-content:center; }
          .diag-actions { flex-direction:column; align-items:center; }
          .diag-actions .btn { width:min(100%, 280px); justify-content:center; }
        }
        @media(max-width:360px){
          .opts-grid { grid-template-columns:1fr; }
          .features-grid { grid-template-columns:1fr; max-width:240px; }
          .draft-banner { flex-direction:column; align-items:flex-start; gap:10px; }
          .user-chip { padding:4px 7px; }
          .header-btn { display:none !important; }
        }
        @media(max-width:280px){
          .hlogo-text { display:none; }
          .chat-wrap, .hero-wrap { padding-left:8px; padding-right:8px; }
          .header-inner { padding:0 8px; }
          .msg-avatar { width:22px; height:22px; }
        }
      `}</style>
    </>
  );
}

export const getServerSideProps = withAuthSSR(async (ctx, user) => {
  return { props: { user } };
});