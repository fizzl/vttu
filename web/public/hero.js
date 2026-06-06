/**
 * VTTU — decorative hero backdrop.
 *
 * The "subtle but impressive" layer from doc/dazzle.md: a slow field of
 * low-poly grey facets under a single warm light, exactly one orange spark,
 * a sub-perceptual breathing motion (nothing spins), and pointer parallax
 * capped at 5%. prefers-reduced-motion freezes it to one handsome frame.
 *
 * Three.js is imported straight from a CDN as an ES module, so there is no
 * build step and nothing in package.json. This file is hand-written JS and is
 * NOT part of the tsc build.
 */

import * as THREE from "https://esm.sh/three@0.160.0";

const canvas = document.querySelector("#hero-canvas");

if (canvas) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Palette tokens, mirrored from styles.css (Three.js needs numbers).
  const GREY_050 = 0xfbfbf9;
  const GREY_100 = 0xf0efec;
  const YELLOW_100 = 0xfcefc1;
  const ORANGE_500 = 0xf26419;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  const BASE_Z = 9;
  camera.position.set(0, 0, BASE_Z);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true, // transparent — the grey hero body shows through
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // A single warm key light grazes the facets, pushing highlights toward
  // yellow-100; soft warm ambient keeps the shadows from going cold.
  const key = new THREE.DirectionalLight(YELLOW_100, 1.7);
  key.position.set(-4, 5, 6);
  scene.add(key);
  scene.add(new THREE.AmbientLight(GREY_100, 1.0));

  // The field of low-poly grey facets. flatShading gives the hard, faceted
  // look; it reads almost still.
  const field = new THREE.Group();
  scene.add(field);

  const greyMat = new THREE.MeshStandardMaterial({
    color: GREY_050,
    flatShading: true,
    roughness: 0.85,
    metalness: 0.0,
  });

  // Pebbles mirrored across the vertical axis (x negated) from the original
  // layout, so the composition reads as its own reflection.
  const shapes = [
    { geo: new THREE.IcosahedronGeometry(2.4, 1), pos: [2.2, 0.2, 0.0] },
    { geo: new THREE.IcosahedronGeometry(1.5, 1), pos: [-2.4, -0.9, -1.5] },
    { geo: new THREE.DodecahedronGeometry(1.1, 0), pos: [-1.5, 1.5, -2.6] },
  ];
  for (const s of shapes) {
    const mesh = new THREE.Mesh(s.geo, greyMat);
    mesh.position.set(s.pos[0], s.pos[1], s.pos[2]);
    mesh.rotation.set(0.4, 0.7, 0.0);
    field.add(mesh);
  }

  // The one orange element — the spark that ties the scene to the palette.
  const spark = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.5, 0),
    new THREE.MeshStandardMaterial({
      color: ORANGE_500,
      flatShading: true,
      roughness: 0.5,
    }),
  );
  spark.position.set(-3.0, 1.1, 0.6);
  field.add(spark);

  // Pointer parallax target, in normalized [-1, 1] coordinates.
  const pointer = { x: 0, y: 0 };
  if (!reduced) {
    window.addEventListener("pointermove", (event) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    });
  }

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  const MAX_LEAN = BASE_Z * 0.05; // ≤5% parallax — the whole motion budget

  function render(t) {
    const time = t / 1000;

    // Breathe: a sub-perceptual sway over 15–22s loops. Nothing spins.
    field.rotation.y = Math.sin(time / 15) * 0.15;
    field.rotation.x = Math.cos(time / 22) * 0.08;

    // The spark drifts and bobs gently rather than spinning.
    spark.position.y = 1.1 + Math.sin(time / 6) * 0.25;
    spark.rotation.y = Math.sin(time / 9) * 0.6;

    // Lean the camera a hair toward the cursor, then settle.
    camera.position.x += (pointer.x * MAX_LEAN - camera.position.x) * 0.05;
    camera.position.y += (-pointer.y * MAX_LEAN - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  if (reduced) {
    // One handsome, frozen frame.
    render(0);
  } else {
    renderer.setAnimationLoop(render);
  }
}
