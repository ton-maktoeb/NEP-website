import { next } from '@vercel/edge';

/*
  Password gate for the pre-launch NoEggPlant site.
  ------------------------------------------------------------
  This runs on Vercel's Edge network BEFORE any page is served,
  so the whole site stays private until launch.

  Passwords are read from environment variables you set in the
  Vercel dashboard (never stored in this repo, never sent to the
  browser):
    SITE_MASTER_PASSWORD  your permanent password
    SITE_GUEST_CODES      comma-separated codes you hand out
    SITE_COOKIE_SECRET    random string used to sign the login cookie

  Revoking access: delete a code from SITE_GUEST_CODES and redeploy.
  The master password is never revoked.
*/

export const config = {
  // Run on every request path.
  matcher: '/:path*',
};

const COOKIE_NAME = 'nep_gate';
const MAX_AGE = 60 * 60 * 24 * 30; // stay signed in for 30 days
const encoder = new TextEncoder();

// Sign a value with the secret (HMAC-SHA256) and return a URL-safe string.
async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  const bytes = new Uint8Array(sig);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// The list of guest codes currently allowed.
function guestList() {
  return (process.env.SITE_GUEST_CODES || '')
    .split(',').map(c => c.trim()).filter(Boolean);
}

// Build the signed cookie for a logged-in identity ("master" or a guest code).
async function makeCookie(identity, secret) {
  const sig = await sign(identity, secret);
  const value = identity + '.' + sig;
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

// Check the incoming cookie: valid signature AND still-allowed identity.
async function cookieIsValid(cookieHeader, secret) {
  if (!cookieHeader) return false;
  const m = cookieHeader.match(new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]+)'));
  if (!m) return false;
  const raw = decodeURIComponent(m[1]);
  const dot = raw.lastIndexOf('.');
  if (dot < 0) return false;
  const identity = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (sig !== await sign(identity, secret)) return false;      // tampered
  if (identity === 'master') return true;                       // permanent
  return guestList().includes(identity);                        // revocable
}

// The on-brand login screen (fully self-contained so it needs no other files).
function loginPage(message) {
  const err = message
    ? `<p style="margin:0 0 18px;color:#F1FC7A;font:600 14px/1.5 system-ui,sans-serif">${message}</p>`
    : '';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>NoEggPlant — private preview</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#160419;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif">
<form method="POST" action="/__gate" style="width:100%;max-width:360px;padding:40px 32px;margin:20px;background:#26072E;border:1px solid rgba(241,252,122,.18);border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.4)">
  <div style="font:900 22px/1 system-ui,sans-serif;color:#fff;text-align:center"><span style="color:#F1FC7A">NOEGG</span>PLANT</div>
  <p style="margin:14px 0 26px;color:#C9B9D0;font:500 14px/1.5 system-ui,sans-serif;text-align:center">This preview is private. Enter your password to continue.</p>
  ${err}
  <input name="password" type="password" autofocus required placeholder="Password"
    style="width:100%;padding:14px 16px;background:#3D1A47;border:1px solid rgba(241,252,122,.22);border-radius:10px;color:#fff;font:500 15px/1.3 system-ui,sans-serif;outline:none;box-sizing:border-box">
  <button type="submit"
    style="width:100%;margin-top:16px;padding:14px;background:#F1FC7A;color:#26072E;font:800 14px/1 system-ui,sans-serif;border:0;border-radius:999px;cursor:pointer">Enter</button>
</form>
</body></html>`;
}

function htmlResponse(body, status) {
  return new Response(body, {
    status: status || 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' },
  });
}

export default async function middleware(request) {
  const path = new URL(request.url).pathname;

  // Let Vercel's internal requests through untouched.
  if (path.startsWith('/_vercel')) return next();

  const secret = process.env.SITE_COOKIE_SECRET;
  const master = process.env.SITE_MASTER_PASSWORD;

  // Fail closed: if protection isn't configured, block everyone (never public by accident).
  if (!secret || !master) {
    return htmlResponse('<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;background:#160419;color:#fff;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center"><div><h1>Setup needed</h1><p>Password protection is not configured yet.<br>Add SITE_MASTER_PASSWORD and SITE_COOKIE_SECRET in Vercel, then redeploy.</p></div>', 503);
  }

  // Handle the login form submission.
  if (request.method === 'POST' && path === '/__gate') {
    let password = '';
    try {
      const form = await request.formData();
      password = (form.get('password') || '').toString();
    } catch (e) {}
    let identity = null;
    if (password && password === master) identity = 'master';
    else if (password && guestList().includes(password)) identity = password;

    if (identity) {
      const cookie = await makeCookie(identity, secret);
      return new Response(null, { status: 303, headers: { Location: '/', 'Set-Cookie': cookie } });
    }
    return htmlResponse(loginPage('That password is not valid. Try again.'), 401);
  }

  // Already signed in? Let the request through to the real site.
  if (await cookieIsValid(request.headers.get('cookie'), secret)) {
    return next();
  }

  // Otherwise show the login screen for any request.
  return htmlResponse(loginPage(''), 401);
}
