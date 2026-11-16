/* A 5-inch freestyle FPV quad, built to real proportions (units are millimetres).
 *
 * The previous version was a stack of boxes and read as a table, not a drone.
 * What makes a 5" freestyle quad recognisable, and what this model therefore
 * has to get right:
 *
 *   - an X frame of four separate tapered carbon arms, not a box plate
 *   - 2207 motors (28 mm stator) with a ribbed bell and a visible stator
 *   - 5" TRI-blade props with a swept outline and real pitch, not flat paddles
 *   - a camera cage at the front with a tilted micro camera and a lens
 *   - a battery on the deck with a strap, and an antenna at the back
 *   - everything matte carbon and bare aluminium: no other hues
 *
 * Nothing here is random: the same call produces the same mesh.
 */

import * as THREE from '../node_modules/three/build/three.module.js';

const MM = 1; // one unit is one millimetre
const R_MOTOR = 110 * MM;      // motor axis, 220 mm diagonal
const R_PROP = 63.5 * MM;      // 5 inch
const ARM_W_ROOT = 11.5 * MM;
const ARM_W_TIP = 6.5 * MM;
const ARM_T = 4.2 * MM;        // arm thickness

/* ------------------------------------------------------------------ */
/* materials                                                          */
/* ------------------------------------------------------------------ */
function carbonWeaveTexture() {
  // A small twill weave, dark. Generated once, deterministic.
  const N = 64;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  g.fillStyle = '#14171a';
  g.fillRect(0, 0, N, N);
  const cell = 8;
  for (let y = 0; y < N; y += cell) {
    for (let x = 0; x < N; x += cell) {
      const even = ((x / cell) + (y / cell)) % 2 === 0;
      g.fillStyle = even ? '#1b1f23' : '#0e1114';
      g.fillRect(x, y, cell, cell);
      g.fillStyle = even ? '#23282d' : '#171b1f';
      g.fillRect(x + 1, y + 1, cell - 2, cell - 2);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function makeMaterials() {
  const weave = carbonWeaveTexture();
  const carbon = new THREE.MeshStandardMaterial({
    color: 0x23272b, map: weave, roughness: 0.52, metalness: 0.22,
  });
  const carbonPlate = new THREE.MeshStandardMaterial({
    color: 0x2a2f34, map: weave, roughness: 0.46, metalness: 0.28,
  });
  const alu = new THREE.MeshStandardMaterial({
    color: 0xa8b2bb, roughness: 0.28, metalness: 0.95,
  });
  const aluDark = new THREE.MeshStandardMaterial({
    color: 0x6c757d, roughness: 0.38, metalness: 0.9,
  });
  const bell = new THREE.MeshStandardMaterial({
    color: 0x9aa4ad, roughness: 0.3, metalness: 0.95,
  });
  const stator = new THREE.MeshStandardMaterial({
    color: 0x3a3026, roughness: 0.62, metalness: 0.35,
  });
  const propMat = new THREE.MeshStandardMaterial({
    color: 0x1d2126, roughness: 0.58, metalness: 0.06,
  });
  const plastic = new THREE.MeshStandardMaterial({
    color: 0x111417, roughness: 0.72, metalness: 0.02,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x0a1016, roughness: 0.06, metalness: 0.35,
  });
  const rubber = new THREE.MeshStandardMaterial({
    color: 0x0c0e10, roughness: 0.95, metalness: 0.0,
  });
  const heat = new THREE.MeshStandardMaterial({
    color: 0xb0703c, roughness: 0.5, metalness: 0.5,
    emissive: 0x321708, emissiveIntensity: 0.0,
  });
  return { carbon, carbonPlate, alu, aluDark, bell, stator, propMat, plastic, glass, rubber, heat };
}

/* ------------------------------------------------------------------ */
/* geometry helpers                                                   */
/* ------------------------------------------------------------------ */
function extrudeFlat(points, thickness) {
  // points are [x, z]; the shape is extruded downward in Y from y=0
  const s = new THREE.Shape();
  points.forEach(([x, z], i) => (i ? s.lineTo(x, z) : s.moveTo(x, z)));
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: thickness, bevelEnabled: false, curveSegments: 2 });
  g.rotateX(Math.PI / 2);      // shape plane XY -> XZ, extrusion now along -Y
  g.translate(0, 0, 0);
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
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: true, bevelSize: 0.5, bevelThickness: 0.5, bevelSegments: 1, curveSegments: 6 });
  g.rotateX(Math.PI / 2);
  return g;
}

/* ------------------------------------------------------------------ */
/* parts                                                              */
/* ------------------------------------------------------------------ */
function buildArm(m) {
  const g = new THREE.Group();
  const shape = [
    [18, -ARM_W_ROOT / 2],
    [R_MOTOR, -ARM_W_TIP / 2],
    [R_MOTOR, ARM_W_TIP / 2],
    [18, ARM_W_ROOT / 2],
  ];
  const geo = extrudeFlat(shape, ARM_T);
  const mesh = new THREE.Mesh(geo, m.carbon);
  mesh.position.y = -ARM_T;
  g.add(mesh);
  return g;
}

function buildMotor(m, hot) {
  const g = new THREE.Group();
  // stator block visible under the bell
  const base = new THREE.Mesh(new THREE.CylinderGeometry(14.2, 14.6, 5, 24), m.stator);
  base.position.y = 2.5; g.add(base);

  // 4 standoff pillars between base and bell seats
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 7, 8), m.aluDark);
    p.position.set(Math.cos(a) * 11.4, 7.5, Math.sin(a) * 11.4);
    g.add(p);
  }

  // bell: a 28 mm can with a raised rim and a machined groove
  const bellMat = hot ? m.heat : m.bell;
  const can = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 15, 40, 1, false), bellMat);
  can.position.y = 18; g.add(can);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(14.6, 14.6, 1.6, 40), m.alu);
  rim.position.y = 25.4; g.add(rim);
  const groove = new THREE.Mesh(new THREE.CylinderGeometry(13.4, 13.4, 1.1, 40), m.aluDark);
  groove.position.y = 12.6; g.add(groove);

  // 6 slim vertical ribs, like a 2207 bell with cut-outs
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(2.6, 9.4, 3.2), m.aluDark);
    rib.position.set(Math.cos(a) * 13.1, 18.6, Math.sin(a) * 13.1);
    rib.rotation.y = -a;
    g.add(rib);
  }

  // shaft
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 4, 12), m.alu);
  shaft.position.y = 27.6; g.add(shaft);

  return g;
}

function buildProp(m) {
  // 5" tri-blade. Each blade is a swept outline extruded thin, laid flat and
  // then pitched about its own radial axis, which is what makes it read as a prop.
  const g = new THREE.Group();
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(8.2, 8.2, 5.2, 20), m.propMat);
  hub.position.y = 1.6; g.add(hub);
  const hubTop = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 6.4, 2.2, 18), m.propMat);
  hubTop.position.y = 5.2; g.add(hubTop);

  const outline = [
    [8, -5.6],
    [26, -11.2],
    [46, -13.4],
    [59, -12.2],
    [R_PROP, -8.4],
    [R_PROP, -3.6],
    [56, 6.2],
    [34, 10.4],
    [16, 7.6],
    [8, 4.4],
  ];
  const geo = extrudeFlat(outline, 1.15);

  for (let b = 0; b < 3; b++) {
    const holder = new THREE.Group();
    holder.rotation.y = (b / 3) * Math.PI * 2;
    const blade = new THREE.Group();
    const mesh = new THREE.Mesh(geo, m.propMat);
    // lay flat, then pitch about the radial (x) axis
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 3.4;
    mesh.scale.y = 1;
    blade.add(mesh);
    // pitch: rotate the whole blade about its radial axis
    blade.rotation.x = -0.30;
    holder.add(blade);
    g.add(holder);
  }
  return g;
}

function buildCamera(m) {
  // micro camera in a cage at the front, tilted up ~30 degrees
  const g = new THREE.Group();
  const tilt = -0.52;

  const cageL = new THREE.Mesh(new THREE.BoxGeometry(2.2, 24, 22), m.carbon);
  cageL.position.set(-11.5, 0, 0);
  const cageR = cageL.clone(); cageR.position.x = 11.5;
  g.add(cageL, cageR);

  const top = new THREE.Mesh(new THREE.BoxGeometry(26, 2.2, 20), m.carbon);
  top.position.y = 12.5; g.add(top);

  const hood = new THREE.Group();
  hood.position.set(0, 5.5, 2);
  hood.rotation.x = tilt;
  const body = new THREE.Mesh(new THREE.BoxGeometry(19, 19, 12), m.plastic);
  hood.add(body);
  const lensBarrel = new THREE.Mesh(new THREE.CylinderGeometry(7.4, 7.4, 6, 24), m.plastic);
  lensBarrel.rotation.x = Math.PI / 2; lensBarrel.position.z = 8;
  hood.add(lensBarrel);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.2, 1.2, 24), m.glass);
  lens.rotation.x = Math.PI / 2; lens.position.z = 11.2;
  hood.add(lens);
  g.add(hood);

  return g;
}

function buildBattery(m) {
  const g = new THREE.Group();
  const pack = new THREE.Mesh(new THREE.BoxGeometry(38, 25, 74), m.plastic);
  pack.position.y = 12.5; g.add(pack);
  // two straps
  for (const z of [-20, 18]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(42, 2.4, 11), m.rubber);
    strap.position.set(0, 12.5, z); g.add(strap);
  }
  // XT60 lead
  const lead = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 16, 10), m.rubber);
  lead.rotation.x = 1.15; lead.position.set(0, 16, 40); g.add(lead);
  return g;
}

function buildAntenna(m) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(11, 5, 11), m.plastic);
  base.position.y = 2.5; g.add(base);
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.9, 16, 10), m.plastic);
  stalk.position.y = 12; g.add(stalk);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 52, 8), m.plastic);
  stem.position.y = 44; g.add(stem);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 15, 12), m.plastic);
  tip.position.y = 74; g.add(tip);
  g.rotation.x = 0.34;
  return g;
}

function buildStack(m) {
  // flight controller / ESC stack on standoffs, with a visible top board
  const g = new THREE.Group();
  const fc = new THREE.Mesh(new THREE.BoxGeometry(36, 1.7, 36), m.carbonPlate);
  fc.position.y = 19; g.add(fc);
  const esc = new THREE.Mesh(new THREE.BoxGeometry(36, 1.7, 36), m.carbonPlate);
  esc.position.y = 8.5; g.add(esc);
  const usb = new THREE.Mesh(new THREE.BoxGeometry(9, 4, 6), m.aluDark);
  usb.position.set(0, 21.5, 12); g.add(usb);
  for (const [x, z] of [[15, 15], [15, -15], [-15, 15], [-15, -15]]) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 22, 8), m.aluDark);
    s.position.set(x, 10, z); g.add(s);
  }
  return g;
}

/* ------------------------------------------------------------------ */
/* assembly                                                           */
/* ------------------------------------------------------------------ */
export function buildQuad() {
  const m = makeMaterials();
  const group = new THREE.Group();
  const props = [];
  const motors = [];

  // four arms in an X, each carrying a motor and a prop
  const armAngles = [Math.PI / 4, -Math.PI / 4, (3 * Math.PI) / 4, -(3 * Math.PI) / 4];
  armAngles.forEach((ang, i) => {
    const arm = buildArm(m);
    arm.rotation.y = ang;
    group.add(arm);

    const mx = Math.cos(ang) * R_MOTOR;
    const mz = Math.sin(ang) * R_MOTOR;

    const motor = buildMotor(m, false);
    motor.position.set(mx, 0, mz);
    group.add(motor);
    motors.push(motor);

    const prop = buildProp(m);
    prop.position.set(mx, 26.5, mz);
    prop.userData.dir = i % 2 === 0 ? 1 : -1;
    group.add(prop);
    props.push(prop);
  });

  // bottom deck and top deck
  const bottom = new THREE.Mesh(roundedPlate(64, 64, 2.4, 6), m.carbonPlate);
  bottom.position.y = 0; group.add(bottom);
  const top = new THREE.Mesh(roundedPlate(46, 46, 2.2, 5), m.carbonPlate);
  top.position.y = 22.6; group.add(top);

  group.add(buildStack(m));

  const cam = buildCamera(m);
  cam.position.set(0, 12, -46);
  group.add(cam);

  const batt = buildBattery(m);
  batt.position.set(0, 24.6, 4);
  group.add(batt);

  const ant = buildAntenna(m);
  ant.position.set(0, 25, 40);
  group.add(ant);

  group.userData.materials = m;
  return { group, props, motors, materials: m };
}

/* A pine silhouette for the opening drop. Reads as a tree, not a cone. */
export function buildTree() {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0x0e1319, transparent: true, opacity: 0.95 });
  const tiers = [
    [130, 250, 40],
    [105, 230, 190],
    [80, 200, 330],
    [50, 160, 450],
  ];
  for (const [r, h, y] of tiers) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 9, 1, true), mat);
    cone.position.y = y + h / 2;
    g.add(cone);
  }
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(14, 17, 70, 8), mat);
  trunk.position.y = 35;
  g.add(trunk);
  return g;
}
