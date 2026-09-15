/**
 * The week's clock, in language a stranger can read.
 *
 * The keeper sets exercise at the NYSE Friday close — 4:00pm America/New_York, Thursday on a
 * Friday holiday — and expiry 24 hours later (stonkhousedotfun/callhouse keeper/src/calendar.ts). That is
 * 8:00pm UTC while US daylight time holds and 9:00pm UTC after it ends. Pages lead with New York
 * in 12-hour time and put UTC in a footnote, never in the same breath as the close.
 */

const NY = "America/New_York";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** 16:00 → "4:00pm". Minutes always shown, so 4pm never collides with 4:00am at a glance. */
function hour12(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  return `${h}:${pad(minute)}${hour < 12 ? "am" : "pm"}`;
}

type Bag = {
  weekday: string;
  day: string;
  month: string;
  year: string;
  hour: number;
  minute: number;
  zone: string;
};

function partsIn(timeZone: string, date: Date): Bag {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "shortGeneric",
  });
  const got: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== "literal") got[part.type] = part.value;
  }
  const hourRaw = got.hour === "24" ? "0" : (got.hour ?? "0");
  const zone = (got.timeZoneName ?? "ET").replace(/ Time$/i, "").replace(/^Eastern$/i, "ET");
  return {
    weekday: got.weekday ?? "",
    day: got.day ?? "",
    month: got.month ?? "",
    year: got.year ?? "",
    hour: Number(hourRaw),
    minute: Number(got.minute ?? "0"),
    zone,
  };
}

export type Clock = {
  weekday: string;
  weekdayShort: string;
  date: string;
  time: string;
  zone: string;
  /** "Friday 4:00pm New York" */
  label: string;
  /** "Fri 4:00pm NY" */
  short: string;
  /** "8:00pm UTC" */
  utc: string;
};

/** Format a unix-seconds instant the way the rest of the site prints time. */
export function clockAt(tsSeconds: number): Clock {
  const date = new Date(tsSeconds * 1000);
  const ny = partsIn(NY, date);
  const utc = partsIn("UTC", date);
  const time = hour12(ny.hour, ny.minute);
  return {
    weekday: ny.weekday,
    weekdayShort: ny.weekday.slice(0, 3),
    date: `${ny.day} ${ny.month} ${ny.year}`,
    time,
    zone: ny.zone,
    label: `${ny.weekday} ${time} New York`,
    short: `${ny.weekday.slice(0, 3)} ${time} NY`,
    utc: `${hour12(utc.hour, utc.minute)} UTC`,
  };
}

/**
 * The keeper's usual week, when the page is describing the rule rather than one dated rehearsal.
 * Lead with these; the DST footnote lives in <ClockNote>.
 */
export const WEEK = {
  close: "Friday 4:00pm New York",
  closeShort: "Fri 4:00pm NY",
  expiry: "Saturday 4:00pm New York",
  expiryShort: "Sat 4:00pm NY",
  window: "Friday 4:00pm to Saturday 4:00pm New York",
  utcDst: "8:00pm UTC",
  utcStd: "9:00pm UTC",
} as const;
