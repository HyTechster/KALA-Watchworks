import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export interface StrapMaterials {
  readonly leather: THREE.Material;
  readonly stitch: THREE.Material;
  readonly rubber: THREE.Material;
  readonly rubberGroove: THREE.Material;
  readonly braceletPolished: THREE.Material;
  readonly braceletBrushed: THREE.Material;
}

export interface Straps {
  readonly leather: THREE.Group;
  readonly rubber: THREE.Group;
  readonly bracelet: THREE.Group;
}

const SIDE = new THREE.Vector3(1, 0, 0);

/** Path of one strap half, curving from the lugs back behind the case. */
function strapCurve(sign: 1 | -1): THREE.CatmullRomCurve3 {
  const pts: [number, number][] = [
    [1.12, -0.06],
    [1.42, -0.12],
    [1.7, -0.34],
    [1.9, -0.7],
    [1.99, -1.12],
    [1.98, -1.62],
    [1.9, -2.05],
  ];
  return new THREE.CatmullRomCurve3(
    pts.map(([y, z]) => new THREE.Vector3(0, y * sign, z)),
    false,
    'centripetal',
  );
}

interface Frame {
  readonly point: THREE.Vector3;
  readonly tangent: THREE.Vector3;
  /** Unit vector perpendicular to the band surface (points away from the wrist). */
  readonly up: THREE.Vector3;
}

function frameAt(curve: THREE.Curve<THREE.Vector3>, t: number, sign: 1 | -1): Frame {
  const point = curve.getPointAt(t);
  const tangent = curve.getTangentAt(t).normalize();
  const up = new THREE.Vector3().crossVectors(tangent, SIDE).normalize();
  if (sign === -1) up.negate();
  return { point, tangent, up };
}

/** Sweeps a rectangular cross-section along the curve, tapering in width. */
function sweepBand(
  curve: THREE.Curve<THREE.Vector3>,
  sign: 1 | -1,
  widthStart: number,
  widthEnd: number,
  thickness: number,
  segments = 72,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const h = thickness / 2;
  const corners: [number, number][] = [
    [1, 1],
    [-1, 1],
    [-1, -1],
    [1, -1],
  ];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const { point, up } = frameAt(curve, t, sign);
    const w = THREE.MathUtils.lerp(widthStart, widthEnd, t) / 2;
    for (const [sx, sy] of corners) {
      const v = point.clone().addScaledVector(SIDE, sx * w).addScaledVector(up, sy * h);
      positions.push(v.x, v.y, v.z);
      uvs.push(sx > 0 ? 1 : 0, t);
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let c = 0; c < 4; c++) {
      const a = i * 4 + c;
      const b = i * 4 + ((c + 1) % 4);
      const a2 = a + 4;
      const b2 = b + 4;
      indices.push(a, a2, b, b, a2, b2);
    }
  }
  const last = segments * 4;
  indices.push(0, 1, 2, 0, 2, 3, last, last + 2, last + 1, last, last + 3, last + 2);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Places instanced pieces along the curve, oriented to the band's frame. */
function distribute(
  mesh: THREE.InstancedMesh,
  curve: THREE.Curve<THREE.Vector3>,
  sign: 1 | -1,
  count: number,
  from: number,
  to: number,
  offset: (frame: Frame, index: number) => THREE.Vector3,
  startIndex = 0,
): void {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const basis = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    const t = from + ((to - from) * i) / Math.max(1, count - 1);
    const frame = frameAt(curve, t, sign);
    basis.makeBasis(SIDE, frame.tangent, new THREE.Vector3().crossVectors(SIDE, frame.tangent));
    q.setFromRotationMatrix(basis);
    m.compose(offset(frame, i), q, new THREE.Vector3(1, 1, 1));
    mesh.setMatrixAt(startIndex + i, m);
  }
}

function leatherHalf(sign: 1 | -1, m: StrapMaterials): THREE.Group {
  const group = new THREE.Group();
  const curve = strapCurve(sign);
  const band = new THREE.Mesh(sweepBand(curve, sign, 1.02, 0.86, 0.075), m.leather);
  band.castShadow = true;
  band.receiveShadow = true;
  group.add(band);

  const stitchGeo = new THREE.BoxGeometry(0.012, 0.034, 0.006);
  const perSide = 46;
  const stitches = new THREE.InstancedMesh(stitchGeo, m.stitch, perSide * 2);
  for (const [k, sx] of [
    [0, 1],
    [1, -1],
  ] as const) {
    distribute(
      stitches,
      curve,
      sign,
      perSide,
      0.03,
      0.97,
      (frame, i) => {
        const t = 0.03 + (0.94 * i) / (perSide - 1);
        const w = THREE.MathUtils.lerp(1.02, 0.86, t) / 2 - 0.055;
        return frame.point.clone().addScaledVector(SIDE, sx * w).addScaledVector(frame.up, -0.04);
      },
      k * perSide,
    );
  }
  group.add(stitches);
  return group;
}

function rubberHalf(sign: 1 | -1, m: StrapMaterials): THREE.Group {
  const group = new THREE.Group();
  const curve = strapCurve(sign);
  const band = new THREE.Mesh(sweepBand(curve, sign, 1.02, 0.88, 0.09), m.rubber);
  band.castShadow = true;
  group.add(band);

  const grooveGeo = new THREE.BoxGeometry(0.64, 0.022, 0.012);
  const count = 26;
  const grooves = new THREE.InstancedMesh(grooveGeo, m.rubberGroove, count);
  distribute(grooves, curve, sign, count, 0.08, 0.95, (frame) =>
    frame.point.clone().addScaledVector(frame.up, -0.046),
  );
  group.add(grooves);
  return group;
}

function braceletHalf(sign: 1 | -1, m: StrapMaterials): THREE.Group {
  const group = new THREE.Group();
  const curve = strapCurve(sign);
  const links = 26;
  const centerGeo = new RoundedBoxGeometry(0.32, 0.105, 0.085, 2, 0.02);
  const outerGeo = new RoundedBoxGeometry(0.34, 0.105, 0.09, 2, 0.022);
  const center = new THREE.InstancedMesh(centerGeo, m.braceletPolished, links);
  const outer = new THREE.InstancedMesh(outerGeo, m.braceletBrushed, links * 2);
  distribute(center, curve, sign, links, 0.02, 0.98, (frame) => frame.point.clone());
  for (const [k, sx] of [
    [0, 1],
    [1, -1],
  ] as const) {
    distribute(
      outer,
      curve,
      sign,
      links,
      0.02,
      0.98,
      (frame, i) => {
        const t = 0.02 + (0.96 * i) / (links - 1);
        const w = THREE.MathUtils.lerp(0.335, 0.28, t);
        return frame.point.clone().addScaledVector(SIDE, sx * w);
      },
      k * links,
    );
  }
  center.castShadow = true;
  outer.castShadow = true;
  group.add(center, outer);
  return group;
}

export function buildStraps(m: StrapMaterials): Straps {
  const leather = new THREE.Group();
  leather.add(leatherHalf(1, m), leatherHalf(-1, m));
  const rubber = new THREE.Group();
  rubber.add(rubberHalf(1, m), rubberHalf(-1, m));
  const bracelet = new THREE.Group();
  bracelet.add(braceletHalf(1, m), braceletHalf(-1, m));
  return { leather, rubber, bracelet };
}
