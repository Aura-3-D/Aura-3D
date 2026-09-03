import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import * as THREE from "three";
import type { Character } from "@/lib/characters";
import type { LiveSceneProps } from "./types";

export type { LiveSceneProps };

function useCharacterMap(videoSrc: string, posterSrc: string) {
  const [map, setMap] = useState<THREE.Texture | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const still = loader.load(posterSrc, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      if (!cancelled) setMap((current) => current ?? tex);
    });
    still.colorSpace = THREE.SRGBColorSpace;

    const video = document.createElement("video");
    video.src = videoSrc;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("playsinline", "1");
    videoRef.current = video;

    const videoTex = new THREE.VideoTexture(video);
    videoTex.colorSpace = THREE.SRGBColorSpace;
    videoTex.minFilter = THREE.LinearFilter;
    videoTex.magFilter = THREE.LinearFilter;
    videoTex.generateMipmaps = false;

    const onPlaying = () => {
      if (!cancelled) setMap(videoTex);
    };
    video.addEventListener("playing", onPlaying);
    const tryPlay = () => {
      video.play().catch(() => undefined);
    };
    video.addEventListener("canplay", tryPlay);
    video.load();
    tryPlay();

    return () => {
      cancelled = true;
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("canplay", tryPlay);
      video.pause();
      video.removeAttribute("src");
      video.load();
      videoRef.current = null;
      videoTex.dispose();
      still.dispose();
    };
  }, [videoSrc, posterSrc]);

  return { map, video: videoRef };
}

function CoverPortrait({
  character,
  affection,
  speaking,
  amplitude,
  pointer,
}: LiveSceneProps) {
  const { map, video } = useCharacterMap(character.video, character.portrait);
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: null as THREE.Texture | null },
        uAmp: { value: 0 },
        uLook: { value: new THREE.Vector2(0, 0) },
        uTime: { value: 0 },
        uSpeak: { value: 0 },
        uAffection: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uAmp;
        uniform vec2 uLook;
        uniform float uTime;
        uniform float uSpeak;
        uniform float uAffection;
        varying vec2 vUv;
        void main() {
          vec2 uv = vUv;
          float depth = smoothstep(0.15, 0.85, vUv.y);
          uv += uLook * vec2(0.006, 0.004) * depth;
          float breathe = sin(uTime * 1.05) * 0.0016 * (1.0 - uSpeak);
          uv.y += (uv.y - 0.4) * breathe;
          uv = clamp(uv, 0.0, 1.0);
          vec4 col = texture2D(uMap, uv);
          float warmth = uAffection * 0.08;
          col.rgb *= 1.0 + warmth * vec3(-0.01, 0.03, 0.09);
          col.rgb += vec3(0.02, 0.04, 0.07) * uSpeak * uAmp;
          gl_FragColor = col;
        }
      `,
      toneMapped: false,
    });
  }, []);

  useEffect(() => () => material.dispose(), [material]);

  const { viewport } = useThree();
  const look = useRef(new THREE.Vector2());
  const amp = useRef(0);
  const speak = useRef(0);
  const mesh = useRef<THREE.Mesh>(null);

  const aspect = 2 / 3;
  const vAspect = viewport.width / viewport.height;
  let w: number;
  let h: number;
  if (vAspect > aspect) {
    w = viewport.width * 1.08;
    h = w / aspect;
  } else {
    h = viewport.height * 1.08;
    w = h * aspect;
  }

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.1);
    const live = video.current;
    if (live && !live.paused && live.readyState >= 2) {
      const tex = material.uniforms.uMap!.value;
      if (tex) tex.needsUpdate = true;
    }
    look.current.x += (pointer.x - look.current.x) * (1 - Math.exp(-d * 5));
    look.current.y += (pointer.y - look.current.y) * (1 - Math.exp(-d * 5));
    const gated = speaking && amplitude > 0.045 ? Math.min(1, amplitude) : 0;
    amp.current += (gated - amp.current) * (1 - Math.exp(-d * 16));
    speak.current += ((speaking ? 1 : 0) - speak.current) * (1 - Math.exp(-d * 7));
    if (map) material.uniforms.uMap!.value = map;
    material.uniforms.uAmp!.value = amp.current;
    material.uniforms.uLook!.value.set(look.current.x, look.current.y);
    material.uniforms.uTime!.value = state.clock.elapsedTime;
    material.uniforms.uSpeak!.value = speak.current;
    material.uniforms.uAffection!.value = affection / 100;
    if (mesh.current) {
      const talk = amp.current;
      mesh.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.006;
      mesh.current.rotation.x = talk * 0.018;
      mesh.current.rotation.y = look.current.x * 0.03;
    }
  });

  if (!map) return null;

  return (
    <mesh ref={mesh} scale={[w, h, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function Dust() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const count = 70;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 3.4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3.2;
      positions[i * 3 + 2] = Math.random() * 1.4 + 0.15;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useEffect(() => () => geo.dispose(), [geo]);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.1);
    const points = ref.current;
    if (!points) return;
    points.rotation.y += d * 0.012;
    const pos = points.geometry.attributes.position;
    if (!pos) return;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + d * 0.04;
      if (y > 1.7) y = -1.7;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        color="#e8e4dc"
        size={0.012}
        transparent
        opacity={0.28}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

function CameraRig({
  affection,
  pointer,
}: {
  affection: number;
  pointer: { x: number; y: number };
}) {
  const { camera } = useThree();
  useFrame((_, delta) => {
    const d = Math.min(delta, 0.1);
    const t = affection / 100;
    const targetZ = 2.38 - t * 0.62;
    const targetY = 0.04 + t * 0.16;
    const targetX = pointer.x * 0.08;
    camera.position.z += (targetZ - camera.position.z) * (1 - Math.exp(-d * 3));
    camera.position.y += (targetY - camera.position.y) * (1 - Math.exp(-d * 3));
    camera.position.x += (targetX - camera.position.x) * (1 - Math.exp(-d * 4));
    camera.lookAt(0, 0.05 + t * 0.08, 0);
  });
  return null;
}

function Scene(props: LiveSceneProps) {
  return (
    <>
      <color attach="background" args={["#070b14"]} />
      <CoverPortrait {...props} />
      <Dust />
      <CameraRig affection={props.affection} pointer={props.pointer} />
    </>
  );
}

class GLBoundary extends Component<
  { fallback: ReactNode; children?: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("WebGL scene failed, using video fallback", error, info);
  }
  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

function VideoFallback({ character }: { character: Character }) {
  return (
    <video
      className="absolute inset-0 size-full object-cover"
      src={character.video}
      poster={character.portrait}
      autoPlay
      muted
      loop
      playsInline
    />
  );
}

export function LiveScene(props: LiveSceneProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-bg">
      <img
        src={props.character.portrait}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      {ready ? (
        <GLBoundary fallback={<VideoFallback character={props.character} />}>
          <Canvas
            className="absolute inset-0"
            dpr={[1, 1.6]}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: "high-performance",
            }}
            camera={{ position: [0, 0.05, 2.3], fov: 28, near: 0.1, far: 24 }}
          >
            <Scene {...props} />
          </Canvas>
        </GLBoundary>
      ) : null}
    </div>
  );
}
