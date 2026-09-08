import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * URL cố định của Apps Script "WebHub Sync API" — đúng với DEFAULT_SCRIPT_URL
 * trong src/services/googleSync.ts (đồng bộ WebHub_Projects main sheet).
 */
const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbw7QvnRI3e2l_0B7Nl4KDeLEOT3CWo-P_CcjWGD5XIoT7XVBhsiWG3OKEVrOcihLyUm/exec';

const GO_SALT = 'webhub-go-v1';

/**
 * FNV-1a 32-bit hash → base36, tạo mã ngắn ổn định từ chuỗi bất kỳ.
 * Phải giữ logic 100% giống src/utils/goLink.ts (generateGoCode) — không thể
 * import từ thư mục ngoài api/ vì Vercel bundle ESM sẽ không resolve được.
 */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function generateGoCode(projectId: string): string {
  const mixed = `${GO_SALT}:${projectId}`;
  return fnv1a(mixed).toString(36);
}

interface ProjectLike {
  id?: unknown;
  url?: unknown;
  title?: unknown;
  authorName?: unknown;
  description?: unknown;
}

interface GoTarget {
  url: string;
  title: string;
  authorName: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeUrl(rawUrl: string): string {
  let url = (rawUrl || '').trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  return url;
}

/**
 * GET /go/:code
 * Trả về trang khung trên domain của chính website: hiển thị mô phỏng trong
 * khung trình duyệt giả, có tên tác giả ở góc. URL gốc chỉ server biết và được
 * đưa vào iframe tại chính thời điểm mở trang — khách xem chỉ thấy domain của mình.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const urlPath = (req.url || '').split('?')[0];
  const code = (urlPath.split('/').pop() || '').trim();
  if (!code) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Thiếu mã mô phỏng.');
    return;
  }

  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || (req.headers.host as string) || 'localhost';
  const selfUrl = `${proto}://${host}/go/${code}`;

  try {
    const fetchRes = await fetch(`${SCRIPT_URL}?action=getProjects`, {
      headers: { Accept: 'application/json' },
    });
    if (!fetchRes.ok) {
      throw new Error(`HTTP ${fetchRes.status}`);
    }
    const payload = (await fetchRes.json()) as { data?: ProjectLike[] };
    const list = Array.isArray(payload.data) ? payload.data : [];

    const target = list.find((p) => {
      const id = String(p.id || '');
      if (!id) return false;
      return generateGoCode(id) === code;
    });

    const realUrl = target && typeof target.url === 'string' ? normalizeUrl(target.url) : '';
    if (!realUrl) {
      return renderNotFound(res, selfUrl);
    }

    const page: GoTarget = {
      url: realUrl,
      title:
        target && typeof target.title === 'string' && target.title.trim()
          ? target.title.trim()
          : 'Mô phỏng học tập',
      authorName:
        target && typeof target.authorName === 'string' && target.authorName.trim()
          ? target.authorName.trim()
          : 'Thành viên',
    };

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(renderFramePage(page, selfUrl));
  } catch (err) {
    console.error('go frame error', err);
    res.statusCode = 502;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Không thể giải mã liên kết ngay lúc này. Vui lòng thử lại sau.');
  }
}

function renderFramePage(page: GoTarget, selfUrl: string): string {
  const title = escapeHtml(page.title);
  const author = escapeHtml(page.authorName);
  const frameSrc = escapeHtml(page.url);
  const address = escapeHtml(selfUrl);
  const homeUrl = escapeHtml(selfUrl.replace(/\/go\/[^/]*$/, '/'));

  return `<!doctype html>
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
    padding: 20px; gap: 16px;
  }
  .topbar {
    width: 100%; max-width: 1100px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .brand {
    display: flex; align-items: center; gap: 8px;
    font-weight: 700; font-size: 13px; letter-spacing: 0.02em;
  }
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
    padding: 10px 14px;
    display: flex; align-items: center; gap: 12px;
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
  .viewport {
    position: relative; flex: 1; min-height: 0; background: #fff;
  }
  iframe {
    width: 100%; height: 100%; border: 0; display: block; background: #fff;
  }
  .author-badge {
    position: absolute; left: 14px; bottom: 14px;
    background: rgba(2, 6, 23, 0.72);
    color: #e2e8f0;
    font-size: 11px; font-weight: 600;
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
  .hint {
    font-size: 11px; color: #94a3b8; text-align: center;
  }
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
      <div class="address">${address}</div>
    </div>
    <div class="viewport">
      <iframe src="${frameSrc}" title="${title}" allowfullscreen allow="geolocation; autoplay; fullscreen"></iframe>
      <div class="author-badge">
        <span class="avatar">${author.trim().charAt(0).toUpperCase()}</span>
        <span>${author}</span>
      </div>
    </div>
  </div>

  <div class="hint">Khung an toàn · Link gốc của tác giả được bảo mật</div>
</body>
</html>`;
}

function renderNotFound(res: ServerResponse, selfUrl: string): void {
  const homeUrl = selfUrl.replace(/\/go\/[^/]*$/, '/');
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(
    '<!doctype html><html lang="vi"><meta charset="utf-8"><title>Không tìm thấy</title>' +
      '<body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">' +
      '<div style="text-align:center"><h1 style="margin:0 0 8px">404</h1>' +
      '<p style="margin:0 0 16px;color:#94a3b8">Không tìm thấy mô phỏng với mã này.</p>' +
      `<a href="${homeUrl}" style="color:#818cf8;text-decoration:none">← Về trang chủ</a></div></body></html>`
  );
}