// صيغة رابط البائع العام (/u/<slug>): حروف إنجليزية صغيرة وأرقام وشرطات
// بس، من 3 إلى 32 حرف، وما يبدأ أو ينتهي بشرطة. نفس القيد مكرر كـ CHECK
// على عمود merchants.slug بقاعدة البيانات (دفاع من طبقتين).
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}
