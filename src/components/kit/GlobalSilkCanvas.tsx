import { useEffect, useRef } from "react";
import * as THREE from "three";

export function GlobalSilkCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Light / Slate Silk Wave Shader responding to mouse movement
    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uResolution: { value: new THREE.Vector2(width, height) },
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform vec2 uResolution;
        uniform float uTime;
        uniform vec2 uMouse;

        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m;
          m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
          vec2 uv = vUv;
          vec2 anchor = vec2(0.68 + uMouse.x * 0.04, 0.48 + uMouse.y * 0.04);
          vec2 centered = uv - anchor;
          
          float angle = -0.42;
          mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
          vec2 p = rot * centered;

          float t = uTime * 0.35;

          float wave1 = sin(p.y * 2.2 + t * 0.85) * 0.28;
          float wave2 = cos(p.y * 4.4 - t * 1.15 + p.x * 1.4) * 0.16;
          float wave3 = sin(p.y * 8.0 + t * 1.45) * 0.08;
          float noise = snoise(p * 1.8 + vec2(t * 0.2, -t * 0.12)) * 0.16;

          float ribbonCoord = p.x + (wave1 + wave2 + wave3 + noise);

          float silk1 = sin(p.y * 14.0 + ribbonCoord * 22.0 + t * 1.5);
          float silk2 = cos(p.y * 22.0 - ribbonCoord * 16.0 - t * 1.1);
          float silkTexture = (silk1 * 0.5 + silk2 * 0.5) * 0.08;

          // Light Slate & Subtle Silver Grey Palette (Harmonious with clean white background)
          vec3 cDarkCharcoal = vec3(0.22, 0.24, 0.28);
          vec3 cMidSlate     = vec3(0.48, 0.52, 0.58);
          vec3 cSilverGrey   = vec3(0.72, 0.76, 0.82);
          vec3 cLightFrost   = vec3(0.90, 0.92, 0.96);
          vec3 cGlint        = vec3(1.0, 1.0, 1.0);

          float norm = (ribbonCoord + 0.35) * 1.5 + silkTexture;

          vec3 color = cDarkCharcoal;
          color = mix(color, cMidSlate,   smoothstep(-0.35, 0.10, norm));
          color = mix(color, cSilverGrey, smoothstep(0.05, 0.45, norm));
          color = mix(color, cLightFrost, smoothstep(0.40, 0.78, norm));
          color = mix(color, cGlint,      smoothstep(0.72, 1.10, norm));

          // Silk Sheen Reflections
          float sheen1 = pow(clamp(sin(p.y * 3.6 + t * 0.85 + ribbonCoord * 4.0) * 0.5 + 0.5, 0.0, 1.0), 4.5);
          float sheen2 = pow(clamp(cos(p.y * 5.8 - t * 1.1 + ribbonCoord * 3.0) * 0.5 + 0.5, 0.0, 1.0), 5.5);
          float strandGlint = pow(clamp(silk1 * 0.5 + 0.5, 0.0, 1.0), 6.0) * 0.35;

          color += cGlint * (sheen1 * 0.45 + sheen2 * 0.25 + strandGlint);

          // Ribbon width & mask
          float ribbonWidth = 0.95;
          float distCenter = abs(ribbonCoord - 0.05);

          float mask = smoothstep(ribbonWidth, 0.02, distCenter);
          mask = pow(mask, 1.05);

          float outerGlow = smoothstep(ribbonWidth * 2.2, 0.0, distCenter) * 0.45;

          vec3 finalColor = color + cSilverGrey * outerGlow * 0.25;
          float alpha = clamp(mask * 0.65 + outerGlow * 0.3, 0.0, 0.85);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    // Mouse Tracking
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      mouse.targetX = x * 2;
      mouse.targetY = -y * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Resize
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      material.uniforms.uResolution.value.set(width, height);
    };
    window.addEventListener("resize", handleResize);

    const clock = new THREE.Clock();
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      material.uniforms.uTime.value = elapsed;

      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;
      material.uniforms.uMouse.value.set(mouse.x, mouse.y);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-40"
      aria-hidden="true"
    />
  );
}
