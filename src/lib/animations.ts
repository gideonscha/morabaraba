/**
 * Tiny animation helpers — pure transforms/opacity, 60fps safe.
 *
 * Reusable CSS keyframes live in src/index.css; this module hosts the
 * runtime helpers (number counters etc.) that can't be expressed in CSS.
 */

/**
 * Pure counter — animates a number from `from` to `to` over `durationMs`.
 * Returns a cleanup function. Use inside useEffect.
 */
export function tweenNumber(
  from: number,
  to: number,
  durationMs: number,
  onTick: (val: number) => void,
): () => void {
  if (from === to || durationMs <= 0) { onTick(to); return () => {}; }
  const start = performance.now();
  let raf = 0;
  const tick = () => {
    const t = Math.min(1, (performance.now() - start) / durationMs);
    const eased = t * t * (3 - 2 * t); // smoothstep
    onTick(Math.round(from + (to - from) * eased));
    if (t < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
