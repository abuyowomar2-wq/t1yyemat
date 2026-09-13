// يوحّد صيغة رقم الجوال السعودي عشان "0501234567" و"+966501234567"
// و"00966501234567" يطابقون نفس العميل بدل ما يصيرون سجلات مكررة.
export function normalizePhone(raw: string): string {
  let digits = raw.trim().replace(/[^\d+]/g, "");

  if (digits.startsWith("+966")) digits = "0" + digits.slice(4);
  else if (digits.startsWith("00966")) digits = "0" + digits.slice(5);
  else if (digits.startsWith("966")) digits = "0" + digits.slice(3);

  return digits;
}
