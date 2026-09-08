import type { IncomingMessage, ServerResponse } from 'node:http';
import { generateGoCode } from '../../src/utils/goLink';

/**
 * URL cố định của Apps Script "WebHub Sync API" — đúng với DEFAULT_SCRIPT_URL
 * trong src/services/googleSync.ts (đồng bộ WebHub_Projects main sheet).
 */
const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbw7QvnRI3e2l_0B7Nl4KDeLEOT3CWo-P_CcjWGD5XIoT7XVBhsiWG3OKEVrOcihLyUm/exec';

interface ProjectLike {
  id?: unknown;
  url?: unknown;
  status?: unknown;
}

/**
 * GET /go/:code
 * Serverless redirect: mã go-code → mô phỏng thật.
 * Nguồn dữ liệu: Google Sheets (WebHub_Projects) qua Apps Script — URL gốc
 * không nằm trong giao diện web, chỉ server mới giải mã tại thời điểm redirect.
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

    const url = target && typeof target.url === 'string' ? target.url : '';
    if (url) {
      res.statusCode = 302;
      res.setHeader('Location', url);
      res.setHeader('Cache-Control', 'no-store');
      res.end();
      return;
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(
      '<!doctype html><html lang="vi"><meta charset="utf-8"><title>Không tìm thấy</title>' +
        '<body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">' +
        '<div style="text-align:center"><h1 style="margin:0 0 8px">404</h1>' +
        '<p style="margin:0 0 16px;color:#94a3b8">Không tìm thấy mô phỏng với mã này.</p>' +
        '<a href="/" style="color:#818cf8;text-decoration:none">← Về trang chủ</a></div></body></html>'
    );
  } catch (err) {
    console.error('go redirect error', err);
    res.statusCode = 502;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Không thể giải mã liên kết ngay lúc này. Vui lòng thử lại sau.');
  }
}