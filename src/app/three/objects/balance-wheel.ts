import * as THREE from 'three';

export interface BalanceWheel {
  /** Whole assembly; place and scale this. */
  readonly group: THREE.Group;
  /** Rotates with the oscillation (rim, arms, weights). */
  readonly wheel: THREE.Group;
  /** The hairspring, which winds and unwinds with the wheel. */
  readonly spring: THREE.Mesh;
}

/** Balance wheel with timing weights and a spiral hairspring, lying flat (axis +Y). */
export function createBalanceWheel(
  radius: number,
  rimMaterial: THREE.Material,
  weightMaterial: THREE.Material,
  springMaterial: THREE.Material,
): BalanceWheel {
  const group = new THREE.Group();
  const wheel = new THREE.Group();
  group.add(wheel);

  const rimThickness = radius * 0.07;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, rimThickness, 14, 96), rimMaterial);
  rim.rotation.x = Math.PI / 2;
  rim.scale.z = 0.7;
  rim.castShadow = true;
  wheel.add(rim);

  const armGeo = new THREE.BoxGeometry(radius * 2, radius * 0.05, radius * 0.07);
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Mesh(armGeo, rimMaterial);
    arm.rotation.y = (i * Math.PI) / 3;
    wheel.add(arm);
  }

  const weightGeo = new THREE.CylinderGeometry(radius * 0.06, radius * 0.06, radius * 0.12, 12);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const weight = new THREE.Mesh(weightGeo, weightMaterial);
    weight.position.set(Math.cos(a) * (radius + rimThickness * 0.9), 0, Math.sin(a) * (radius + rimThickness * 0.9));
    weight.rotation.z = Math.PI / 2;
    weight.rotation.y = -a;
    wheel.add(weight);
  }

  const roller = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.14, radius * 0.14, radius * 0.08, 24), weightMaterial);
  roller.position.y = -radius * 0.12;
  wheel.add(roller);

  const staff = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.035, radius * 0.035, radius * 0.7, 12), rimMaterial);
  wheel.add(staff);

  // Archimedean spiral hairspring.
  const turns = 11;
  const points: THREE.Vector3[] = [];
  const r0 = radius * 0.1;
  const r1 = radius * 0.62;
  const samples = turns * 48;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const a = t * turns * Math.PI * 2;
    const r = r0 + (r1 - r0) * t;
    points.push(new THREE.Vector3(Math.cos(a) * r, radius * 0.16, Math.sin(a) * r));
  }
  const spring = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), samples, radius * 0.008, 5, false),
    springMaterial,
  );
  group.add(spring);

  return { group, wheel, spring };
}

/**
 * Balance angle in radians for time `t` (seconds). 28,800 vph is 8 beats per second,
 * i.e. 4 full oscillations per second.
 */
export function balanceAngle(t: number, amplitude = THREE.MathUtils.degToRad(160)): number {
  return amplitude * Math.sin(t * Math.PI * 2 * 4);
}

/**
 * Escape wheel angle in radians for time `t`. It advances half a tooth (12° for a
 * 15-tooth wheel) on each of the 8 beats per second, snapping forward then resting.
 */
export function escapeAngle(t: number, teeth = 15): number {
  const beats = t * 8;
  const beat = Math.floor(beats);
  const frac = beats - beat;
  const step = frac < 0.3 ? 1 - Math.pow(1 - frac / 0.3, 3) : 1;
  return (beat + step) * ((Math.PI * 2) / teeth / 2);
}
