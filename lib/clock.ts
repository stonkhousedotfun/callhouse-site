/**
 * The week's clock, in language a stranger can read.
 *
 * Every time a reader sees is in THEIR browser's time zone, with the zone named ("Sep 24, 1:00 PM PDT"). A market
 * deadline (expiry, cutoff, settlement) also keeps the market's own time beside it, muted: "Sep 24, 1:00 PM PDT
 * (4:00 PM ET)", shown once when the reader is already on New York time. There is no UTC line.
 *
 * The server cannot know the reader's zone, so a page renders the New York string ({marketAt}) and
 * <LocalTime> swaps in {viewerAt} after mount. Neither string is ever printed without its zone name.
 */

const NY = "America/New_York";

/** The market's time zone. */
export const MARKET_ZONE = NY;

type FormatOptions = { timeZone?: string; dateless?: boolean };

function formatIn(tsSeconds: number, { timeZone, dateless = false }: FormatOptions, zoneName: "short" | "shortGeneric"): string {
  return new Intl.DateTimeFormat("en-US", {
    ...(timeZone ? { timeZone } : {}),
    ...(dateless ? {} : { month: "short", day: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: zoneName,
  }).format(new Date(tsSeconds * 1000));
}

/** The same instant with the zone name dropped, so two zones can be compared by wall clock. */
function wallClock(tsSeconds: number, timeZone: string | undefined): string {
  return new Intl.DateTimeFormat("en-US", {
    ...(timeZone ? { timeZone } : {}),
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(tsSeconds * 1000));
}

/** "Sep 24, 4:00 PM EDT": what the server renders, before the browser's zone is known. */
export function marketAt(tsSeconds: number, dateless = false): string {
  return formatIn(tsSeconds, { timeZone: NY, dateless }, "short");
}

/**
 * The reader's time, zone named: "Sep 24, 1:00 PM PDT". With `market`, a deadline also shows New York time,
 * "Sep 24, 1:00 PM PDT (4:00 PM ET)", unless the reader's wall clock already is New York's. `timeZone` is for tests;
 * the page leaves it unset so the browser's zone is used.
 */
export function viewerAt(tsSeconds: number, opts: FormatOptions & { market?: boolean } = {}): string {
  const local = formatIn(tsSeconds, opts, "short");
  if (!opts.market || wallClock(tsSeconds, opts.timeZone) === wallClock(tsSeconds, NY)) return local;
  return `${local} (${formatIn(tsSeconds, { timeZone: NY, dateless: true }, "shortGeneric")})`;
}

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
};

/** Format a unix-seconds instant the way the rest of the site prints time. */
export function clockAt(tsSeconds: number): Clock {
  const date = new Date(tsSeconds * 1000);
  const ny = partsIn(NY, date);
  const time = hour12(ny.hour, ny.minute);
  return {
    weekday: ny.weekday,
    weekdayShort: ny.weekday.slice(0, 3),
    date: `${ny.day} ${ny.month} ${ny.year}`,
    time,
    zone: ny.zone,
    label: `${ny.weekday} ${time} New York`,
    short: `${ny.weekday.slice(0, 3)} ${time} NY`,
  };
}

/**
 * The keeper's usual week, when the page is describing the rule rather than one dated rehearsal.
 * Lead with these; <ClockNote> says once that times are shown in the reader's zone.
 */
export const WEEK = {
  close: "Friday 4:00pm New York",
  closeShort: "Fri 4:00pm NY",
  expiry: "Saturday 4:00pm New York",
  expiryShort: "Sat 4:00pm NY",
  window: "Friday 4:00pm to Saturday 4:00pm New York",
} as const;
