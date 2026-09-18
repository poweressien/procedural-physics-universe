import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { useSimulationStore } from "../simulation/useSimulationStore";
import { useKeyboardControls } from "./useKeyboardControls";
import { SCALE_PRESETS } from "./scalePresets";
import type { ScaleLevel } from "../types";

interface Transition {
  active: boolean;
  elapsed: number;
  duration: number;
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

export function CameraRig() {
  const { camera } = useThree();
  const orbitRef = useRef<any>(null);
  const lockRef = useRef<any>(null);
  const keys = useKeyboardControls();

  const scaleLevel = useSimulationStore((s) => s.scaleLevel);
  const firstPerson = useSimulationStore((s) => s.firstPerson);
  const flyToken = useSimulationStore((s) => s.flyToken);
  const prevScale = useRef<ScaleLevel>(scaleLevel);
  const prevFlyToken = useRef(flyToken);

  const transition = useRef<Transition>({
    active: false,
    elapsed: 0,
    duration: 1.3,
    fromPos: new THREE.Vector3(),
    toPos: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3(),
  });
  const syncAcc = useRef(0);

  // Kick off a smooth transition whenever the requested scale level changes,
  // or when a "fly to this entity" request comes in (which takes priority
  // over a plain scale-level change, since both can fire in the same update).
  useEffect(() => {
    const scaleChanged = prevScale.current !== scaleLevel;
    const flyRequested = prevFlyToken.current !== flyToken;
    prevScale.current = scaleLevel;
    prevFlyToken.current = flyToken;
    if (!scaleChanged && !flyRequested) return;

    const flyTarget = useSimulationStore.getState().flyTarget;
    const usesFly = flyRequested && flyTarget;
    const toPos = usesFly ? flyTarget!.position : SCALE_PRESETS[scaleLevel].position;
    const toTarget = usesFly ? flyTarget!.target : SCALE_PRESETS[scaleLevel].target;

    const currentTarget = orbitRef.current
      ? (orbitRef.current.target as THREE.Vector3).clone()
      : camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(10));

    transition.current = {
      active: true,
      elapsed: 0,
      duration: 1.3,
      fromPos: camera.position.clone(),
      toPos: new THREE.Vector3(...toPos),
      fromTarget: currentTarget,
      toTarget: new THREE.Vector3(...toTarget),
    };
    if (orbitRef.current) orbitRef.current.enabled = false;
  }, [scaleLevel, flyToken, camera]);

  // Engage / release pointer lock when first-person mode toggles.
  useEffect(() => {
    if (firstPerson) {
      lockRef.current?.lock?.();
    } else {
      lockRef.current?.unlock?.();
    }
  }, [firstPerson]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const t = transition.current;

    if (t.active) {
      t.elapsed += delta;
      const p = smoothstep(Math.min(1, t.elapsed / t.duration));
      camera.position.lerpVectors(t.fromPos, t.toPos, p);
      if (orbitRef.current) {
        orbitRef.current.target.lerpVectors(t.fromTarget, t.toTarget, p);
        orbitRef.current.update();
      } else {
        const target = new THREE.Vector3().lerpVectors(t.fromTarget, t.toTarget, p);
        camera.lookAt(target);
      }
      if (p >= 1) {
        t.active = false;
        if (orbitRef.current && !firstPerson) orbitRef.current.enabled = true;
      }
      return;
    }

    const k = keys.current;
    const anyMove = k.forward || k.back || k.left || k.right || k.up || k.down;
    if (!anyMove) return;

    const speed = (k.fast ? 30 : 11) * delta;
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

    const move = new THREE.Vector3();
    if (k.forward) move.add(forward);
    if (k.back) move.sub(forward);
    if (k.right) move.add(right);
    if (k.left) move.sub(right);
    if (move.lengthSq() > 0) move.normalize().multiplyScalar(speed);

    camera.position.add(move);
    if (!firstPerson && orbitRef.current) orbitRef.current.target.add(move);

    const vertical = (k.up ? 1 : 0) - (k.down ? 1 : 0);
    if (vertical !== 0) {
      camera.position.y += vertical * speed;
      if (!firstPerson && orbitRef.current) orbitRef.current.target.y += vertical * speed;
    }

    if (!firstPerson && orbitRef.current) orbitRef.current.update();
  });

  useFrame((_, rawDelta) => {
    syncAcc.current += Math.min(rawDelta, 0.1);
    if (syncAcc.current >= 0.3) {
      syncAcc.current = 0;
      useSimulationStore.getState().setCameraPos([camera.position.x, camera.position.y, camera.position.z]);
    }
  });

  return (
    <>
      {firstPerson ? (
        <PointerLockControls ref={lockRef} />
      ) : (
        <OrbitControls
          ref={orbitRef}
          enableDamping
          dampingFactor={0.08}
          minDistance={3}
          maxDistance={2600}
          maxPolarAngle={Math.PI * 0.49}
        />
      )}
    </>
  );
}
