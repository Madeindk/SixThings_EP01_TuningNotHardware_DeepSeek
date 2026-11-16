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
/* prop: modelled blades, spinner nut and blur disc, all together      */
/* ------------------------------------------------------------------ */
/* The reference scene in EP4 (p4_3d_ani/src/a06a.js) draws a propeller as three
 * things at once: extruded blades with a curved profile, a spinner over the hub,
 * and a translucent blur disc for RPM. Doing all three is what makes a prop read
 * as a real prop that is spinning, rather than as a flat disc. */
function propBladeShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.9, 4.5);
  s.quadraticCurveTo(-5.4, 14, -4.2, 32);
  s.quadraticCurveTo(-3.2, 44, -1.6, 52);
  s.quadraticCurveTo(-0.6, 58, 0.2, 57);
  s.quadraticCurveTo(3.0, 52, 3.6, 40);
  s.quadraticCurveTo(4.4, 22, 2.2, 10);
  s.quadraticCurveTo(1.6, 5.5, -0.9, 4.5);
  return s;
}

function shapeMesh(shape, depth, mat, bevel = 1.2) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: bevel * 0.5,
    bevelSize: bevel * 0.5, bevelSegments: 3, curveSegments: 24,
  });
  geo.translate(0, 0, -depth / 2);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  return m;
}
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

  /* --- plates: real AIO board dimensions --- */
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

    /* The stack is a 25.5 x 25.5 AIO flight controller: measured envelope
     * 30.0 x 29.0 x 7.3 mm, sitting on a 20 x 20 ESC-style board of
     * 32.0 x 31.0 x 3.6 mm. Both are real dimensions read out of the supplied
     * STEP files; the geometry itself is modelled, not copied. */
    const esc = new THREE.Mesh(new THREE.BoxGeometry(31, 3.6, 30), pcb);
    esc.position.y = 9.8;
    esc.castShadow = true;
    Q.add(esc);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const mos = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.3, 6.4), chipMat);
      mos.position.set(Math.cos(a) * 11, 11.9, Math.sin(a) * 12.4);
      mos.rotation.y = -a;
      Q.add(mos);
    }
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 11, 18), capMat);
    cap.position.set(-12, 17, 14);
    cap.rotation.x = 0.16;
    Q.add(cap);
    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 1.1, 18), metal);
    capTop.position.set(-12, 22.6, 14.9);
    capTop.rotation.x = 0.16;
    Q.add(capTop);

    // AIO: one board carrying the gyro, the MCU and the pads
    const aio = new THREE.Mesh(new THREE.BoxGeometry(29, 7.3, 28), pcb);
    aio.position.y = 20.4;
    aio.castShadow = true;
    Q.add(aio);
    const mcu = new THREE.Mesh(new THREE.BoxGeometry(9.5, 1.4, 9.5), chipMat);
    mcu.position.y = 24.7; mcu.rotation.y = Math.PI / 4; Q.add(mcu);
    // the gyro: a small metal can, and sign four is about this chip
    const gyro = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.3, 4.6), metal);
    gyro.position.set(8, 24.6, 8); Q.add(gyro);
    const usb = new THREE.Mesh(new THREE.BoxGeometry(7.6, 2.6, 5), metal);
    usb.position.set(0, 25.1, 12.6); Q.add(usb);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 2), capMat);
    boot.position.set(10.5, 24.6, 10.5); Q.add(boot);

    // receiver: Crossfire Nano, mounted behind the stack
    const rxPcb = new THREE.Mesh(new THREE.BoxGeometry(21, 1.4, 16), pcb);
    rxPcb.position.set(0, 12.5, 34);
    Q.add(rxPcb);
    const rxShield = new THREE.Mesh(new THREE.BoxGeometry(12, 2.6, 9), metal);
    rxShield.position.set(0, 13.8, 34);
    Q.add(rxShield);

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

  /* --- battery on the deck: real GNB 1100 mAh 4S envelope --- */
  {
    /* The pack must look like a LiPo: a rounded brick with a wrapped label, one
     * XT60 and one balance lead at the FRONT, strapped down. The previous version
     * was a plain black box with two antennas passing through it, which read as a
     * backpack rather than as a battery. */
    const packGeo = new THREE.BoxGeometry(34, 28, 78, 2, 2, 2);
    const pack = new THREE.Mesh(packGeo, plastic);
    pack.position.set(0, 45, 4);
    pack.castShadow = true;
    Q.add(pack);

    // shrink-wrap label, slightly inset so the black pack shows at the edges
    const label = new THREE.Mesh(new THREE.BoxGeometry(34.6, 20, 62), new THREE.MeshStandardMaterial({
      color: 0x1d3d52, roughness: 0.72, metalness: 0.05,
    }));
    label.position.set(0, 45, 4);
    Q.add(label);
    const labelDot = new THREE.Mesh(new THREE.BoxGeometry(35.2, 9, 16), new THREE.MeshStandardMaterial({
      color: 0x8f2d24, roughness: 0.7,
    }));
    labelDot.position.set(0, 52, 4);
    Q.add(labelDot);

    // straps wrap the pack and the deck
    for (const z of [-16, 25]) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(37, 2.4, 10), rubber);
      strap.position.set(0, 45, z);
      Q.add(strap);
    }
    // grip pad under the straps
    const grip = new THREE.Mesh(new THREE.BoxGeometry(30, 0.8, 4), rubber);
    grip.position.set(0, 31.4, 4);
    Q.add(grip);

    /* Leads come out of the FRONT of the pack and run down to the XT60 on the
     * ESC. Nothing passes through the battery. */
    const xt60Body = new THREE.Mesh(new THREE.BoxGeometry(11, 7.5, 9), plastic);
    xt60Body.position.set(0, 34, 50);
    Q.add(xt60Body);
    const xt60Top = new THREE.Mesh(new THREE.BoxGeometry(9, 1.6, 7), new THREE.MeshStandardMaterial({
      color: 0xd9b23a, metalness: 0.8, roughness: 0.35,
    }));
    xt60Top.position.set(0, 38, 50);
    Q.add(xt60Top);
    for (const [dx, col] of [[-2.4, 0xaa2222], [2.4, 0x1a1a1a]]) {
      const lead = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 16, 8),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.82 }));
      lead.rotation.x = 1.15;
      lead.position.set(dx, 38, 40);
      Q.add(lead);
    }
    // balance lead: a thin ribbon with a small plug
    const bal = new THREE.Mesh(new THREE.BoxGeometry(7, 0.7, 15),
      new THREE.MeshStandardMaterial({ color: 0x6f6a60, roughness: 0.9 }));
    bal.position.set(-13, 31.6, 34);
    bal.rotation.x = 0.2;
    Q.add(bal);
    const balPlug = new THREE.Mesh(new THREE.BoxGeometry(8, 2.6, 5), plastic);
    balPlug.position.set(-13, 32.4, 41);
    Q.add(balPlug);
  }

  /* --- antennas: mounted on the REAR of the bottom plate, behind the pack --- */
  {
    /* Previously these rose straight out of the battery, which is wrong: antennas
     * mount to the frame, not to the pack. They now sit on two standoffs at the
     * rear edge of the bottom plate, leaning back and outward, clear of the pack
     * and clear of the rear props. */
    for (const [ax, lean, twist] of [[-16, 0.42, -0.20], [16, 0.34, 0.18]]) {
      const mount = new THREE.Group();
      mount.position.set(ax, 2, 46);
      Q.add(mount);

      // the post they are clamped to
      const post = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.2, 12, 12), metal);
      post.position.y = 6;
      mount.add(post);
      // a printed clamp block
      const clamp = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 7),
        new THREE.MeshStandardMaterial({ color: 0x171c21, roughness: 0.7 }));
      clamp.position.y = 12;
      mount.add(clamp);

      // the antenna itself: a rigid stem with a flexible tip
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 46, 8),
        new THREE.MeshStandardMaterial({ color: 0x14181c, roughness: 0.66 }));
      stem.position.y = 36;
      mount.add(stem);
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 22, 12),
        new THREE.MeshStandardMaterial({ color: 0x0f1216, roughness: 0.8 }));
      sleeve.position.y = 62;
      mount.add(sleeve);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(2.4, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0x2a3138, roughness: 0.6 }));
      cap.position.y = 74;
      mount.add(cap);

      mount.rotation.z = twist;
      // lean TOWARDS the rear. Rotating about +X tilts a +Y stem towards +Z, and
      // +Z is the rear of the airframe (the camera cage is at -Z), so the sign is
      // positive. Negative lean put them forward across the battery.
      mount.rotation.x = lean;
    }
  }

  /* --- motors + props: the d.js construction, with the real 2306 mesh swapped in
   * once it has loaded --- */
let motors = MP.map(([x, z], i) => {
    const grp = new THREE.Group();
    grp.position.set(x, 2.5, z);
    Q.add(grp);

    // procedural stand-in, replaced by the real STL when it arrives
    const proc = new THREE.Group();
    grp.add(proc);

    const stator = new THREE.Mesh(new THREE.CylinderGeometry(13, 14, 8, 40), metal);
    stator.position.y = 4;
    stator.castShadow = true;
    proc.add(stator);

    const bell = new THREE.Mesh(new THREE.CylinderGeometry(13.5, 13.5, 12, 48), bellSteel);
    bell.position.y = 14;
    bell.castShadow = true;
    proc.add(bell);

    // the shiny ring is what makes the motor read as machined aluminium
    const ring = new THREE.Mesh(new THREE.TorusGeometry(13.6, 0.9, 12, 64), ringMat.clone());
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 20;
    grp.add(ring);

    const prop = new THREE.Mesh(
      new THREE.CircleGeometry(PROP_R, 64),
      new THREE.MeshBasicMaterial({ map: propTex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    );
    prop.rotation.x = -Math.PI / 2;
    prop.position.y = 24;
    grp.add(prop);

    /* modelled blades, spun by the same pivot as the disc. They sit under the
     * blur, so at low RPM the blades read and at high RPM they are lost in the
     * smear, which is exactly how a real prop behaves on camera. */
    const bladePivot = new THREE.Group();
    bladePivot.position.y = 24.6;
    grp.add(bladePivot);
    const bladeMat = new THREE.MeshPhysicalMaterial({
      color: 0x2a3138, roughness: 0.44, clearcoat: 0.45, clearcoatRoughness: 0.35, metalness: 0.06,
    });
    const bladeShape = propBladeShape();
    for (let b = 0; b < 3; b++) {
      const holder = new THREE.Group();
      holder.rotation.y = (b / 3) * Math.PI * 2;
      const blade = shapeMesh(bladeShape, 1.5, bladeMat, 1.0);
      blade.rotation.x = -Math.PI / 2;
      blade.rotation.z = -0.10;        // pitch
      blade.position.set(0, 0, 0);
      holder.add(blade);
      bladePivot.add(holder);
    }

    /* the prop nut that holds the prop on. Without this the blades appear to
     * float; with it the assembly reads as bolted to the bell. */
    const nutMat = new THREE.MeshStandardMaterial({ color: 0xb9c3cc, metalness: 0.95, roughness: 0.22 });
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.4, 4.2, 6), nutMat);
    nut.position.y = 27.2;
    grp.add(nut);
    const nutTop = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 5.4, 1.4, 6), nutMat);
    nutTop.position.y = 30.0;
    grp.add(nutTop);
    // the washer the nut bears on
    const washer = new THREE.Mesh(new THREE.CylinderGeometry(6.6, 6.6, 0.8, 20), nutMat);
    washer.position.y = 25.2;
    grp.add(washer);

    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(150, 150),
      new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 24.5;
    grp.add(glow);

    return { grp, proc, prop, bladePivot, glow, bell, ring, nut, dir: i === 0 || i === 3 ? 1 : -1 };
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

  /* --- swap in the real motor mesh when it has loaded --- */
  const motorUrl = '/build/models/emax_rsii_2306.stl';
  let realMotor = null;

  const api = {
    scene, Q, motors,
    materials: { carbon, metal, bellSteel, heatMat, ringMat },
    motorUrl,
    applyRealMotor(geometry) {
      if (realMotor) return;
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      const bb = geometry.boundingBox;
      const size = new THREE.Vector3();
      bb.getSize(size);
      const centre = new THREE.Vector3();
      bb.getCenter(centre);
      // sit the motor on the arm: centre in X/Z, base at y = 0
      const mat = new THREE.MeshStandardMaterial({
        color: 0x9fa9b3, metalness: 0.78, roughness: 0.42, envMapIntensity: 1.15,
      });
      realMotor = { geometry, mat, size, bb };
      motors.forEach((m) => {
        const mesh = new THREE.Mesh(geometry, mat);
        mesh.position.set(-centre.x, -bb.min.y, -centre.z);
        mesh.castShadow = true;
        m.grp.add(mesh);
        m.proc.visible = false;
        m.realMesh = mesh;
      });
    },
    get realMotorSize() { return realMotor ? realMotor.size : null; },
  };

  return api;
}

/* Loads the real EMAX RSII 2306 mesh and swaps it into the motors. */
export async function enrichQuad(api) {
  if (!api.motorUrl) return false;
  try {
    const { STLLoader } = await import('/build/node_modules/three/examples/jsm/loaders/STLLoader.js');
    const geo = await new STLLoader().loadAsync(api.motorUrl);
    api.applyRealMotor(geo);
    return true;
  } catch (e) {
    console.warn('real motor mesh unavailable, keeping procedural motor:', e.message);
    return false;
  }
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
