import * as THREE from 'three';

export interface GearOptions {
  readonly teeth: number;
  readonly module: number;
  readonly thickness: number;
  /** Number of spokes; 0 keeps the wheel solid (pinions). */
  readonly spokes?: number;
  readonly axleRadius?: number;
}

export const pitchRadius = (teeth: number, module: number): number => (teeth * module) / 2;

const polar = (r: number, a: number) => new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r);

/** Gear outline with trapezoid teeth (addendum = 1 module, dedendum = 1.25 modules). */
export function gearShape({ teeth, module, spokes = 0, axleRadius }: GearOptions): THREE.Shape {
  const pr = pitchRadius(teeth, module);
  const outer = pr + module;
  const root = pr - module * 1.25;
  const pitch = (Math.PI * 2) / teeth;
  const points: THREE.Vector2[] = [];

  for (let i = 0; i < teeth; i++) {
    const a = i * pitch;
    points.push(polar(root, a), polar(root, a + pitch * 0.28), polar(outer, a + pitch * 0.4));
    points.push(polar(outer, a + pitch * 0.6), polar(root, a + pitch * 0.72));
  }
  const shape = new THREE.Shape(points);

  if (spokes > 0) {
    const rim = Math.max(module * 2.2, root * 0.12);
    const inner = root - rim;
    const hub = Math.max(root * 0.22, module * 3);
    const spokeHalf = Math.max(module * 1.1, root * 0.06);
    const step = (Math.PI * 2) / spokes;
    for (let i = 0; i < spokes; i++) {
      const a0 = i * step + spokeHalf / inner;
      const a1 = (i + 1) * step - spokeHalf / inner;
      const h0 = i * step + spokeHalf / hub;
      const h1 = (i + 1) * step - spokeHalf / hub;
      if (a1 <= a0 || h1 <= h0) continue;
      const hole = new THREE.Path();
      hole.absarc(0, 0, inner, a0, a1, false);
      hole.absarc(0, 0, hub, h1, h0, true);
      hole.closePath();
      shape.holes.push(hole);
    }
  }

  const axle = axleRadius ?? Math.max(module * 1.2, root * 0.05);
  const axleHole = new THREE.Path();
  axleHole.absarc(0, 0, axle, 0, Math.PI * 2, true);
  shape.holes.push(axleHole);
  return shape;
}

/** Extruded gear lying flat in the XZ plane (axis along +Y), centred on y = 0. */
export function createGearGeometry(options: GearOptions): THREE.BufferGeometry {
  const { thickness, module } = options;
  const geometry = new THREE.ExtrudeGeometry(gearShape(options), {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: thickness * 0.12,
    bevelSize: module * 0.1,
    bevelSegments: 1,
    curveSegments: 10,
  });
  geometry.translate(0, 0, -thickness / 2);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

/** Swiss lever escape wheel with raked club teeth, lying in the XZ plane. */
export function createEscapeWheelGeometry(teeth: number, radius: number, thickness: number): THREE.BufferGeometry {
  const root = radius * 0.78;
  const pitch = (Math.PI * 2) / teeth;
  const points: THREE.Vector2[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * pitch;
    points.push(polar(root, a), polar(radius * 0.97, a + pitch * 0.55), polar(radius, a + pitch * 0.66));
    points.push(polar(radius * 0.9, a + pitch * 0.7), polar(root, a + pitch * 0.74));
  }
  const shape = new THREE.Shape(points);
  const inner = root * 0.82;
  const hub = root * 0.25;
  const spokes = 5;
  const step = (Math.PI * 2) / spokes;
  for (let i = 0; i < spokes; i++) {
    const hole = new THREE.Path();
    hole.absarc(0, 0, inner, i * step + 0.12, (i + 1) * step - 0.12, false);
    hole.absarc(0, 0, hub, (i + 1) * step - 0.4, i * step + 0.4, true);
    hole.closePath();
    shape.holes.push(hole);
  }
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -thickness / 2);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}
