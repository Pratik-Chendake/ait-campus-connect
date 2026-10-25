/**
 * Academic Year Utilities for AIT Pune Campus Connect
 * 
 * Strict Academic Year Boundary for 2026–27:
 * Start: 1 July 2026 (2026-07-01T00:00:00)
 * End:   30 June 2027 (2027-06-30T23:59:59)
 */

export const AY_2026_27 = '2026-27';
export const AY_2026_27_START = '2026-07-01';
export const AY_2026_27_END = '2027-06-30T23:59:59';
export const AY_2026_27_DATE_ONLY_END = '2027-06-30';

/**
 * Calculates academic year string from a date string (e.g., '2026-07-15' -> '2026-27')
 * In Indian engineering institutions (including AIT Pune), the academic year runs July to June.
 */
export function getAcademicYear(dateStr) {
  if (!dateStr) return AY_2026_27;
  const clean = dateStr.slice(0, 10);
  const parts = clean.split('-');
  if (parts.length < 2) return AY_2026_27;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  
  if (isNaN(year) || isNaN(month)) return AY_2026_27;
  
  if (month >= 7) {
    const nextYearSuffix = (year + 1).toString().slice(-2);
    return `${year}-${nextYearSuffix}`;
  } else {
    const yearSuffix = year.toString().slice(-2);
    return `${year - 1}-${yearSuffix}`;
  }
}

/**
 * Checks if a given ISO/SQL date string falls strictly within Academic Year 2026–27
 * (1 July 2026 to 30 June 2027)
 */
export function isAY2026_27(dateStr) {
  if (!dateStr) return false;
  const d = dateStr.slice(0, 10);
  return d >= AY_2026_27_START && d <= AY_2026_27_DATE_ONLY_END;
}

/**
 * Returns SQL condition snippet for filtering events table by AY 2026–27
 */
export function getAY2026_27SQLCondition(alias = 'e') {
  const prefix = alias ? `${alias}.` : '';
  return `(${prefix}event_start_date >= '${AY_2026_27_START}' AND ${prefix}event_start_date <= '${AY_2026_27_DATE_ONLY_END}' AND (${prefix}is_archive = 0 OR ${prefix}is_archive IS NULL))`;
}
