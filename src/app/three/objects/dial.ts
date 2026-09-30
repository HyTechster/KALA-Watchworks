import * as THREE from 'three';
import { ModelId } from '../../data/configurator-options';
import { canvas } from '../utils/materials';
import { CASE } from './watch-case';

export interface DialMaterials {
  readonly dial: THREE.MeshPhysicalMaterial;
  readonly subdial: THREE.MeshPhysicalMaterial;
  readonly indices: THREE.Material;
  readonly lume: THREE.Material;
  readonly accent: THREE.Material;
}

export interface Dial {
  readonly group: THREE.Group;
  readonly subdials: THREE.Group;
  /** Small running-seconds hand at 9 o'clock (chronograph only). */
  readonly subSeconds: THREE.Group;
  /** Redraws the printed layer (logo, minute track, sub-dial scales). */
  redrawPrint(variant: ModelId, darkInk: boolean): void;
  dispose(): void;
}

const DIAL_RADIUS = 0.83;
const PRINT_SIZE = 1024;
const SUB_X = 0.36;

/**
 * Builds the dial. With `printOnly`, only the printed layer is created: the Blender model
 * already provides the disc, sub-dial cups, applied indices and lume.
 *
 * Under a transmissive crystal, the print must be opaque (cut out with alpha-to-coverage):
 * the crystal samples a capture of opaque objects only, and transparent objects drawn after
 * it fail the depth test against the glass, so a transparent print would vanish.
 */
export function buildDial(m: DialMaterials, printOnly = false, transmissiveCrystal = false): Dial {
  const group = new THREE.Group();
  group.position.z = CASE.dialZ;
  const subdials = new THREE.Group();
  const subSeconds = new THREE.Group();
  if (!printOnly) buildDialGeometry(group, subdials, subSeconds, m);

  // Printed layer on a transparent canvas texture.
  const { canvas: printCanvas, ctx } = canvas(PRINT_SIZE);
  const printTexture = new THREE.CanvasTexture(printCanvas);
  printTexture.colorSpace = THREE.SRGBColorSpace;
  printTexture.anisotropy = 8;
  // The print glows faintly so it reads like bright lacquer even where the studio light is dim.
  const printMaterial = new THREE.MeshStandardMaterial({
    map: printTexture,
    emissive: 0xffffff,
    emissiveMap: printTexture,
    emissiveIntensity: 0.4,
    roughness: 0.55,
    metalness: 0,
    ...(transmissiveCrystal
      ? { alphaTest: 0.01, alphaToCoverage: true }
      : { transparent: true, depthWrite: false }),
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -2,
  });
  const print = new THREE.Mesh(new THREE.PlaneGeometry(DIAL_RADIUS * 2, DIAL_RADIUS * 2), printMaterial);
  print.position.z = 0.0016;
  group.add(print);

  const toPx = (u: number) => (u / (DIAL_RADIUS * 2) + 0.5) * PRINT_SIZE;
  const toPy = (v: number) => (0.5 - v / (DIAL_RADIUS * 2)) * PRINT_SIZE;
  const scale = PRINT_SIZE / (DIAL_RADIUS * 2);

  const redrawPrint = (variant: ModelId, darkInk: boolean) => {
    const ink = darkInk ? 'rgba(38,26,20,0.92)' : 'rgba(240,236,228,0.92)';
    ctx.clearRect(0, 0, PRINT_SIZE, PRINT_SIZE);
    ctx.save();
    ctx.translate(PRINT_SIZE / 2, PRINT_SIZE / 2);

    // Minute track.
    ctx.strokeStyle = ink;
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const major = i % 5 === 0;
      const r1 = 0.765 * scale;
      const r2 = (major ? 0.8 : 0.785) * scale;
      ctx.lineWidth = major ? 3 : 1.6;
      ctx.beginPath();
      ctx.moveTo(Math.sin(a) * r1, -Math.cos(a) * r1);
      ctx.lineTo(Math.sin(a) * r2, -Math.cos(a) * r2);
      ctx.stroke();
    }
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 0.8 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Logo: a thin stroke over the fill gives the heavier weight of the applied logo in the renders.
    ctx.font = '700 66px "Syne", ui-sans-serif, sans-serif';
    ctx.letterSpacing = '18px';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    // Letter spacing also trails the last letter; shift by half of it to stay centred.
    const logoX = toPx(0) + 9;
    ctx.fillText('KALA', logoX, toPy(0.3));
    ctx.strokeText('KALA', logoX, toPy(0.3));
    ctx.font = '500 19px "JetBrains Mono", ui-monospace, monospace';
    ctx.letterSpacing = '6px';
    ctx.fillText(variant === 'chronograph' ? 'CHRONOGRAPH · K-05' : 'AUTOMATIC · K-03', toPx(0), toPy(0.215));

    if (variant === 'chronograph') {
      for (const sx of [-1, 1]) {
        const cx = toPx(sx * SUB_X);
        const cy = toPy(0);
        ctx.strokeStyle = ink;
        // Faint snailing only on a blended print; a cut-out print would dither it into noise.
        for (let r = 0.04; !transmissiveCrystal && r < 0.16; r += 0.012) {
          ctx.globalAlpha = 0.12;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        for (let i = 0; i < 30; i++) {
          const a = (i / 30) * Math.PI * 2;
          const major = i % 5 === 0;
          const r1 = (major ? 0.125 : 0.14) * scale;
          const r2 = 0.158 * scale;
          ctx.lineWidth = major ? 2.6 : 1.4;
          ctx.beginPath();
          ctx.moveTo(cx + Math.sin(a) * r1, cy - Math.cos(a) * r1);
          ctx.lineTo(cx + Math.sin(a) * r2, cy - Math.cos(a) * r2);
          ctx.stroke();
        }
      }
      ctx.font = '500 15px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillText('SERIES 03', toPx(0), toPy(-0.36));
    } else {
      ctx.font = '500 16px "JetBrains Mono", ui-monospace, monospace';
      ctx.letterSpacing = '8px';
      ctx.fillText('SERIES 03', toPx(0), toPy(-0.34));
      ctx.font = '400 13px "JetBrains Mono", ui-monospace, monospace';
      ctx.letterSpacing = '5px';
      ctx.fillText('KUALA LUMPUR', toPx(0), toPy(-0.4));
    }
    printTexture.needsUpdate = true;
    last = [variant, darkInk];
  };

  // Text drawn before the brand fonts arrive uses a fallback face; redraw once they load.
  let last: [ModelId, boolean] | null = null;
  let disposed = false;
  document.fonts?.ready.then(() => {
    if (!disposed && last) redrawPrint(...last);
  });

  return {
    group,
    subdials,
    subSeconds,
    redrawPrint,
    dispose: () => {
      disposed = true;
      printTexture.dispose();
      printMaterial.dispose();
      print.geometry.dispose();
    },
  };
}

/** Disc, recessed sub-dials, applied indices and lume dots for the procedural (fallback) watch. */
function buildDialGeometry(group: THREE.Group, subdials: THREE.Group, subSeconds: THREE.Group, m: DialMaterials): void {
  const disc = new THREE.Mesh(new THREE.CircleGeometry(DIAL_RADIUS, 128), m.dial);
  disc.receiveShadow = true;
  group.add(disc);

  // Sub-dials: recessed discs at 3 and 9 o'clock.
  const subGeo = new THREE.CircleGeometry(0.165, 64);
  for (const sx of [-1, 1]) {
    const sub = new THREE.Mesh(subGeo, m.subdial);
    sub.position.set(sx * SUB_X, 0, 0.0008);
    subdials.add(sub);
  }
  subSeconds.position.set(-SUB_X, 0, 0.012);
  const subHand = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.15, 0.004), m.accent);
  subHand.position.y = 0.055;
  const subCap = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.01, 20), m.accent);
  subCap.rotation.x = Math.PI / 2;
  subSeconds.add(subHand, subCap);
  const subMinutes = subSeconds.clone();
  subMinutes.position.x = SUB_X;
  subMinutes.rotation.z = -2.1;
  subdials.add(subSeconds, subMinutes);
  group.add(subdials);

  // Applied indices (instanced), with a double bar at 12.
  const indexGeo = new THREE.BoxGeometry(0.034, 0.12, 0.022);
  const indices = new THREE.InstancedMesh(indexGeo, m.indices, 13);
  const dummy = new THREE.Object3D();
  let n = 0;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const offsets = i === 0 ? [-0.026, 0.026] : [0];
    for (const off of offsets) {
      dummy.position.set(Math.sin(a) * 0.62 + Math.cos(a) * off, Math.cos(a) * 0.62 - Math.sin(a) * off, 0.012);
      dummy.rotation.set(0, 0, -a);
      dummy.updateMatrix();
      indices.setMatrixAt(n++, dummy.matrix);
    }
  }
  indices.castShadow = true;
  group.add(indices);

  // Lume dots just outside each index.
  const lumeGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.006, 16);
  lumeGeo.rotateX(Math.PI / 2);
  const lume = new THREE.InstancedMesh(lumeGeo, m.lume, 12);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    dummy.position.set(Math.sin(a) * 0.72, Math.cos(a) * 0.72, 0.004);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    lume.setMatrixAt(i, dummy.matrix);
  }
  group.add(lume);
}
