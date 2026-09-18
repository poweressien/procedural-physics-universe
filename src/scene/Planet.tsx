import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useSimulationStore } from "../simulation/useSimulationStore";
import {
  EARTH_CLOUDS_TEXTURE_URL,
  EARTH_DAY_TEXTURE_URL,
  EARTH_NIGHT_TEXTURE_URL,
  PLANET_CENTER,
  PLANET_RADIUS,
} from "../world/planetConfig";

const ATMO_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMO_FRAGMENT = /* glsl */ `
  varying vec3 vNormal;
  uniform vec3 glowColor;
  uniform float glowPower;
  void main() {
    float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), glowPower);
    gl_FragColor = vec4(glowColor, 1.0) * clamp(intensity, 0.0, 1.0);
  }
`;

// The marker sits at the true north pole of the sphere — directly below
// the city's own origin — with a beam pointing straight up toward it, so
// "here's your city" is a literal position, not a decorative guess.
const MARKER_LOCAL = new THREE.Vector3(0, PLANET_RADIUS * 1.01, 0);
const BEAM_END_LOCAL = new THREE.Vector3(0, PLANET_RADIUS * 1.3, 0);

/** Does the actual texture-loading work — kept separate so the Suspense
 * boundary in Scene.tsx only wraps this, not the whole planet group. */
function PlanetBody() {
  const [dayMap, nightMap, cloudsMap] = useTexture([
    EARTH_DAY_TEXTURE_URL,
    EARTH_NIGHT_TEXTURE_URL,
    EARTH_CLOUDS_TEXTURE_URL,
  ]);

  const surfaceRef = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const markerLight = useRef<THREE.PointLight>(null);

  const beamPositions = useMemo(
    () =>
      new Float32Array([
        MARKER_LOCAL.x,
        MARKER_LOCAL.y,
        MARKER_LOCAL.z,
        BEAM_END_LOCAL.x,
        BEAM_END_LOCAL.y,
        BEAM_END_LOCAL.z,
      ]),
    []
  );
  const atmoUniforms = useMemo(
    () => ({ glowColor: { value: new THREE.Color("#6fc3ff") }, glowPower: { value: 2.2 } }),
    []
  );
  const haloUniforms = useMemo(
    () => ({ glowColor: { value: new THREE.Color("#3d8fe0") }, glowPower: { value: 3.4 } }),
    []
  );

  useFrame((_, delta) => {
    if (surfaceRef.current) surfaceRef.current.rotation.y += delta * 0.015;
    if (cloudRef.current) cloudRef.current.rotation.y += delta * 0.021;
    if (markerLight.current) {
      markerLight.current.intensity = 2 + Math.sin(performance.now() * 0.004) * 0.6;
    }
  });

  return (
    <>
      {/* Dedicated lighting so the planet always looks its best regardless
          of whatever time it happens to be down on the ground. */}
      <directionalLight position={[700, 500, 900]} intensity={2.4} color="#fff8ec" />
      <pointLight position={[-900, -300, -600]} intensity={0.35} color="#4a7bd6" distance={2600} decay={1.5} />

      <group ref={surfaceRef}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[PLANET_RADIUS, 96, 96]} />
          <meshStandardMaterial
            map={dayMap}
            emissiveMap={nightMap}
            emissive="#ffd9a0"
            emissiveIntensity={1.3}
            roughness={0.9}
            metalness={0.04}
          />
        </mesh>

        {/* "You are here" marker + beam, planted at the true north pole */}
        <mesh position={MARKER_LOCAL}>
          <sphereGeometry args={[8, 12, 12]} />
          <meshBasicMaterial color="#57d9c4" />
        </mesh>
        <line>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[beamPositions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#57d9c4" transparent opacity={0.85} />
        </line>
        <pointLight ref={markerLight} position={BEAM_END_LOCAL} color="#57d9c4" distance={260} decay={2} />
      </group>

      {/* Cloud layer, rotating independently for a light parallax effect */}
      <mesh ref={cloudRef}>
        <sphereGeometry args={[PLANET_RADIUS * 1.012, 80, 80]} />
        <meshStandardMaterial
          map={cloudsMap}
          alphaMap={cloudsMap}
          transparent
          depthWrite={false}
          roughness={1}
          opacity={0.75}
        />
      </mesh>

      {/* Atmosphere glow — bright inner rim plus a wider, softer outer halo */}
      <mesh scale={1.04}>
        <sphereGeometry args={[PLANET_RADIUS, 64, 64]} />
        <shaderMaterial
          vertexShader={ATMO_VERTEX}
          fragmentShader={ATMO_FRAGMENT}
          uniforms={atmoUniforms}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.1}>
        <sphereGeometry args={[PLANET_RADIUS, 48, 48]} />
        <shaderMaterial
          vertexShader={ATMO_VERTEX}
          fragmentShader={ATMO_FRAGMENT}
          uniforms={haloUniforms}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

export function Planet() {
  const scaleLevel = useSimulationStore((s) => s.scaleLevel);
  const visible = scaleLevel === "planet";
  if (!visible) return null;

  return (
    <group position={PLANET_CENTER}>
      <PlanetBody />
    </group>
  );
}
