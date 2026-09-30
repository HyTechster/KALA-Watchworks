import * as THREE from 'three';
import { CaseId, DIAL_OPTIONS, DialId } from '../../data/configurator-options';
import { buildStudioRoom, STUDIO_SIGMA, StudioEnvironmentData } from './studio-room';

export interface MetalFinish {
  readonly color: string;
  readonly roughness: number;
  readonly clearcoat: number;
}

export const CASE_FINISHES: Record<CaseId, MetalFinish> = {
  steel: { color: '#d6dadf', roughness: 0.2, clearcoat: 0.35 },
  titanium: { color: '#9ea3a8', roughness: 0.34, clearcoat: 0.1 },
  'rose-gold': { color: '#e3aa8d', roughness: 0.17, clearcoat: 0.4 },
};

export function dialColor(id: DialId): string {
  return DIAL_OPTIONS.find((d) => d.id === id)?.hex ?? '#1f5c58';
}

export function createMetal(finish: MetalFinish, roughnessOffset = 0): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: finish.color,
    metalness: 1,
    roughness: Math.min(1, finish.roughness + roughnessOffset),
    clearcoat: finish.clearcoat,
    clearcoatRoughness: 0.12,
  });
}

export function canvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const el = document.createElement('canvas');
  el.width = size;
  el.height = size;
  const ctx = el.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  return { canvas: el, ctx };
}

function toTexture(el: HTMLCanvasElement, srgb = true): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(el);
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/** Prefilters the studio room on this thread. Used when workers cannot render WebGL. */
export function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = buildStudioRoom();
  const texture = pmrem.fromScene(room.scene, STUDIO_SIGMA).texture;
  room.dispose();
  pmrem.dispose();
  return texture;
}

let studioTexels: Promise<StudioEnvironmentData | null> | null = null;

/** Asks the worker for the prefiltered studio once; every scene reuses the texels. */
function requestStudioTexels(): Promise<StudioEnvironmentData | null> {
  studioTexels ??= new Promise((resolve) => {
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') {
      resolve(null);
      return;
    }
    const worker = new Worker(new URL('./studio-environment.worker', import.meta.url), { type: 'module' });
    const finish = (data: StudioEnvironmentData | null) => {
      worker.terminate();
      resolve(data);
    };
    worker.onmessage = ({ data }: MessageEvent<StudioEnvironmentData | { error: string }>) =>
      finish('texels' in data ? data : null);
    worker.onerror = () => finish(null);
    // The worker prefilters the studio HDRI (falling back to the procedural room itself).
    worker.postMessage({ hdrUrl: new URL('env/studio.hdr', document.baseURI).href });
  });
  return studioTexels;
}

/**
 * Dark studio environment for PBR reflections. It is prefiltered in a Web Worker so the
 * heavy shader compilation never blocks the page, then uploaded as a cube-UV texture.
 * Falls back to prefiltering on the main thread when the worker path is unavailable.
 */
export async function loadStudioEnvironment(renderer: THREE.WebGLRenderer): Promise<THREE.Texture> {
  const data = await requestStudioTexels();
  if (!data) return createStudioEnvironment(renderer);
  const texture = new THREE.DataTexture(data.texels, data.width, data.height, THREE.RGBAFormat, THREE.HalfFloatType);
  texture.mapping = THREE.CubeUVReflectionMapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

/** Radial sunburst brushing, used as a grayscale map multiplied by the dial colour. */
export function createSunburstTexture(size = 1024): THREE.CanvasTexture {
  const { canvas: el, ctx } = canvas(size);
  const c = size / 2;
  ctx.fillStyle = '#d9d9d9';
  ctx.fillRect(0, 0, size, size);
  ctx.translate(c, c);
  for (let i = 0; i < 720; i++) {
    const a = (i / 720) * Math.PI * 2;
    const v = 170 + Math.round(Math.random() * 85);
    ctx.strokeStyle = `rgb(${v},${v},${v})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * c * 1.5, Math.sin(a) * c * 1.5);
    ctx.stroke();
  }
  const vignette = ctx.createRadialGradient(0, 0, 0, 0, 0, c);
  vignette.addColorStop(0, 'rgba(255,255,255,0.25)');
  vignette.addColorStop(0.7, 'rgba(255,255,255,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vignette;
  ctx.fillRect(-c, -c, size, size);
  return toTexture(el);
}

/** Widmanstätten-style crystalline pattern for the meteorite dial. */
export function createMeteoriteTexture(size = 1024): THREE.CanvasTexture {
  const { canvas: el, ctx } = canvas(size);
  ctx.fillStyle = '#bdbdbd';
  ctx.fillRect(0, 0, size, size);
  const families = [0.35, 1.4, 2.45];
  for (const angle of families) {
    for (let i = 0; i < 90; i++) {
      const offset = (Math.random() - 0.5) * size * 2;
      const width = 2 + Math.random() * 16;
      const v = Math.random() > 0.5 ? 235 : 140;
      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.rotate(angle);
      ctx.fillStyle = `rgba(${v},${v},${v},${0.18 + Math.random() * 0.3})`;
      ctx.fillRect(-size, offset, size * 2, width);
      ctx.restore();
    }
  }
  return toTexture(el);
}

/** Perlage (circular graining) for movement plates. */
export function createPerlageTexture(size = 1024, rings = 26): THREE.CanvasTexture {
  const { canvas: el, ctx } = canvas(size);
  ctx.fillStyle = '#a9adb2';
  ctx.fillRect(0, 0, size, size);
  const step = size / rings;
  for (let y = 0; y < rings + 1; y++) {
    for (let x = 0; x < rings + 1; x++) {
      const cx = x * step + (y % 2 ? step / 2 : 0);
      const cy = y * step;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, step * 0.75);
      g.addColorStop(0, 'rgba(255,255,255,0.35)');
      g.addColorStop(0.55, 'rgba(120,120,120,0.25)');
      g.addColorStop(0.9, 'rgba(255,255,255,0.3)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, step * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = toTexture(el);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** Côtes de Genève stripes for bridges. */
export function createStripeTexture(size = 512, stripes = 10): THREE.CanvasTexture {
  const { canvas: el, ctx } = canvas(size);
  const w = size / stripes;
  for (let i = 0; i < stripes; i++) {
    const g = ctx.createLinearGradient(i * w, 0, (i + 1) * w, 0);
    g.addColorStop(0, '#8d9197');
    g.addColorStop(0.45, '#eef0f2');
    g.addColorStop(0.55, '#d3d6da');
    g.addColorStop(1, '#8a8e94');
    ctx.fillStyle = g;
    ctx.fillRect(i * w, 0, w + 1, size);
  }
  const texture = toTexture(el);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.rotation = Math.PI / 5;
  return texture;
}

/** Soft radial gradient, used for the floor shadow and sparkle particles. */
export function createRadialTexture(size: number, inner: string, outer: string): THREE.CanvasTexture {
  const { canvas: el, ctx } = canvas(size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return toTexture(el);
}

/** Disposes every geometry, material and texture under an object. */
export function disposeObject(root: THREE.Object3D): void {
  const textures = new Set<THREE.Texture>();
  const materials = new Set<THREE.Material>();
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (!mat) return;
    (Array.isArray(mat) ? mat : [mat]).forEach((m) => materials.add(m));
  });
  materials.forEach((m) => {
    for (const value of Object.values(m)) {
      if (value instanceof THREE.Texture) textures.add(value);
    }
    m.dispose();
  });
  textures.forEach((t) => t.dispose());
}
