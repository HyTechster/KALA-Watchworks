// Pure helpers that build SVG path data for gears and escape wheels.

const f = (n: number) => n.toFixed(2);

const polar = (cx: number, cy: number, r: number, angle: number): [number, number] => [
  cx + r * Math.cos(angle),
  cy + r * Math.sin(angle),
];

/** Involute-like gear outline with trapezoid teeth. */
export function gearPath(teeth: number, outerR: number, rootR: number, cx = 0, cy = 0): string {
  const pitch = (Math.PI * 2) / teeth;
  const points: [number, number][] = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * pitch;
    points.push(polar(cx, cy, rootR, a));
    points.push(polar(cx, cy, rootR, a + pitch * 0.3));
    points.push(polar(cx, cy, outerR, a + pitch * 0.42));
    points.push(polar(cx, cy, outerR, a + pitch * 0.68));
    points.push(polar(cx, cy, rootR, a + pitch * 0.8));
  }
  return `M${points.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z`;
}

/** Swiss lever escape wheel with raked club teeth. */
export function escapeWheelPath(teeth: number, outerR: number, rootR: number, cx = 0, cy = 0): string {
  const pitch = (Math.PI * 2) / teeth;
  const points: [number, number][] = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * pitch;
    points.push(polar(cx, cy, rootR, a));
    points.push(polar(cx, cy, outerR * 0.97, a + pitch * 0.55));
    points.push(polar(cx, cy, outerR, a + pitch * 0.66));
    points.push(polar(cx, cy, outerR * 0.9, a + pitch * 0.7));
    points.push(polar(cx, cy, rootR, a + pitch * 0.74));
  }
  return `M${points.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z`;
}

/** Circle as path data (useful for evenodd cut-outs). */
export function circlePath(r: number, cx = 0, cy = 0): string {
  return `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0Z`;
}

/** Sector-shaped windows between spokes, returned as path data for an evenodd fill. */
export function spokeWindowsPath(
  spokes: number,
  innerR: number,
  hubR: number,
  spokeWidth: number,
  cx = 0,
  cy = 0,
): string {
  const step = (Math.PI * 2) / spokes;
  let d = '';
  for (let i = 0; i < spokes; i++) {
    const outerPad = spokeWidth / 2 / innerR;
    const innerPad = spokeWidth / 2 / hubR;
    const a0 = i * step;
    const a1 = a0 + step;
    const [x1, y1] = polar(cx, cy, innerR, a0 + outerPad);
    const [x2, y2] = polar(cx, cy, innerR, a1 - outerPad);
    const [x3, y3] = polar(cx, cy, hubR, a1 - innerPad);
    const [x4, y4] = polar(cx, cy, hubR, a0 + innerPad);
    const large = step - outerPad * 2 > Math.PI ? 1 : 0;
    d += `M${f(x1)} ${f(y1)}A${f(innerR)} ${f(innerR)} 0 ${large} 1 ${f(x2)} ${f(y2)}L${f(x3)} ${f(y3)}A${f(hubR)} ${f(hubR)} 0 0 0 ${f(x4)} ${f(y4)}Z`;
  }
  return d;
}

/** A gear with spoked windows and an axle hole, as one evenodd path. */
export function spokedGearPath(teeth: number, outerR: number, rootR: number, spokes = 4, cx = 0, cy = 0): string {
  const rim = Math.max(1.2, (outerR - rootR) * 1.6);
  return (
    gearPath(teeth, outerR, rootR, cx, cy) +
    spokeWindowsPath(spokes, rootR - rim, Math.max(rootR * 0.24, 2), Math.max(1.2, rootR * 0.1), cx, cy) +
    circlePath(Math.max(rootR * 0.07, 0.8), cx, cy)
  );
}

/** Evenly spaced tick marks as line segments (for dials and bezels). */
export function tickLines(count: number, r1: number, r2: number): { x1: number; y1: number; x2: number; y2: number; major: boolean }[] {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    return {
      x1: Math.cos(a) * r1,
      y1: Math.sin(a) * r1,
      x2: Math.cos(a) * r2,
      y2: Math.sin(a) * r2,
      major: i % (count / 12) === 0,
    };
  });
}
