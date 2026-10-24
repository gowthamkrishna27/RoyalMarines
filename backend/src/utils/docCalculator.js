/**
 * DOC (Days of Culture) Calculator for Aqua Feed Performance Management System.
 * 
 * In shrimp aquaculture, DOC represents the number of culture days elapsed
 * since shrimp post-larvae were stocked into a tank/pond.
 * 
 * Counting convention:
 * - Day of stocking: DOC 0 (or entered baseline on stocking/registration day)
 * - Next calendar day: DOC + 1
 * - Deterministic, non-mutating calculation based on farm calendar days (Asia/Kolkata).
 */

export const FARM_TIMEZONE = 'Asia/Kolkata';

/**
 * Parses any date representation (YYYY-MM-DD, DD-MM-YYYY, ISO string, Date object)
 * into calendar parts { year, month, day } in the specified timezone.
 *
 * @param {string|Date|number} dateInput 
 * @param {string} [timeZone=FARM_TIMEZONE] 
 * @returns {{ year: number, month: number, day: number } | null}
 */
export function getCalendarParts(dateInput, timeZone = FARM_TIMEZONE) {
  if (!dateInput) return null;

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return null;

    // Direct YYYY-MM-DD format (no time zone offset)
    const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(trimmed);
    if (isoMatch && !trimmed.includes('T') && !trimmed.includes(' ')) {
      return {
        year: parseInt(isoMatch[1], 10),
        month: parseInt(isoMatch[2], 10),
        day: parseInt(isoMatch[3], 10),
      };
    }

    // Direct DD-MM-YYYY format (common in Indian aquaculture records)
    const indMatch = /^(\d{1,2})-(\d{1,2})-(\d{4})/.exec(trimmed);
    if (indMatch && !trimmed.includes('T') && !trimmed.includes(' ')) {
      return {
        year: parseInt(indMatch[3], 10),
        month: parseInt(indMatch[2], 10),
        day: parseInt(indMatch[1], 10),
      };
    }
  }

  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return null;

  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.format(d); // e.g. "2026-10-15"
    const [year, month, day] = parts.split('-').map(Number);
    return { year, month, day };
  } catch {
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
    };
  }
}

/**
 * Calculates calendar days difference: laterParts - earlierParts.
 *
 * @param {{ year: number, month: number, day: number }} earlierParts 
 * @param {{ year: number, month: number, day: number }} laterParts 
 * @returns {number}
 */
export function calendarDaysDiff(earlierParts, laterParts) {
  if (!earlierParts || !laterParts) return 0;
  const utcEarlier = Date.UTC(earlierParts.year, earlierParts.month - 1, earlierParts.day);
  const utcLater = Date.UTC(laterParts.year, laterParts.month - 1, laterParts.day);
  return Math.round((utcLater - utcEarlier) / 86400000);
}

/**
 * Calculates the current DOC for a tank deterministically without modifying database records.
 *
 * Handles:
 * 1. Same-day registration & stocking: returns baseline DOC (0, 1, 30, etc.)
 * 2. Next-day / future calendar day: returns baseline DOC + elapsed calendar days
 * 3. Historical / past stocking date: derives elapsed days without adding days twice
 * 4. Future stocking dates: safely clamps to entered baseline without negative values
 * 5. Closed/Harvested cycles: retains harvest/cycle-closing DOC without ongoing increment
 * 6. Legacy records with missing stocking_date: falls back to seed_date or created_at
 * 7. Page refreshes & repeated requests: pure calculation, 0 side effects
 *
 * @param {object} tank - Tank database or API record
 * @param {Date|string} [targetDate=new Date()] - Date to evaluate against (defaults to now)
 * @param {string} [timeZone=FARM_TIMEZONE] - Farm's timezone
 * @returns {number} Current calculated DOC (integer >= 0)
 */
export function calculateCurrentDoc(tank, targetDate = new Date(), timeZone = FARM_TIMEZONE) {
  if (!tank) return 0;

  const enteredDoc = (tank.doc !== undefined && tank.doc !== null && !isNaN(Number(tank.doc)))
    ? Math.max(0, parseInt(tank.doc, 10))
    : 0;

  // Closed cycle check: harvested or completed tanks do not increment
  const statusStr = String(tank.status || '').toUpperCase();
  if (statusStr === 'HARVESTED' || statusStr === 'COMPLETED' || Boolean(tank.finalHarvestCompleted)) {
    return enteredDoc;
  }

  const targetParts = getCalendarParts(targetDate, timeZone);
  if (!targetParts) return enteredDoc;

  const stockingDateInput = tank.stocking_date || tank.stockingDate || tank.seed_date || tank.seedDate;
  const createdDateInput = tank.created_at || tank.createdAt;

  const stockingParts = getCalendarParts(stockingDateInput, timeZone);
  const createdParts = getCalendarParts(createdDateInput, timeZone);

  // If no reference dates are known, return entered baseline safely
  if (!stockingParts && !createdParts) {
    return enteredDoc;
  }

  // Case 1: Both stocking date and created_at available
  if (stockingParts && createdParts) {
    const daysStockingToCreation = calendarDaysDiff(stockingParts, createdParts);
    const daysSinceStocking = calendarDaysDiff(stockingParts, targetParts);
    const daysSinceCreation = calendarDaysDiff(createdParts, targetParts);

    // Future stocking date
    if (daysSinceStocking < 0) {
      return enteredDoc;
    }

    // Same-day stocking & registration (or stocking after registration)
    if (daysStockingToCreation <= 0) {
      const elapsed = Math.max(0, daysSinceStocking);
      return enteredDoc + elapsed;
    }

    // Past stocking date prior to registration:
    // If enteredDoc is minimal (0 or 1), user specified initial DOC on stocking date
    if (enteredDoc <= 1) {
      return enteredDoc + Math.max(0, daysSinceStocking);
    }

    // If enteredDoc was recorded as baseline on registration day (e.g. 30):
    // Add elapsed days since registration so elapsed days before registration are not added twice
    return enteredDoc + Math.max(0, daysSinceCreation);
  }

  // Case 2: Only stockingParts available
  if (stockingParts) {
    const daysSinceStocking = calendarDaysDiff(stockingParts, targetParts);
    if (daysSinceStocking <= 0) return enteredDoc;
    return enteredDoc + daysSinceStocking;
  }

  // Case 3: Only createdParts available (legacy records)
  if (createdParts) {
    const daysSinceCreation = calendarDaysDiff(createdParts, targetParts);
    if (daysSinceCreation <= 0) return enteredDoc;
    return enteredDoc + daysSinceCreation;
  }

  return enteredDoc;
}

export default {
  FARM_TIMEZONE,
  getCalendarParts,
  calendarDaysDiff,
  calculateCurrentDoc,
};
