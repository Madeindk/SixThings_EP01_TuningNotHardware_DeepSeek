/* A 5-inch freestyle FPV quad.
 *
 * THIS FILE IS A PORT of shared/animation-reference/d.js, the scene that already
 * renders a convincing drone. The geometry, proportions, materials and light rig
 * are taken from it directly rather than re-invented, because the earlier
 * from-scratch model read as a stack of boxes and then as a flat spider.
 *
 * What d.js gets right, and what is therefore kept verbatim:
 *   - ARM = 112 (5" class), motors on a true X at ±ARM/√2
 *   - arms as long thin boxes rotated about the centre, not a plate
 *   - a physical carbon material with clearcoat, so the airframe catches highlights
 *   - the prop as a 64-segment CircleGeometry carrying a canvas texture of three
 *     blade smears, drawn with MeshBasicMaterial so it stays bright regardless of
 *     lighting. This is the single most important detail.
 *   - a shiny torus ring on each motor
 *   - RoomEnvironment as scene.environment, one warm key with shadows, a rim light
 *   - a 30-degree camera at ~900 from the centre, elevated ~38 degrees
 *
 * Added on top (the parts this episode needs to talk about): camera cage and lens,
 * ESC and FC boards with visible chips, gyro can, USB, boot button, capacitor,
 * XT60, three motor wires per arm, battery with straps, two antennas, and a
 * heat-capable bell for sign two.
 */

import * as THREE from 'three';
import { RoomEnvironment } from '/SixThings_EP01/shared/animation-reference/jsm/environments/RoomEnvironment.js';

const ARM = 112;          // centre -> motor, 5" class (~225 mm diagonal)
const PROP_R = 64;        // 5 inch

/* ------------------------------------------------------------------ */
/* prop texture: the construction from d.js                            */
/* ------------------------------------------------------------------ */
function propTexture() {
  const n = 512;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const x = c.getContext('2d');
  const cx = n / 2;

  const rg = x.createRadialGradient(cx, cx, n * 0.06, cx, cx, cx);
  rg.addColorStop(0, 'rgba(200,210,225,0.20)');
  rg.addColorStop(0.85, 'rgba(200,210,225,0.10)');
  rg.addColorStop(1, 'rgba(200,210,225,0)');
  x.fillStyle = rg;
  x.beginPath(); x.arc(cx, cx, cx, 0, 7); x.fill();

  for (let b = 0; b < 3; b++) {
    x.save();
    x.translate(cx, cx);
    x.rotate((b * Math.PI * 2) / 3);
    for (let k = 0; k < 14; k++) {
      x.rotate(0.035);
      x.fillStyle = `rgba(220,228,240,${0.05 * (1 - k / 14)})`;
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
  return t;
}

function glowTexture() {
  const n = 256;
  const c = document.createElement('canvas');
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

  /* --- materials, in the manner of d.js --- */
  const carbon = new THREE.MeshPhysicalMaterial({ color: 0x17191d, roughness: 0.38, clearcoat: 0.8, clearcoatRoughness: 0.25 });
  const carbonPlate = new THREE.MeshPhysicalMaterial({ color: 0x1c1f24, roughness: 0.34, clearcoat: 0.85, clearcoatRoughness: 0.22 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x2a2e35, metalness: 0.9, roughness: 0.35 });
  const bellSteel = new THREE.MeshStandardMaterial({ color: 0x202329, metalness: 0.85, roughness: 0.3 });
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xd8b25a, metalness: 1, roughness: 0.3, emissive: 0xe9c873, emissiveIntensity: 0.2,
  });
  const pcb = new THREE.MeshPhysicalMaterial({ color: 0x121823, roughness: 0.45, clearcoat: 0.6 });
  const chipMat = new THREE.MeshStandardMaterial({ color: 0x0d0f12, roughness: 0.5 });
  const plastic = new THREE.MeshPhysicalMaterial({ color: 0x14181c, roughness: 0.66, metalness: 0.04 });
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a0d14, roughness: 0.05, metalness: 0.2, clearcoat: 1,
  });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x0a0c0e, roughness: 0.97 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x8d7d66, roughness: 0.6, metalness: 0.28 });
  const wireMat = new THREE.MeshStandardMaterial({ color: 0x1b1512, roughness: 0.76 });
  const heatMat = new THREE.MeshStandardMaterial({
    color: 0x8a8d90, metalness: 0.9, roughness: 0.34, emissive: 0x5a2a10, emissiveIntensity: 0,
  });

  const Q = new THREE.Group();
  scene.add(Q);

  const propTex = propTexture();
  const glowTex = glowTexture();

  /* --- arms: the d.js construction (centre -> motor, thin boxes) --- */
  const corners = [[1, -1], [1, 1], [-1, -1], [-1, 1]];        // FR, RR, FL, RL
  const MP = corners.map(([x, z]) => [x * ARM / Math.SQRT2, z * ARM / Math.SQRT2]);

  for (const [x, z] of MP) {
    const len = ARM + 8;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(14, 5, len), carbon);
    arm.position.set(x / 2, 0, z / 2);
    arm.rotation.y = Math.atan2(x, z);
    arm.castShadow = true;
    Q.add(arm);

    // motor pad and four bolts, so the arm tip reads as machined
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 1.6, 24), carbonPlate);
    pad.position.set(x, 2.6, z);
    Q.add(pad);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2.4, 8), metal);
      bolt.position.set(x + Math.cos(a) * 9.2, 3.2, z + Math.sin(a) * 9.2);
      Q.add(bolt);
    }
  }

  /* --- plates: d.js proportions --- */
  {
    const bot = new THREE.Mesh(new THREE.BoxGeometry(46, 4, 96), carbonPlate);
    bot.castShadow = true;
    Q.add(bot);

    const top = new THREE.Mesh(new THREE.BoxGeometry(40, 3, 90), carbonPlate);
    top.position.y = 30;
    top.castShadow = true;
    Q.add(top);

    for (const [sx, sz] of [[-17, -40], [17, -40], [-17, 40], [17, 40]]) {
      const so = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 28, 16), metal);
      so.position.set(sx, 15, sz);
      Q.add(so);
    }

    // ESC board, with visible MOSFETs — the part that heats up
    const esc = new THREE.Mesh(new THREE.BoxGeometry(38, 1.6, 40), pcb);
    esc.position.y = 9;
    esc.castShadow = true;
    Q.add(esc);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const mos = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.3, 6.4), chipMat);
      mos.position.set(Math.cos(a) * 13, 10.2, Math.sin(a) * 15.5);
      mos.rotation.y = -a;
      Q.add(mos);
    }
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 12, 18), capMat);
    cap.position.set(-13, 15.6, 16);
    cap.rotation.x = 0.16;
    Q.add(cap);

    // FC board — d.js has it as a clearcoated plate with an MCU
    const fc = new THREE.Mesh(new THREE.BoxGeometry(36, 1.6, 36), pcb);
    fc.position.y = 20.5;
    fc.castShadow = true;
    Q.add(fc);
    const mcu = new THREE.Mesh(new THREE.BoxGeometry(10, 1.4, 10), chipMat);
    mcu.position.y = 21.7; mcu.rotation.y = Math.PI / 4; Q.add(mcu);
    // the gyro: a small metal can, and sign four is about this chip
    const gyro = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.3, 4.6), metal);
    gyro.position.set(9, 21.6, 9); Q.add(gyro);
    const usb = new THREE.Mesh(new THREE.BoxGeometry(7.6, 2.6, 5), metal);
    usb.position.set(0, 22.1, 14.4); Q.add(usb);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 2), capMat);
    boot.position.set(12, 21.6, 12.4); Q.add(boot);

    // motor wires: three per arm, running from the ESC out along the arm
    for (const [mx, mz] of MP) {
      const a = Math.atan2(mz, mx);
      for (let k = 0; k < 3; k++) {
        const off = (k - 1) * 3.2;
        const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, ARM * 0.9, 6), wireMat);
        wire.position.set(
          Math.cos(a) * ARM * 0.52 - Math.sin(a) * off,
          4.4,
          Math.sin(a) * ARM * 0.52 + Math.cos(a) * off,
        );
        wire.rotation.z = Math.PI / 2;
        wire.rotation.y = -a;
        Q.add(wire);
      }
    }

    const xt60 = new THREE.Mesh(new THREE.BoxGeometry(9, 6, 8), plastic);
    xt60.position.set(14, 12, 26); Q.add(xt60);
  }

  /* --- camera cage at the front, lens facing forward --- */
  {
    const cage = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 18), metal);
    cage.position.set(0, 16, -52);
    Q.add(cage);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 6, 24), lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 16, -62);
    Q.add(lens);
    // side plates, so the cage reads as carbon rather than as a floating block
    for (const sx of [-12, 12]) {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(2.2, 22, 20), carbon);
      plate.position.set(sx, 14, -52);
      Q.add(plate);
    }
  }

  /* --- battery on the deck, two straps --- */
  {
    const pack = new THREE.Mesh(new THREE.BoxGeometry(36, 22, 70), plastic);
    pack.position.set(0, 42, 4);
    pack.castShadow = true;
    Q.add(pack);
    for (const z of [-18, 22]) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(40, 2.2, 9), rubber);
      strap.position.set(0, 42, z);
      Q.add(strap);
    }
  }

  /* --- antennas at the rear --- */
  {
    for (const [ax, rot] of [[-11, 0.30], [11, -0.22]]) {
      const a = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(9, 4.5, 9), plastic);
      base.position.y = 2.2; a.add(base);
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 14, 10), plastic);
      stalk.position.y = 11; a.add(stalk);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 48, 8), plastic);
      stem.position.y = 40; a.add(stem);
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 15, 12), plastic);
      tip.position.y = 60; a.add(tip);
      a.position.set(ax, 52, 34);
      a.rotation.x = rot;
      Q.add(a);
    }
  }

  /* --- motors + props: the d.js construction --- */
  const motors = MP.map(([x, z], i) => {
    const grp = new THREE.Group();
    grp.position.set(x, 2.5, z);
    Q.add(grp);

    const stator = new THREE.Mesh(new THREE.CylinderGeometry(13, 14, 8, 40), metal);
    stator.position.y = 4;
    stator.castShadow = true;
    grp.add(stator);

    const bell = new THREE.Mesh(new THREE.CylinderGeometry(13.5, 13.5, 12, 48), bellSteel);
    bell.position.y = 14;
    bell.castShadow = true;
    grp.add(bell);

    // the shiny ring is what makes the motor read as machined aluminium
    const ring = new THREE.Mesh(new THREE.TorusGeometry(13.6, 0.9, 12, 64), ringMat.clone());
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 20;
    grp.add(ring);

    const nut = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 3, 6), metal);
    nut.position.y = 22.4;
    grp.add(nut);

    // the prop disc, exactly as d.js draws it: MeshBasicMaterial, so it stays
    // bright no matter how the studio is lit
    const prop = new THREE.Mesh(
      new THREE.CircleGeometry(PROP_R, 64),
      new THREE.MeshBasicMaterial({ map: propTex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    );
    prop.rotation.x = -Math.PI / 2;
    prop.position.y = 24;
    grp.add(prop);

    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(150, 150),
      new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 24.5;
    grp.add(glow);

    return { grp, prop, glow, bell, ring, dir: i === 0 || i === 3 ? 1 : -1 };
  });

  /* --- light rig: the d.js setup, plus a floor that exists --- */
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xfff1dc, 2.0);
  key.position.set(-150, 400, 200);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -260, right: 260, top: 260, bottom: -260, near: 50, far: 1000 });
  key.shadow.radius = 8;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xe9c873, 1.0);
  rim.position.set(300, 120, -300);
  scene.add(rim);

  scene.add(new THREE.HemisphereLight(0x8fa6c8, 0x0b111d, 1.1));
  scene.add(new THREE.AmbientLight(0x4a5866, 0.7));

  // A visible floor, and a shadow catcher on it. d.js used a bare ShadowMaterial,
  // which is invisible against a void, so the studio had no ground at all.
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x252d36, roughness: 0.88, metalness: 0.02 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -90;
  floor.receiveShadow = true;
  scene.add(floor);

  // soft pool of light on the floor, fading to void
  const poolTex = (() => {
    const n = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = n;
    const c2 = cv.getContext('2d');
    const rg = c2.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    rg.addColorStop(0, 'rgba(150,175,195,0.50)');
    rg.addColorStop(0.5, 'rgba(120,145,168,0.16)');
    rg.addColorStop(1, 'rgba(120,145,168,0)');
    c2.fillStyle = rg; c2.fillRect(0, 0, n, n);
    return new THREE.CanvasTexture(cv);
  })();
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(2400, 2400),
    new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, opacity: 0.85 })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = -89;
  scene.add(pool);

  scene.fog = new THREE.Fog(0x0B0E12, 1400, 3200);

  return {
    scene, Q, motors,
    materials: { carbon, metal, bellSteel, heatMat, ringMat },
  };
}

/* A pine silhouette for the opening drop. */
export function createTree() {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0x0b1014, transparent: true, opacity: 0.97, side: THREE.DoubleSide });
  for (const [r, h, y] of [[160, 320, 40], [130, 290, 250], [100, 250, 440], [64, 190, 600]]) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 9, 1, true), mat);
    cone.position.y = y + h / 2;
    g.add(cone);
  }
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(16, 19, 100, 8), mat);
  trunk.position.y = 50;
  g.add(trunk);
  return g;
}
