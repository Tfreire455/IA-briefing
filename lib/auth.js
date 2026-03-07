import jwt from 'jsonwebtoken';
import { parse, serialize } from 'cookie';

const SECRET = process.env.JWT_SECRET;
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

if (!SECRET && process.env.NODE_ENV !== 'test') {
  console.warn('[auth] JWT_SECRET não definido!');
}

// ── Token ──────────────────────────────────────────────────────────────────
export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

export function verifyToken(token) {
  try { return jwt.verify(token, SECRET); } catch { return null; }
}

// ── Cookie ────────────────────────────────────────────────────────────────
const COOKIE_NAME = 'tm_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function setAuthCookie(res, token) {
  res.setHeader('Set-Cookie', serialize(COOKIE_NAME, token, {
    httpOnly: true,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  }));
}

export function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', serialize(COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    sameSite: 'strict',
  }));
}

export function getTokenFromReq(req) {
  const cookies = parse(req.headers.cookie || '');
  return cookies[COOKIE_NAME] || null;
}

// ── Middleware ────────────────────────────────────────────────────────────
/** Wraps an API handler — injects req.user or returns 401 */
export function requireAuth(handler) {
  return async (req, res) => {
    const token = getTokenFromReq(req);
    if (!token) return res.status(401).json({ error: 'Não autenticado.' });
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Sessão expirada.' });
    req.user = decoded;
    return handler(req, res);
  };
}

/** Wraps an API handler — injects req.user and requires admin role */
export function requireAdmin(handler) {
  return requireAuth(async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito a administradores.' });
    }
    return handler(req, res);
  });
}

// ── SSR guards ───────────────────────────────────────────────────────────
/** getServerSideProps wrapper — redirects to /login if not authenticated */
export function withAuthSSR(gssp, { adminOnly = false } = {}) {
  return async (ctx) => {
    const token = getTokenFromReq(ctx.req);
    if (!token) return { redirect: { destination: '/login', permanent: false } };
    const user = verifyToken(token);
    if (!user) return { redirect: { destination: '/login', permanent: false } };
    if (adminOnly && user.role !== 'admin') {
      return { redirect: { destination: '/dashboard', permanent: false } };
    }
    return gssp(ctx, user);
  };
}

/** getServerSideProps wrapper — redirects to / (briefing) if already logged in */
export function redirectIfAuth(gssp) {
  return async (ctx) => {
    const token = getTokenFromReq(ctx.req);
    if (token && verifyToken(token)) {
      return { redirect: { destination: '/', permanent: false } };
    }
    return gssp ? gssp(ctx) : { props: {} };
  };
}

// ── Validation ────────────────────────────────────────────────────────────
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password) {
  const errors = [];
  if (!password || password.length < 8) errors.push('Mínimo 8 caracteres.');
  if (!/[A-Z]/.test(password)) errors.push('Pelo menos 1 letra maiúscula.');
  if (!/[0-9]/.test(password)) errors.push('Pelo menos 1 número.');
  return errors;
}
