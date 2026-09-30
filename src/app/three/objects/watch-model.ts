import * as THREE from 'three';
import { HandAngles } from '../../core/services/clock.service';
import { CaseId, DialId, ModelId, StrapId } from '../../data/configurator-options';
import { EngravingTexture } from '../utils/engraving-texture';
import { createEscapeWheelGeometry } from '../utils/gear-geometry';
import {
  CASE_FINISHES,
  canvas,
  createMeteoriteTexture,
  createMetal,
  createPerlageTexture,
  createRadialTexture,
  createStripeTexture,
  createSunburstTexture,
  dialColor,
  disposeObject,
} from '../utils/materials';
import { createBalanceWheel } from './balance-wheel';
import { CalibreRig, driveCalibre, rigFromModel } from './calibre';
import { buildDial, Dial } from './dial';
import { createJewel, createWheel } from './gear';
import { buildHands } from './hands';
import { createRotor } from './rotor';
import { buildStraps } from './strap';
import { buildWatchCase, CASE } from './watch-case';

export interface WatchModelOptions {
  readonly variant: ModelId;
  readonly caseMaterial: CaseId;
  readonly dial: DialId;
  readonly strap: StrapId;
  readonly engraving?: string;
  readonly serial?: string;
  /** Lighter tier for phones: non-transmissive crystal and smaller textures. */
  readonly lite?: boolean;
}

/** Models built in Blender. When absent, the watch is built procedurally instead. */
export interface WatchAssets {
  readonly watch: THREE.Object3D;
  readonly movement: THREE.Object3D | null;
}

/** Everything the model animates or toggles, whichever way it was built. */
interface WatchParts {
  readonly crown: THREE.Object3D;
  readonly pushers: THREE.Object3D;
  readonly diverParts: readonly THREE.Object3D[];
  readonly dressParts: readonly THREE.Object3D[];
  readonly chronoParts: readonly THREE.Object3D[];
  readonly plainDialParts: readonly THREE.Object3D[];
  readonly bezelTicks: THREE.InstancedMesh;
  readonly hour: THREE.Object3D;
  readonly minute: THREE.Object3D;
  readonly second: THREE.Object3D;
  readonly subSeconds: THREE.Object3D;
  readonly straps: Record<StrapId, THREE.Object3D>;
  /** Ticks sit on the modelled bezel's slope rather than a flat procedural top. */
  readonly modelledBezel: boolean;
}

interface SharedMaterials {
  readonly insert: THREE.MeshPhysicalMaterial;
  readonly gold: THREE.MeshPhysicalMaterial;
  readonly lume: THREE.MeshStandardMaterial;
  readonly crystal: THREE.MeshPhysicalMaterial;
  readonly casebackGlass: THREE.MeshPhysicalMaterial;
}

const VARIANT_SCALE: Record<ModelId, number> = { dress: 0.95, diver: 1.03, chronograph: 1 };
const WIND_DURATION = 2.6;
const WIND_SPIN_SECONDS = 5400;
const SPARKS = 90;
/** The Blender movement is 2.3 units across; behind the caseback it is shrunk and flattened. */
const CASEBACK_MOVEMENT_SCALE = new THREE.Vector3(0.36, 0.2, 0.36);

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * The KALA watch: case, bezel, crown, sapphire crystal, dial, hands, straps and a beating
 * movement behind an exhibition caseback. Shared by the hero and the configurator. Uses the
 * Blender models when provided and falls back to procedural geometry otherwise.
 */
export class WatchModel {
  /** Outer group: position and pointer tilt. */
  readonly root = new THREE.Group();
  /** Inner group: yaw (turning to the caseback). */
  readonly turntable = new THREE.Group();
  private readonly body = new THREE.Group();

  private readonly polished: THREE.MeshPhysicalMaterial;
  private readonly brushed: THREE.MeshPhysicalMaterial;
  private readonly casebackMat: THREE.MeshPhysicalMaterial;
  private readonly dialMat: THREE.MeshPhysicalMaterial;
  private readonly subdialMat: THREE.MeshPhysicalMaterial;
  private readonly tickMat: THREE.MeshStandardMaterial;
  private readonly sunburst: THREE.CanvasTexture;
  private meteoriteTexture: THREE.CanvasTexture | null = null;
  private readonly insertTexture: THREE.CanvasTexture;
  private readonly movementTextures: THREE.Texture[] = [];
  private readonly engraving: EngravingTexture;

  private readonly parts: WatchParts;
  private readonly dial: Dial;
  private readonly calibre: CalibreRig;
  private readonly sparks: THREE.Points;
  private readonly sparkVelocities = new Float32Array(SPARKS * 3);
  private readonly sparkMaterial: THREE.PointsMaterial;

  private variant: ModelId;
  private serial: string;
  private engravingText = '';

  private readonly targetCase = new THREE.Color();
  private targetRoughness = 0.2;
  private readonly targetDial = new THREE.Color();
  private readonly targetSubdial = new THREE.Color();

  private readonly targetAngles = { hours: 0, minutes: 0, seconds: 0 };
  private readonly shownAngles = { hours: 0, minutes: 0, seconds: 0 };
  private hasTime = false;

  private dialDarkInk = false;
  private windElapsed = -1;
  private sparkElapsed = -1;
  private rotorAngle = 0;

  constructor(options: WatchModelOptions, assets: WatchAssets | null = null) {
    this.variant = options.variant;
    this.serial = options.serial ?? 'KALA-03-077/088';

    const finish = CASE_FINISHES[options.caseMaterial];
    this.polished = createMetal(finish);
    this.polished.side = THREE.DoubleSide;
    this.brushed = createMetal(finish, 0.18);
    this.brushed.side = THREE.DoubleSide;
    this.targetCase.set(finish.color);
    this.targetRoughness = finish.roughness;

    this.engraving = new EngravingTexture();
    this.casebackMat = new THREE.MeshPhysicalMaterial({
      color: finish.color,
      metalness: 1,
      roughness: 0.3,
      map: this.engraving.texture,
      bumpMap: this.engraving.texture,
      bumpScale: 1.2,
      clearcoat: 0.2,
    });

    this.sunburst = createSunburstTexture(options.lite ? 512 : 1024);
    this.targetDial.set(dialColor(options.dial));
    this.targetSubdial.copy(this.targetDial).multiplyScalar(0.55);
    this.dialMat = new THREE.MeshPhysicalMaterial({
      color: this.targetDial,
      map: options.dial === 'meteorite' ? this.meteorite() : this.sunburst,
      metalness: 0.45,
      roughness: 0.34,
      clearcoat: 0.8,
      clearcoatRoughness: 0.08,
    });
    this.subdialMat = new THREE.MeshPhysicalMaterial({
      color: this.targetSubdial,
      metalness: 0.3,
      roughness: 0.5,
      clearcoat: 0.5,
    });
    this.tickMat = new THREE.MeshStandardMaterial({ color: '#2d2e31', metalness: 0.4, roughness: 0.4 });
    this.insertTexture = this.createInsertTexture();

    const shared: SharedMaterials = {
      insert: new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        map: this.insertTexture,
        roughness: 0.22,
        metalness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
      }),
      gold: createMetal({ color: '#d8b67a', roughness: 0.22, clearcoat: 0.3 }),
      lume: new THREE.MeshStandardMaterial({
        color: '#e8efe2',
        emissive: '#b8e6c2',
        emissiveIntensity: 0.18,
        roughness: 0.6,
      }),
      crystal: this.createCrystal(!!options.lite),
      casebackGlass: new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0,
        roughness: 0.04,
        transparent: true,
        opacity: 0.16,
        clearcoat: 1,
        envMapIntensity: 1.8,
        depthWrite: false,
      }),
    };

    const dialMaterials = {
      dial: this.dialMat,
      subdial: this.subdialMat,
      indices: this.polished,
      lume: shared.lume,
      accent: shared.gold,
    };

    if (assets) {
      this.parts = this.adoptModel(assets.watch, shared);
      this.dial = buildDial(dialMaterials, true, !options.lite);
      this.calibre = assets.movement ? this.adoptMovement(assets.movement) : this.buildMiniMovement(shared.gold);
    } else {
      const built = this.buildProcedural(shared);
      this.dial = buildDial(dialMaterials, false, !options.lite);
      this.parts = {
        ...built,
        chronoParts: [this.dial.subdials],
        subSeconds: this.dial.subSeconds,
      };
      this.calibre = this.buildMiniMovement(shared.gold);
    }
    this.body.add(this.dial.group);

    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(SPARKS * 3), 3));
    this.sparkMaterial = new THREE.PointsMaterial({
      size: 0.07,
      map: createRadialTexture(64, 'rgba(255,236,190,1)', 'rgba(201,169,110,0)'),
      color: '#f1d9a0',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.sparks = new THREE.Points(sparkGeo, this.sparkMaterial);
    this.sparks.visible = false;

    this.turntable.add(this.body, this.sparks);
    this.root.add(this.turntable);

    this.dialDarkInk = options.dial === 'salmon';
    this.setVariant(options.variant);
    this.setStrap(options.strap);
    this.setEngraving(options.engraving ?? '');
  }

  setVariant(variant: ModelId): void {
    this.variant = variant;
    const chrono = variant === 'chronograph';
    const diver = variant === 'diver';
    const p = this.parts;
    p.pushers.visible = chrono;
    p.diverParts.forEach((o) => (o.visible = diver));
    p.dressParts.forEach((o) => (o.visible = !diver));
    p.chronoParts.forEach((o) => (o.visible = chrono));
    p.plainDialParts.forEach((o) => (o.visible = !chrono));
    this.tickMat.color.set(diver ? '#ece7da' : '#2d2e31');
    this.tickMat.emissive.set(diver ? '#3a3a36' : '#000000');
    this.layoutBezelTicks(diver);
    this.body.scale.setScalar(VARIANT_SCALE[variant]);
    this.redrawDialPrint();
  }

  setCase(id: CaseId, immediate = false): void {
    const finish = CASE_FINISHES[id];
    this.targetCase.set(finish.color);
    this.targetRoughness = finish.roughness;
    if (immediate) this.applyCase(1);
  }

  setDial(id: DialId, immediate = false): void {
    this.targetDial.set(dialColor(id));
    this.targetSubdial.copy(this.targetDial).multiplyScalar(0.55);
    const map = id === 'meteorite' ? this.meteorite() : this.sunburst;
    if (this.dialMat.map !== map) {
      this.dialMat.map = map;
      this.dialMat.needsUpdate = true;
    }
    this.dialDarkInk = id === 'salmon';
    this.redrawDialPrint();
    if (immediate) this.applyDial(1);
  }

  setStrap(id: StrapId): void {
    for (const [key, strap] of Object.entries(this.parts.straps)) strap.visible = key === id;
  }

  setEngraving(text: string): void {
    this.engravingText = text;
    this.engraving.draw(text, this.serial);
  }

  setSerial(serial: string): void {
    this.serial = serial;
    this.engraving.draw(this.engravingText, serial);
  }

  /** Continuous clockwise hand angles in degrees (see ClockService.continuousAngles). */
  setTime(angles: HandAngles): void {
    this.targetAngles.hours = angles.hours;
    this.targetAngles.minutes = angles.minutes;
    this.targetAngles.seconds = angles.seconds;
    if (!this.hasTime) {
      Object.assign(this.shownAngles, this.targetAngles);
      this.hasTime = true;
    }
  }

  /** Crown turns, hands spin forward to the current time and gold sparks burst once. */
  wind(): void {
    this.windElapsed = 0;
    this.sparkElapsed = 0;
    this.resetSparks();
  }

  update(dt: number, elapsed: number): void {
    const k = 1 - Math.exp(-dt * 5);
    this.applyCase(k);
    this.applyDial(k);

    // Hands: the second hand snaps to each new second; the others follow smoothly.
    let spin = 0;
    if (this.windElapsed >= 0) {
      this.windElapsed += dt;
      const p = Math.min(1, this.windElapsed / WIND_DURATION);
      spin = WIND_SPIN_SECONDS * (1 - easeOutExpo(p));
      this.parts.crown.rotation.x = easeOutCubic(p) * Math.PI * 10;
      if (p >= 1) this.windElapsed = -1;
    }
    const snap = 1 - Math.exp(-dt * 30);
    this.shownAngles.seconds += (this.targetAngles.seconds - this.shownAngles.seconds) * snap;
    this.shownAngles.minutes += (this.targetAngles.minutes - this.shownAngles.minutes) * snap;
    this.shownAngles.hours += (this.targetAngles.hours - this.shownAngles.hours) * snap;
    const toRad = THREE.MathUtils.degToRad;
    this.parts.hour.rotation.z = -toRad(this.shownAngles.hours - spin / 120);
    this.parts.minute.rotation.z = -toRad(this.shownAngles.minutes - spin / 10);
    this.parts.second.rotation.z = -toRad(this.shownAngles.seconds - (spin / WIND_SPIN_SECONDS) * 1080);
    this.parts.subSeconds.rotation.z = -toRad(this.shownAngles.seconds);

    // Movement behind the caseback: 4 Hz balance, stepping escapement, slow rotor.
    this.rotorAngle += dt * 0.45;
    driveCalibre(this.calibre, elapsed, this.rotorAngle, THREE.MathUtils.degToRad(200));

    this.updateSparks(dt);
  }

  dispose(): void {
    this.dial.dispose();
    this.engraving.dispose();
    this.sunburst.dispose();
    this.meteoriteTexture?.dispose();
    this.insertTexture.dispose();
    this.movementTextures.forEach((t) => t.dispose());
    disposeObject(this.root);
  }

  /**
   * Adopts the Blender watch: swaps its placeholder materials for the live ones (so case,
   * dial and engraving keep responding to the configurator) and maps its named parts.
   */
  private adoptModel(model: THREE.Object3D, shared: SharedMaterials): WatchParts {
    const live: Record<string, THREE.Material> = {
      case_polished: this.polished,
      case_brushed: this.brushed,
      caseback: this.casebackMat,
      dial: this.dialMat,
      subdial: this.subdialMat,
      insert: shared.insert,
      lume: shared.lume,
      gold_accent: shared.gold,
      crystal: shared.crystal,
      caseback_glass: shared.casebackGlass,
    };
    model.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      const source = mesh.material as THREE.Material;
      const replacement = live[source.name];
      if (replacement) {
        source.dispose();
        mesh.material = replacement;
      }
      if (source.name === 'crystal' || source.name === 'caseback_glass') mesh.renderOrder = 2;
      // Moulded FKM rubber is matte; keep its grooves from reading as polished metal.
      if (source.name === 'rubber') {
        const rubber = source as THREE.MeshStandardMaterial;
        rubber.roughness = 0.86;
        rubber.color.set('#0c0d0f');
        rubber.envMapIntensity = 0.5;
      }
    });

    // The modelled caseback ring is UV-mapped from the front, so turn this watch's own
    // engraving texture half a turn to read upright from the back. (Geometry is shared
    // between the hero and configurator copies, so it must not be edited.)
    const engraving = this.engraving.texture;
    engraving.center.set(0.5, 0.5);
    engraving.rotation = Math.PI;

    const get = (name: string): THREE.Object3D => model.getObjectByName(name) ?? new THREE.Group();
    const subMinutes = get('sub_hand_minutes');
    subMinutes.rotation.z = -2.1;

    const bezelTicks = this.createBezelTicks();
    this.body.add(model, bezelTicks);

    return {
      crown: get('crown'),
      pushers: get('pushers'),
      diverParts: [get('bezel_diver'), get('bezel_insert')],
      dressParts: [get('bezel_polished')],
      chronoParts: [get('dial_chrono'), get('subdials'), get('sub_hand_seconds'), subMinutes],
      plainDialParts: [get('dial')],
      bezelTicks,
      hour: get('hand_hour'),
      minute: get('hand_minute'),
      second: get('hand_second'),
      subSeconds: get('sub_hand_seconds'),
      straps: { leather: get('strap_leather'), rubber: get('strap_rubber'), bracelet: get('strap_bracelet') },
      modelledBezel: true,
    };
  }

  /** The Blender movement, shrunk behind the sapphire caseback and facing it. */
  private adoptMovement(movement: THREE.Object3D): CalibreRig {
    const perlage = createPerlageTexture(512, 22);
    const stripes = createStripeTexture(512, 10);
    this.movementTextures.push(perlage, stripes);
    movement.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (material.name === 'mv_plate') material.map = perlage;
      if (material.name === 'mv_bridge' || material.name === 'mv_rotor') material.map = stripes;
      material.needsUpdate = true;
    });
    movement.scale.copy(CASEBACK_MOVEMENT_SCALE);
    movement.rotation.x = -Math.PI / 2;
    movement.position.z = 0.02;
    this.body.add(movement);
    return rigFromModel(movement);
  }

  /** Procedural fallback: case, hands and straps generated in code. */
  private buildProcedural(shared: SharedMaterials): Omit<WatchParts, 'chronoParts' | 'subSeconds'> {
    const watchCase = buildWatchCase({
      polished: this.polished,
      brushed: this.brushed,
      ticks: this.tickMat,
      insert: shared.insert,
      crystal: shared.crystal,
      casebackGlass: shared.casebackGlass,
      caseback: this.casebackMat,
      gold: shared.gold,
    });
    const hands = buildHands({ metal: this.polished, lume: shared.lume, accent: shared.gold });
    const straps = buildStraps({
      leather: new THREE.MeshStandardMaterial({ color: '#4a2f22', roughness: 0.72, side: THREE.DoubleSide }),
      stitch: new THREE.MeshStandardMaterial({ color: '#d8c6a4', roughness: 0.85 }),
      rubber: new THREE.MeshStandardMaterial({ color: '#141516', roughness: 0.55, side: THREE.DoubleSide }),
      rubberGroove: new THREE.MeshStandardMaterial({ color: '#070708', roughness: 0.85 }),
      braceletPolished: this.polished,
      braceletBrushed: this.brushed,
    });
    this.body.add(watchCase.group, hands.group, straps.leather, straps.rubber, straps.bracelet);
    return {
      crown: watchCase.crown,
      pushers: watchCase.pushers,
      diverParts: [watchCase.diverInsert],
      dressParts: [],
      plainDialParts: [],
      bezelTicks: watchCase.bezelTicks,
      hour: hands.hour,
      minute: hands.minute,
      second: hands.second,
      straps,
      modelledBezel: false,
    };
  }

  private createCrystal(lite: boolean): THREE.MeshPhysicalMaterial {
    // Transmission needs an extra render pass; phones get a reflective glass instead.
    return lite
      ? new THREE.MeshPhysicalMaterial({
          color: '#ffffff',
          metalness: 0,
          roughness: 0.03,
          transparent: true,
          opacity: 0.12,
          clearcoat: 1,
          clearcoatRoughness: 0.02,
          envMapIntensity: 1.6,
          depthWrite: false,
        })
      : new THREE.MeshPhysicalMaterial({
          color: '#ffffff',
          metalness: 0,
          roughness: 0.02,
          transmission: 1,
          thickness: 0.05,
          ior: 1.77,
          clearcoat: 1,
          clearcoatRoughness: 0.02,
          envMapIntensity: 1.4,
          attenuationColor: new THREE.Color('#eaf5ff'),
          attenuationDistance: 2,
        });
  }

  private createBezelTicks(): THREE.InstancedMesh {
    return new THREE.InstancedMesh(new THREE.BoxGeometry(0.011, 0.045, 0.008), this.tickMat, 60);
  }

  private meteorite(): THREE.CanvasTexture {
    this.meteoriteTexture ??= createMeteoriteTexture();
    return this.meteoriteTexture;
  }

  private redrawDialPrint(): void {
    this.dial.redrawPrint(this.variant, this.dialDarkInk);
  }

  private applyCase(k: number): void {
    for (const mat of [this.polished, this.brushed, this.casebackMat]) {
      mat.color.lerp(this.targetCase, k);
    }
    this.polished.roughness += (this.targetRoughness - this.polished.roughness) * k;
    this.brushed.roughness += (Math.min(1, this.targetRoughness + 0.18) - this.brushed.roughness) * k;
  }

  private applyDial(k: number): void {
    this.dialMat.color.lerp(this.targetDial, k);
    this.subdialMat.color.lerp(this.targetSubdial, k);
  }

  /**
   * Instanced bezel ticks. On the modelled watch they lie on the diver's flat insert or
   * follow the slope of the polished dress bezel; the procedural bezel has a flat top.
   */
  private layoutBezelTicks(diver: boolean): void {
    const ticks = this.parts.bezelTicks;
    const modelled = this.parts.modelledBezel;
    const radius = modelled && !diver ? 0.915 : 0.905;
    const z = modelled ? (diver ? 0.2515 : 0.2472) : CASE.bezelTop + 0.008;
    const tilt = modelled && !diver ? -0.173 : 0;
    const dummy = new THREE.Object3D();
    dummy.rotation.order = 'ZXY';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const major = i % 5 === 0;
      const numeral = diver && i % 10 === 0;
      dummy.position.set(Math.sin(a) * radius, Math.cos(a) * radius, z);
      dummy.rotation.set(tilt, 0, -a);
      const s = numeral ? 0 : 1;
      dummy.scale.set((major ? 1.8 : 1) * s, (major ? 1.7 : 1) * s, s);
      dummy.updateMatrix();
      ticks.setMatrixAt(i, dummy.matrix);
    }
    ticks.instanceMatrix.needsUpdate = true;
  }

  private createInsertTexture(): THREE.CanvasTexture {
    const size = 1024;
    const { canvas: el, ctx } = canvas(size);
    const c = size / 2;
    const scale = c / 0.965;
    ctx.fillStyle = '#0d0e10';
    ctx.fillRect(0, 0, size, size);
    ctx.translate(c, c);
    ctx.fillStyle = '#ece7da';
    ctx.font = '600 44px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const n of [10, 20, 30, 40, 50]) {
      const a = (n / 60) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      ctx.translate(0, -0.905 * scale);
      ctx.fillText(String(n), 0, 0);
      ctx.restore();
    }
    // Lume pip at 12.
    ctx.fillStyle = '#e6d3a3';
    ctx.beginPath();
    ctx.moveTo(0, -0.945 * scale);
    ctx.lineTo(-22, -0.865 * scale);
    ctx.lineTo(22, -0.865 * scale);
    ctx.closePath();
    ctx.fill();
    const texture = new THREE.CanvasTexture(el);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }

  /** Procedural fallback movement, built lying flat (+Y up) and turned to face the caseback. */
  private buildMiniMovement(gold: THREE.Material): CalibreRig {
    const group = new THREE.Group();
    group.rotation.x = -Math.PI / 2;
    // Plate sits just behind the dial; parts stack toward the caseback (−Z).
    group.position.z = 0.02;

    const perlage = createPerlageTexture(512, 18);
    const stripes = createStripeTexture(512, 8);
    this.movementTextures.push(perlage, stripes);
    const plateMat = new THREE.MeshPhysicalMaterial({ color: '#c4c8cc', metalness: 1, roughness: 0.38, map: perlage });
    const bridgeMat = new THREE.MeshPhysicalMaterial({
      color: '#dfe2e6',
      metalness: 1,
      roughness: 0.28,
      map: stripes,
      clearcoat: 0.3,
    });
    const steel = new THREE.MeshPhysicalMaterial({ color: '#cfd3d8', metalness: 1, roughness: 0.2 });
    const ruby = new THREE.MeshPhysicalMaterial({ color: '#b3122a', roughness: 0.1, clearcoat: 1, metalness: 0 });
    const blued = new THREE.MeshPhysicalMaterial({ color: '#1f3f8a', metalness: 1, roughness: 0.25 });

    group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.83, 0.83, 0.04, 96), plateMat));

    const gearA = createWheel({ teeth: 60, module: 0.009, thickness: 0.014, spokes: 5, pinionTeeth: 8 }, gold, steel);
    gearA.group.position.set(-0.17, 0.06, 0.13);
    const gearB = createWheel({ teeth: 44, module: 0.009, thickness: 0.014, spokes: 4, pinionTeeth: 8 }, gold, steel);
    gearB.group.position.set(0.16, 0.08, 0.26);
    const escape = new THREE.Mesh(createEscapeWheelGeometry(15, 0.1, 0.012), steel);
    escape.position.set(0.3, 0.09, -0.02);
    group.add(gearA.group, gearB.group, escape);

    const balance = createBalanceWheel(0.17, gold, gold, blued);
    balance.group.position.set(0.16, 0.1, -0.28);
    group.add(balance.group);

    const cockShape = new THREE.Shape();
    cockShape.moveTo(0.36, -0.62);
    cockShape.quadraticCurveTo(0.3, -0.34, 0.2, -0.3);
    cockShape.lineTo(0.12, -0.26);
    cockShape.quadraticCurveTo(0.12, -0.4, 0.14, -0.62);
    cockShape.closePath();
    const bridgeShape = new THREE.Shape();
    bridgeShape.moveTo(-0.72, 0.2);
    bridgeShape.quadraticCurveTo(-0.5, 0.52, -0.05, 0.55);
    bridgeShape.quadraticCurveTo(0.3, 0.5, 0.45, 0.28);
    bridgeShape.lineTo(0.36, 0.2);
    bridgeShape.quadraticCurveTo(0.1, 0.38, -0.2, 0.36);
    bridgeShape.quadraticCurveTo(-0.52, 0.32, -0.64, 0.12);
    bridgeShape.closePath();
    for (const [shape, y, depth] of [
      [cockShape, 0.15, 0.02],
      [bridgeShape, 0.13, 0.022],
    ] as const) {
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelSize: 0.006,
        bevelThickness: 0.004,
        bevelSegments: 1,
      });
      geo.rotateX(Math.PI / 2);
      const mesh = new THREE.Mesh(geo, bridgeMat);
      mesh.position.y = y;
      group.add(mesh);
    }

    for (const [x, z] of [
      [0.16, -0.28],
      [-0.17, 0.13],
      [0.16, 0.26],
    ] as const) {
      const jewel = createJewel(0.018, ruby, steel);
      jewel.position.set(x, 0.155, z);
      group.add(jewel);
    }
    for (const [x, z] of [
      [-0.6, 0.2],
      [0.3, 0.36],
      [0.24, -0.55],
    ] as const) {
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 20), blued);
      screw.position.set(x, 0.16, z);
      group.add(screw);
    }

    const rotor = createRotor(0.78, 0.022, bridgeMat, gold);
    rotor.position.y = 0.19;
    group.add(rotor);

    this.body.add(group);
    return { escape, fourth: gearA.group, third: gearB.group, balance: balance.wheel, rotor, forkBase: 0 };
  }

  private resetSparks(): void {
    const pos = this.sparks.geometry.getAttribute('position') as THREE.BufferAttribute;
    const origin = new THREE.Vector3(1.15, 0, 0.05);
    for (let i = 0; i < SPARKS; i++) {
      const dir = new THREE.Vector3(Math.random() - 0.3, Math.random() - 0.5, Math.random() - 0.2).normalize();
      const speed = 0.8 + Math.random() * 1.8;
      this.sparkVelocities.set([dir.x * speed, dir.y * speed, dir.z * speed], i * 3);
      pos.setXYZ(i, origin.x, origin.y, origin.z);
    }
    pos.needsUpdate = true;
    this.sparks.visible = true;
  }

  private updateSparks(dt: number): void {
    if (this.sparkElapsed < 0) return;
    this.sparkElapsed += dt;
    const life = 1.8;
    const p = this.sparkElapsed / life;
    const pos = this.sparks.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < SPARKS; i++) {
      const vx = this.sparkVelocities[i * 3];
      const vy = this.sparkVelocities[i * 3 + 1];
      const vz = this.sparkVelocities[i * 3 + 2];
      pos.setXYZ(i, pos.getX(i) + vx * dt, pos.getY(i) + vy * dt - 0.25 * dt, pos.getZ(i) + vz * dt);
      this.sparkVelocities[i * 3] *= 0.96;
      this.sparkVelocities[i * 3 + 1] *= 0.96;
      this.sparkVelocities[i * 3 + 2] *= 0.96;
    }
    pos.needsUpdate = true;
    this.sparkMaterial.opacity = p < 0.12 ? p / 0.12 : Math.max(0, 1 - (p - 0.12) / 0.88);
    if (p >= 1) {
      this.sparkElapsed = -1;
      this.sparks.visible = false;
    }
  }
}
