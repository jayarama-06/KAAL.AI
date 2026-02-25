// ═══════════════════════════════════════════════════════════════════════════
// KAAL Timezone Service
// Comprehensive timezone detection, storage, and conversion utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detect user's current timezone using Intl API
 * Falls back to UTC if detection fails
 */
export function detectUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    console.warn('Timezone detection failed, defaulting to UTC:', e);
    return 'UTC';
  }
}

/**
 * Get timezone offset in minutes for a given timezone at a specific date
 * Handles DST transitions automatically
 */
export function getTimezoneOffset(timezone: string, date: Date = new Date()): number {
  try {
    // Create formatter for the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });

    // Get date parts in target timezone
    const parts = formatter.formatToParts(date);
    const tzDate = new Date(
      parseInt(parts.find(p => p.type === 'year')!.value),
      parseInt(parts.find(p => p.type === 'month')!.value) - 1,
      parseInt(parts.find(p => p.type === 'day')!.value),
      parseInt(parts.find(p => p.type === 'hour')!.value),
      parseInt(parts.find(p => p.type === 'minute')!.value),
      parseInt(parts.find(p => p.type === 'second')!.value)
    );

    // Calculate offset in minutes
    return Math.round((tzDate.getTime() - date.getTime()) / 60000);
  } catch (e) {
    console.warn(`Failed to get offset for timezone ${timezone}:`, e);
    return 0;
  }
}

/**
 * Convert a date from one timezone to another
 */
export function convertTimezone(date: Date, fromTz: string, toTz: string): Date {
  // Get the date string in the source timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: fromTz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  
  // Create a new date in the target timezone
  const newDate = new Date(
    parseInt(parts.find(p => p.type === 'year')!.value),
    parseInt(parts.find(p => p.type === 'month')!.value) - 1,
    parseInt(parts.find(p => p.type === 'day')!.value),
    parseInt(parts.find(p => p.type === 'hour')!.value),
    parseInt(parts.find(p => p.type === 'minute')!.value),
    parseInt(parts.find(p => p.type === 'second')!.value)
  );

  return newDate;
}

/**
 * Get current time in a specific timezone
 */
export function getCurrentTimeInTimezone(timezone: string): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  
  return new Date(
    parseInt(parts.find(p => p.type === 'year')!.value),
    parseInt(parts.find(p => p.type === 'month')!.value) - 1,
    parseInt(parts.find(p => p.type === 'day')!.value),
    parseInt(parts.find(p => p.type === 'hour')!.value),
    parseInt(parts.find(p => p.type === 'minute')!.value),
    parseInt(parts.find(p => p.type === 'second')!.value)
  );
}

/**
 * Get current hour in a specific timezone (0-23)
 */
export function getCurrentHourInTimezone(timezone: string): number {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  });
  
  const hourStr = formatter.format(now);
  return parseInt(hourStr);
}

/**
 * Format a date in a specific timezone
 */
export function formatDateInTimezone(
  date: Date, 
  timezone: string, 
  options: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    ...options,
  }).format(date);
}

/**
 * Check if a timezone observes DST at a given date
 */
export function isDSTActive(timezone: string, date: Date = new Date()): boolean {
  // Get offset in January (winter) and July (summer)
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  
  const janOffset = getTimezoneOffset(timezone, jan);
  const julOffset = getTimezoneOffset(timezone, jul);
  const currentOffset = getTimezoneOffset(timezone, date);
  
  // If offsets differ, timezone observes DST
  // Current offset matches summer offset = DST is active
  return janOffset !== julOffset && currentOffset === Math.max(janOffset, julOffset);
}

/**
 * Get timezone abbreviation (e.g., "PST", "EST", "GMT")
 */
export function getTimezoneAbbreviation(timezone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    
    const parts = formatter.formatToParts(date);
    const tzName = parts.find(p => p.type === 'timeZoneName')?.value;
    
    return tzName || timezone.split('/').pop() || 'UTC';
  } catch (e) {
    return 'UTC';
  }
}

/**
 * Get user-friendly timezone display name
 * Example: "America/New_York" → "New York (EST, UTC-5)"
 */
export function getTimezoneFriendlyName(timezone: string, date: Date = new Date()): string {
  const cityName = timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;
  const abbr = getTimezoneAbbreviation(timezone, date);
  const offset = -getTimezoneOffset(timezone, date) / 60;
  const offsetStr = offset >= 0 ? `UTC+${offset}` : `UTC${offset}`;
  
  return `${cityName} (${abbr}, ${offsetStr})`;
}

/**
 * Common timezone presets for quick selection
 */
export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Anchorage', label: 'Alaska' },
  { value: 'Pacific/Honolulu', label: 'Hawaii' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZDT)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
];

/**
 * Get all available timezones (full list from Intl API)
 */
export function getAllTimezones(): string[] {
  // This is a simplified list - in production, use Intl.supportedValuesOf('timeZone')
  // which is available in newer browsers
  try {
    // @ts-ignore - supportedValuesOf is not in all TypeScript versions yet
    if (typeof Intl.supportedValuesOf === 'function') {
      // @ts-ignore
      return Intl.supportedValuesOf('timeZone');
    }
  } catch (e) {
    // Fallback to common timezones
  }
  
  return COMMON_TIMEZONES.map(tz => tz.value);
}

/**
 * Validate if a timezone string is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Store user timezone preference in localStorage
 */
export function saveTimezonePreference(timezone: string): void {
  if (isValidTimezone(timezone)) {
    localStorage.setItem('kaal_user_timezone', timezone);
  }
}

/**
 * Load user timezone preference from localStorage or detect automatically
 */
export function loadTimezonePreference(): string {
  const stored = localStorage.getItem('kaal_user_timezone');
  if (stored && isValidTimezone(stored)) {
    return stored;
  }
  
  // Auto-detect and save
  const detected = detectUserTimezone();
  saveTimezonePreference(detected);
  return detected;
}

/**
 * Calculate "business hours" boundaries based on timezone
 * Returns { startHour, endHour, lunchStart, lunchEnd }
 */
export function getBusinessHours(timezone: string): {
  startHour: number;
  endHour: number;
  lunchStart: number;
  lunchEnd: number;
} {
  // Default to 9am-6pm with 12pm-1pm lunch
  // In future, this could be customized per user
  return {
    startHour: 9,
    endHour: 18,
    lunchStart: 12,
    lunchEnd: 13,
  };
}
