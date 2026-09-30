import * as THREE from 'three';
import { balanceAngle, escapeAngle } from './balance-wheel';

/** The moving parts of a calibre. Every part turns about its own local Y axis. */
export interface CalibreRig {
  readonly barrel?: THREE.Object3D;
  readonly center?: THREE.Object3D;
  readonly third?: THREE.Object3D;
  readonly fourth?: THREE.Object3D;
  readonly escape?: THREE.Object3D;
  readonly fork?: THREE.Object3D;
  readonly balance?: THREE.Object3D;
  readonly hairspring?: THREE.Object3D;
  readonly rotor?: THREE.Object3D;
  /** Rest angle of the pallet fork (radians). */
  readonly forkBase: number;
}

/** Finds the named moving parts in the Blender movement (see art/kala-watch.blend). */
export function rigFromModel(root: THREE.Object3D): CalibreRig {
  const get = (name: string) => root.getObjectByName(name) ?? undefined;
  return {
    barrel: get('wheel_barrel'),
    center: get('wheel_center'),
    third: get('wheel_third'),
    fourth: get('wheel_fourth'),
    escape: get('wheel_escape'),
    fork: get('pallet_fork'),
    balance: get('balance_wheel'),
    hairspring: get('hairspring'),
    rotor: get('rotor'),
    forkBase: 0,
  };
}

const FORK_SWING = THREE.MathUtils.degToRad(9);

/**
 * True relative speeds, all derived from the escapement's beat: the escape wheel steps on
 * each of 8 beats per second, the seconds (fourth) wheel turns once a minute, the centre
 * wheel once an hour, and the balance oscillates 4 times per second (28,800 vph).
 */
export function driveCalibre(rig: CalibreRig, t: number, rotorAngle: number, balanceAmplitude?: number): void {
  const esc = escapeAngle(t);
  const fourth = esc / 16;
  const third = fourth * (10 / 75);
  const center = third * (10 / 80);
  const barrel = center * (12 / 96);
  if (rig.escape) rig.escape.rotation.y = esc;
  if (rig.fourth) rig.fourth.rotation.y = -fourth;
  if (rig.third) rig.third.rotation.y = third;
  if (rig.center) rig.center.rotation.y = -center;
  if (rig.barrel) rig.barrel.rotation.y = barrel;

  const swing = balanceAngle(t, balanceAmplitude);
  if (rig.balance) rig.balance.rotation.y = swing;
  if (rig.hairspring) rig.hairspring.rotation.y = swing * 0.12;
  if (rig.fork) {
    const flip = THREE.MathUtils.clamp(Math.sin(t * Math.PI * 8) * 4, -1, 1);
    rig.fork.rotation.y = rig.forkBase + flip * FORK_SWING;
  }
  if (rig.rotor) rig.rotor.rotation.y = rotorAngle;
}
