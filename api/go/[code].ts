import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * XOR key phải trùng 100% với src/utils/goLink.ts (XOR_KEY) — không thể import từ
 * thư mục ngoài api/ vì Vercel bundle ESM sẽ không resolve được.
 */
const XOR_KEY = 'webhub-go-v2#sbx7q';

/** XOR từng byte theo key (2 chiều giống nhau). */
function xorBytes(bytes: Uint8Array): Uint8Array {
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ^ XOR_KEY.charCodeAt(i % XOR_KEY.length);
  }
  return out;
}

/** base64url → bytes. */
function base64UrlToBytes(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Giải mã mã → chuỗi payload gốc. Trả về '' nếu mã không hợp lệ. */
function decodeCodeToText(code: string): string {
  try {
    return new TextDecoder().decode(xorBytes(base64UrlToBytes(code)));
  } catch {
    return '';
  }
}

interface GoPayload {
  u?: string;
  t?: string;
  a?: string;
}

function normalizeUrl(rawUrl: string): string {
  const url = (rawUrl || '').trim();
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function escapeHtml(value: string): string {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * GET /go/:code
 * Đổi payload {u, t, a} từ mã trong link, trả về TRANG KHUNG trên domain của mình:
 * khung trình duyệt giả + tên tác giả + iframe nạp mô phỏng. Thanh địa chỉ chỉ
 * hiện /go/<mã> — URL gốc không lộ ra ngoài.
 */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  const urlPath = (req.url || '').split('?')[0];
  const code = (urlPath.split('/').pop() || '').trim();

  let payload: GoPayload = {};
  try {
    payload = JSON.parse(decodeCodeToText(code) || '{}') as GoPayload;
  } catch {
    payload = {};
  }

  const target = normalizeUrl(payload.u || '');
  if (!target) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(
      '<!doctype html><html lang="vi"><meta charset="utf-8"><title>Không tìm thấy</title>' +
        '<body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">' +
        '<div style="text-align:center"><h1 style="margin:0 0 8px">404</h1>' +
        '<p style="margin:0 0 16px;color:#94a3b8">Không tìm thấy mô phỏng với mã này.</p>' +
        '<a href="/" style="color:#818cf8;text-decoration:none">← Về trang chủ</a></div></body></html>'
    );
    return;
  }

  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host =
    (req.headers['x-forwarded-host'] as string) ||
    (req.headers.host as string) ||
    'localhost';
  const selfUrl = `${proto}://${host}/go/${code}`;
  const homeUrl = `${proto}://${host}/`;

  const title = escapeHtml((payload.t || '').trim() || 'Mô phỏng học tập');
  const author = escapeHtml((payload.a || '').trim() || 'Thành viên');
  const addr = escapeHtml(selfUrl);
  const frameSrc = escapeHtml(target);
  const initial = author.trim().charAt(0).toUpperCase();

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(`<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
    font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    color: #e2e8f0;
    display: flex; flex-direction: column; align-items: center;
    padding: 20px; gap: 14px;
  }
  .topbar {
    width: 100%; max-width: 1100px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 13px; }
  .brand-badge {
    width: 28px; height: 28px; border-radius: 8px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; color: #fff;
  }
  .back { color: #c7d2fe; text-decoration: none; font-size: 12px; font-weight: 600; }
  .back:hover { color: #fff; }
  .frame {
    width: 100%; max-width: 1100px; flex: 1; min-height: 0;
    background: #1e293b;
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 16px; overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.45);
    display: flex; flex-direction: column;
  }
  .chrome {
    background: #0b1220;
    border-bottom: 1px solid rgba(148, 163, 184, 0.15);
    padding: 10px 14px; display: flex; align-items: center; gap: 12px;
  }
  .dots { display: flex; gap: 6px; }
  .dot { width: 11px; height: 11px; border-radius: 50%; }
  .dot.r { background: #f87171; }
  .dot.y { background: #fbbf24; }
  .dot.g { background: #34d399; }
  .address {
    flex: 1; min-width: 0;
    background: rgba(148, 163, 184, 0.12);
    border-radius: 8px; padding: 6px 12px;
    font-size: 12px; font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
    color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .viewport { position: relative; flex: 1; min-height: 0; background: #fff; }
  iframe { width: 100%; height: 100%; border: 0; display: block; background: #fff; }
  .author-badge {
    position: absolute; left: 14px; bottom: 14px;
    background: rgba(2, 6, 23, 0.72);
    color: #e2e8f0; font-size: 11px; font-weight: 600;
    padding: 7px 12px; border-radius: 10px;
    border: 1px solid rgba(148, 163, 184, 0.25);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; gap: 7px;
    pointer-events: none;
  }
  .avatar {
    width: 18px; height: 18px; border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 800; color: #fff;
  }
  .hint { font-size: 11px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
  <div class="topbar">
    <div class="brand"><span class="brand-badge">UB</span><span>Học Tập Số</span></div>
    <a class="back" href="${homeUrl}">&larr; Về trang chủ</a>
  </div>

  <div class="frame">
    <div class="chrome">
      <div class="dots"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span></div>
      <div class="address">${addr}</div>
    </div>
    <div class="viewport">
      <iframe src="${frameSrc}" title="${title}" allowfullscreen allow="fullscreen; autoplay; geolocation"></iframe>
      <div class="author-badge"><span class="avatar">${initial}</span><span>${author}</span></div>
    </div>
  </div>

  <div class="hint">Tác giả: ${author} · Link gốc được bảo mật</div>
</body>
</html>`);
}