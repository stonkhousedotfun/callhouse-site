"use client";

/**
 * The night/day toggle on stonkhouse.fun (the app's is callhouse web/components/ThemeToggle.tsx):
 * a sun/moon icon button, at least 44px square, whose
 * aria-label names the mode it switches TO. Mounted in the site header (components/Nav.tsx).
 *
 * THE DOCUMENT IS THE SOURCE OF TRUTH, not React state. The pre-paint script (lib/theme.ts THEME_INIT_SCRIPT) has
 * already set data-theme before this component exists. The toggle SUBSCRIBES to that attribute with
 * useSyncExternalStore (a MutationObserver on <html data-theme>) and renders the neutral "night" snapshot on the
 * server. ONE DELIBERATE DIFFERENCE FROM THE APP'S COPY: the app reads the attribute with setState inside useEffect,
 * which this repo's lint (react-hooks/set-state-in-effect) refuses; a subscription has no effect-time setState, and a
 * change made anywhere (the toggle, or another tab's script) re-renders it.
 */
import { useSyncExternalStore } from "react";

import { applyTheme, otherTheme, parseTheme, resolveTheme, toggleLabel, type Theme } from "@/lib/theme";

function currentTheme(): Theme {
  if (typeof document === "undefined") return "night";
  const fromDom = parseTheme(document.documentElement.getAttribute("data-theme"));
  if (fromDom) return fromDom;
  let dark = false;
  try { dark = window.matchMedia("(prefers-color-scheme: dark)").matches; } catch { /* no matchMedia: day */ }
  return resolveTheme(null, dark);
}

export function SunIcon() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>;
}

export function MoonIcon() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>;
}

/** Presentational half, testable without a document: the icon shows the mode you switch TO. */
export function ThemeToggleButton({ theme, onToggle, className = "" }: { theme: Theme; onToggle: () => void; className?: string }) {
  return <button type="button" onClick={onToggle} aria-label={toggleLabel(theme)} title={toggleLabel(theme)}
    data-theme-toggle={theme}
    className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill border border-line-2 text-ink-2 hover:text-ink ${className}`.trim()}>
    {theme === "night" ? <SunIcon /> : <MoonIcon />}
  </button>;
}

/** Notify on every change of <html data-theme>. */
function subscribe(onChange: () => void): () => void {
  if (typeof document === "undefined") return () => {};
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const serverTheme = (): Theme => "night";

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, currentTheme, serverTheme);
  return <ThemeToggleButton theme={theme} className={className} onToggle={() => {
    // applyTheme sets data-theme (the subscription re-renders this button) and persists; the page switches even if
    // storage refuses the write.
    applyTheme(otherTheme(currentTheme()));
  }} />;
}
