import * as THREE from 'three';

/**
 * Skeletonised winding rotor: a half-disc with a heavy gold rim weight, lying flat
 * (axis +Y). Rotate the returned group's `rotation.y` to spin it.
 */
export function createRotor(
  radius: number,
  thickness: number,
  plateMaterial: THREE.Material,
  weightMaterial: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();
  const hub = radius * 0.14;
  const rimInner = radius * 0.8;

  const plate = new THREE.Shape();
  plate.absarc(0, 0, rimInner, Math.PI, 0, false);
  plate.lineTo(hub, 0);
  plate.absarc(0, 0, hub, 0, Math.PI, true);
  plate.closePath();

  // The arcs above sweep π → 2π, so the three skeleton windows sit in that half too.
  const windows = [
    [Math.PI * 1.08, Math.PI * 1.3],
    [Math.PI * 1.39, Math.PI * 1.61],
    [Math.PI * 1.7, Math.PI * 1.92],
  ];
  for (const [a0, a1] of windows) {
    const w = new THREE.Path();
    w.absarc(0, 0, rimInner * 0.86, a0, a1, false);
    w.absarc(0, 0, hub * 1.9, a1 - 0.08, a0 + 0.08, true);
    w.closePath();
    plate.holes.push(w);
  }

  const extrude = (shape: THREE.Shape, depth: number) => {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: depth * 0.15,
      bevelSize: radius * 0.008,
      bevelSegments: 2,
      curveSegments: 48,
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  };

  const plateMesh = new THREE.Mesh(extrude(plate, thickness), plateMaterial);
  plateMesh.castShadow = true;
  group.add(plateMesh);

  const rim = new THREE.Shape();
  rim.absarc(0, 0, radius, Math.PI, 0, false);
  rim.lineTo(rimInner, 0);
  rim.absarc(0, 0, rimInner, 0, Math.PI, true);
  rim.closePath();
  const rimMesh = new THREE.Mesh(extrude(rim, thickness * 1.8), weightMaterial);
  rimMesh.position.y = -thickness * 0.4;
  rimMesh.castShadow = true;
  group.add(rimMesh);

  const bearing = new THREE.Mesh(new THREE.CylinderGeometry(hub * 1.1, hub * 1.1, thickness * 2.2, 40), weightMaterial);
  bearing.position.y = thickness * 0.5;
  group.add(bearing);

  return group;
}
