import * as THREE from 'three';
import { CASE } from './watch-case';

export interface HandMaterials {
  readonly metal: THREE.Material;
  readonly lume: THREE.Material;
  readonly accent: THREE.Material;
}

export interface Hands {
  readonly group: THREE.Group;
  readonly hour: THREE.Group;
  readonly minute: THREE.Group;
  readonly second: THREE.Group;
  /** Sets hand rotations from clockwise angles in degrees. */
  setAngles(hours: number, minutes: number, seconds: number): void;
}

function dauphine(length: number, width: number, tail: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, -tail);
  s.lineTo(width / 2, 0);
  s.lineTo(0, length);
  s.lineTo(-width / 2, 0);
  s.closePath();
  return s;
}

/** Narrow diamond lume insert running from y0 to y1, widest at yMid. */
function lumeInsert(y0: number, yMid: number, y1: number, width: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, y0);
  s.lineTo(width / 2, yMid);
  s.lineTo(0, y1);
  s.lineTo(-width / 2, yMid);
  s.closePath();
  return s;
}

function extrude(shape: THREE.Shape, depth: number): THREE.ExtrudeGeometry {
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.4,
    bevelSize: 0.004,
    bevelSegments: 1,
  });
}

function buildHand(length: number, width: number, z: number, m: HandMaterials): THREE.Group {
  const group = new THREE.Group();
  group.position.z = z;
  const body = new THREE.Mesh(extrude(dauphine(length, width, 0.09), 0.006), m.metal);
  body.castShadow = true;
  const lume = new THREE.Mesh(
    new THREE.ShapeGeometry(lumeInsert(length * 0.12, length * 0.3, length * 0.86, width * 0.38)),
    m.lume,
  );
  lume.position.z = 0.0125;
  group.add(body, lume);
  return group;
}

export function buildHands(m: HandMaterials): Hands {
  const group = new THREE.Group();
  const base = CASE.dialZ + 0.03;

  const hour = buildHand(0.44, 0.064, base, m);
  const minute = buildHand(0.7, 0.05, base + 0.018, m);

  const second = new THREE.Group();
  second.position.z = base + 0.036;
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.9, 0.004), m.accent);
  needle.position.y = 0.3;
  const counterweight = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.006, 32), m.accent);
  counterweight.rotation.x = Math.PI / 2;
  counterweight.position.y = -0.1;
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.005, 24), m.lume);
  tip.rotation.x = Math.PI / 2;
  tip.position.y = 0.62;
  second.add(needle, counterweight, tip);
  second.traverse((o) => (o.castShadow = true));

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 32), m.accent);
  cap.rotation.x = Math.PI / 2;
  cap.position.z = base + 0.042;

  group.add(hour, minute, second, cap);

  const toRad = THREE.MathUtils.degToRad;
  return {
    group,
    hour,
    minute,
    second,
    setAngles: (h, min, s) => {
      hour.rotation.z = -toRad(h);
      minute.rotation.z = -toRad(min);
      second.rotation.z = -toRad(s);
    },
  };
}
