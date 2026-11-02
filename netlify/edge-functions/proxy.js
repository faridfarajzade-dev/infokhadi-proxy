const TARGET = 'https://infokhadi-3gaefuu2rht.qoder.website';

const STRIP = new Set([
  'host',
  'content-length',
  'content-encoding',
  'transfer-encoding',
  'connection',
  'accept-encoding',
  'set-cookie',
]);

export default async function handler(request) {
  const url = new URL(request.url);
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('accept-encoding');
  headers.set('origin', TARGET);
  if (headers.has('referer')) headers.set('referer', TARGET + '/');

  const upstream = new URL(url.pathname + url.search, TARGET);
  const init = { method: request.method, headers, redirect: 'manual' };
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.body) {
    init.body = request.body;
    init.duplex = 'half';
  }

  let res;
  try {
    res = await fetch(upstream, init);
  } catch (err) {
    return new Response('Proxy error: ' + err.message, { status: 502 });
  }

  const out = new Headers();
  for (const [key, value] of res.headers) {
    if (!STRIP.has(key.toLowerCase())) out.set(key, value);
  }
  const location = out.get('location');
  if (location && location.startsWith(TARGET)) out.set('location', location.slice(TARGET.length) || '/');

  return new Response(res.body, { status: res.status, headers: out });
}

export const config = { path: '/*' };
