"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "@/store/useStore";
import { ISS_TLE, SATELLITE_TLES, getSatRec, propagateToGeo, propagateOrbitPath } from "@/lib/satellite-utils";

function generateEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, "#0a2a5a");
  grad.addColorStop(0.15, "#0d3d7a");
  grad.addColorStop(0.25, "#1a5a3a");
  grad.addColorStop(0.35, "#2a7a4a");
  grad.addColorStop(0.45, "#3a8a5a");
  grad.addColorStop(0.5, "#4a9a6a");
  grad.addColorStop(0.55, "#3a8a5a");
  grad.addColorStop(0.65, "#2a7a4a");
  grad.addColorStop(0.75, "#1a5a3a");
  grad.addColorStop(0.85, "#0d3d7a");
  grad.addColorStop(1, "#0a2a5a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = `rgba(34, 120, 60, ${0.3 + Math.random() * 0.5})`;
    ctx.beginPath();
    ctx.ellipse(Math.random() * 1024, Math.random() * 512, 5 + Math.random() * 40, 3 + Math.random() * 20, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 100; i++) {
    ctx.fillStyle = `rgba(180, 140, 80, ${0.2 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.ellipse(200 + Math.random() * 300, 150 + Math.random() * 150, 3 + Math.random() * 15, 2 + Math.random() * 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function generateNightTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#050515";
  ctx.fillRect(0, 0, 1024, 512);

  for (let i = 0; i < 300; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    ctx.fillStyle = `rgba(100, 70, 30, ${0.05 + Math.random() * 0.15})`;
    ctx.beginPath();
    ctx.arc(x, y, 1 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  const cities = [
    [750, 180], [740, 190], [730, 185], [760, 175], [500, 200],
    [510, 195], [490, 205], [300, 150], [310, 145], [290, 155],
    [200, 100], [210, 95], [850, 230], [840, 240], [400, 120],
  ];
  cities.forEach(([x, y]) => {
    ctx.fillStyle = `rgba(255, 200, 100, ${0.3 + Math.random() * 0.5})`;
    ctx.beginPath();
    ctx.arc(x, y, 2 + Math.random() * 4, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function generateCloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 512, 256);
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + Math.random() * 0.15})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 256, 5 + Math.random() * 40, 0, Math.PI * 2);
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

function latLngToVec(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

const vsEarth = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fsEarth = `
uniform sampler2D dayTex;
uniform sampler2D nightTex;
uniform vec3 sunDirection;
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vec4 day = texture2D(dayTex, vUv);
  vec4 night = texture2D(nightTex, vUv);
  float cosAngle = dot(normalize(vNormal), normalize(sunDirection));
  float dayFactor = smoothstep(-0.15, 0.25, cosAngle);
  float terminatorGlow = exp(-pow(abs(cosAngle) / 0.08, 2.0)) * 0.5;
  vec4 color = mix(night, day, dayFactor);
  color.rgb += terminatorGlow * vec3(1.0, 0.6, 0.2);
  gl_FragColor = color;
}
`;

function EarthWithTerminator({ lat, lng }: { lat: number; lng: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const dayTex = useMemo(() => generateEarthTexture(), []);
  const nightTex = useMemo(() => generateNightTexture(), []);
  const cloudTex = useMemo(() => generateCloudTexture(), []);

  const sunDir = useMemo(() => new THREE.Vector3(1, 0.5, 0.8).normalize(), []);

  const uniforms = useMemo(
    () => ({
      dayTex: { value: dayTex },
      nightTex: { value: nightTex },
      sunDirection: { value: sunDir },
    }),
    [dayTex, nightTex, sunDir]
  );

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0008;
      uniforms.sunDirection.value.x = Math.sin(clock.elapsedTime * 0.02) * 1.2;
      uniforms.sunDirection.value.z = Math.cos(clock.elapsedTime * 0.02) * 1.2;
    }
    if (cloudRef.current) cloudRef.current.rotation.y += 0.001;
    if (ringRef.current) ringRef.current.rotation.y += 0.0005;
  });

  const markerPos = useMemo(() => latLngToVec(lat, lng, 1.02), [lat, lng]);

  const glowCanvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(32, 32, 14, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(108, 99, 255, 0.3)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(32, 32, 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#6c63ff";
    ctx.fill();
    return c;
  }, []);

  return (
    <group>
      <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
        <ringGeometry args={[1.3, 1.45, 64]} />
        <meshBasicMaterial color="#6c63ff" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>

      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vsEarth}
          fragmentShader={fsEarth}
        />
      </mesh>

      <mesh ref={cloudRef}>
        <sphereGeometry args={[1.008, 64, 64]} />
        <meshPhongMaterial map={cloudTex} transparent opacity={0.2} depthWrite={false} />
      </mesh>

      <mesh position={markerPos}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#ff4466" />
      </mesh>
      <mesh position={markerPos.clone().multiplyScalar(1.3)}>
        <sprite>
          <spriteMaterial transparent>
            <canvasTexture attach="map" image={glowCanvas} />
          </spriteMaterial>
        </sprite>
      </mesh>
    </group>
  );
}

function Atmosphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.0003;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.12, 48, 48]} />
      <shaderMaterial
        transparent
        side={THREE.BackSide}
        depthWrite={false}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vec3 viewDir = normalize(-vPosition);
            float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
            float intensity = pow(rim, 3.0) * 0.8;
            gl_FragColor = vec4(0.3, 0.5, 1.0, intensity);
          }
        `}
      />
    </mesh>
  );
}

function OrbitPath({ path, color = "#44ffaa", opacity = 0.25 }: { path: { lat: number; lng: number }[]; color?: string; opacity?: number }) {
  const points = useMemo(() => {
    if (path.length < 2) return null;
    return path.map((p) => latLngToVec(p.lat, p.lng, 1.03));
  }, [path]);

  if (!points || points.length < 2) return null;

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={Float32Array.from(points.flatMap((p) => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </line>
  );
}

function GroundTrack({ path, color = "#ffaa00" }: { path: { lat: number; lng: number }[]; color?: string }) {
  const points = useMemo(() => {
    if (path.length < 2) return null;
    return path.map((p) => latLngToVec(p.lat, p.lng, 1.005));
  }, [path]);

  if (!points || points.length < 2) return null;

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={Float32Array.from(points.flatMap((p) => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.6} linewidth={2} />
    </line>
  );
}

function ISS() {
  const dotRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<{ lat: number; lng: number }[]>([]);
  const [groundTrack, setGroundTrack] = useState<{ lat: number; lng: number }[]>([]);
  const issSatRec = useMemo(() => getSatRec(ISS_TLE.name, ISS_TLE.line1, ISS_TLE.line2), []);
  const orbitPath = useMemo(() => propagateOrbitPath(issSatRec, new Date(), 240, 0.5), [issSatRec]);

  useFrame(() => {
    const now = new Date();
    const pos = propagateToGeo(issSatRec, now);
    if (pos && dotRef.current) {
      const v = latLngToVec(pos.lat, pos.lng, 1.06);
      dotRef.current.position.copy(v);

      trailRef.current.push({ lat: pos.lat, lng: pos.lng });
      if (trailRef.current.length > 180) trailRef.current.shift();
      setGroundTrack([...trailRef.current]);
    }
  });

  return (
    <group>
      <OrbitPath path={orbitPath} color="#ffaa00" opacity={0.1} />
      <GroundTrack path={groundTrack} color="#ffaa00" />
      <mesh ref={dotRef}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshBasicMaterial color="#ffaa00" />
        <pointLight color="#ffaa00" intensity={0.8} distance={0.4} />
      </mesh>
      <pointLight color="#ffaa00" intensity={0.3} distance={0.8} />
    </group>
  );
}

function TrackedSatellites() {
  const groupRef = useRef<THREE.Group>(null);
  const satRecs = useMemo(
    () => SATELLITE_TLES.map((s) => ({ ...s, rec: getSatRec(s.name, s.line1, s.line2) })),
    []
  );
  const orbitPaths = useMemo(
    () => satRecs.map((s) => ({ name: s.name, path: propagateOrbitPath(s.rec, new Date(), 240, 0.5) })),
    [satRecs]
  );

  useFrame(() => {
    if (!groupRef.current) return;
    const now = new Date();
    satRecs.forEach((sat, i) => {
      const pos = propagateToGeo(sat.rec, now);
      if (pos && groupRef.current!.children[i]) {
        const r = 1.04 + (pos.alt / 1000) * 0.06;
        groupRef.current!.children[i].position.copy(latLngToVec(pos.lat, pos.lng, Math.min(r, 1.15)));
      }
    });
  });

  const colors = ["#44ffaa", "#66ddff", "#ffdd44", "#ff66aa", "#aa88ff", "#88ffdd", "#ff8844", "#44ddff", "#ff4488", "#88ff44"];

  return (
    <group ref={groupRef}>
      {orbitPaths.map((op, i) => (
        <OrbitPath key={op.name} path={op.path} color={colors[i]} opacity={0.15} />
      ))}
      {satRecs.map((sat, i) => (
        <mesh key={sat.name}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshBasicMaterial color={colors[i]} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function BackgroundStars() {
  return <Stars radius={150} depth={60} count={4000} factor={4.5} saturation={0} fade speed={0.5} />;
}

export default function Globe3D() {
  const location = useStore((s) => s.location);
  const lat = location?.lat ?? 20;
  const lng = location?.lng ?? 0;

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-3 left-3 z-10 flex gap-2 pointer-events-none">
        <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          ● Real-time
        </span>
        <span className="text-[10px] px-2 py-1 rounded-full bg-[#1a1a3a]/80 text-zinc-300 border border-[#3a3a6a]">
          3D Globe
        </span>
      </div>
      <Canvas
        camera={{ position: [0, 0.5, 3.8], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#000011" }}
      >
        <ambientLight intensity={0.15} />
        <directionalLight position={[5, 3, 5]} intensity={1.5} />
        <directionalLight position={[-3, -2, -3]} intensity={0.2} color="#4466ff" />

        <EarthWithTerminator lat={lat} lng={lng} />
        <Atmosphere />
        <ISS />
        <TrackedSatellites />
        <BackgroundStars />

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1.8}
          maxDistance={10}
          rotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
