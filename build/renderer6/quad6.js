/* A 5-inch freestyle quad, adapted from shared/animation-reference/d.js.
 *
 * d.js is the reference this series is meant to build on, and the thing that made
 * its quad read as a drone is the PROP: not modelled blades, but a canvas texture
 * of 14 rotated blade layers per blade, drawn as a radial gradient disc. That is a
 * motion-blurred prop, and at any angle it reads instantly as a quad in flight.
 *
 * Ported here with 6 Things materials instead of the Inside the Log navy/gold, and
 * with a real X frame, motor bells with ribs, a camera cage and a battery.
 */

import * as THREE from 'three';
import { RoomEnvironment } from '/SixThings_EP01/shared/animation-reference/jsm/environments/RoomEnvironment.js';

const ARM = 112;          // centre -> motor, 5" class (~225 mm diagonal)
const PROP_R = 64;        // 5 inch

/* ------------------------------------------------------------------ */
/* textures                                                           */
/* ------------------------------------------------------------------ */
function propTexture() {
  // Motion-blurred 5" tri-blade, exactly the construction from d.js.
  const n = 512, c = document.createElement('canvas');
  c.width = c.height = n;
  const x = c.getContext('2d');
  const cx = n / 2;

  const rg = x.createRadialGradient(cx, cx, n * 0.06, cx, cx, cx);
  rg.addColorStop(0, 'rgba(196,206,218,0.22)');
  rg.addColorStop(0.86, 'rgba(196,206,218,0.11)');
  rg.addColorStop(1, 'rgba(196,206,218,0)');
  x.fillStyle = rg;
  x.beginPath(); x.arc(cx, cx, cx, 0, 7); x.fill();

  for (let b = 0; b < 3; b++) {
    x.save();
    x.translate(cx, cx);
    x.rotate((b * Math.PI * 2) / 3);
    for (let k = 0; k < 14; k++) {
      x.rotate(0.035);
      x.fillStyle = `rgba(212,222,234,${0.055 * (1 - k / 14)})`;
      x.beginPath();
      x.moveTo(0, -4);
      x.quadraticCurveTo(cx * 0.6, -16, cx * 0.96, -6);
      x.lineTo(cx * 0.96, 4);
      x.quadraticCurveTo(cx * 0.6, 8, 0, 4);
      x.fill();
    }
    x.restore();
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function carbonTexture() {
  const N = 128;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  g.fillStyle = '#171a1d'; g.fillRect(0, 0, N, N);
  const cell = 8;
  for (let y = 0; y < N; y += cell) {
    for (let x = 0; x < N; x += cell) {
      const even = ((x / cell) + (y / cell)) % 2 === 0;
      g.fillStyle = even ? '#21262b' : '#101316';
      g.fillRect(x, y, cell, cell);
      g.fillStyle = even ? '#2b3138' : '#171b20';
      g.fillRect(x + 1, y + 1, cell - 2, cell - 2);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function glowTexture() {
  const n = 256, c = document.createElement('canvas');
  c.width = c.height = n;
  const x = c.getContext('2d');
  const rg = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  rg.addColorStop(0, 'rgba(143,232,223,0.55)');
  rg.addColorStop(0.4, 'rgba(143,232,223,0.18)');
  rg.addColorStop(1, 'rgba(143,232,223,0)');
  x.fillStyle = rg; x.fillRect(0, 0, n, n);
  return new THREE.CanvasTexture(c);
}

/* ------------------------------------------------------------------ */
/* build                                                              */
/* ------------------------------------------------------------------ */
export function createQuad(renderer) {
  const scene = new THREE.Scene();
  const weave = carbonTexture();

  const carbon = new THREE.MeshPhysicalMaterial({
    color: 0x2a3036, map: weave, roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.35, metalness: 0.2,
  });
  const carbonPlate = carbon.clone();
  carbonPlate.color = new THREE.Color(0x333a41);
  const bellMat = new THREE.MeshStandardMaterial({ color: 0x8f9aa4, metalness: 0.94, roughness: 0.3 });
  const bellDark = new THREE.MeshStandardMaterial({ color: 0x4e565e, metalness: 0.9, roughness: 0.4 });
  const statorMat = new THREE.MeshStandardMaterial({ color: 0x3b3128, metalness: 0.5, roughness: 0.62 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x767f88, metalness: 0.92, roughness: 0.34 });
  const plastic = new THREE.MeshPhysicalMaterial({ color: 0x14181c, roughness: 0.68, metalness: 0.03 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x0a1016, roughness: 0.04, metalness: 0.3, clearcoat: 1 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x0b0d0f, roughness: 0.96, metalness: 0 });
  const heatMat = new THREE.MeshStandardMaterial({
    color: 0x9d6a3c, metalness: 0.6, roughness: 0.45, emissive: 0x3a1a08, emissiveIntensity: 0,
  });
  // PCB: dark green-black with a faint trace sheen, the way a real stack reads
  const pcbMat = new THREE.MeshPhysicalMaterial({
    color: 0x16202a, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.3, metalness: 0.05,
  });
  const chipMat = new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: 0.5, metalness: 0.1 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x8a7a63, roughness: 0.62, metalness: 0.25 });
  const wireMat = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.75, metalness: 0.05 });

  let motorsWires = [];

  const Q = new THREE.Group();
  scene.add(Q);

  const propTex = propTexture();
  const glowTex = glowTexture();

  /* --- frame --- */
  const MP = [[1, -1], [1, 1], [-1, -1], [-1, 1]].map(([x, z]) => [x * ARM / Math.SQRT2, z * ARM / Math.SQRT2]);

  for (const [x, z] of MP) {
    const len = ARM + 10;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(13.5, 4.6, len), carbon);
    arm.position.set(x / 2, 0, z / 2);
    arm.rotation.y = Math.atan2(x, z);
    arm.castShadow = true;
    Q.add(arm);
  }

  const bottom = new THREE.Mesh(new THREE.BoxGeometry(50, 4, 92), carbonPlate);
  bottom.castShadow = true;
  Q.add(bottom);
  const top = new THREE.Mesh(new THREE.BoxGeometry(42, 3, 84), carbonPlate);
  top.position.y = 30;
  top.castShadow = true;
  Q.add(top);

  for (const [x, z] of [[-17, -38], [17, -38], [-17, 38], [17, 38]]) {
    const so = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 28, 14), metal);
    so.position.set(x, 15, z);
    Q.add(so);
  }

  /* --- flight stack: ESC board, FC board, standoffs, wiring --- */
  {
    const stackY = 8;
    // ESC board (bottom of the stack): visible outside the FC footprint
    const escPcb = new THREE.Mesh(new THREE.BoxGeometry(38, 1.6, 38), pcbMat);
    escPcb.position.y = stackY;
    escPcb.castShadow = true;
    Q.add(escPcb);
    // electrolytic capacitor standing at the rear of the ESC
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 13, 18), capMat);
    cap.position.set(-13, stackY + 8, 15);
    cap.rotation.x = 0.18;
    Q.add(cap);
    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 1.2, 18), metal);
    capTop.position.set(-13, stackY + 14.6, 15.1);
    capTop.rotation.x = 0.18;
    Q.add(capTop);

    // FC board, four standoffs, USB, boot button, gyro can
    const fcBoard = new THREE.Mesh(new THREE.BoxGeometry(36, 1.6, 36), pcbMat);
    fcBoard.position.y = 21;
    fcBoard.castShadow = true;
    Q.add(fcBoard);

    for (const [sx, sz] of [[-15, -15], [15, -15], [-15, 15], [15, 15]]) {
      const so = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 12, 12), metal);
      so.position.set(sx, stackY + 8.5, sz);
      Q.add(so);
    }

    const mcu = new THREE.Mesh(new THREE.BoxGeometry(10, 1.5, 10), chipMat);
    mcu.position.y = 22.3; mcu.rotation.y = Math.PI / 4; Q.add(mcu);
    // the gyro is a small metal can: recognisable, and it is what sign four is about
    const gyroCan = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.3, 4.4), metal);
    gyroCan.position.set(9, 22.2, 9); Q.add(gyroCan);
    const usb = new THREE.Mesh(new THREE.BoxGeometry(7.6, 2.6, 5.2), metal);
    usb.position.set(0, 22.6, 14.6); Q.add(usb);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 2), capMat);
    boot.position.set(12, 22.3, 12.5); Q.add(boot);

    // motor wires: three thin leads from each ESC corner out along the arm
    motorsWires = [];
    for (const [x, z] of MP) {
      for (let k = 0; k < 3; k++) {
        const a = Math.atan2(z, x);
        const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, ARM * 0.92, 6), wireMat);
        const mx = x * 0.52, mz = z * 0.52;
        wire.position.set(mx + Math.cos(a + Math.PI / 2) * (k - 1) * 3.2, 3.2, mz + Math.sin(a + Math.PI / 2) * (k - 1) * 3.2);
        wire.rotation.z = Math.PI / 2;
        wire.rotation.y = -a;
        Q.add(wire);
        motorsWires.push(wire);
      }
    }

    // battery lead: XT60 from the ESC out to the pack
    const xt60 = new THREE.Mesh(new THREE.BoxGeometry(9, 6, 8), plastic);
    xt60.position.set(14, 12, 26); Q.add(xt60);
    const lead = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 14, 8), rubber);
    lead.position.set(10, 20, 30); lead.rotation.z = 0.6; Q.add(lead);
  }

  /* --- camera cage --- */
  {
    const cy = 17;
    const plateL = new THREE.Mesh(new THREE.BoxGeometry(2.2, 26, 24), carbon);
    plateL.position.set(-12, cy, -50); Q.add(plateL);
    const plateR = plateL.clone(); plateR.position.x = 12; Q.add(plateR);
    const brace = new THREE.Mesh(new THREE.BoxGeometry(26, 2.2, 20), carbon);
    brace.position.set(0, cy + 13, -50); Q.add(brace);

    const hood = new THREE.Group();
    hood.position.set(0, cy + 2, -48);
    hood.rotation.x = -0.46;
    const body = new THREE.Mesh(new THREE.BoxGeometry(19, 19, 13), plastic);
    body.castShadow = true;
    hood.add(body);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(7.3, 7.3, 6, 26), plastic);
    barrel.rotation.x = Math.PI / 2; barrel.position.z = 8.5; hood.add(barrel);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(6.1, 6.1, 1.2, 26), glass);
    lens.rotation.x = Math.PI / 2; lens.position.z = 11.6; hood.add(lens);
    Q.add(hood);
  }

  /* --- battery on the deck --- */
  {
    const pack = new THREE.Mesh(new THREE.BoxGeometry(38, 24, 72), plastic);
    pack.position.set(0, 42, 4); pack.castShadow = true; Q.add(pack);
    for (const z of [-18, 22]) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(42, 2.4, 10), rubber);
      strap.position.set(0, 42, z); Q.add(strap);
    }
    const lead = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 15, 10), rubber);
    lead.rotation.x = 1.2; lead.position.set(0, 44, 46); Q.add(lead);
  }

  /* --- antenna --- */
  {
    const a = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 10), plastic);
    base.position.y = 2.5; a.add(base);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 54, 8), plastic);
    stem.position.y = 32; a.add(stem);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 16, 12), plastic);
    tip.position.y = 64; a.add(tip);
    a.position.set(0, 54, 38);
    a.rotation.x = 0.3;
    Q.add(a);
  }

  /* --- motors + props --- */
  const motors = MP.map(([x, z], i) => {
    const grp = new THREE.Group();
    grp.position.set(x, 2.5, z);
    Q.add(grp);

    const stator = new THREE.Mesh(new THREE.CylinderGeometry(13, 14, 7, 36), statorMat);
    stator.position.y = 3.5; stator.castShadow = true; grp.add(stator);

    const can = new THREE.Mesh(new THREE.CylinderGeometry(13.6, 13.6, 13, 44), bellMat);
    can.position.y = 13.5; can.castShadow = true; grp.add(can);

    for (let r = 0; r < 6; r++) {
      const a = (r / 6) * Math.PI * 2;
      const rib = new THREE.Mesh(new THREE.BoxGeometry(2.4, 8.4, 3), bellDark);
      rib.position.set(Math.cos(a) * 12.8, 14.2, Math.sin(a) * 12.8);
      rib.rotation.y = -a;
      grp.add(rib);
    }

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 1.6, 44), metal);
    rim.position.y = 20.4; grp.add(rim);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 4, 12), metal);
    shaft.position.y = 22.4; grp.add(shaft);

    // the prop is a textured disc, exactly as in d.js
    const prop = new THREE.Mesh(
      new THREE.CircleGeometry(PROP_R, 64),
      new THREE.MeshBasicMaterial({ map: propTex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    );
    prop.rotation.x = -Math.PI / 2;
    prop.position.y = 23;
    prop.userData.dir = i === 0 || i === 3 ? 1 : -1;
    grp.add(prop);

    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(150, 150),
      new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 23.6;
    grp.add(glow);

    return { grp, prop, glow, can };
  });

  /* --- lights, environment, floor --- */
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.08, 0.1, 100).texture;
  pmrem.dispose();

  const key = new THREE.SpotLight(0xD2DEE6, 2600, 0, Math.PI / 6.2, 0.62, 1.15);
  key.position.set(-190, 540, 300);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -300, right: 300, top: 300, bottom: -300, near: 80, far: 1400 });
  key.shadow.radius = 6;
  key.shadow.bias = -0.0006;
  scene.add(key, key.target);

  const rim = new THREE.DirectionalLight(0x7f97a8, 1.5);
  rim.position.set(320, 150, -320);
  scene.add(rim);

  scene.add(new THREE.HemisphereLight(0x8fa6b8, 0x080b0e, 0.5));

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.ShadowMaterial({ opacity: 0.42 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -80;
  ground.receiveShadow = true;
  scene.add(ground);

  scene.fog = new THREE.Fog(0x0B0E12, 1100, 2600);

  return { scene, Q, motors, materials: { carbon, bellMat, heatMat, metal } };
}

/* A pine silhouette, for the opening drop. */
export function createTree() {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0x0c1116, transparent: true, opacity: 0.96, side: THREE.DoubleSide });
  for (const [r, h, y] of [[150, 300, 40], [122, 270, 240], [95, 230, 420], [60, 180, 570]]) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 9, 1, true), mat);
    cone.position.y = y + h / 2;
    g.add(cone);
  }
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(15, 18, 90, 8), mat);
  trunk.position.y = 45;
  g.add(trunk);
  return g;
}
