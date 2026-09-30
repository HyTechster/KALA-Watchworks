import * as THREE from 'three';

/** Prefiltered studio environment as raw texels, produced by the environment worker. */
export interface StudioEnvironmentData {
  readonly width: number;
  readonly height: number;
  /** Half-float RGBA texels of the prefiltered (PMREM, cube-UV) environment. */
  readonly texels: Uint16Array;
}

export interface StudioRoom {
  readonly scene: THREE.Scene;
  dispose(): void;
}

/**
 * A black room with a few emissive softboxes. Rendered into a PMREM it gives metals
 * premium studio reflections without downloading an HDR file. Pure Three.js, no DOM,
 * so it also runs inside a Web Worker.
 */
export function buildStudioRoom(): StudioRoom {
  const scene = new THREE.Scene();
  const disposables: { dispose(): void }[] = [];

  const roomGeo = new THREE.BoxGeometry(24, 14, 24);
  const roomMat = new THREE.MeshBasicMaterial({ color: 0x060607, side: THREE.BackSide });
  scene.add(new THREE.Mesh(roomGeo, roomMat));
  disposables.push(roomGeo, roomMat);

  const panel = (w: number, h: number, position: THREE.Vector3Tuple, intensity: number, color = 0xffffff) => {
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    mat.color.multiplyScalar(intensity);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...position);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
    disposables.push(geo, mat);
  };

  panel(9, 2.4, [0, 6.5, 0.5], 4.2); // top softbox
  panel(1.2, 7, [-7, 1.2, 2.5], 7.5); // left strip
  panel(0.9, 7, [7, 0.6, -1.5], 5.5, 0xffe3bd); // warm right strip
  panel(12, 0.5, [0, 2, -10], 2.6); // back rim line
  panel(7, 1, [0, -3.5, 8], 0.9); // low front fill
  panel(2.5, 2.5, [5, 4, 6], 1.4, 0xfff1dc); // soft warm kicker

  return { scene, dispose: () => disposables.forEach((d) => d.dispose()) };
}

/** Blur applied to the room before prefiltering. */
export const STUDIO_SIGMA = 0.035;
