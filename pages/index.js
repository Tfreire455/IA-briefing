import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import CircuitBg from '../components/CircuitBg';
import { withAuthSSR } from '../lib/auth';

// ── Typing animation ──────────────────────────────────────────────────────────
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
      if (idx.current >= text.length) {
        clearInterval(iv);
        setDone(true);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(iv);
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && <span style={{ animation: '_blink 0.8s step-end infinite', color: 'var(--cyan)' }}>▌</span>}
    </span>
  );
}

// ── Progress ring ─────────────────────────────────────────────────────────────
function ProgressRing({ pct = 0 }) {
  const r = 22, c = 2 * Math.PI * r;
  const dash = c - (pct / 100) * c;
  return (
    <svg width="58" height="58" viewBox="0 0 58 58">
      <circle cx="29" cy="29" r={r} fill="none" stroke="rgba(14,165,233,0.12)" strokeWidth="2.5"/>
      <circle cx="29" cy="29" r={r} fill="none" stroke="url(#pg)" strokeWidth="2.5"
        strokeDasharray={c} strokeDashoffset={dash} strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.6s ease' }}/>
      <defs>
        <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0EA5E9"/>
          <stop offset="100%" stopColor="#06EEF5"/>
        </linearGradient>
      </defs>
      <text x="29" y="34" textAnchor="middle" fill="var(--cyan)" fontFamily="Orbitron" fontSize="11" fontWeight="700">
        {pct}%
      </text>
    </svg>
  );
}

// ── Diagnosis renderer ────────────────────────────────────────────────────────
function DiagnosisView({ text, userName, onRestart }) {
  const sections = [];
  const lines = text.split('\n');
  let current = null;

  const SECTION_ICONS = {
    'RESUMO': '◈', 'PRINCIPAIS': '⚠', 'OPORTUNIDADES': '◆',
    'AUTOMAÇÕES': '⚙', 'ESTRATÉGIAS DE MARKETING': '◇',
    'SISTEMAS': '⬡', 'CAPTAÇÃO': '◉', 'RECOMENDAÇÕES': '★',
  };

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const isHeader = Object.keys(SECTION_ICONS).some(k => trimmed.toUpperCase().startsWith(k));
    if (isHeader) {
      if (current) sections.push(current);
      const icon = Object.entries(SECTION_ICONS).find(([k]) => trimmed.toUpperCase().startsWith(k))?.[1] || '◈';
      current = { title: trimmed, icon, items: [] };
    } else if (current) {
      current.items.push(trimmed);
    }
  });
  if (current) sections.push(current);

  // Fallback: no sections detected, show raw
  if (!sections.length) {
    sections.push({ title: 'DIAGNÓSTICO COMPLETO', icon: '◈', items: text.split('\n').filter(Boolean) });
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '860px', margin: '0 auto', padding: '36px 24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 180, delay: 0.1 }}
          style={{ width: '80px', height: '80px', border: '1px solid rgba(6,238,245,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 32px rgba(6,238,245,0.25)' }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M7 18L15 26L29 11" stroke="#06EEF5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
        <p className="tag" style={{ justifyContent: 'center', marginBottom: '12px' }}>ANÁLISE COMPLETA</p>
        <h2 className="font-orb" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', fontWeight: 700, marginBottom: '10px' }}>
          <span className="text-grad">SEU DIAGNÓSTICO</span>
        </h2>
        <p className="font-exo" style={{ fontSize: '14px', color: 'var(--tmuted)', maxWidth: '440px', margin: '0 auto' }}>
          Diagnóstico personalizado para <strong style={{ color: 'var(--tbright)' }}>{userName}</strong> — preparado pela TM Dev.
        </p>
        <div className="cyber-line" style={{ marginTop: '22px' }} />
      </div>

      {/* Sections */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {sections.map((sec, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="panel" style={{ padding: '22px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <span style={{ fontSize: '20px', color: 'var(--cyan)', textShadow: '0 0 8px var(--cyan)', flexShrink: 0 }}>{sec.icon}</span>
              <h3 className="font-orb" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--tbright)' }}>{sec.title}</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {sec.items.map((item, j) => {
                const isBullet = item.startsWith('•') || item.startsWith('-') || item.startsWith('*');
                const cleaned = item.replace(/^[•\-*]\s*/, '');
                return (
                  <div key={j} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    {isBullet && (
                      <span style={{ width: '5px', height: '5px', background: 'var(--cyan)', flexShrink: 0, marginTop: '7px', clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)' }}/>
                    )}
                    <p className="font-exo" style={{ fontSize: '13px', color: isBullet ? 'var(--text)' : 'var(--tbright)', lineHeight: 1.65, fontWeight: isBullet ? 400 : 500 }}>{cleaned}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '36px', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost font-orb" onClick={onRestart}>↺ NOVO BRIEFING</button>
        {typeof window !== 'undefined' && (
          <button className="btn btn-primary font-orb" onClick={() => window.print()}>
            <span>↓ SALVAR PDF</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BriefingPage({ user }) {
  const router = useRouter();

  // Phase: 'loading' | 'hero' | 'chat' | 'diagnosis'
  const [phase, setPhase] = useState('loading');
  const [existingDraft, setExistingDraft] = useState(null);

  // Chat state
  const [question, setQuestion]     = useState('');
  const [options, setOptions]       = useState([]);
  const [progress, setProgress]     = useState(0);
  const [selected, setSelected]     = useState([]);
  const [freeText, setFreeText]     = useState('');
  const [sending, setSending]       = useState(false);
  const [typingDone, setTypingDone] = useState(false);
  const [error, setError]           = useState('');
  const [diagnosis, setDiagnosis]   = useState('');

  // History display (question, answer pairs)
  const [history, setHistory] = useState([]);

  const textRef = useRef(null);

  // ── Load existing draft on mount ───────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/draft');
        const d = await r.json();
        if (d.draft && d.draft.messageCount > 0) {
          setExistingDraft(d.draft);
          if (d.draft.completed) {
            setDiagnosis(d.draft.diagnosis);
            setPhase('diagnosis');
          } else {
            setPhase('hero');
          }
        } else {
          setPhase('hero');
        }
      } catch {
        setPhase('hero');
      }
    })();
  }, []);

  // ── Toggle option selection ────────────────────────────────────────
  const toggleOpt = (opt) => {
    setSelected(s => s.includes(opt) ? s.filter(x => x !== opt) : [...s, opt]);
  };

  // ── Send message to AI ─────────────────────────────────────────────
  const sendMessage = useCallback(async ({ reset = false, isFirst = false } = {}) => {
    const hasContent = selected.length > 0 || freeText.trim() || isFirst;
    if (!hasContent || sending) return;

    setSending(true); setError(''); setTypingDone(false);

    // Add user turn to history display
    if (!isFirst) {
      const userMsg = selected.length > 0
        ? selected.join(', ') + (freeText.trim() ? ` — ${freeText.trim()}` : '')
        : freeText.trim();
      setHistory(h => [...h, { role: 'user', content: userMsg }]);
    }

    setSelected([]); setFreeText('');

    try {
      const body = {
        userMessage: freeText.trim(),
        selectedOptions: selected,
        reset,
      };
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (r.status === 401) { router.push('/login'); return; }
      const data = await r.json();
      if (data.error) { setError(data.error); return; }

      if (data.type === 'diagnosis') {
        setDiagnosis(data.diagnosis);
        setProgress(100);
        setPhase('diagnosis');
      } else {
        setQuestion(data.question || '');
        setOptions(data.options || []);
        setProgress(data.progress || 0);
        setHistory(h => [...h, { role: 'assistant', content: data.question }]);
        setTimeout(() => textRef.current?.focus(), 400);
      }
    } catch { setError('Erro de conexão. Tente novamente.'); }
    finally { setSending(false); }
  }, [selected, freeText, sending, router]);

  // ── Start / resume chat ────────────────────────────────────────────
  const startChat = async (resume = false) => {
    setPhase('chat'); setHistory([]); setProgress(0);
    setQuestion(''); setOptions([]);
    setSelected([]); setFreeText('');

    setSending(true); setTypingDone(false); setError('');
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: !resume, userMessage: '', selectedOptions: [] }),
      });
      if (r.status === 401) { router.push('/login'); return; }
      const data = await r.json();
      if (data.error) { setError(data.error); return; }

      if (data.type === 'question') {
        setQuestion(data.question || '');
        setOptions(data.options || []);
        setProgress(data.progress || 0);
        setHistory([{ role: 'assistant', content: data.question }]);
      }
    } catch { setError('Erro de conexão.'); }
    finally { setSending(false); }
  };

  const handleRestart = async () => {
    await fetch('/api/draft', { method: 'DELETE' });
    setExistingDraft(null); setDiagnosis(''); setHistory([]);
    setPhase('hero');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const canSend = (selected.length > 0 || freeText.trim().length > 0) && !sending && typingDone;

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <>
      <Head><title>TM Dev — Briefing Inteligente</title></Head>
      <div style={{ background: 'var(--bg)', minHeight: '100vh', position: 'relative' }}>
        <CircuitBg opacity={0.3} />
        <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(14,165,233,0.07) 0%, transparent 70%)', zIndex: 0 }} />

        {/* ── Top nav ──────────────────────────────────────────────── */}
        <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(4,12,24,0.92)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(14px)' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '11px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', border: '1px solid rgba(6,238,245,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(6,238,245,0.12)' }}>
                <span className="font-orb text-cglow" style={{ fontSize: '9px', fontWeight: 700 }}>TM</span>
              </div>
              <div>
                <span className="font-orb" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--tbright)', letterSpacing: '0.1em' }}>TM DEV</span>
                <span className="font-mono" style={{ fontSize: '6px', color: 'var(--tmuted)', letterSpacing: '0.2em', display: 'block' }}>AI BRIEFING</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {phase === 'chat' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ProgressRing pct={progress} />
                  <span className="font-mono" style={{ fontSize: '8px', color: 'var(--tmuted)', letterSpacing: '0.1em' }}>PROGRESSO</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 12px', background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)' }}>
                <div style={{ width: '22px', height: '22px', background: 'rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="font-orb" style={{ fontSize: '9px', color: 'var(--blue)' }}>{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <span className="font-exo" style={{ fontSize: '11px', color: 'var(--text)' }}>{user.name}</span>
              </div>
              {user.role === 'admin' && (
                <Link href="/dashboard" className="btn btn-ghost btn-sm font-orb" style={{ textDecoration: 'none', display: 'inline-flex', fontSize: '9px' }}>PAINEL</Link>
              )}
              <button className="btn btn-ghost btn-sm font-orb" onClick={handleLogout} style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'var(--danger)', fontSize: '9px' }}>SAIR</button>
            </div>
          </div>
          {phase === 'chat' && (
            <div className="prog-track"><div className="prog-fill" style={{ width: `${progress}%` }} /></div>
          )}
        </header>

        <AnimatePresence mode="wait">

          {/* ── Loading ─────────────────────────────────────────────── */}
          {phase === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ minHeight: 'calc(100vh - 58px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{ textAlign: 'center' }}>
                <div className="spin" style={{ width: '32px', height: '32px', margin: '0 auto 14px', borderWidth: '3px' }} />
                <p className="font-mono" style={{ fontSize: '8px', color: 'var(--tmuted)', letterSpacing: '0.2em' }}>CARREGANDO...</p>
              </div>
            </motion.div>
          )}

          {/* ── Hero ────────────────────────────────────────────────── */}
          {phase === 'hero' && (
            <motion.div key="hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ maxWidth: '700px', margin: '0 auto', padding: '60px 24px', position: 'relative', zIndex: 1, textAlign: 'center' }}>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
                <div style={{ width: '76px', height: '76px', border: '1px solid rgba(6,238,245,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 0 36px rgba(6,238,245,0.18)' }}>
                  {[[-5, -5], [70, -5], [-5, 70], [70, 70]].map(([x, y], i) => (
                    <div key={i} style={{ position: 'absolute', left: x, top: y, width: 10, height: 10, background: 'var(--cyan)', clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)', boxShadow: '0 0 6px var(--cyan)' }} />
                  ))}
                  <span className="font-orb text-cglow" style={{ fontSize: '19px', fontWeight: 900 }}>IA</span>
                </div>
              </div>

              <p className="tag" style={{ justifyContent: 'center', marginBottom: '14px' }}>TM Dev — Briefing com IA</p>
              <h1 className="font-orb" style={{ fontSize: 'clamp(1.9rem, 5vw, 3.4rem)', fontWeight: 700, lineHeight: 1.1, marginBottom: '10px' }}>
                <span className="text-grad">OLÁ, {user.name.split(' ')[0].toUpperCase()}!</span>
              </h1>
              <h2 className="font-orb" style={{ fontSize: 'clamp(0.85rem, 2.2vw, 1.3rem)', color: 'var(--text)', letterSpacing: '0.08em', fontWeight: 500, marginBottom: '20px' }}>
                DIAGNÓSTICO INTELIGENTE DO SEU NEGÓCIO
              </h2>
              <p className="font-exo" style={{ fontSize: '14px', color: 'var(--tmuted)', lineHeight: 1.75, maxWidth: '500px', margin: '0 auto 36px' }}>
                Nossa IA vai conduzir uma entrevista personalizada com você, adaptando as perguntas ao seu negócio e gerando um diagnóstico completo com oportunidades de crescimento.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxWidth: '460px', margin: '0 auto 38px' }}>
                {[['◈', 'Perguntas Adaptativas'], ['◆', 'Análise em Tempo Real'], ['⬡', 'Diagnóstico Completo']].map(([icon, t]) => (
                  <div key={t} className="panel panel-hover" style={{ padding: '16px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', color: 'var(--cyan)', marginBottom: '8px' }}>{icon}</div>
                    <div className="font-mono" style={{ fontSize: '7px', color: 'var(--tmuted)', letterSpacing: '0.08em' }}>{t}</div>
                  </div>
                ))}
              </div>

              {/* Draft banner */}
              {existingDraft && !existingDraft.completed && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="panel" style={{ padding: '18px 22px', marginBottom: '24px', maxWidth: '460px', margin: '0 auto 24px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <p className="font-mono" style={{ fontSize: '8px', color: 'var(--cyan)', letterSpacing: '0.15em', marginBottom: '4px' }}>◈ RASCUNHO SALVO</p>
                    <p className="font-exo" style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '3px' }}>
                      Você tem um briefing em andamento — {existingDraft.progress}% concluído
                    </p>
                    <p className="font-mono" style={{ fontSize: '8px', color: 'var(--tmuted)', letterSpacing: '0.08em' }}>
                      {new Date(existingDraft.updatedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <button className="btn btn-primary btn-sm font-orb" onClick={() => startChat(true)}>
                    CONTINUAR →
                  </button>
                </motion.div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <button className="btn btn-primary font-orb" onClick={() => startChat(false)} style={{ padding: '15px 52px', fontSize: '11px' }}>
                  <span>{existingDraft && !existingDraft.completed ? 'NOVO BRIEFING' : 'INICIAR BRIEFING →'}</span>
                </button>
                {existingDraft && !existingDraft.completed && (
                  <p className="font-mono" style={{ fontSize: '8px', color: 'rgba(239,68,68,0.5)', letterSpacing: '0.1em', cursor: 'pointer' }}
                    onClick={() => { fetch('/api/draft', { method: 'DELETE' }); setExistingDraft(null); }}>
                    descartar rascunho
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Chat ────────────────────────────────────────────────── */}
          {phase === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ maxWidth: '780px', margin: '0 auto', padding: '32px 24px 100px', position: 'relative', zIndex: 1 }}>

              {/* History */}
              {history.length > 1 && (
                <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {history.slice(0, -1).map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
                      {m.role === 'assistant' ? (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <div style={{ width: '28px', height: '28px', background: 'rgba(6,238,245,0.1)', border: '1px solid rgba(6,238,245,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                            <span className="font-orb" style={{ fontSize: '8px', color: 'var(--cyan)' }}>IA</span>
                          </div>
                          <p className="font-exo" style={{ fontSize: '13px', color: 'rgba(203,213,225,0.45)', lineHeight: 1.6, paddingTop: '4px' }}>{m.content}</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
                          <div style={{ maxWidth: '70%', padding: '9px 14px', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
                            <p className="font-exo" style={{ fontSize: '12px', color: 'rgba(203,213,225,0.6)', lineHeight: 1.5 }}>{m.content}</p>
                          </div>
                          <div style={{ width: '28px', height: '28px', background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                            <span className="font-orb" style={{ fontSize: '9px', color: 'var(--blue)' }}>{user.name.charAt(0)}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  <div className="cyber-line" style={{ margin: '8px 0' }} />
                </div>
              )}

              {/* Current AI question */}
              {question && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '28px' }}>
                  <div style={{ width: '36px', height: '36px', background: 'rgba(6,238,245,0.1)', border: '1px solid rgba(6,238,245,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 12px rgba(6,238,245,0.15)' }}>
                    <span className="font-orb text-cglow" style={{ fontSize: '9px', fontWeight: 700 }}>IA</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="font-mono" style={{ fontSize: '7px', color: 'var(--cyan)', letterSpacing: '0.2em', marginBottom: '8px' }}>TM DEV CONSULTOR</p>
                    <p className="font-exo" style={{ fontSize: '16px', color: 'var(--tbright)', lineHeight: 1.65, fontWeight: 400 }}>
                      {sending && !question ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="spin" />
                          <span className="font-mono" style={{ fontSize: '10px', color: 'var(--tmuted)', letterSpacing: '0.12em' }}>ANALISANDO...</span>
                        </span>
                      ) : (
                        <TypingText text={question} onDone={() => setTypingDone(true)} speed={16} />
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Thinking indicator */}
              {sending && !question && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '28px' }}>
                  <div style={{ width: '36px', height: '36px', background: 'rgba(6,238,245,0.07)', border: '1px solid rgba(6,238,245,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="font-orb text-cglow" style={{ fontSize: '9px' }}>IA</span>
                  </div>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--cyan)', animation: `_dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Answer area */}
              <AnimatePresence>
                {typingDone && !sending && options.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {/* Multiple choice */}
                    <div style={{ marginBottom: '16px' }}>
                      <p className="flabel" style={{ marginBottom: '10px' }}>Selecione uma ou mais opções:</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '7px' }}>
                        {options.map(opt => {
                          const on = selected.includes(opt);
                          return (
                            <motion.div key={opt} whileTap={{ scale: 0.97 }}
                              className={`opt ${on ? 'on' : ''}`} onClick={() => toggleOpt(opt)}
                              style={{ padding: '11px 14px', cursor: 'pointer' }}>
                              <span className={`chk-box ${on ? 'on' : ''}`} style={{ flexShrink: 0 }}>
                                {on && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                              </span>
                              <span style={{ fontSize: '12px' }}>{opt}</span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Free text */}
                    <div style={{ marginBottom: '16px' }}>
                      <p className="flabel">Ou escreva sua resposta (opcional se selecionou acima):</p>
                      <div style={{ position: 'relative' }}>
                        <textarea ref={textRef} className="inp" rows={3}
                          placeholder="Adicione detalhes ou escreva livremente aqui..."
                          value={freeText} onChange={e => setFreeText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendMessage(); }}
                          style={{ paddingBottom: '36px' }} />
                        <span className="font-mono" style={{ position: 'absolute', bottom: '9px', right: '12px', fontSize: '7px', color: 'var(--tmuted)', letterSpacing: '0.1em' }}>
                          Ctrl+Enter para enviar
                        </span>
                      </div>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="alert alert-error" style={{ marginBottom: '12px' }}>
                        <span>⚠</span><span>{error}</span>
                      </div>
                    )}

                    {/* Send */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(74,222,128,0.8)', boxShadow: '0 0 5px rgba(74,222,128,0.6)', animation: '_pulse 2s ease-in-out infinite' }} />
                        <span className="font-mono" style={{ fontSize: '8px', color: 'var(--tmuted)', letterSpacing: '0.1em' }}>
                          {selected.length > 0 ? `${selected.length} opção(ões) selecionada(s)` : 'Selecione ou escreva para continuar'}
                        </span>
                      </div>
                      <button className="btn btn-primary font-orb" onClick={() => sendMessage()} disabled={!canSend}
                        style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        {sending
                          ? <><span className="spin" style={{ borderTopColor: '#fff', width: '14px', height: '14px' }} /><span>ENVIANDO...</span></>
                          : <span>RESPONDER →</span>}
                      </button>
                    </div>

                    {/* Draft note */}
                    <p className="font-mono" style={{ fontSize: '7px', color: 'rgba(14,165,233,0.3)', letterSpacing: '0.12em', marginTop: '12px', textAlign: 'right' }}>
                      ◈ RASCUNHO SALVO AUTOMATICAMENTE
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── Diagnosis ───────────────────────────────────────────── */}
          {phase === 'diagnosis' && (
            <motion.div key="diagnosis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'relative', zIndex: 1 }}>
              <DiagnosisView text={diagnosis} userName={user.name} onRestart={handleRestart} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <style>{`
        @keyframes _blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes _dot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        @keyframes _pulse { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
        @media print {
          header, button, .btn { display: none !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>
    </>
  );
}

export const getServerSideProps = withAuthSSR(async (ctx, user) => {
  return { props: { user } };
});
