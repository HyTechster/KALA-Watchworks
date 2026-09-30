import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** Models built in Blender (see art/kala-watch.blend), Draco-compressed. */
export const MODEL_URLS = {
  watch: 'models/kala-watch.glb',
  movement: 'models/kala-movement.glb',
} as const;

export type ModelKey = keyof typeof MODEL_URLS;

let loader: GLTFLoader | null = null;
const scenes = new Map<ModelKey, Promise<THREE.Group>>();

/** Resolves a public asset path against the document base (works under a sub-path too). */
export function assetUrl(path: string): string {
  return new URL(path, document.baseURI).href;
}

function gltfLoader(): GLTFLoader {
  if (!loader) {
    const draco = new DRACOLoader();
    draco.setDecoderPath(assetUrl('draco/'));
    loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
  }
  return loader;
}

/** Downloads and parses a model once; later calls reuse the same promise. */
function loadScene(key: ModelKey): Promise<THREE.Group> {
  let pending = scenes.get(key);
  if (!pending) {
    pending = gltfLoader()
      .loadAsync(assetUrl(MODEL_URLS[key]))
      .then((gltf) => gltf.scene);
    // Let a failed download be retried by the next scene.
    pending.catch(() => scenes.delete(key));
    scenes.set(key, pending);
  }
  return pending;
}

/**
 * A fresh copy of a model for one scene. Geometry is shared between copies; materials are
 * cloned so each scene (hero, configurator, explorer) can recolour its own watch.
 */
export async function instantiateModel(key: ModelKey): Promise<THREE.Object3D> {
  const source = await loadScene(key);
  const copy = source.clone(true);
  copy.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map((m) => m.clone()) : mesh.material.clone();
  });
  return copy;
}

/** Starts downloading a model early without waiting for it. */
export function prefetchModel(key: ModelKey): void {
  loadScene(key).catch(() => undefined);
}
