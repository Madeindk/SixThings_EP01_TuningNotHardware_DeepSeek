/* Renders a clean dimensional 5-inch quad with a transparent background, for the
 * E cards' cut-out. Replaces src/quad_cutout_PLACEHOLDER.png, which the style
 * lock says must not ship. */
import * as THREE from '../node_modules/three/build/three.module.js';
import { buildQuadInto } from './main.js';

const W = 1200, H = 1000;
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.setClearAlpha(0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, W / H, 10, 9000);

const group = new THREE.Group();
buildQuadInto(group);
// slight bank, so it reads as a flying object rather than an orthographic plan
group.rotation.set(0.34, -0.42, 0.06);
scene.add(group);

scene.add(new THREE.AmbientLight(0x8d9aa6, 1.5));
const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(-320, 620, 460);
scene.add(key);
const fill = new THREE.DirectionalLight(0xa8bccb, 1.0);
fill.position.set(520, 180, 300);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xdfe9f2, 1.2);
rim.position.set(200, 260, -620);
scene.add(rim);

camera.position.set(0, 250, 1150);
camera.lookAt(0, 10, 0);

renderer.render(scene, camera);
window.__cutoutDone = true;
