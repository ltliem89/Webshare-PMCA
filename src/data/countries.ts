export interface CountryOption {
  code: string;
  nameEn: string;
  nameVi: string;
}

/**
 * Danh sách quốc gia ưu tiên: Việt Nam đứng đầu, kế đến là 11 nước Đông Nam Á
 * (ASEAN + Đông Timor). Người dùng có thể tìm kiếm theo tên quốc tế (nameEn).
 */
export const SOUTHEAST_ASIA_COUNTRIES: CountryOption[] = [
  { code: 'VN', nameEn: 'Vietnam', nameVi: 'Việt Nam' },
  { code: 'ID', nameEn: 'Indonesia', nameVi: 'Indonesia' },
  { code: 'MY', nameEn: 'Malaysia', nameVi: 'Malaysia' },
  { code: 'TH', nameEn: 'Thailand', nameVi: 'Thái Lan' },
  { code: 'PH', nameEn: 'Philippines', nameVi: 'Philippines' },
  { code: 'SG', nameEn: 'Singapore', nameVi: 'Singapore' },
  { code: 'MM', nameEn: 'Myanmar', nameVi: 'Myanmar' },
  { code: 'KH', nameEn: 'Cambodia', nameVi: 'Campuchia' },
  { code: 'LA', nameEn: 'Laos', nameVi: 'Lào' },
  { code: 'BN', nameEn: 'Brunei', nameVi: 'Brunei' },
  { code: 'TL', nameEn: 'Timor-Leste / East Timor', nameVi: 'Đông Timor' },
];

/** Tìm tên hiển thị theo mã quốc gia; trả về mã nếu không tìm thấy. */
export function countryDisplayName(code: string, fallbackNames?: Record<string, string>): string {
  if (!code) return 'VN';
  const found = SOUTHEAST_ASIA_COUNTRIES.find((c) => c.code === code);
  if (found) return found.nameVi;
  if (fallbackNames && fallbackNames[code]) return fallbackNames[code];
  return code;
}
