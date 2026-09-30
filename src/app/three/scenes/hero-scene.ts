import * as THREE from 'three';
import { HandAngles } from '../../core/services/clock.service';
import { WatchAssets, WatchModel, WatchModelOptions } from '../objects/watch-model';
import { instantiateModel } from '../utils/assets';
import { createRadialTexture, loadStudioEnvironment } from '../utils/materials';
import { clampedPixelRatio, compileScene, isLowPowerDevice, isProduction, yieldToMain } from '../utils/webgl';

export interface HeroSceneOptions {
  /** `hero` places the watch to the right on wide screens; `center` keeps it centred. */
  readonly framing: 'hero' | 'center';
  readonly parallax: boolean;
  readonly reducedMotion: boolean;
  readonly model: WatchModelOptions;
  readonly maxPixelRatio?: number;
}

/** The Blender watch and movement, or null to fall back to the procedural watch. */
async function loadWatchAssets(): Promise<WatchAssets | null> {
  try {
    const [watch, movement] = await Promise.all([
      instantiateModel('watch'),
      instantiateModel('movement').catch(() => null),
    ]);
    return { watch, movement };
  } catch {
    return null;
  }
}

/** Vertical extent of the watch (straps included) in world units, with a little air. */
const WATCH_HEIGHT = 4.5;
/** Minimum horizontal room the case and crown need, in world units. */
const WATCH_WIDTH = 2.8;

/**
 * Studio stage for the procedural watch: dark environment reflections, a rim light that
 * sweeps across the case, a soft floor shadow, pointer parallax and a scroll-driven turn.
 * Runs a single requestAnimationFrame loop that can be paused when off-screen.
 */
export class HeroScene {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  private readonly rim: THREE.PointLight;
  private readonly key: THREE.SpotLight;
  private readonly shadow: THREE.Mesh;
  private readonly resizeObserver: ResizeObserver;

  private static readonly ORIGIN = new THREE.Vector2();
  private readonly pointer = new THREE.Vector2();
  private readonly tilt = new THREE.Vector2();
  private turnTarget = 0;
  private yawTarget = 0;
  private baseX = 0;
  private baseY = 0;
  private active = false;
  private elapsed = 0;
  private last = 0;
  private rendered = false;
  private warmed = false;
  private disposed = false;
  private readonly firstFrame: (() => void)[] = [];
  private reducedMotion: boolean;
  /** Free vertical band (px from the top of the stage) for the watch on portrait screens. */
  private band: { top: number; bottom: number } | null = null;

  /**
   * Builds the stage in separate tasks (renderer → environment → model → shader warm-up)
   * so no single step blocks the main thread for long.
   */
  static async create(canvas: HTMLCanvasElement, options: HeroSceneOptions): Promise<HeroScene> {
    const lite = isLowPowerDevice();
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !lite,
      alpha: true,
      powerPreference: lite ? 'default' : 'high-performance',
    });
    renderer.setPixelRatio(clampedPixelRatio(Math.min(options.maxPixelRatio ?? 2, lite ? 1.5 : 2)));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;
    // Shader validation is a development aid; skipping it avoids synchronous GPU queries.
    renderer.debug.checkShaderErrors = !isProduction();
    await yieldToMain();

    let environment: THREE.Texture | null = null;
    let watch: WatchModel | null = null;
    try {
      // Lighting (prefiltered in a worker) and the Blender models download in parallel.
      const [env, assets] = await Promise.all([loadStudioEnvironment(renderer), loadWatchAssets()]);
      environment = env;
      await yieldToMain();
      watch = new WatchModel({ ...options.model, lite }, assets);
      await yieldToMain();
      const scene = new HeroScene(canvas, options, renderer, environment, watch);
      await scene.warmUp();
      return scene;
    } catch (error) {
      watch?.dispose();
      environment?.dispose();
      renderer.dispose();
      throw error;
    }
  }

  private constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: HeroSceneOptions,
    private readonly renderer: THREE.WebGLRenderer,
    private readonly environment: THREE.Texture,
    readonly watch: WatchModel,
  ) {
    this.reducedMotion = options.reducedMotion;
    this.scene.environment = environment;
    this.scene.environmentIntensity = 1;

    this.key = new THREE.SpotLight('#fff3e2', 70, 40, 0.5, 0.9, 2);
    this.key.position.set(-4.5, 5.5, 7);
    this.rim = new THREE.PointLight('#ffd9a0', 36, 16, 2);
    this.rim.position.set(3.5, 2.5, -2);
    const fill = new THREE.DirectionalLight('#e6ebf2', 0.3);
    fill.position.set(3, -2, 4);
    this.scene.add(this.key, this.key.target, this.rim, fill);

    this.scene.add(watch.root);
    this.key.target = watch.root;

    const shadowTexture = createRadialTexture(256, 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0)');
    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, opacity: 0.75 }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.scale.set(4.2, 1.8, 1);
    this.scene.add(this.shadow);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement ?? canvas);
    this.resize();
  }

  /**
   * Compiles every shader program without blocking the main thread (where the
   * browser supports parallel shader compilation).
   */
  private async warmUp(): Promise<void> {
    await compileScene(this.renderer, this.scene, this.camera);
    // The sapphire's transmission pass renders opaque objects into an offscreen target,
    // which needs its own shader variants (linear output, no tone mapping). Warm those
    // too, so the first frame does not stall compiling them synchronously.
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    this.renderer.setRenderTarget(target);
    await compileScene(this.renderer, this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    target.dispose();
    this.warmed = true;
  }

  /** Starts or pauses the render loop (off-screen, hidden tab). */
  setActive(active: boolean): void {
    if (this.disposed || !this.warmed || active === this.active) return;
    this.active = active;
    if (active) {
      this.last = performance.now();
      this.renderer.setAnimationLoop((time) => this.frame(time));
    } else {
      this.renderer.setAnimationLoop(null);
    }
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  setTime(angles: HandAngles): void {
    this.watch.setTime(angles);
  }

  /** Normalised pointer in −1…1. */
  setPointer(x: number, y: number): void {
    this.pointer.set(x, y);
  }

  /** 0 = dial facing the viewer, 1 = caseback facing the viewer. */
  setTurn(progress: number): void {
    this.turnTarget = THREE.MathUtils.clamp(progress, 0, 1) * Math.PI;
  }

  /**
   * On portrait screens the copy sits below the watch. Frame the watch into the free band
   * between the navigation and the copy, whatever the device's proportions.
   */
  setPortraitBand(top: number, bottom: number): void {
    this.band = { top, bottom };
    this.resize();
  }

  /** Extra yaw in radians (drag-to-turn). */
  setYaw(radians: number): void {
    this.yawTarget = radians;
  }

  onFirstFrame(callback: () => void): void {
    if (this.rendered) callback();
    else this.firstFrame.push(callback);
  }

  /** Renders one frame immediately (used when the loop is paused but state changed). */
  renderOnce(): void {
    if (!this.disposed) this.frame(performance.now());
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.watch.dispose();
    (this.shadow.material as THREE.MeshBasicMaterial).map?.dispose();
    (this.shadow.material as THREE.Material).dispose();
    this.shadow.geometry.dispose();
    this.environment.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  private resize(): void {
    const host = this.canvas.parentElement ?? this.canvas;
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    const aspect = width / height;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = aspect;

    if (this.options.framing === 'hero') {
      const wide = aspect >= 1.05;
      this.baseX = wide ? Math.min(2.5, 0.55 + aspect * 1.0) : 0;
      if (wide) {
        this.baseY = -0.05;
        this.camera.position.set(0, 0, 9.6);
      } else {
        // Portrait: fit the watch into the free band above the copy.
        const band = this.band && this.band.bottom - this.band.top > 80 ? this.band : null;
        const bandTop = band?.top ?? height * 0.1;
        const bandBottom = band?.bottom ?? height * 0.42;
        const visibleHeight = Math.max((WATCH_HEIGHT * height) / (bandBottom - bandTop), WATCH_WIDTH / aspect);
        const centre = (bandTop + bandBottom) / 2 / height;
        this.baseY = (0.5 - centre) * visibleHeight;
        this.camera.position.set(0, 0, visibleHeight / (2 * Math.tan(THREE.MathUtils.degToRad(15))));
      }
    } else {
      this.baseX = 0;
      this.baseY = 0.1;
      this.camera.position.set(0, 0.2, aspect >= 1 ? 8.6 : 8.6 / Math.pow(aspect, 0.85));
    }
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    this.watch.root.position.set(this.baseX, this.baseY, 0);
    this.shadow.position.set(this.baseX, this.baseY - 2.35, -0.6);
    if (!this.active && this.warmed) this.renderOnce();
  }

  private frame(time: number): void {
    const dt = Math.min(0.05, Math.max(0, (time - this.last) / 1000));
    this.last = time;
    this.elapsed += dt;
    const t = this.elapsed;
    const reduced = this.reducedMotion;

    this.watch.update(dt, t);

    const ease = 1 - Math.exp(-dt * 4);
    if (this.options.parallax && !reduced) {
      this.tilt.lerp(this.pointer, ease);
    } else {
      this.tilt.lerp(HeroScene.ORIGIN, ease);
    }
    const root = this.watch.root;
    root.rotation.x = -this.tilt.y * 0.2;
    root.rotation.z = this.tilt.x * 0.04;
    root.position.y = this.baseY + (reduced ? 0 : Math.sin(t * 0.7) * 0.035);

    const turntable = this.watch.turntable;
    const yaw = this.turnTarget + this.yawTarget + this.tilt.x * 0.32;
    turntable.rotation.y += (yaw - turntable.rotation.y) * (1 - Math.exp(-dt * 6));

    if (!reduced) {
      const sweep = Math.sin(t * 0.45) * 1.3;
      this.rim.position.set(Math.sin(sweep) * 4.2 + this.baseX, 2.6, -1.6 + Math.cos(sweep) * 1.4);
      this.scene.environmentRotation.y = Math.sin(t * 0.22) * 0.55;
    }

    this.renderer.render(this.scene, this.camera);

    if (!this.rendered) {
      this.rendered = true;
      this.firstFrame.splice(0).forEach((cb) => cb());
    }
  }
}
