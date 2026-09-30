import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PartId } from '../../data/parts';
import { createBalanceWheel } from '../objects/balance-wheel';
import { CalibreRig, driveCalibre, rigFromModel } from '../objects/calibre';
import { createJewel, createWheel } from '../objects/gear';
import { createRotor } from '../objects/rotor';
import { createEscapeWheelGeometry, createGearGeometry } from '../utils/gear-geometry';
import {
  createPerlageTexture,
  createStripeTexture,
  disposeObject,
  loadStudioEnvironment,
} from '../utils/materials';
import { instantiateModel } from '../utils/assets';
import { clampedPixelRatio, compileScene, isLowPowerDevice, isProduction } from '../utils/webgl';

export interface HotspotScreen {
  readonly id: PartId;
  x: number;
  y: number;
  visible: boolean;
}

export interface MovementSceneOptions {
  readonly reducedMotion: boolean;
  /** Called every frame with the projected screen position of each part's hotspot. */
  readonly onFrame?: (hotspots: readonly HotspotScreen[]) => void;
}

interface PartEntry {
  readonly anchor: THREE.Object3D;
  readonly view: { readonly offset: THREE.Vector3Tuple; readonly distance: number };
}

interface TrackedMaterial {
  readonly material: THREE.MeshStandardMaterial;
  readonly part: PartId | null;
}

/** Camera fly-to presets per part. */
const VIEWS: Record<PartId, PartEntry['view']> = {
  barrel: { offset: [-0.6, 1.4, 1], distance: 3.2 },
  train: { offset: [1, 1.5, 0.9], distance: 3.4 },
  escapement: { offset: [0.5, 1.6, 0.4], distance: 2.4 },
  balance: { offset: [-0.8, 1.4, -0.2], distance: 2.6 },
  rotor: { offset: [0, 1.6, 1.4], distance: 5 },
};

/** Explode layers of the Blender calibre (bottom to top) and the part each one belongs to. */
const MODEL_LAYERS: readonly { readonly node: string; readonly part: PartId | null }[] = [
  { node: 'layer_plate', part: null },
  { node: 'layer_barrel', part: 'barrel' },
  { node: 'layer_train', part: 'train' },
  { node: 'layer_escapement', part: 'escapement' },
  { node: 'layer_balance', part: 'balance' },
  { node: 'layer_bridges', part: null },
  { node: 'layer_rotor', part: 'rotor' },
];

const MODULE = 0.016;
const LAYER_GAP = 0.62;
const HOME_POSITION = new THREE.Vector3(0.8, 7.6, 7.4);
const HOME_TARGET = new THREE.Vector3(0, 0.35, -0.2);

// Wheel positions (x, z) derived from centre distances so each wheel meshes its neighbour's pinion.
const POS = {
  center: new THREE.Vector2(0, 0),
  barrel: new THREE.Vector2(-0.748, 0.432),
  third: new THREE.Vector2(0.709, 0.125),
  fourth: new THREE.Vector2(0.942, -0.514),
  escape: new THREE.Vector2(0.353, -0.854),
  fork: new THREE.Vector2(-0.045, -1.084),
  balance: new THREE.Vector2(-0.521, -1.359),
};

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Interactive exploded view of the KALA Calibre K-03. */
export class MovementScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  private readonly controls: OrbitControls;
  private environment: THREE.Texture | null = null;
  private readonly resizeObserver: ResizeObserver;
  private readonly root = new THREE.Group();
  private readonly layers: { group: THREE.Object3D; base: number; index: number }[] = [];
  private readonly textures: THREE.Texture[] = [];
  private readonly parts = new Map<PartId, PartEntry>();
  private readonly materials: TrackedMaterial[] = [];
  private readonly hotspots: HotspotScreen[] = [];

  private rig: CalibreRig = { forkBase: 0 };

  private explodeTarget = 0;
  private explode = 0;
  private selected: PartId | null = null;
  private active = false;
  private warmed = false;
  private disposed = false;
  private elapsed = 0;
  private last = 0;
  private width = 1;
  private height = 1;
  private rotorAngle = 0;
  private cameraTween: {
    fromPos: THREE.Vector3;
    toPos: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
    t: number;
    duration: number;
  } | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: MovementSceneOptions,
  ) {
    const lite = isLowPowerDevice();
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !lite,
      alpha: true,
      powerPreference: lite ? 'default' : 'high-performance',
    });
    this.renderer.setPixelRatio(clampedPixelRatio(lite ? 1.5 : 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.debug.checkShaderErrors = !isProduction();

    this.scene.environmentIntensity = 1.9;

    const key = new THREE.DirectionalLight('#fff1dc', 3.4);
    key.position.set(-3, 6, 4);
    const rim = new THREE.DirectionalLight('#c9a96e', 1.4);
    rim.position.set(4, 2, -5);
    this.scene.add(key, rim, new THREE.HemisphereLight('#fff6e8', '#1a1a1c', 0.9));

    this.camera.position.copy(HOME_POSITION);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.copy(HOME_TARGET);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    // Wheel zoom would hijack page scrolling; zoom is offered through buttons instead.
    this.controls.enableZoom = false;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 15;
    this.controls.minPolarAngle = 0.15;
    this.controls.maxPolarAngle = 1.38;
    this.controls.rotateSpeed = 0.7;
    this.controls.touches = { ONE: null as unknown as THREE.TOUCH, TWO: THREE.TOUCH.DOLLY_ROTATE };
    this.controls.addEventListener('start', () => (this.cameraTween = null));
    canvas.style.touchAction = 'pan-y';

    this.root.rotation.y = -0.35;
    this.scene.add(this.root);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement ?? canvas);
    this.resize();
  }

  /**
   * Loads the studio environment and the Blender calibre (falling back to the procedural
   * one), then compiles shaders without blocking, all before the first frame.
   */
  async warmUp(): Promise<void> {
    const [environment, model] = await Promise.all([
      loadStudioEnvironment(this.renderer),
      instantiateModel('movement').catch(() => null),
    ]);
    this.environment = environment;
    if (this.disposed) {
      this.environment.dispose();
      return;
    }
    this.scene.environment = this.environment;
    this.rig = model ? this.adoptModel(model) : this.buildProcedural();
    await compileScene(this.renderer, this.scene, this.camera);
    this.warmed = true;
  }

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

  /** 0 = assembled, 1 = fully exploded. */
  setExplode(value: number): void {
    this.explodeTarget = THREE.MathUtils.clamp(value, 0, 1);
  }

  select(id: PartId | null): void {
    this.selected = id;
    if (!id) {
      this.flyTo(HOME_POSITION, HOME_TARGET);
      return;
    }
    const part = this.parts.get(id);
    if (!part) return;
    this.root.updateMatrixWorld(true);
    const target = part.anchor.getWorldPosition(new THREE.Vector3());
    const offset = new THREE.Vector3(...part.view.offset).normalize().multiplyScalar(part.view.distance);
    this.flyTo(target.clone().add(offset), target);
  }

  resetView(): void {
    this.select(null);
  }

  /** Moves the camera toward (negative) or away from (positive) the target. */
  zoom(step: number): void {
    const dir = this.camera.position.clone().sub(this.controls.target);
    const distance = THREE.MathUtils.clamp(dir.length() * (1 + step), this.controls.minDistance, this.controls.maxDistance);
    dir.setLength(distance);
    this.flyTo(this.controls.target.clone().add(dir), this.controls.target.clone(), 0.6);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    disposeObject(this.root);
    this.textures.forEach((t) => t.dispose());
    this.environment?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  private flyTo(position: THREE.Vector3, target: THREE.Vector3, duration = 1.2): void {
    if (this.options.reducedMotion) {
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.controls.update();
      return;
    }
    this.cameraTween = {
      fromPos: this.camera.position.clone(),
      toPos: position.clone(),
      fromTarget: this.controls.target.clone(),
      toTarget: target.clone(),
      t: 0,
      duration,
    };
  }

  private resize(): void {
    const host = this.canvas.parentElement ?? this.canvas;
    this.width = Math.max(1, host.clientWidth);
    this.height = Math.max(1, host.clientHeight);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    const portrait = this.camera.aspect < 1;
    this.camera.fov = portrait ? 37 : 32;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Adopts the Blender calibre: layer nodes drive the explode, anchor nodes the hotspots,
   * and every material is cloned per part so a selection can glow while the rest dims.
   */
  private adoptModel(model: THREE.Object3D): CalibreRig {
    const perlage = createPerlageTexture(1024, 30);
    const stripes = createStripeTexture(512, 12);
    this.textures.push(perlage, stripes);
    const clones = new Map<string, THREE.MeshStandardMaterial>();

    MODEL_LAYERS.forEach(({ node, part }, index) => {
      const layer = model.getObjectByName(node);
      if (!layer) return;
      this.layers.push({ group: layer, base: layer.position.y, index });
      layer.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        const source = mesh.material as THREE.MeshStandardMaterial;
        const key = `${part}:${source.uuid}`;
        let material = clones.get(key);
        if (!material) {
          material = source.clone();
          if (source.name === 'mv_plate') material.map = perlage;
          if (source.name === 'mv_bridge' || source.name === 'mv_rotor') material.map = stripes;
          clones.set(key, material);
          this.materials.push({ material, part });
        }
        mesh.material = material;
      });
    });

    for (const id of Object.keys(VIEWS) as PartId[]) {
      const anchor = model.getObjectByName(`anchor_${id}`);
      if (!anchor) continue;
      this.parts.set(id, { anchor, view: VIEWS[id] });
      this.hotspots.push({ id, x: 0, y: 0, visible: false });
    }
    this.root.add(model);
    return rigFromModel(model);
  }

  private material(part: PartId | null, params: THREE.MeshPhysicalMaterialParameters): THREE.MeshPhysicalMaterial {
    const material = new THREE.MeshPhysicalMaterial({ metalness: 0.9, roughness: 0.28, ...params });
    this.materials.push({ material, part });
    return material;
  }

  private layer(index: number, base: number): THREE.Group {
    const group = new THREE.Group();
    group.position.y = base;
    this.layers.push({ group, base, index });
    this.root.add(group);
    return group;
  }

  private addPart(id: PartId, layer: THREE.Group, anchor: THREE.Vector3Tuple, view: PartEntry['view']): void {
    const a = new THREE.Object3D();
    a.position.set(...anchor);
    layer.add(a);
    this.parts.set(id, { anchor: a, view });
    this.hotspots.push({ id, x: 0, y: 0, visible: false });
  }

  /** Procedural fallback calibre, generated in code. */
  private buildProcedural(): CalibreRig {
    const perlage = createPerlageTexture(1024, 30);
    const stripes = createStripeTexture(512, 12);
    this.textures.push(perlage, stripes);

    // Layer 0: mainplate.
    const plateLayer = this.layer(0, 0);
    const plateTop = this.material(null, { color: '#c6cace', roughness: 0.4, map: perlage });
    const plateSide = this.material(null, { color: '#b7bcc2', roughness: 0.3 });
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.14, 160), [plateSide, plateTop, plateSide]);
    plate.position.y = -0.07;
    plateLayer.add(plate);
    const chaton = this.material(null, { color: '#d9c38f', roughness: 0.2 });
    const rubyPlate = this.material(null, { color: '#b3122a', metalness: 0, roughness: 0.1, clearcoat: 1 });
    for (const p of [POS.center, POS.third, POS.fourth, POS.escape, POS.fork, POS.balance, POS.barrel]) {
      const jewel = createJewel(0.045, rubyPlate, chaton);
      jewel.position.set(p.x, 0, p.y);
      plateLayer.add(jewel);
    }

    // Layer 1: mainspring barrel.
    const barrelLayer = this.layer(1, 0.14);
    const barrelGold = this.material('barrel', { color: '#d9b77a', roughness: 0.25 });
    const barrelSteel = this.material('barrel', { color: '#cfd3d8', roughness: 0.22 });
    const blued = this.material('barrel', { color: '#27468f', roughness: 0.25 });
    const barrel = new THREE.Group();
    barrel.position.set(POS.barrel.x, 0, POS.barrel.y);
    const barrelTeeth = new THREE.Mesh(createGearGeometry({ teeth: 96, module: MODULE, thickness: 0.05, spokes: 0 }), barrelGold);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.2, 96, 1, true), barrelGold);
    drum.position.y = 0.12;
    const lid = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.7, 96), barrelSteel);
    lid.rotation.x = -Math.PI / 2;
    lid.position.y = 0.22;
    const springPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 400; i++) {
      const t = i / 400;
      const a = t * Math.PI * 2 * 7;
      const r = 0.12 + t * 0.52;
      springPoints.push(new THREE.Vector3(Math.cos(a) * r, 0.12, Math.sin(a) * r));
    }
    const mainspring = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(springPoints), 400, 0.012, 5),
      blued,
    );
    const ratchet = new THREE.Mesh(createGearGeometry({ teeth: 40, module: 0.012, thickness: 0.04, spokes: 0 }), barrelSteel);
    ratchet.position.y = 0.25;
    const arbor = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.34, 24), barrelSteel);
    arbor.position.y = 0.14;
    barrel.add(barrelTeeth, drum, lid, mainspring, ratchet, arbor);
    barrelLayer.add(barrel);
    this.addPart('barrel', barrelLayer, [POS.barrel.x, 0.34, POS.barrel.y], VIEWS.barrel);

    // Layer 2: gear train (centre, third and fourth wheels).
    const trainLayer = this.layer(2, 0.2);
    const trainGold = this.material('train', { color: '#dcbc80', roughness: 0.22 });
    const trainSteel = this.material('train', { color: '#d2d6db', roughness: 0.2 });
    const center = createWheel({ teeth: 80, module: MODULE, thickness: 0.035, spokes: 5, pinionTeeth: 12, pinionHeight: 0.16, pinionOffset: -0.1 }, trainGold, trainSteel);
    center.group.position.set(POS.center.x, 0, POS.center.y);
    const third = createWheel({ teeth: 75, module: MODULE, thickness: 0.035, spokes: 5, pinionTeeth: 10, pinionHeight: 0.14, pinionOffset: -0.06 }, trainGold, trainSteel);
    third.group.position.set(POS.third.x, 0.06, POS.third.y);
    const fourth = createWheel({ teeth: 80, module: MODULE, thickness: 0.035, spokes: 4, pinionTeeth: 10, pinionHeight: 0.14, pinionOffset: -0.06 }, trainGold, trainSteel);
    fourth.group.position.set(POS.fourth.x, 0.12, POS.fourth.y);
    trainLayer.add(center.group, third.group, fourth.group);
    this.addPart('train', trainLayer, [POS.third.x, 0.26, POS.third.y], VIEWS.train);

    // Layer 3: escapement (escape wheel + pallet fork).
    const escLayer = this.layer(3, 0.3);
    const escSteel = this.material('escapement', { color: '#e3e6ea', roughness: 0.16 });
    const ruby = this.material('escapement', { color: '#c0162e', metalness: 0, roughness: 0.08, clearcoat: 1 });
    const escape = new THREE.Group();
    escape.position.set(POS.escape.x, 0, POS.escape.y);
    const escWheel = new THREE.Mesh(createEscapeWheelGeometry(15, 0.3, 0.03), escSteel);
    const escPinion = new THREE.Mesh(createGearGeometry({ teeth: 7, module: MODULE, thickness: 0.14, spokes: 0 }), escSteel);
    escPinion.position.y = -0.08;
    escape.add(escWheel, escPinion);

    const fork = new THREE.Group();
    fork.position.set(POS.fork.x, 0.03, POS.fork.y);
    const dir = POS.escape.clone().sub(POS.fork);
    const forkBase = -Math.atan2(dir.y, dir.x);
    fork.rotation.y = forkBase;
    const forkShape = new THREE.Shape();
    forkShape.moveTo(-0.58, 0.07);
    forkShape.lineTo(-0.5, 0.03);
    forkShape.lineTo(0.02, 0.03);
    forkShape.lineTo(0.2, 0.2);
    forkShape.lineTo(0.27, 0.16);
    forkShape.lineTo(0.09, 0);
    forkShape.lineTo(0.27, -0.16);
    forkShape.lineTo(0.2, -0.2);
    forkShape.lineTo(0.02, -0.03);
    forkShape.lineTo(-0.5, -0.03);
    forkShape.lineTo(-0.58, -0.07);
    forkShape.lineTo(-0.6, -0.035);
    forkShape.lineTo(-0.54, 0);
    forkShape.lineTo(-0.6, 0.035);
    forkShape.closePath();
    const forkGeo = new THREE.ExtrudeGeometry(forkShape, { depth: 0.03, bevelEnabled: false });
    forkGeo.rotateX(-Math.PI / 2);
    const forkMesh = new THREE.Mesh(forkGeo, escSteel);
    const stoneGeo = new THREE.BoxGeometry(0.03, 0.05, 0.07);
    for (const sy of [1, -1]) {
      const stone = new THREE.Mesh(stoneGeo, ruby);
      stone.position.set(0.25, 0.02, -sy * 0.19);
      fork.add(stone);
    }
    const forkArbor = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 12), escSteel);
    fork.add(forkMesh, forkArbor);
    escLayer.add(escape, fork);
    this.addPart('escapement', escLayer, [POS.escape.x, 0.18, POS.escape.y], VIEWS.escapement);

    // Layer 4: balance wheel and hairspring.
    const balanceLayer = this.layer(4, 0.42);
    const balanceGold = this.material('balance', { color: '#e0c285', roughness: 0.2 });
    const balanceSpring = this.material('balance', { color: '#2a4b98', roughness: 0.25 });
    const balance = createBalanceWheel(0.5, balanceGold, balanceGold, balanceSpring);
    balance.group.position.set(POS.balance.x, 0, POS.balance.y);
    balanceLayer.add(balance.group);
    this.addPart('balance', balanceLayer, [POS.balance.x, 0.22, POS.balance.y], VIEWS.balance);

    // Layer 5: bridges with Côtes de Genève (not selectable).
    const bridgeLayer = this.layer(5, 0.62);
    const bridgeMat = this.material(null, { color: '#e2e5e9', roughness: 0.24, map: stripes, clearcoat: 0.3 });
    const bridgeScrew = this.material(null, { color: '#27468f', roughness: 0.25 });
    const bridgeJewel = this.material(null, { color: '#b3122a', metalness: 0, roughness: 0.1, clearcoat: 1 });
    const bridgeChaton = this.material(null, { color: '#d9c38f', roughness: 0.2 });
    const extrudeBridge = (shape: THREE.Shape) => {
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.015, bevelSegments: 2, curveSegments: 24 });
      geo.rotateX(Math.PI / 2);
      geo.translate(0, 0.07, 0);
      return new THREE.Mesh(geo, bridgeMat);
    };
    // Shapes are drawn in (x, z) because the Y rotation above maps shape Y to world +Z.
    const trainBridge = new THREE.Shape();
    trainBridge.moveTo(-0.2, 0.35);
    trainBridge.quadraticCurveTo(0.6, 0.55, 1.25, 0.1);
    trainBridge.quadraticCurveTo(1.45, -0.4, 1.1, -0.85);
    trainBridge.lineTo(0.85, -0.7);
    trainBridge.quadraticCurveTo(1.05, -0.35, 0.85, 0.02);
    trainBridge.quadraticCurveTo(0.45, 0.25, -0.1, 0.12);
    trainBridge.closePath();
    const barrelBridge = new THREE.Shape();
    barrelBridge.absarc(POS.barrel.x, POS.barrel.y, 0.5, 0, Math.PI * 2, false);
    const cock = new THREE.Shape();
    cock.moveTo(-1.55, -1.45);
    cock.quadraticCurveTo(-1.1, -1.25, -0.56, -1.36);
    cock.lineTo(-0.5, -1.25);
    cock.quadraticCurveTo(-1.1, -1.05, -1.6, -1.25);
    cock.closePath();
    const bridges = [extrudeBridge(trainBridge), extrudeBridge(barrelBridge), extrudeBridge(cock)];
    bridges.forEach((b) => bridgeLayer.add(b));
    for (const p of [POS.center, POS.third, POS.fourth, POS.barrel, POS.balance]) {
      const jewel = createJewel(0.04, bridgeJewel, bridgeChaton);
      jewel.position.set(p.x, 0.075, p.y);
      bridgeLayer.add(jewel);
    }
    for (const [x, z] of [
      [-0.05, 0.28],
      [1.2, -0.3],
      [-1.4, -1.3],
      [POS.barrel.x + 0.34, POS.barrel.y - 0.28],
    ] as const) {
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 24), bridgeScrew);
      screw.position.set(x, 0.09, z);
      bridgeLayer.add(screw);
    }

    // Layer 6: winding rotor.
    const rotorLayer = this.layer(6, 0.88);
    const rotorPlate = this.material('rotor', { color: '#e4e6ea', roughness: 0.22, map: stripes, clearcoat: 0.4 });
    const rotorGold = this.material('rotor', { color: '#e0bd7c', roughness: 0.18 });
    const rotor = createRotor(2.1, 0.05, rotorPlate, rotorGold);
    rotorLayer.add(rotor);
    this.addPart('rotor', rotorLayer, [0, 0.16, 1.45], VIEWS.rotor);

    return {
      barrel,
      center: center.group,
      third: third.group,
      fourth: fourth.group,
      escape,
      fork,
      forkBase,
      balance: balance.wheel,
      hairspring: balance.spring,
      rotor,
    };
  }

  private frame(time: number): void {
    const dt = Math.min(0.05, Math.max(0, (time - this.last) / 1000));
    this.last = time;
    this.elapsed += dt;
    const t = this.elapsed;

    // Kinematics: everything derives from the escapement's beat for true relative speeds.
    this.rotorAngle += dt * (this.options.reducedMotion ? 0 : 0.35);
    driveCalibre(this.rig, t, this.rotorAngle);

    // Explode layers.
    this.explode += (this.explodeTarget - this.explode) * (1 - Math.exp(-dt * 6));
    for (const layer of this.layers) {
      layer.group.position.y = layer.base + layer.index * LAYER_GAP * this.explode;
    }

    // Highlight the selected part: gold emissive pulse; dim everything else.
    const pulse = 0.22 + Math.sin(t * 4) * 0.12;
    const k = 1 - Math.exp(-dt * 8);
    for (const { material, part } of this.materials) {
      const isSelected = this.selected !== null && part === this.selected;
      const targetOpacity = this.selected === null || isSelected ? 1 : 0.16;
      material.opacity += (targetOpacity - material.opacity) * k;
      if (Math.abs(material.opacity - targetOpacity) < 0.002) material.opacity = targetOpacity;
      const transparent = material.opacity < 0.999;
      if (transparent !== material.transparent) {
        material.transparent = transparent;
        material.needsUpdate = true;
      }
      material.depthWrite = material.opacity > 0.6;
      material.emissive.set(isSelected ? '#c9a96e' : '#000000');
      material.emissiveIntensity = isSelected ? pulse : 0;
    }

    // Camera fly-to.
    if (this.cameraTween) {
      const tween = this.cameraTween;
      tween.t += dt / tween.duration;
      const p = easeInOutCubic(Math.min(1, tween.t));
      this.camera.position.lerpVectors(tween.fromPos, tween.toPos, p);
      this.controls.target.lerpVectors(tween.fromTarget, tween.toTarget, p);
      if (tween.t >= 1) this.cameraTween = null;
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    // Project hotspots to screen space.
    const v = new THREE.Vector3();
    for (const spot of this.hotspots) {
      const part = this.parts.get(spot.id);
      if (!part) continue;
      part.anchor.getWorldPosition(v).project(this.camera);
      spot.x = (v.x * 0.5 + 0.5) * this.width;
      spot.y = (-v.y * 0.5 + 0.5) * this.height;
      spot.visible = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
    }
    this.options.onFrame?.(this.hotspots);
  }
}

