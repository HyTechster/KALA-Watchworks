/// <reference lib="webworker" />

import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { buildStudioRoom, STUDIO_SIGMA, StudioEnvironmentData } from './studio-room';

export interface StudioEnvironmentRequest {
  /** Absolute URL of the studio HDRI; when it fails to load, the procedural room is used. */
  readonly hdrUrl: string;
}

/** Loads the studio HDRI as an equirectangular texture ready for prefiltering. */
async function loadHdr(url: string): Promise<THREE.DataTexture> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HDR ${response.status}`);
  const parsed = new HDRLoader().parse(await response.arrayBuffer());
  const texture = new THREE.DataTexture(
    parsed.data as Uint16Array,
    parsed.width,
    parsed.height,
    THREE.RGBAFormat,
    parsed.type,
  );
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.LinearSRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.flipY = true;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Builds the studio environment off the main thread. Prefiltering compiles large blur
 * shaders, which can stall the page for most of a second on some GPUs; here it only
 * stalls this worker. The result is sent back as raw half-float texels.
 */
addEventListener('message', async ({ data }: MessageEvent<StudioEnvironmentRequest>) => {
  try {
    const canvas = new OffscreenCanvas(1, 1);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    renderer.debug.checkShaderErrors = false;
    const pmrem = new THREE.PMREMGenerator(renderer);

    let target: THREE.WebGLRenderTarget;
    try {
      // Real studio lighting: Poly Haven "Wooden Studio 15" (CC0), neutralised in Blender.
      const hdr = await loadHdr(data.hdrUrl);
      target = pmrem.fromEquirectangular(hdr);
      hdr.dispose();
    } catch {
      const room = buildStudioRoom();
      target = pmrem.fromScene(room.scene, STUDIO_SIGMA);
      room.dispose();
    }

    const { width, height } = target;
    const gl = renderer.getContext() as WebGL2RenderingContext;
    const floats = new Float32Array(width * height * 4);
    renderer.setRenderTarget(target);
    // Float color buffers can always be read back as RGBA/FLOAT in WebGL 2.
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, floats);
    renderer.setRenderTarget(null);

    const texels = new Uint16Array(floats.length);
    for (let i = 0; i < floats.length; i++) texels[i] = THREE.DataUtils.toHalfFloat(floats[i]);

    target.dispose();
    pmrem.dispose();
    renderer.dispose();

    const result: StudioEnvironmentData = { width, height, texels };
    postMessage(result, [texels.buffer]);
  } catch (error) {
    postMessage({ error: String(error) });
  }
});
