/**
 * Tạo link che cho mỗi mô phỏng: URL gốc được mã hóa (XOR + base64url) đưa thẳng
 * vào link, serverless decode rồi 302 redirect tới mô phỏng thật:
 *   https://<domain>/go/<mã-hóa>  → Redirect 302 → URL gốc.
 *
 * Lưu ý: mã dễ giải mã (XOR key nằm ở 2 phía). Mục đích là che URL gốc khỏi
 * giao diện/thanh địa chỉ cho người dùng thường — KHÔNG phải mã hóa bảo mật cao.
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

/** Bytes → base64url chuẩn (không có dấu '=' padding). */
function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
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

/** Mã hóa URL gốc → mã ngắn dạng base64url (đưa vào path của link che). */
export function encodeUrlToCode(url: string): string {
  return bytesToBase64Url(xorBytes(new TextEncoder().encode(url)));
}

/** Giải mã mã → URL gốc. Trả về '' nếu mã không hợp lệ. */
export function decodeCodeToUrl(code: string): string {
  try {
    return new TextDecoder().decode(xorBytes(base64UrlToBytes(code)));
  } catch {
    return '';
  }
}

/**
 * Link che đầy đủ của một mô phỏng:
 *   https://<domain>/go/<mã-hóa>  → 302 redirect tới URL gốc.
 * Dùng cho nút Truy cập, Chia sẻ, Copy link, QR, address bar.
 */
export function getGoUrl(location: { origin: string }, realUrl: string): string {
  return `${location.origin}/go/${encodeUrlToCode(realUrl)}`;
}