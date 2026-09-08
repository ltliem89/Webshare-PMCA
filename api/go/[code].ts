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

/** Giải mã mã → URL gốc. Trả về '' nếu mã không hợp lệ. */
function decodeCodeToUrl(code: string): string {
  try {
    return new TextDecoder().decode(xorBytes(base64UrlToBytes(code)));
  } catch {
    return '';
  }
}

function normalizeUrl(rawUrl: string): string {
  const url = (rawUrl || '').trim();
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/**
 * GET /go/:code
 * Mã hóa trực tiếp URL gốc trong link → decode và 302 redirect thẳng tới mô phỏng.
 * Không cần Google Sheets, phản hồi nhanh, không phụ thuộc dữ liệu ngoài.
 */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  const urlPath = (req.url || '').split('?')[0];
  const code = (urlPath.split('/').pop() || '').trim();
  const target = normalizeUrl(decodeCodeToUrl(code));

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

  res.statusCode = 302;
  res.setHeader('Location', target);
  res.setHeader('Cache-Control', 'no-store');
  res.end();
}