export async function doRequest({ url, method = 'GET', headers = {}, body = null }) {
  const start = performance.now();
  let response, text = null, json = null;
  try {
    const opts = {
      method,
      headers: { ...headers }
    };
    if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      opts.body = body;
    }

    response = await fetch(url, opts);
    text = await response.text();
    try { json = JSON.parse(text); } catch (e) { json = null; }
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    return { ok: false, error: err.message || String(err), duration, status: null };
  }

  const duration = Math.round(performance.now() - start);
  const resHeaders = {};
  try {
    response.headers.forEach((v, k) => (resHeaders[k] = v));
  } catch (e) {}

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: resHeaders,
    text,
    json,
    duration,
    size: text ? new Blob([text]).size : 0
  };
}

export function parseHeaders(text) {
  // Accept lines like: Key: value
  const out = {};
  if (!text) return out;
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx > -1) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      if (key) out[key] = val;
    }
  }
  return out;
}
