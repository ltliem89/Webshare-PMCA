/**
 * Tạo mã ngắn cố định (go-code) cho mỗi bài/mô phỏng, dùng cho link che:
 *   https://<domain>/go/<go-code>  → serverless redirect thẳng tới mô phỏng thật.
 *
 * Mã được sinh 1 chiều từ id: ổn định, không cần lưu thêm, không lộ URL gốc.
 */

const SALT = 'webhub-go-v1';

/** FNV-1a 32-bit hash → base36, tạo mã ngắn ổn định từ chuỗi bất kỳ. */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Sinh go-code ổn định (không đổi theo thời gian) cho một project id.
 * Ví dụ: "phet-fractions" → mã như "qh3x9k2m".
 */
export function generateGoCode(projectId: string): string {
  const mixed = `${SALT}:${projectId}`;
  return fnv1a(mixed).toString(36);
}

/**
 * Link che đầy đủ của một mô phỏng:
 *   https://<domain>/go/<mã>  → serverless redirect thẳng tới mô phỏng thật.
 * Dùng cho nút Truy cập, Chia sẻ, Copy link, QR.
 */
export function getGoUrl(location: { origin: string }, projectId: string): string {
  return `${location.origin}/go/${generateGoCode(projectId)}`;
}