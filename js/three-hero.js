/**
 * Lightweight Three.js cinematic hero
 * - Wireframe icosahedron + point cloud
 * - Pointer parallax / rotation
 * - Reduced motion + mobile fallback (no WebGL)
 */
(function () {
  const MOBILE_MQ = window.matchMedia('(max-width: 768px)');
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

  function shouldSkip() {
    return REDUCED.matches || !window.WebGLRenderingContext;
  }

  async function loadThree() {
    // Prefer global if already present
    if (window.THREE) return window.THREE;
    const mod = await import('https://unpkg.com/three@0.170.0/build/three.module.js');
    return mod;
  }

  function createScene(THREE, mount) {
    const w = mount.clientWidth || 320;
    const h = mount.clientHeight || 340;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.cssText =
      'width:100%;height:100%;display:block;pointer-events:none;';

    // Core mesh — morphing-feel via slow scale + rotation
    const geo = new THREE.IcosahedronGeometry(1.15, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // Inner glow sphere
    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.7, 0),
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        wireframe: true,
        transparent: true,
        opacity: 0.35
      })
    );
    scene.add(inner);

    // Particle field around mesh
    const COUNT = MOBILE_MQ.matches ? 180 : 420;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const c1 = new THREE.Color(0x6366f1);
    const c2 = new THREE.Color(0x22d3ee);
    const c3 = new THREE.Color(0xa78bfa);
    for (let i = 0; i < COUNT; i++) {
      const r = 1.6 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const mix = Math.random();
      const col = mix < 0.33 ? c1 : mix < 0.66 ? c2 : c3;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    // Soft ambient-like fill via second wire torus
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.85, 0.02, 8, 64),
      new THREE.MeshBasicMaterial({
        color: 0xa78bfa,
        transparent: true,
        opacity: 0.4
      })
    );
    ring.rotation.x = Math.PI / 2.4;
    scene.add(ring);

    let targetRotX = 0;
    let targetRotY = 0;
    let raf = 0;
    let running = true;

    function onPointer(e) {
      const rect = mount.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = nx * 0.55;
      targetRotX = ny * 0.35;
    }

    const hero = document.getElementById('hero');
    hero?.addEventListener('pointermove', onPointer);

    function resize() {
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      if (!nw || !nh) return;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    }
    window.addEventListener('resize', resize);

    const clock = new THREE.Clock();
    function animate() {
      if (!running) return;
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      mesh.rotation.x += (targetRotX - mesh.rotation.x) * 0.04;
      mesh.rotation.y += (targetRotY + t * 0.15 - mesh.rotation.y) * 0.04;
      inner.rotation.y = -t * 0.25;
      inner.rotation.x = t * 0.12;

      const s = 1 + Math.sin(t * 0.8) * 0.04;
      mesh.scale.setScalar(s);

      points.rotation.y = t * 0.08;
      points.rotation.x = Math.sin(t * 0.2) * 0.1;
      ring.rotation.z = t * 0.1;

      renderer.render(scene, camera);
    }
    animate();

    // Pause when off-screen
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          running = en.isIntersecting;
          if (running) animate();
          else cancelAnimationFrame(raf);
        });
      },
      { threshold: 0.05 }
    );
    io.observe(mount);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      hero?.removeEventListener('pointermove', onPointer);
      window.removeEventListener('resize', resize);
      geo.dispose();
      mat.dispose();
      pGeo.dispose();
      pMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }

  async function init() {
    const mount = document.getElementById('threeHero');
    if (!mount) return;

    if (shouldSkip() || MOBILE_MQ.matches) {
      mount.classList.add('three-fallback');
      mount.innerHTML =
        '<div class="three-fallback-orb"></div><div class="three-fallback-ring"></div>';
      return;
    }

    try {
      const THREE = await loadThree();
      createScene(THREE, mount);
    } catch (e) {
      console.warn('[MKA] Three.js failed, CSS fallback', e);
      mount.classList.add('three-fallback');
      mount.innerHTML =
        '<div class="three-fallback-orb"></div><div class="three-fallback-ring"></div>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
