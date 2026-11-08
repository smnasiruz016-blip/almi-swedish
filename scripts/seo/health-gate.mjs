// RR-400 health gate (runs first in `npm run build`; no network, no database).
// 1. A site icon exists, so browsers do not request a missing /favicon.ico (a 404 in the console costs Best Practices).
// 2. The coral, teal and amber-accent TEXT shades reach WCAG AA (4.5:1) on every light page background token.
// 3. globals.css really applies those shades to the .text-almi-coral / -coral-deep / -teal / -accent / -accent-deep classes.
// Sabotage: set --color-almi-coral-text back to #ff6b5b, or delete src/app/icon.svg; the gate must go RED.
import { existsSync, readFileSync } from "node:fs";

const ROOT = new URL("../../", import.meta.url);
const fails = [];

const ICONS = ["src/app/icon.svg", "src/app/icon.png", "src/app/favicon.ico", "public/favicon.ico"];
if (!ICONS.some((p) => existsSync(new URL(p, ROOT)))) fails.push(`no site icon (expected one of ${ICONS.join(", ")})`);

const css = readFileSync(new URL("src/app/globals.css", ROOT), "utf8");
const token = (name) => css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})\\b`))?.[1];
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const backgrounds = ["almi-bg", "almi-paper", "almi-bg-peach"].map((n) => [n, token(n)]).filter(([, v]) => v);
for (const t of ["almi-coral-text", "almi-teal-text", "almi-accent-text"]) {
  const fg = token(t);
  if (!fg) { fails.push(`--color-${t} is missing from globals.css`); continue; }
  for (const [n, bg] of backgrounds) {
    const r = ratio(fg, bg);
    if (r < 4.5) fails.push(`--color-${t} ${fg} on --color-${n} ${bg} is ${r.toFixed(2)}:1 (< 4.5:1)`);
  }
}
const MAP = [["text-almi-coral-deep", "almi-coral-text"], ["text-almi-coral", "almi-coral-text"], ["text-almi-teal", "almi-teal-text"], ["text-almi-accent-deep", "almi-accent-text"], ["text-almi-accent", "almi-accent-text"]];
for (const [cls, t] of MAP) {
  const re = new RegExp(`\\.${cls}\\s*[,{][^}]*color:\\s*var\\(--color-${t}\\)`);
  if (!re.test(css)) fails.push(`.${cls} is not mapped to var(--color-${t}) in globals.css`);
}

if (fails.length) { console.error(`health-gate RED (${fails.length}):\n  - ${fails.join("\n  - ")}`); process.exit(1); }
console.log(`health-gate GREEN: icon present; coral/teal/accent text >= 4.5:1 on ${backgrounds.map(([n]) => n).join(", ")}; classes mapped`);
