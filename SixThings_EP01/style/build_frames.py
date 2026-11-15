#!/usr/bin/env python3
"""6 Things style reference frames. Code-rendered (HTML/CSS/SVG + headless Chrome).
All chart data are SYNTHETIC, generated from the seeded formulas below and written to data/.
Quad imagery = concept PLACEHOLDERS cut from Thomas's two concept frames (src/)."""
import numpy as np, csv, subprocess, pathlib, base64, html
ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / "frames"; DATA = ROOT / "data"; OUT.mkdir(exist_ok=True); DATA.mkdir(exist_ok=True)

# ---- palette (keep in sync with STYLE_6THINGS.md) ----
PAPER, INK, INK2, RULE, ACCENT = "#F4F1EA", "#111111", "#5E5B55", "#111111", "#EC4118"
VOID, STUDIO, HUDLINE, HUDTEXT, HUDDIM, TEAL, SETPT = "#0B0E12", "#1A2027", "#5D6B75", "#E6ECEF", "#8E9BA3", "#4FE0CF", "#E6ECEF"

def b64(p): return base64.b64encode(pathlib.Path(p).read_bytes()).decode()
def fontface():
    f = ROOT / "fonts"
    return f"""
@font-face{{font-family:'BC';src:url('file://{f}/BarlowCondensed-ExtraBold.ttf');font-weight:800}}
@font-face{{font-family:'BC';src:url('file://{f}/BarlowCondensed-Black.ttf');font-weight:900}}
@font-face{{font-family:'IT';src:url('file://{f}/InterTight-VariableFont_wght.ttf');font-weight:100 900}}
@font-face{{font-family:'JM';src:url('file://{f}/JetBrainsMono-VariableFont_wght.ttf');font-weight:100 800}}
*{{margin:0;padding:0;box-sizing:border-box}} html,body{{width:1920px;height:1080px;overflow:hidden}}
body{{position:relative;font-family:'IT';-webkit-font-smoothing:antialiased}}
.abs{{position:absolute}}
"""

# ---------------- synthetic data ----------------
def sign1_data():
    """Propwash example. 1 kHz, 1.6 s. Roll setpoint: a short roll move that ENDS at 0.50 s.
    Throttle chopped 0.70-1.30 s. Gyro follows setpoint (2nd-order, ~15 ms lag) plus a 38 Hz
    burst (Hann envelope 0.85-1.35 s) that starts with the disturbed air, NOT at the stick stop."""
    rng = np.random.default_rng(6001)
    t = np.arange(0, 1.6, 0.001)
    sp = np.where((t > 0.15) & (t < 0.50), 320 * np.sin(np.pi * (t - 0.15) / 0.35) ** 2, 0.0)
    g = np.zeros_like(t); v = 0.0; wn, z = 2 * np.pi * 9, 0.75
    for i in range(1, len(t)):
        a = wn * wn * (sp[i] - g[i - 1]) - 2 * z * wn * v
        v += a * 0.001; g[i] = g[i - 1] + v * 0.001
    env = np.where((t > 0.85) & (t < 1.35), np.sin(np.pi * (t - 0.85) / 0.50) ** 2, 0.0)
    g = g + 85 * env * np.sin(2 * np.pi * 38 * t) + rng.normal(0, 3.0, t.size)
    thr = np.where((t >= 0.70) & (t < 1.30), 8.0, 55.0)
    thr = np.convolve(thr, np.ones(40) / 40, mode="same"); thr[:20] = 55; thr[-20:] = 55
    with open(DATA / "sign1_propwash_synthetic.csv", "w", newline="") as f:
        w = csv.writer(f); w.writerow(["t_s", "setpoint_roll_dps", "gyro_roll_dps", "throttle_pct"])
        for row in zip(t, sp, g, thr): w.writerow([f"{row[0]:.3f}", f"{row[1]:.2f}", f"{row[2]:.2f}", f"{row[3]:.1f}"])
    return t, sp, g, thr

def step_data():
    """Generic step response for the thumbnail: unit step at 0.05 s, 2nd-order zeta 0.35 (overshoot ~30%)."""
    t = np.arange(0, 0.5, 0.0005); sp = (t >= 0.05).astype(float)
    g = np.zeros_like(t); v = 0.0; wn, z = 2 * np.pi * 14, 0.35
    for i in range(1, len(t)):
        a = wn * wn * (sp[i] - g[i - 1]) - 2 * z * wn * v; v += a * 0.0005; g[i] = g[i - 1] + v * 0.0005
    with open(DATA / "thumb_step_synthetic.csv", "w", newline="") as f:
        w = csv.writer(f); w.writerow(["t_s", "setpoint_norm", "gyro_norm"])
        for row in zip(t, sp, g): w.writerow([f"{row[0]:.4f}", f"{row[1]:.3f}", f"{row[2]:.4f}"])
    return t, sp, g

def path(xs, ys, X0, X1, Y0, Y1, x0, x1, y0, y1):
    px = x0 + (xs - X0) / (X1 - X0) * (x1 - x0); py = y1 - (ys - Y0) / (Y1 - Y0) * (y1 - y0)
    return "M" + " L".join(f"{a:.1f},{b:.1f}" for a, b in zip(px, py))

def render(name, body, w=1920, h=1080):
    p = OUT / f"{name}.html"
    p.write_text(f"<!doctype html><html><head><meta charset='utf-8'><style>{fontface()}</style></head><body>{body}</body></html>", encoding="utf-8")
    png = OUT / f"{name}.png"
    subprocess.run(["google-chrome", "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
                    "--allow-file-access-from-files", "--force-device-scale-factor=1", "--virtual-time-budget=4000",
                    f"--window-size={w},{h}", f"--screenshot={png}", p.as_uri()], check=True, capture_output=True)
    p.unlink()  # HTML holds absolute file:// paths; re-run this script to regenerate
    return png

QUAD = ROOT / "src" / "quad_cutout_PLACEHOLDER.png"
PLATE = ROOT / "src" / "plate_F_clean_PLACEHOLDER.jpg"
ICON = next(p for p in [ROOT.parent / "shared" / "brand" / "eqt-icon.svg", ROOT.parent / "pkg" / "SixThings_EP01" / "shared" / "brand" / "eqt-icon.svg"] if p.exists())

# ---------------- (a) thumbnail ----------------
def thumb():
    t, sp, g = step_data()
    X0, X1, Y0, Y1 = 0, 0.5, -0.1, 1.45
    x0, x1, y0, y1 = 110, 640, 850, 1010
    sp_p = path(t, sp, X0, X1, Y0, Y1, x0, x1, y0, y1); g_p = path(t, g, X0, X1, Y0, Y1, x0, x1, y0, y1)
    k = int(np.argmax(g)); cx = x0 + t[k] / X1 * (x1 - x0); cy = y1 - (g[k] - Y0) / (Y1 - Y0) * (y1 - y0)
    body = f"""
<div class='abs' style='inset:0;background:{PAPER}'></div>
<div class='abs' style='left:-14px;top:-70px;font:800 400px/0.80 BC;color:{INK};letter-spacing:-6px;text-transform:uppercase'>IT'S THE</div>
<div class='abs' style='left:-20px;top:228px;font:900 640px/0.80 BC;color:{INK};letter-spacing:-10px'>TUNE</div>
<img class='abs' src='file://{QUAD}' style='left:820px;top:330px;width:1100px'>
<svg class='abs' style='left:0;top:0' width='1920' height='1080'>
 <path d='{sp_p}' fill='none' stroke='{INK}' stroke-width='3' stroke-dasharray='10 8'/>
 <path d='{g_p}' fill='none' stroke='{INK}' stroke-width='5'/>
 <circle cx='{cx:.1f}' cy='{cy:.1f}' r='34' fill='none' stroke='{ACCENT}' stroke-width='6'/>
</svg>
<div class='abs' style='left:1560px;top:64px;background:{ACCENT};color:{PAPER};font:800 92px/1 BC;padding:10px 26px 6px;letter-spacing:1px'>6 SIGNS</div>
"""
    render("a_thumbnail_1920x1080", body)

# ---------------- (b) sign title card ----------------
def sign_card():
    t, sp, g, thr = sign1_data()
    m = (t >= 0.4) & (t <= 1.5); tt, gg, ss = t[m], g[m], sp[m]
    X0, X1, Y0, Y1 = 0.4, 1.5, -150, 350
    x0, x1, y0, y1 = 470, 960, 790, 960
    gp = path(tt, gg, X0, X1, Y0, Y1, x0, x1, y0, y1); spp = path(tt, ss, X0, X1, Y0, Y1, x0, x1, y0, y1)
    zy = y1 - (0 - Y0) / (Y1 - Y0) * (y1 - y0)
    def X(v): return x0 + (v - X0) / (X1 - X0) * (x1 - x0)
    def Y(v): return y1 - (v - Y0) / (Y1 - Y0) * (y1 - y0)
    xt = "".join(f"<line x1='{X(v):.1f}' y1='{y1}' x2='{X(v):.1f}' y2='{y1+8}' stroke='{INK}' stroke-width='1.5'/><text x='{X(v):.1f}' y='{y1+32}' text-anchor='middle' font-family='JM' font-size='18' fill='{INK2}'>{v:.1f}</text>" for v in (0.5, 1.0, 1.5))
    yt = "".join(f"<line x1='{x0-8}' y1='{Y(v):.1f}' x2='{x0}' y2='{Y(v):.1f}' stroke='{INK}' stroke-width='1.5'/><text x='{x0-14}' y='{Y(v)+6:.1f}' text-anchor='end' font-family='JM' font-size='18' fill='{INK2}'>{v:d}</text>" for v in (-100, 0, 100, 200, 300))
    body = f"""
<div class='abs' style='inset:0;background:{PAPER}'></div>
<div class='abs' style='left:-18px;top:150px;font:900 480px/0.80 BC;color:{INK};letter-spacing:-8px;white-space:nowrap'>PROPWASH</div>
<img class='abs' src='file://{QUAD}' style='left:930px;top:360px;width:1000px'>
<div class='abs' style='right:96px;top:72px;font:600 40px/1 IT;color:{INK};font-variant-numeric:tabular-nums;letter-spacing:1px'><span style='color:{ACCENT}'>01</span> / 06</div>
<div class='abs' style='right:96px;top:132px;width:56px;height:5px;background:{ACCENT}'></div>
<div class='abs' style='left:96px;top:802px;width:96px;height:6px;background:{ACCENT}'></div>
<div class='abs' style='left:96px;top:830px;width:320px;font:600 28px/1.25 IT;color:{INK};letter-spacing:1.5px;text-transform:uppercase'>Sign 01<br>Wobble in your own wash</div>
<svg class='abs' style='left:0;top:0' width='1920' height='1080'>
 <line x1='{x0}' y1='{y0-10}' x2='{x0}' y2='{y1}' stroke='{INK}' stroke-width='1.5'/>
 <line x1='{x0}' y1='{y1}' x2='{x1+10}' y2='{y1}' stroke='{INK}' stroke-width='1.5'/>
 <line x1='{x0}' y1='{zy:.1f}' x2='{x1}' y2='{zy:.1f}' stroke='{INK2}' stroke-width='1' stroke-dasharray='3 5'/>
 {xt}{yt}
 <rect x='{X(0.85):.1f}' y='{y0}' width='{X(1.35)-X(0.85):.1f}' height='{y1-y0}' fill='{ACCENT}' opacity='0.10'/>
 <path d='{spp}' fill='none' stroke='{INK2}' stroke-width='2' stroke-dasharray='8 6'/>
 <path d='{gp}' fill='none' stroke='{INK}' stroke-width='2.2'/>
 <text x='{x0}' y='{y0-24}' font-family='IT' font-weight='600' font-size='18' letter-spacing='1.5' fill='{INK}'>ROLL RATE, DEG/S  ·  SYNTHETIC EXAMPLE</text>
 <text x='{x1}' y='{y1+62}' text-anchor='end' font-family='IT' font-weight='600' font-size='18' letter-spacing='1.5' fill='{INK}'>TIME, S</text>
</svg>
"""
    render("b_sign01_titlecard_propwash", body)

# ---------------- (c) F HUD beat ----------------
def hud_beat():
    t, sp, g, thr = sign1_data()
    X0, X1, Y0, Y1 = 0.0, 1.6, -200, 400
    px0, py0, pw, ph = 1120, 120, 700, 680
    x0, x1, y0, y1 = px0 + 92, px0 + pw - 30, py0 + 110, py0 + 400
    tx0, tx1, ty0, ty1 = x0, x1, py0 + 440, py0 + 520
    def X(v): return x0 + (v - X0) / (X1 - X0) * (x1 - x0)
    def Y(v): return y1 - (v - Y0) / (Y1 - Y0) * (y1 - y0)
    gp = path(t, g, X0, X1, Y0, Y1, x0, x1, y0, y1); spp = path(t, sp, X0, X1, Y0, Y1, x0, x1, y0, y1)
    tp = path(t, thr, X0, X1, 0, 100, tx0, tx1, ty0, ty1)
    grid = "".join(f"<line x1='{x0}' y1='{Y(v):.1f}' x2='{x1}' y2='{Y(v):.1f}' stroke='{HUDLINE}' stroke-width='1' opacity='{0.9 if v==0 else 0.35}'/><text x='{x0-12}' y='{Y(v)+6:.1f}' text-anchor='end' font-family='JM' font-size='18' fill='{HUDDIM}'>{v}</text>" for v in (-200, 0, 200, 400))
    xt = "".join(f"<text x='{X(v):.1f}' y='{ty1+30}' text-anchor='middle' font-family='JM' font-size='18' fill='{HUDDIM}'>{v:.1f}</text>" for v in (0.0, 0.4, 0.8, 1.2, 1.6))
    br = lambda x, y, dx, dy: f"<path d='M{x},{y+dy} L{x},{y} L{x+dx},{y}' fill='none' stroke='{HUDLINE}' stroke-width='2'/>"
    corners = br(64, 64, 70, 70) + br(1856, 64, -70, 70) + br(64, 1016, 70, -70) + br(1856, 1016, -70, -70)
    body = f"""
<img class='abs' src='file://{PLATE}' style='left:-160px;top:0;width:2080px;height:1080px;object-fit:cover'>
<div class='abs' style='inset:0;background:linear-gradient(90deg,rgba(11,14,18,0) 45%,rgba(11,14,18,.70) 62%,rgba(11,14,18,.82) 100%)'></div>
<svg class='abs' style='left:0;top:0' width='1920' height='1080'>
 {corners}
 <rect x='{px0}' y='{py0}' width='{pw}' height='{ph}' fill='rgba(11,14,18,.55)' stroke='{HUDLINE}' stroke-width='1.2' rx='6'/>
 <text x='{px0+30}' y='{py0+48}' font-family='IT' font-weight='600' font-size='22' letter-spacing='3' fill='{HUDTEXT}'>ROLL · SETPOINT vs GYRO</text>
 <text x='{px0+pw-30}' y='{py0+48}' text-anchor='end' font-family='IT' font-weight='500' font-size='18' letter-spacing='2' fill='{HUDDIM}'>SYNTHETIC EXAMPLE</text>
 <text x='{px0+30}' y='{py0+78}' font-family='JM' font-size='18' fill='{HUDDIM}'>roll rate, deg/s</text>
 {grid}
 <rect x='{X(0.85):.1f}' y='{y0}' width='{X(1.35)-X(0.85):.1f}' height='{ty1-y0}' fill='{ACCENT}' opacity='0.12'/>
 <line x1='{X(0.85):.1f}' y1='{y0}' x2='{X(0.85):.1f}' y2='{ty1}' stroke='{ACCENT}' stroke-width='2'/>
 <line x1='{X(0.50):.1f}' y1='{y0}' x2='{X(0.50):.1f}' y2='{ty1}' stroke='{HUDDIM}' stroke-width='1.2' stroke-dasharray='4 6'/>
 <text x='{X(0.50)+8:.1f}' y='{y0+20}' font-family='IT' font-weight='500' font-size='17' fill='{HUDDIM}'>stick stops</text>
 <text x='{X(0.85)+8:.1f}' y='{y0+20}' font-family='IT' font-weight='600' font-size='17' fill='{ACCENT}'>wobble starts in the wash</text>
 <path d='{spp}' fill='none' stroke='{SETPT}' stroke-width='2' stroke-dasharray='9 7' opacity='.9'/>
 <path d='{gp}' fill='none' stroke='{TEAL}' stroke-width='2.4'/>
 <line x1='{tx0}' y1='{ty1}' x2='{tx1}' y2='{ty1}' stroke='{HUDLINE}' stroke-width='1' opacity='.6'/>
 <path d='{tp}' fill='none' stroke='{HUDDIM}' stroke-width='2'/>
 <text x='{x0-12}' y='{ty1-22}' text-anchor='end' font-family='JM' font-size='16' fill='{HUDDIM}'>thr</text>
 {xt}
 <text x='{x1}' y='{ty1+56}' text-anchor='end' font-family='JM' font-size='18' fill='{HUDDIM}'>time, s</text>
 <line x1='{px0+30}' y1='{py0+ph-34}' x2='{px0+60}' y2='{py0+ph-34}' stroke='{SETPT}' stroke-width='2' stroke-dasharray='9 7'/>
 <text x='{px0+70}' y='{py0+ph-28}' font-family='IT' font-size='18' fill='{HUDTEXT}'>setpoint</text>
 <line x1='{px0+180}' y1='{py0+ph-34}' x2='{px0+210}' y2='{py0+ph-34}' stroke='{TEAL}' stroke-width='3'/>
 <text x='{px0+220}' y='{py0+ph-28}' font-family='IT' font-size='18' fill='{HUDTEXT}'>gyro</text>
 <line x1='{px0+300}' y1='{py0+ph-34}' x2='{px0+330}' y2='{py0+ph-34}' stroke='{HUDDIM}' stroke-width='2'/>
 <text x='{px0+340}' y='{py0+ph-28}' font-family='IT' font-size='18' fill='{HUDTEXT}'>throttle</text>
</svg>
<div class='abs' style='left:1120px;top:836px;width:700px;height:84px;border:1.2px solid {HUDLINE};border-radius:6px;background:rgba(11,14,18,.55);display:flex;align-items:center;padding:0 30px;gap:22px'>
 <span style='font:500 22px/1 JM;color:{ACCENT}'>01</span>
 <span style='font:500 36px/1 IT;color:{HUDTEXT}'>The burst follows the air, not the stick</span>
</div>
"""
    render("c_F_hud_beat_sign01", body)

# ---------------- (d) recap / end card ----------------
SIGNS = [("01", "Propwash", "wobble in your own wash"), ("02", "Hot motors", "on clean props"),
         ("03", "Bounce-back", "at the end of a move"), ("04", "Late or too far", "gyro vs setpoint"),
         ("05", "Stick twitch", "follows your thumbs"), ("06", "High throttle", "shaking only with throttle")]
def recap():
    cells = ""
    for i, (n, a, b) in enumerate(SIGNS):
        cx, cy = 96 + (i % 3) * 590, 560 + (i // 3) * 200
        cells += f"""<div class='abs' style='left:{cx}px;top:{cy}px;width:540px;border-top:2px solid {INK};padding-top:18px'>
 <div style='font:600 26px/1 IT;color:{ACCENT if i==0 else INK2};font-variant-numeric:tabular-nums'>{n}</div>
 <div style='font:800 72px/0.95 BC;color:{INK};text-transform:uppercase;margin-top:10px'>{html.escape(a)}</div>
 <div style='font:500 24px/1.2 IT;color:{INK2};margin-top:6px'>{html.escape(b)}</div></div>"""
    body = f"""
<div class='abs' style='inset:0;background:{PAPER}'></div>
<div class='abs' style='left:-16px;top:-40px;font:900 560px/0.80 BC;color:{INK};letter-spacing:-8px'>6 SIGNS</div>
<div class='abs' style='right:96px;top:72px;font:600 40px/1 IT;color:{INK};font-variant-numeric:tabular-nums'>06 / 06</div>
<div class='abs' style='right:96px;top:132px;width:56px;height:5px;background:{ACCENT}'></div>
{cells}
"""
    render("d_recap_card", body)

def endcard():
    body = f"""
<div class='abs' style='inset:0;background:{PAPER}'></div>
<div class='abs' style='left:-16px;top:-30px;font:900 300px/0.80 BC;color:{INK};letter-spacing:-4px'>READ IT IN</div>
<div class='abs' style='left:-16px;top:230px;font:900 300px/0.80 BC;color:{INK};letter-spacing:-4px;white-space:nowrap'>THE RIGHT <span style='color:{ACCENT}'>ORDER.</span></div>
<img class='abs' src='file://{QUAD}' style='left:1000px;top:470px;width:880px'>
<img class='abs' src='file://{ICON}' style='left:96px;top:880px;width:104px;height:104px'>
"""
    render("e_end_card", body)

if __name__ == "__main__":
    thumb(); sign_card(); hud_beat(); recap(); endcard()
    from PIL import Image
    Image.open(OUT / "a_thumbnail_1920x1080.png").convert("RGB").resize((1280, 720), Image.LANCZOS).save(OUT / "a_thumbnail_1280x720.jpg", quality=92)
    print("ok")
