"""Build the EP01 thumbnail from the production quad render.

Style E — Editorial, per SixThings_EP01/style/STYLE_6THINGS.md:

    paper    #F4F1EA   flat, no texture, no vignette
    ink      #111111   display type and the gyro trace
    accent   #EC4118   the single highlight: the overshoot that makes the point

Design is 1920x1080 and delivered as 1280x720, which is what YouTube wants.
Two text elements only: the display block ("IT'S THE" / "TUNE") and the
"6 SIGNS" tag. Type is Barlow Condensed Black 900 with negative tracking; the
one-word line is size D1 and the two-line block D2.

The quad is the airframe already rendered for the series, not a new model. It
comes from G:\\YT-arbejde\\v2\\final\\hero_a_emit.png, which is the same pass as
the film but written with an alpha matte, so it cuts out cleanly and keeps the
shading and the soft shadow that are already in the render.

    python build/make_thumbnail.py
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
STYLE = os.path.join(HERE, '..', 'SixThings_EP01', 'style')
FONT_BLACK = os.path.join(STYLE, 'fonts', 'BarlowCondensed-Black.ttf')
FONT_XBOLD = os.path.join(STYLE, 'fonts', 'BarlowCondensed-ExtraBold.ttf')
OUT = os.path.join(HERE, 'thumb')

PAPER = (244, 241, 234)
INK = (17, 17, 17)
ACCENT = (236, 65, 24)

W, H = 1920, 1080

QUAD_SRC = r'G:\YT-arbejde\v2\final\hero_a_emit.png'


# ---------------------------------------------------------------------------
# type
# ---------------------------------------------------------------------------
def font(path, size):
    return ImageFont.truetype(path, size)


def tracked_width(text, fnt, tracking):
    """Width of `text` including the tracking added after every glyph."""
    if not text:
        return 0
    total = 0
    for ch in text:
        total += fnt.getlength(ch) + tracking
    return total - tracking


def draw_tracked(draw, xy, text, fnt, tracking, fill):
    """Draw with letter-spacing. Negative tracking tightens the display face,
    which is what makes a condensed headline read as one block of shape rather
    than a row of letters."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += fnt.getlength(ch) + tracking


def measure_cap(draw, text, fnt):
    """Cap height and the offset from the draw origin to the cap top, so lines
    can be aligned on their capitals instead of their ascent."""
    box = draw.textbbox((0, 0), text, font=fnt)
    return box


# ---------------------------------------------------------------------------
# the quad
# ---------------------------------------------------------------------------
def load_quad(target_h):
    im = Image.open(QUAD_SRC).convert('RGBA')
    bb = im.getchannel('A').getbbox()
    if bb:
        im = im.crop(bb)
    scale = target_h / im.height
    return im.resize((max(1, int(im.width * scale)), target_h), Image.LANCZOS)


# ---------------------------------------------------------------------------
# the chart
# ---------------------------------------------------------------------------
def step_response(n=420):
    """Setpoint steps up once; the gyro lags, overshoots, rings and settles.

    Returns (setpoint, gyro) as two lists of normalised y values in 0..1, where
    1 is the top of the plot. This is a drawing, not data: the video says so.

    The step lands at 0.16 so most of the width is the response — at thumbnail
    size a curve that stays flat for a third of its length reads as an empty
    box, and the whole point is the overshoot.
    """
    import math

    t_step = 0.16
    sp, gy = [], []
    for i in range(n):
        t = i / (n - 1)
        target = 1.0 if t >= t_step else 0.0
        sp.append(target)

        if t < t_step:
            gy.append(0.0)
            continue

        dt = t - t_step
        # first-order rise, then a damped ring on top of it
        rise = 1.0 - math.exp(-dt / 0.050)
        ring = 0.42 * math.exp(-dt / 0.105) * math.sin(dt / 0.031)
        v = rise + ring
        gy.append(v)
    return sp, gy


def draw_chart(draw, box, sp, gy, accent):
    x0, y0, x1, y1 = box
    pw = x1 - x0
    ph = y1 - y0

    def px(i, n):
        return x0 + pw * (i / (n - 1))

    def py(v):
        # Headroom for the overshoot: at 0.30 + 0.50 v a peak of about 1.35 sits
        # just inside the top of the box, which leaves room for the accent circle
        # drawn around it.
        return y1 - ph * (0.30 + 0.50 * v)

    # setpoint: thin dashed ink, 55 %
    dash, gap = 13, 9
    for i in range(len(sp) - 1):
        if i % (dash + gap) >= dash:
            continue
        draw.line([(px(i, len(sp)), py(sp[i])), (px(i + 1, len(sp)), py(sp[i + 1]))],
                  fill=(*INK, 150), width=5)

    # gyro: solid ink
    pts = [(px(i, len(gy)), py(v)) for i, v in enumerate(gy)]
    draw.line(pts, fill=INK, width=9, joint='curve')

    # the overshoot peak, circled in the accent
    peak_i = max(range(len(gy)), key=lambda i: gy[i])
    cx, cy = pts[peak_i]
    r = 54
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=accent, width=9)


# ---------------------------------------------------------------------------
# composition
# ---------------------------------------------------------------------------
def fit_size(text, path, max_w, tracking_pct=-0.015):
    """Largest font size at which `text` fits `max_w`, given the tracking.

    Glyph width scales linearly with point size, so one measurement at a
    reference size gives the answer exactly; no search needed.
    """
    ref = 100
    f = ImageFont.truetype(path, ref)
    tr = tracking_pct * ref
    w = tracked_width(text, f, tr)
    if w <= 0:
        return ref
    return max(12, int(ref * max_w / w))


def build(text_two_line='TUNE', line_one="IT'S THE", tag='6 SIGNS',
          quad_scale=1.0, out_png=None, name='ep01',
          line1_ratio=0.40, type_max_w=1180, type_top=74, chart_h=216):
    canvas = Image.new('RGB', (W, H), PAPER)
    draw = ImageDraw.Draw(canvas, 'RGBA')

    # --- display block -----------------------------------------------------
    # The hero word sets the scale; line one is a fraction of it. Fitting both to
    # a width made the small line grow until it rivalled the hero, which destroys
    # the hierarchy the whole design rests on. When both lines are headlines, the
    # ratio goes to 1.0 and they are set as one block.
    s2 = fit_size(text_two_line, FONT_BLACK, type_max_w, -0.015)
    s2 = max(s2, 260)
    s1 = max(60, int(s2 * line1_ratio))

    f1 = font(FONT_BLACK, s1)
    tr1 = -0.013 * s1
    f2 = font(FONT_BLACK, s2)
    tr2 = -0.015 * s2

    x_left = 46

    b1 = measure_cap(draw, line_one, f1)
    b2 = measure_cap(draw, text_two_line, f2)
    cap1 = b1[3] - b1[1]
    cap2 = b2[3] - b2[1]

    y1_cap = type_top
    y2_cap = y1_cap + cap1 + 12

    draw_tracked(draw, (x_left, y1_cap - b1[1]), line_one, f1, tr1, INK)
    draw_tracked(draw, (x_left - 8, y2_cap - b2[1]), text_two_line, f2, tr2, INK)

    word_w = tracked_width(text_two_line, f2, tr2)
    print(f'  type: line1 {tracked_width(line_one, f1, tr1):.0f}x{cap1:.0f}@{s1}, '
          f'line2 {word_w:.0f}x{cap2:.0f}@{s2}, block ends y={y2_cap + cap2:.0f}')

    # --- quad --------------------------------------------------------------
    # The quad is a mark, not a subject: a small badge in the lower-left corner,
    # clear of the type and the chart. At 320 px it reads as an object rather
    # than a shape, which is all it needs to do.
    qh = int(250 * quad_scale)
    quad = load_quad(qh)
    qx = 84
    qy = H - quad.height - 62
    print(f'  quad: {quad.width}x{quad.height} at {qx},{qy}')

    # a soft paper-coloured glow behind it lifts the cut-out off the paper
    halo = Image.new('L', canvas.size, 0)
    hd = ImageDraw.Draw(halo)
    hd.ellipse([qx - 22, qy - 16, qx + quad.width + 22, qy + quad.height + 16], fill=44)
    halo = halo.filter(ImageFilter.GaussianBlur(30))
    canvas.paste(Image.new('RGB', canvas.size, PAPER), (0, 0), halo)

    canvas.paste(quad, (qx, qy), quad)

    # --- tag ---------------------------------------------------------------
    ft = font(FONT_XBOLD, 64)
    trt = -0.010 * 64
    tw = tracked_width(tag, ft, trt)
    pad_x, pad_y = 32, 18
    tag_w = tw + pad_x * 2
    tag_h = 64 + pad_y * 2
    tx = W - 72 - tag_w
    ty = 64
    draw.rounded_rectangle([tx, ty, tx + tag_w, ty + tag_h], radius=5, fill=ACCENT)
    bt = measure_cap(draw, tag, ft)
    draw_tracked(draw, (tx + pad_x, ty + (tag_h - (bt[3] - bt[1])) / 2 - bt[1]),
                 tag, ft, trt, PAPER)

    # --- chart -------------------------------------------------------------
    # A step, an overshoot, and the overshoot circled. Read at 320 px it is still
    # "a line that shoots past and gets flagged", which is the whole point of the
    # thumbnail; the numbers live in the video. It sits right, opposite the quad
    # mark, so the lower third is balanced.
    sp, gy = step_response()
    cy_end = max(y2_cap + cap2 + 96, H - 62 - chart_h)
    draw_chart(draw, (748, cy_end, 1838, cy_end + chart_h), sp, gy, ACCENT)

    # a hairline rule under the type block ties the two lower elements together
    draw.line([(96, cy_end - 46), (1838, cy_end - 46)], fill=(*INK, 38), width=2)

    os.makedirs(OUT, exist_ok=True)
    if out_png:
        canvas.save(out_png)

    small = canvas.resize((1280, 720), Image.LANCZOS)
    jpg = os.path.join(OUT, f'thumb_{name}_1280x720.jpg')
    small.save(jpg, quality=92, subsampling=0)

    tiny = canvas.resize((320, 180), Image.LANCZOS)
    tiny.save(os.path.join(OUT, f'thumb_{name}_320_check.png'))

    return canvas, jpg


if __name__ == '__main__':
    # A: the primary concept — one word, the quad as a mark, the overshoot flagged
    png = os.path.join(OUT, 'thumb_ep01_a_1920x1080.png')
    canvas, jpg = build(out_png=png, name='ep01_a')
    print('wrote', png, canvas.size)
    print('wrote', jpg, os.path.getsize(jpg) // 1024, 'KB')

    # B: the alternative in the release draft, for when the first one is too
    # cryptic on a crowded shelf — it names the advice instead of the problem.
    # Both lines are headlines here, so they are set as one block, and the chart
    # grows into the space the shorter block leaves behind.
    png_b = os.path.join(OUT, 'thumb_ep01_b_1920x1080.png')
    canvas_b, jpg_b = build(
        line_one='DON\u2019T BUY',
        text_two_line='PARTS YET',
        tag='6 SIGNS',
        out_png=png_b,
        name='ep01_b',
        line1_ratio=0.98,
        type_max_w=1240,
        type_top=150,
        chart_h=300,
    )
    print('wrote', png_b, canvas_b.size)
    print('wrote', jpg_b, os.path.getsize(jpg_b) // 1024, 'KB')

