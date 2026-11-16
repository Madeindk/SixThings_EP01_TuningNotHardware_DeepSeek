/* A 5-inch freestyle FPV quad, modelled to real proportions in millimetres.
 *
 * References used: the working EP-series scene d.js (prop-disc technique) and a
 * photographic side-by-side of real race quads, which showed what the earlier
 * model got wrong:
 *
 *   - the PROPS dominate the silhouette. A 5" prop is 127 mm across on a 220 mm
 *     diagonal frame, so each disc is more than half the frame's width.
 *   - the ARMS are thin and taper towards the motor; they are not planks.
 *   - the BODY is narrow and tall: battery strapped on the deck, stack between
 *     two plates, camera in a cage at the front.
 *   - every motor has a raised bell with a prop nut, and the bell is wider than
 *     the stator it sits on.
 *
 * A prop is drawn twice: modelled blades for low RPM, and a motion-blurred disc
 * texture for high RPM. Cross-fading between them is what makes the spin read as
 * rotation rather than a spinning flat disc. The disc construction (14 rotated
 * blade layers per blade) is the technique from the reference scene.
 */

import * as THREE from 'three';
import { RoomEnvironment } from '/SixThings_EP01/shared/animation-reference/jsm/environments/RoomEnvironment.js';

/* real 5" freestyle numbers */
const ARM_DIAG = 112;     // centre -> motor axis (220 mm motor-to-motor diagonal)
const PROP_R = 63.5;      // 5 inch
const MOTOR_BELL_R = 14.2; // 28.4 mm bell on a 2207 stator
const ARM_ROOT_W = 13;
const ARM_TIP_W = 6.4;
const ARM_T = 4.4;

/* ------------------------------------------------------------------ */
/* textures                                                           */
/* ------------------------------------------------------------------ */
function blurredPropTexture() {
  const n = 512;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const x = c.getContext('2d');
  const cx = n / 2;

  // one blade outline, swept and tapered, then stamped at 14 angles per blade
  const blade = (px, py, scale) => {
    x.beginPath();
    x.moveTo(cx + px, cx + py);
    x.bezierCurveTo(cx + 70 * scale, cx - 26 * scale, cx + 150 * scale, cx - 30 * scale, cx + 236 * scale, cx - 10 * scale);
    x.lineTo(cx + 236 * scale, cx + 10 * scale);
    x.bezierCurveTo(cx + 150 * scale, cx + 6 * scale, cx + 70 * scale, cx + 20 * scale, cx + px, cx + py);
    x.closePath();
    x.fill();
  };

  const hub = x.createRadialGradient(cx, cx, 0, cx, cx, 26);
  hub.addColorStop(0, 'rgba(210,220,232,0.55)');
  hub.addColorStop(1, 'rgba(210,220,232,0)');
  x.fillStyle = hub;
  x.beginPath(); x.arc(cx, cx, 26, 0, 7); x.fill();

  for (let b = 0; b < 3; b++) {
    x.save();
    x.translate(cx, cx);
    x.rotate((b * Math.PI * 2) / 3);
    for (let k = 0; k < 14; k++) {
      x.rotate(0.032);
      x.fillStyle = `rgba(206,216,228,${0.075 * (1 - k / 14)})`;
      blade(0, 0, 1);
    }
    x.restore();
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function carbonWeave() {
  const N = 128;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  g.fillStyle = '#15181b'; g.fillRect(0, 0, N, N);
  const cell = 8;
  for (let y = 0; y < N; y += cell) {
    for (let x = 0; x < N; x += cell) {
      const even = ((x / cell) + (y / cell)) % 2 === 0;
      g.fillStyle = even ? '#1f2429' : '#0e1114';
      g.fillRect(x, y, cell, cell);
      g.fillStyle = even ? '#292f36' : '#15191d';
      g.fillRect(x + 1, y + 1, cell - 2, cell - 2);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2.5, 2.5);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function glowTexture() {
  const n = 256;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const x = c.getContext('2d');
  const rg = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  rg.addColorStop(0, 'rgba(143,232,223,0.5)');
  rg.addColorStop(0.45, 'rgba(143,232,223,0.16)');
  rg.addColorStop(1, 'rgba(143,232,223,0)');
  x.fillStyle = rg; x.fillRect(0, 0, n, n);
  return new THREE.CanvasTexture(c);
}

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */
function extrudeFlat(points, thickness) {
  const s = new THREE.Shape();
  points.forEach(([x, z], i) => (i ? s.lineTo(x, z) : s.moveTo(x, z)));
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: thickness, bevelEnabled: false, curveSegments: 2 });
  g.rotateX(Math.PI / 2);
  return g;
}

function roundedPlate(w, d, t, r) {
  const s = new THREE.Shape();
  const x = w / 2, z = d / 2;
  s.moveTo(-x + r, -z);
  s.lineTo(x - r, -z); s.quadraticCurveTo(x, -z, x, -z + r);
  s.lineTo(x, z - r); s.quadraticCurveTo(x, z, x - r, z);
  s.lineTo(-x + r, z); s.quadraticCurveTo(-x, z, -x, z - r);
  s.lineTo(-x, -z + r); s.quadraticCurveTo(-x, -z, -x + r, -z);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: t, bevelEnabled: true, bevelSize: 0.4, bevelThickness: 0.4, bevelSegments: 1, curveSegments: 8,
  });
  g.rotateX(Math.PI / 2);
  return g;
}

/* ------------------------------------------------------------------ */
/* build                                                              */
/* ------------------------------------------------------------------ */
export function createQuad(renderer) {
  const scene = new THREE.Scene();
  const weave = carbonWeave();

  const carbon = new THREE.MeshPhysicalMaterial({
    color: 0x464e57, map: weave, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.3, metalness: 0.22,
  });
  const carbonLight = new THREE.MeshPhysicalMaterial({
    color: 0x525b64, map: weave, roughness: 0.36, clearcoat: 0.7, clearcoatRoughness: 0.25, metalness: 0.25,
  });
  const bellMat = new THREE.MeshStandardMaterial({ color: 0x9aa5b0, metalness: 0.95, roughness: 0.26 });
  const bellDark = new THREE.MeshStandardMaterial({ color: 0x525a63, metalness: 0.9, roughness: 0.36 });
  const statorMat = new THREE.MeshStandardMaterial({ color: 0x3d3329, metalness: 0.55, roughness: 0.6 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x8b949d, metalness: 0.95, roughness: 0.3 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x4a5259, metalness: 0.9, roughness: 0.4 });
  const plastic = new THREE.MeshPhysicalMaterial({ color: 0x15191d, roughness: 0.66, metalness: 0.04 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x090e14, roughness: 0.03, metalness: 0.35, clearcoat: 1 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x0a0c0e, roughness: 0.97, metalness: 0 });
  const pcb = new THREE.MeshPhysicalMaterial({ color: 0x17222c, roughness: 0.36, clearcoat: 0.72, clearcoatRoughness: 0.28, metalness: 0.06 });
  const chipMat = new THREE.MeshStandardMaterial({ color: 0x0a0c0f, roughness: 0.48, metalness: 0.12 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x8d7d66, roughness: 0.6, metalness: 0.28 });
  const wireMat = new THREE.MeshStandardMaterial({ color: 0x1b1512, roughness: 0.76, metalness: 0.05 });
  const propDark = new THREE.MeshPhysicalMaterial({
    color: 0x2b3238, roughness: 0.46, clearcoat: 0.35, clearcoatRoughness: 0.4, metalness: 0.05,
    side: THREE.DoubleSide,
  });
  // heat: a desaturated warm shimmer, never the accent — the accent means "problem"
  const heatMat = new THREE.MeshStandardMaterial({
    color: 0x8a8d90, metalness: 0.9, roughness: 0.34, emissive: 0x5a2a10, emissiveIntensity: 0,
  });

  const Q = new THREE.Group();
  scene.add(Q);

  const propTex = blurredPropTexture();
  const glowTex = glowTexture();

  /* --- arms: tapered, swept, with a motor pad at the tip --- */
  const corners = [[1, -1], [1, 1], [-1, -1], [-1, 1]];      // FR, RR, FL, RL
  const MP = corners.map(([x, z]) => [x * ARM_DIAG / Math.SQRT2, z * ARM_DIAG / Math.SQRT2]);

  for (const [x, z] of MP) {
    const arm = new THREE.Group();
    arm.rotation.y = Math.atan2(x, z);
    const shape = [
      [16, -ARM_ROOT_W / 2],
      [ARM_DIAG - 6, -ARM_TIP_W / 2],
      [ARM_DIAG - 6, ARM_TIP_W / 2],
      [16, ARM_ROOT_W / 2],
    ];
    const geo = extrudeFlat(shape, ARM_T);
    const mesh = new THREE.Mesh(geo, carbon);
    mesh.position.y = -ARM_T;
    mesh.castShadow = true;
    arm.add(mesh);

    // motor mount pad, with four bolts
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 1.8, 26), carbonLight);
    pad.position.set(ARM_DIAG - 8, -1, 0);
    arm.add(pad);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2.6, 8), darkMetal);
      bolt.position.set(ARM_DIAG - 8 + Math.cos(a) * 9.4, 0.6, Math.sin(a) * 9.4);
      arm.add(bolt);
    }
    Q.add(arm);
  }

  /* --- plates --- */
  const bottom = new THREE.Mesh(roundedPlate(52, 96, 2.6, 7), carbonLight);
  bottom.position.y = 0;
  bottom.castShadow = true;
  Q.add(bottom);
  const top = new THREE.Mesh(roundedPlate(44, 86, 2.4, 6), carbonLight);
  top.position.y = 30;
  top.castShadow = true;
  Q.add(top);

  /* --- stack: ESC, FC, standoffs, gyro can, USB, boot, capacitor --- */
  {
    const esc = new THREE.Mesh(new THREE.BoxGeometry(38, 1.7, 40), pcb);
    esc.position.y = 9;
    esc.castShadow = true;
    Q.add(esc);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const mos = new THREE.Mesh(new THREE.BoxGeometry(5, 1.4, 7), chipMat);
      mos.position.set(Math.cos(a) * 13, 10.3, Math.sin(a) * 16);
      mos.rotation.y = -a;
      Q.add(mos);
    }
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 12, 18), capMat);
    cap.position.set(-13, 16, 16);
    cap.rotation.x = 0.16;
    Q.add(cap);
    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 1.1, 18), metal);
    capTop.position.set(-13, 22.1, 16.9);
    capTop.rotation.x = 0.16;
    Q.add(capTop);

    const fc = new THREE.Mesh(new THREE.BoxGeometry(36, 1.7, 36), pcb);
    fc.position.y = 21.5;
    fc.castShadow = true;
    Q.add(fc);

    for (const [sx, sz] of [[-15, -15], [15, -15], [-15, 15], [15, 15]]) {
      const so = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 11, 12), darkMetal);
      so.position.set(sx, 15.6, sz);
      Q.add(so);
    }

    const mcu = new THREE.Mesh(new THREE.BoxGeometry(10, 1.5, 10), chipMat);
    mcu.position.y = 22.8; mcu.rotation.y = Math.PI / 4; Q.add(mcu);
    const gyro = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.4, 4.6), metal);
    gyro.position.set(9, 22.7, 9); Q.add(gyro);
    const usb = new THREE.Mesh(new THREE.BoxGeometry(7.6, 2.6, 5), metal);
    usb.position.set(0, 23.2, 14.4); Q.add(usb);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 2), capMat);
    boot.position.set(12, 22.7, 12.4); Q.add(boot);

    // motor wires, three per arm, running out along the arm
    for (const [mx, mz] of MP) {
      const a = Math.atan2(mz, mx);
      for (let k = 0; k < 3; k++) {
        const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, ARM_DIAG * 0.9, 6), wireMat);
        const off = (k - 1) * 3;
        wire.position.set(
          Math.cos(a) * ARM_DIAG * 0.52 - Math.sin(a) * off,
          4.2,
          Math.sin(a) * ARM_DIAG * 0.52 + Math.cos(a) * off,
        );
        wire.rotation.z = Math.PI / 2;
        wire.rotation.y = -a;
        Q.add(wire);
      }
    }

    const xt60 = new THREE.Mesh(new THREE.BoxGeometry(9, 6, 8), plastic);
    xt60.position.set(13, 13, 27); Q.add(xt60);
    const lead = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 15, 8), rubber);
    lead.position.set(9, 21, 31); lead.rotation.z = 0.62; Q.add(lead);
  }

  /* --- camera cage with a tilted micro camera --- */
  {
    const cy = 18;
    for (const sx of [-11.5, 11.5]) {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(2.2, 25, 26), carbonLight);
      plate.position.set(sx, cy, -46);
      plate.castShadow = true;
      Q.add(plate);
    }
    const brace = new THREE.Mesh(new THREE.BoxGeometry(25, 2.2, 22), carbonLight);
    brace.position.set(0, cy + 12.5, -46);
    Q.add(brace);

    const hood = new THREE.Group();
    hood.position.set(0, cy + 1.5, -44);
    hood.rotation.x = -0.46;
    const body = new THREE.Mesh(new THREE.BoxGeometry(18, 18, 12), plastic);
    body.castShadow = true;
    hood.add(body);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 6.8, 5.5, 26), plastic);
    barrel.rotation.x = Math.PI / 2; barrel.position.z = 8;
    hood.add(barrel);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.6, 1.1, 26), glass);
    lens.rotation.x = Math.PI / 2; lens.position.z = 10.9;
    hood.add(lens);
    Q.add(hood);
  }

  /* --- battery on the deck, two straps --- */
  {
    const pack = new THREE.Mesh(new THREE.BoxGeometry(36, 23, 74), plastic);
    pack.position.set(0, 43.5, 2);
    pack.castShadow = true;
    Q.add(pack);
    for (const z of [-18, 20]) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(40, 2.2, 9), rubber);
      strap.position.set(0, 43.5, z);
      Q.add(strap);
    }
    const label = new THREE.Mesh(new THREE.BoxGeometry(30, 0.6, 30), darkMetal);
    label.position.set(0, 55.4, 2);
    Q.add(label);
  }

  /* --- antennas --- */
  {
    for (const [ax, rot] of [[-12, 0.30], [12, -0.24]]) {
      const a = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(9, 4.5, 9), plastic);
      base.position.y = 2.2; a.add(base);
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 14, 10), plastic);
      stalk.position.y = 11; a.add(stalk);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 48, 8), plastic);
      stem.position.y = 40; a.add(stem);
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 15, 12), plastic);
      tip.position.y = 60; a.add(tip);
      a.position.set(ax, 55, 32);
      a.rotation.x = rot;
      Q.add(a);
    }
  }

  /* --- motors + props --- */
  const motors = MP.map(([x, z], i) => {
    const grp = new THREE.Group();
    grp.position.set(x, 2.6, z);
    Q.add(grp);

    const stator = new THREE.Mesh(new THREE.CylinderGeometry(11, 12, 7, 32), statorMat);
    stator.position.y = 3.5; stator.castShadow = true; grp.add(stator);

    const can = new THREE.Mesh(new THREE.CylinderGeometry(MOTOR_BELL_R, MOTOR_BELL_R, 15, 40), bellMat);
    can.position.y = 14.5; can.castShadow = true; grp.add(can);

    for (let r = 0; r < 6; r++) {
      const a = (r / 6) * Math.PI * 2;
      const rib = new THREE.Mesh(new THREE.BoxGeometry(2.2, 9, 2.8), bellDark);
      rib.position.set(Math.cos(a) * 13.3, 15.2, Math.sin(a) * 13.3);
      rib.rotation.y = -a;
      grp.add(rib);
    }

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(14.6, 14.6, 1.5, 40), metal);
    rim.position.y = 22.2; grp.add(rim);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 3, 12), metal);
    shaft.position.y = 23.8; grp.add(shaft);

    // modelled blades, for low RPM
    const blades = new THREE.Group();
    blades.position.y = 24.4;
    for (let b = 0; b < 3; b++) {
      const holder = new THREE.Group();
      holder.rotation.y = (b / 3) * Math.PI * 2;
      const blade = new THREE.Group();
      const shape = [
        [7, -5],
        [26, -9.5],
        [46, -11],
        [58, -9.5],
        [PROP_R - 1, -5.5],
        [PROP_R - 1, -1.5],
        [54, 6],
        [32, 8.5],
        [14, 6.5],
        [7, 3.5],
      ];
      const geo = extrudeFlat(shape, 1.3);
      const mesh = new THREE.Mesh(geo, propDark);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0;
      blade.add(mesh);
      blade.rotation.x = -0.28;
      holder.add(blade);
      blades.add(holder);
    }
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.4, 3, 6), metal);
    nut.position.y = 1.6; blades.add(nut);
    grp.add(blades);

    // motion-blurred disc, for high RPM
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(PROP_R, 64),
      new THREE.MeshBasicMaterial({ map: propTex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 24.6;
    grp.add(disc);

    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 25;
    grp.add(glow);

    return { grp, blades, disc, glow, can, dir: i === 0 || i === 3 ? 1 : -1 };
  });

  /* --- lights, environment, floor --- */
  scene.environment = (() => {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.08, 0.1, 120).texture;
    pmrem.dispose();
    return env;
  })();

  /* Light rig.
   * A SpotLight with physical decay loses almost all of its illuminance over the
   * ~600 mm from the lamp to the quad, which left the studio nearly black. The key
   * light is therefore a directional light: no distance falloff, a fixed shadow
   * frustum, and identical exposure at any framing. A soft spot still paints the
   * pool on the floor, purely for atmosphere. */
  const key = new THREE.DirectionalLight(0xE4EEF5, 3.1);
  key.position.set(-260, 520, 380);
  key.target.position.set(0, 20, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -340, right: 340, top: 340, bottom: -340, near: 10, far: 1600 });
  key.shadow.radius = 5;
  key.shadow.bias = -0.0006;
  scene.add(key, key.target);

  const rim = new THREE.DirectionalLight(0x9fc0d4, 2.4);
  rim.position.set(420, 260, -420);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0xB4C8D6, 1.5);
  fill.position.set(320, 80, 380);
  scene.add(fill);

  const kick = new THREE.DirectionalLight(0xCFE0EC, 1.1);
  kick.position.set(-180, -60, -240);
  scene.add(kick);

  scene.add(new THREE.HemisphereLight(0xA6BACB, 0x0c1116, 1.5));
  scene.add(new THREE.AmbientLight(0x5C6B78, 1.1));

  const spot = new THREE.SpotLight(0xC9D6DE, 900, 0, Math.PI / 5, 0.9, 0.85);
  spot.position.set(-160, 520, 240);
  spot.target.position.set(0, 0, 0);
  scene.add(spot, spot.target);

  /* A real floor. A bare ShadowMaterial is transparent everywhere except the
   * shadow, so with a void background the studio had no ground at all. */
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x2c353e, roughness: 0.82, metalness: 0.06,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -95;
  floor.receiveShadow = true;
  scene.add(floor);

  // soft pool of light on the floor, so it falls off to void
  // A soft pool drawn as a radial-gradient sprite: a flat circle showed a hard
  // edge, which read as a ring rather than as light falling off.
  const poolTex = (() => {
    const n = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = n;
    const x2 = cv.getContext('2d');
    const rg = x2.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    rg.addColorStop(0, 'rgba(120,148,170,0.55)');
    rg.addColorStop(0.45, 'rgba(96,122,144,0.20)');
    rg.addColorStop(1, 'rgba(96,122,144,0)');
    x2.fillStyle = rg; x2.fillRect(0, 0, n, n);
    return new THREE.CanvasTexture(cv);
  })();
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(2600, 2600),
    new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, opacity: 0.9 })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = -93;
  scene.add(pool);

  scene.fog = new THREE.Fog(0x0B0E12, 1600, 3600);

  return { scene, Q, motors, materials: { carbon, bellMat, heatMat, metal, bellDark } };
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
