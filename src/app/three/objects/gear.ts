import * as THREE from 'three';
import { createGearGeometry, pitchRadius } from '../utils/gear-geometry';

export interface WheelOptions {
  readonly teeth: number;
  readonly module: number;
  readonly thickness?: number;
  readonly spokes?: number;
  /** Coaxial pinion teeth (0 for none). */
  readonly pinionTeeth?: number;
  /** Pinion height and vertical offset relative to the wheel. */
  readonly pinionHeight?: number;
  readonly pinionOffset?: number;
}

export interface Wheel {
  readonly group: THREE.Group;
  readonly radius: number;
  readonly pinionRadius: number;
}

/**
 * A wheel with an optional coaxial pinion and arbor, lying flat (axis +Y).
 * Rotate `group.rotation.y` to turn it.
 */
export function createWheel(
  options: WheelOptions,
  wheelMaterial: THREE.Material,
  pinionMaterial: THREE.Material,
): Wheel {
  const { teeth, module, thickness = module * 2.4, spokes = 4, pinionTeeth = 0 } = options;
  const group = new THREE.Group();

  const wheel = new THREE.Mesh(createGearGeometry({ teeth, module, thickness, spokes }), wheelMaterial);
  wheel.castShadow = true;
  wheel.receiveShadow = true;
  group.add(wheel);

  let pinionRadius = 0;
  if (pinionTeeth > 0) {
    const height = options.pinionHeight ?? thickness * 3;
    const pinion = new THREE.Mesh(
      createGearGeometry({ teeth: pinionTeeth, module, thickness: height, spokes: 0, axleRadius: module * 0.6 }),
      pinionMaterial,
    );
    pinion.position.y = options.pinionOffset ?? -height / 2;
    group.add(pinion);
    pinionRadius = pitchRadius(pinionTeeth, module);
  }

  const arborHeight = thickness * 6;
  const arbor = new THREE.Mesh(
    new THREE.CylinderGeometry(module * 0.9, module * 0.9, arborHeight, 16),
    pinionMaterial,
  );
  arbor.position.y = options.pinionOffset !== undefined ? options.pinionOffset / 2 : -arborHeight * 0.2;
  group.add(arbor);

  return { group, radius: pitchRadius(teeth, module), pinionRadius };
}

/** Ruby jewel bearing (a tiny domed red cylinder with a steel chaton). */
export function createJewel(radius: number, jewelMaterial: THREE.Material, chatonMaterial: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  const chaton = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.6, radius * 1.6, radius * 0.5, 24), chatonMaterial);
  const jewel = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), jewelMaterial);
  jewel.scale.y = 0.45;
  jewel.position.y = radius * 0.25;
  group.add(chaton, jewel);
  return group;
}
