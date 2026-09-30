import { isDevMode } from '@angular/core';
import type { Camera, Object3D, WebGLRenderer } from 'three';

/** True when the browser can create a WebGL2 (or WebGL) context. */
export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    const ok = !!gl;
    (gl as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

/** Device pixel ratio clamped to the performance budget. */
export function clampedPixelRatio(max = 2): number {
  return Math.min(window.devicePixelRatio || 1, max);
}

/** Lets the browser handle input and paint before the next chunk of work. */
export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** True in production builds. */
export function isProduction(): boolean {
  return !isDevMode();
}

/**
 * Compiles a scene's shaders. Uses parallel compilation when the browser supports it,
 * otherwise compiles synchronously (which is what the first frame would do anyway).
 */
export async function compileScene(renderer: WebGLRenderer, scene: Object3D, camera: Camera): Promise<void> {
  if (renderer.extensions.has('KHR_parallel_shader_compile')) {
    await renderer.compileAsync(scene, camera);
  } else {
    renderer.compile(scene, camera);
  }
}

/**
 * Touch devices, small screens and low core counts get a lighter 3D tier: lower pixel
 * ratio, no MSAA, a non-transmissive crystal and smaller textures.
 */
export function isLowPowerDevice(): boolean {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const smallScreen = Math.min(window.screen.width, window.screen.height) < 768;
  const fewCores = (navigator.hardwareConcurrency ?? 8) <= 4;
  return coarse || smallScreen || fewCores;
}
