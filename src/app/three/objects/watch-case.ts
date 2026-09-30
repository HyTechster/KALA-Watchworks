import * as THREE from 'three';

export interface CaseMaterials {
  readonly polished: THREE.Material;
  readonly brushed: THREE.Material;
  readonly ticks: THREE.MeshStandardMaterial;
  readonly insert: THREE.MeshPhysicalMaterial;
  readonly crystal: THREE.Material;
  readonly casebackGlass: THREE.Material;
  readonly caseback: THREE.Material;
  readonly gold: THREE.Material;
}

export interface WatchCase {
  readonly group: THREE.Group;
  readonly crown: THREE.Group;
  readonly pushers: THREE.Group;
  readonly diverInsert: THREE.Mesh;
  readonly bezelTicks: THREE.InstancedMesh;
}

// Geometry constants in watch units (1 unit ≈ 20 mm).
export const CASE = {
  radius: 1,
  front: 0.16,
  back: -0.2,
  bezelTop: 0.25,
  opening: 0.815,
  dialZ: 0.062,
  casebackWindow: 0.52,
} as const;

/**
 * Lathe around the Z axis from (radius, z) profile points. Profiles are listed
 * counter-clockwise in the (r, z) plane so LatheGeometry's normals face outward.
 */
function latheZ(points: [number, number][], segments = 160): THREE.BufferGeometry {
  const geo = new THREE.LatheGeometry(
    points.map(([r, z]) => new THREE.Vector2(r, z)),
    segments,
  );
  geo.rotateX(Math.PI / 2);
  return geo;
}

function createLugGeometry(): THREE.BufferGeometry {
  // Profile in (length, height); extruded across the lug width.
  const s = new THREE.Shape();
  s.moveTo(0.6, 0.12);
  s.quadraticCurveTo(1.05, 0.1, 1.27, 0.0);
  s.quadraticCurveTo(1.33, -0.04, 1.28, -0.1);
  s.quadraticCurveTo(1.12, -0.16, 0.9, -0.18);
  s.lineTo(0.6, -0.18);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.13,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.018,
    bevelSegments: 3,
    curveSegments: 24,
  });
  geo.translate(0, 0, -0.065);
  // Map shape X → world Y (length), shape Y → world Z (height), extrusion → world X (width).
  geo.applyMatrix4(
    new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0)),
  );
  return geo;
}

export function buildWatchCase(m: CaseMaterials): WatchCase {
  const group = new THREE.Group();

  // Middle case: brushed flanks with polished transitions.
  const mid = new THREE.Mesh(
    latheZ([
      [0.84, CASE.back],
      [0.93, CASE.back],
      [0.982, -0.175],
      [1.0, -0.13],
      [1.004, 0.0],
      [1.0, 0.11],
      [0.985, 0.148],
      [0.955, CASE.front],
      [0.84, CASE.front],
      [0.84, CASE.back],
    ]),
    m.brushed,
  );
  mid.castShadow = true;
  group.add(mid);

  // Polished bezel with a sloped top and an inner flange down to the dial.
  const bezel = new THREE.Mesh(
    latheZ([
      [CASE.opening, CASE.dialZ],
      [0.85, CASE.dialZ],
      [0.85, CASE.front],
      [0.97, CASE.front],
      [0.985, 0.178],
      [0.978, 0.205],
      [0.945, 0.238],
      [0.87, CASE.bezelTop],
      [0.828, CASE.bezelTop],
      [CASE.opening, 0.235],
      [CASE.opening, CASE.dialZ],
    ]),
    m.polished,
  );
  bezel.castShadow = true;
  group.add(bezel);

  // Diver: dark ceramic insert ring with a lume pip.
  const diverInsert = new THREE.Mesh(new THREE.RingGeometry(0.84, 0.965, 160, 1), m.insert);
  diverInsert.position.z = CASE.bezelTop + 0.004;
  group.add(diverInsert);

  // Bezel tick marks as instanced boxes.
  const tickGeo = new THREE.BoxGeometry(0.011, 0.045, 0.008);
  const bezelTicks = new THREE.InstancedMesh(tickGeo, m.ticks, 60);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const major = i % 5 === 0;
    dummy.position.set(Math.sin(a) * 0.905, Math.cos(a) * 0.905, CASE.bezelTop + 0.008);
    dummy.rotation.set(0, 0, -a);
    dummy.scale.set(major ? 1.8 : 1, major ? 1.7 : 1, 1);
    dummy.updateMatrix();
    bezelTicks.setMatrixAt(i, dummy.matrix);
  }
  group.add(bezelTicks);

  // Lugs (four), made from an extruded side profile.
  const lugGeo = createLugGeometry();
  const lugs = new THREE.Group();
  for (const sx of [-1, 1]) {
    const lug = new THREE.Mesh(lugGeo, m.polished);
    lug.position.x = sx * 0.58;
    lug.castShadow = true;
    lugs.add(lug);
  }
  const lowerLugs = lugs.clone();
  lowerLugs.rotation.z = Math.PI;
  group.add(lugs, lowerLugs);

  // Spring bars.
  const barGeo = new THREE.CylinderGeometry(0.022, 0.022, 1.06, 12);
  barGeo.rotateZ(Math.PI / 2);
  for (const sy of [-1, 1]) {
    const bar = new THREE.Mesh(barGeo, m.brushed);
    bar.position.set(0, sy * 1.18, -0.07);
    group.add(bar);
  }

  // Crown with knurling on a winding stem.
  const crown = new THREE.Group();
  crown.position.set(1.0, 0, -0.02);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.08, 16), m.brushed);
  stem.rotation.z = Math.PI / 2;
  stem.position.x = 0.03;
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.12, 48), m.polished);
  head.rotation.z = Math.PI / 2;
  head.position.x = 0.12;
  const knurlGeo = new THREE.BoxGeometry(0.1, 0.014, 0.014);
  const knurls = new THREE.InstancedMesh(knurlGeo, m.brushed, 30);
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2;
    dummy.position.set(0.12, Math.cos(a) * 0.106, Math.sin(a) * 0.106);
    dummy.rotation.set(a, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    knurls.setMatrixAt(i, dummy.matrix);
  }
  const cap = new THREE.Mesh(new THREE.CircleGeometry(0.06, 32), m.gold);
  cap.rotation.y = Math.PI / 2;
  cap.position.x = 0.181;
  crown.add(stem, head, knurls, cap);
  group.add(crown);

  // Chronograph pushers at 2 and 4 o'clock.
  const pushers = new THREE.Group();
  const pusherGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.14, 32);
  pusherGeo.rotateZ(Math.PI / 2);
  for (const deg of [42, -42]) {
    const a = THREE.MathUtils.degToRad(deg);
    const pusher = new THREE.Mesh(pusherGeo, m.polished);
    pusher.position.set(Math.cos(a) * 1.04, Math.sin(a) * 1.04, -0.02);
    pusher.rotation.z = a;
    pushers.add(pusher);
  }
  group.add(pushers);

  // Domed sapphire crystal (transmissive).
  const domePoints: [number, number][] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const r = (1 - t) * 0.83;
    domePoints.push([Math.max(r, 0.0001), 0.225 + Math.sin((t * Math.PI) / 2) * 0.05]);
  }
  const crystal = new THREE.Mesh(latheZ(domePoints, 96), m.crystal);
  crystal.renderOrder = 2;
  group.add(crystal);

  // Exhibition caseback: engraved steel ring around a sapphire window.
  const backRing = new THREE.Mesh(new THREE.RingGeometry(CASE.casebackWindow, 0.93, 160, 1), m.caseback);
  backRing.rotation.y = Math.PI;
  backRing.position.z = CASE.back - 0.002;
  group.add(backRing);

  const backBevel = new THREE.Mesh(
    latheZ([
      [CASE.casebackWindow, CASE.back - 0.03],
      [CASE.casebackWindow + 0.02, CASE.back - 0.003],
    ]),
    m.polished,
  );
  group.add(backBevel);

  const backGlass = new THREE.Mesh(new THREE.CircleGeometry(CASE.casebackWindow, 96), m.casebackGlass);
  backGlass.rotation.y = Math.PI;
  backGlass.position.z = CASE.back - 0.03;
  backGlass.renderOrder = 2;
  group.add(backGlass);

  return { group, crown, pushers, diverInsert, bezelTicks };
}
