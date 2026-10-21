#!/usr/bin/env python3
"""
Animated guides for camera/microphone permission (public/permission-help/*.gif).

Each GIF shows one browser's real prompt (or its site-settings panel when access is
blocked), a finger/cursor moving to the right control, a pulsing "Tap here" ring, the
tap, and the camera coming on. Drawn from scratch so we own every pixel; text uses
Liberation Sans (SIL OFL) from pdfjs-dist.

    python3 scripts/permission-gifs/generate.py        # from interview-fe/

Scenes are rendered at 2x and downsampled for smooth edges.
"""
from __future__ import annotations

import math
import os
import sys
from dataclasses import dataclass
from typing import Callable

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "permission-help")
FONT_DIR = os.path.join(ROOT, "node_modules", "pdfjs-dist", "standard_fonts")
SS = 2  # supersampling
FPS = 15

# Palette
BRAND = (115, 103, 240)
BRAND_SOFT = (237, 235, 254)
INK = (17, 24, 39)
MUTED = (107, 114, 128)
LINE = (229, 231, 235)
WHITE = (255, 255, 255)
BG = (246, 245, 255)
GREEN = (22, 163, 74)
RED = (220, 38, 38)
IOS_BLUE = (10, 132, 255)
G_BLUE = (26, 115, 232)  # Chrome buttons
CHROME_BAR = (241, 243, 244)


def font(size: float, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "LiberationSans-Bold.ttf" if bold else "LiberationSans-Regular.ttf"
    return ImageFont.truetype(os.path.join(FONT_DIR, name), int(round(size * SS)))


# ---------------------------------------------------------------- drawing helpers
class Pen:
    """Draws in logical px (scaled by SS)."""

    def __init__(self, img: Image.Image):
        self.img = img
        self.d = ImageDraw.Draw(img, "RGBA")

    @staticmethod
    def s(v):
        return [x * SS for x in v] if isinstance(v, (list, tuple)) else v * SS

    def rect(self, box, fill=None, r=0, outline=None, width=1):
        self.d.rounded_rectangle(self.s(box), radius=r * SS, fill=fill, outline=outline, width=int(width * SS))

    def circle(self, cx, cy, r, fill=None, outline=None, width=1):
        self.d.ellipse(self.s((cx - r, cy - r, cx + r, cy + r)), fill=fill, outline=outline, width=int(width * SS))

    def line(self, pts, fill, width=1):
        self.d.line([(x * SS, y * SS) for x, y in pts], fill=fill, width=int(width * SS), joint="curve")

    def text(self, xy, s, size=12, fill=INK, bold=False, anchor="la"):
        self.d.text(self.s(xy), s, font=font(size, bold), fill=fill, anchor=anchor)

    def wrap(self, xy, s, width, size=12, fill=INK, bold=False, center=False, gap=1.3):
        f = font(size, bold)
        words, lines, cur = s.split(), [], ""
        for w in words:
            t = f"{cur} {w}".strip()
            if f.getlength(t) / SS <= width:
                cur = t
            else:
                lines.append(cur)
                cur = w
        lines.append(cur)
        x, y = xy
        for ln in lines:
            if center:
                self.text((x + width / 2, y), ln, size, fill, bold, anchor="ma")
            else:
                self.text((x, y), ln, size, fill, bold)
            y += size * gap
        return y

    def poly(self, pts, fill):
        self.d.polygon([(x * SS, y * SS) for x, y in pts], fill=fill)


def ease(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def seg(t: float, a: float, b: float) -> float:
    """0..1 progress of t through [a, b], eased."""
    return ease((t - a) / (b - a)) if b > a else float(t >= b)


def lerp(a, b, p):
    return a + (b - a) * p


def mix(c1, c2, p):
    return tuple(int(lerp(a, b, p)) for a, b in zip(c1, c2))


# ---------------------------------------------------------------- icons
def icon_camera(p: Pen, cx, cy, s=1.0, color=INK):
    p.rect((cx - 8 * s, cy - 5.5 * s, cx + 3 * s, cy + 5.5 * s), fill=color, r=2 * s)
    p.poly([(cx + 3.5 * s, cy - 1.5 * s), (cx + 8 * s, cy - 4.5 * s), (cx + 8 * s, cy + 4.5 * s), (cx + 3.5 * s, cy + 1.5 * s)], fill=color)


def icon_mic(p: Pen, cx, cy, s=1.0, color=INK):
    p.rect((cx - 3 * s, cy - 8 * s, cx + 3 * s, cy + 2 * s), fill=color, r=3 * s)
    p.d.arc(Pen.s((cx - 6 * s, cy - 6 * s, cx + 6 * s, cy + 5 * s)), 0, 180, fill=color, width=int(1.6 * s * SS))
    p.line([(cx, cy + 5 * s), (cx, cy + 8 * s)], color, 1.6 * s)


def icon_tune(p: Pen, cx, cy, color=INK):
    p.line([(cx - 7, cy - 3), (cx + 7, cy - 3)], color, 1.6)
    p.line([(cx - 7, cy + 3), (cx + 7, cy + 3)], color, 1.6)
    p.circle(cx - 2.5, cy - 3, 2.4, fill=WHITE, outline=color, width=1.6)
    p.circle(cx + 2.5, cy + 3, 2.4, fill=WHITE, outline=color, width=1.6)


def icon_reload(p: Pen, cx, cy, r=6, color=INK, width=1.6):
    p.d.arc(Pen.s((cx - r, cy - r, cx + r, cy + r)), 40, 330, fill=color, width=int(width * SS))
    a = math.radians(330)
    tip = (cx + r * math.cos(a), cy + r * math.sin(a))
    p.poly([(tip[0] - 3.5, tip[1] - 1.5), (tip[0] + 2.5, tip[1] - 3.5), (tip[0] + 1.5, tip[1] + 2.5)], fill=color)


def icon_check(p: Pen, cx, cy, r=9, bg=GREEN):
    p.circle(cx, cy, r, fill=bg)
    p.line([(cx - r * 0.45, cy), (cx - r * 0.1, cy + r * 0.38), (cx + r * 0.5, cy - r * 0.35)], WHITE, max(1.6, r / 5))


def toggle(p: Pen, x, y, on: float, color=G_BLUE):
    """Material switch at (x, y) top-left, 34x18; `on` 0..1 animates."""
    track = mix((189, 193, 198), mix(color, WHITE, 0.55), on)
    p.rect((x, y + 2, x + 34, y + 16), fill=track, r=7)
    kx = lerp(x + 8, x + 26, on)
    p.circle(kx, y + 9, 9, fill=mix(WHITE, color, on))


# ---------------------------------------------------------------- pointer + emphasis
def finger(p: Pen, x, y, press: float = 0.0):
    """Touch indicator like a screen recording: soft dot that shrinks when pressing."""
    r = lerp(15, 11, press)
    p.circle(x, y, r + 3, fill=(255, 255, 255, 150))
    p.circle(x, y, r, fill=(40, 40, 52, 150))


def cursor(p: Pen, x, y, press: float = 0.0):
    s = lerp(1.0, 0.88, press)
    pts = [(0, 0), (0, 17), (4.5, 13), (7.5, 20), (10.5, 18.8), (7.6, 12), (13, 12)]
    p.poly([(x + px * s + 1, y + py * s + 1) for px, py in pts], fill=(0, 0, 0, 70))
    p.poly([(x + px * s, y + py * s) for px, py in pts], fill=WHITE)
    inner = [(1.4, 3.2), (1.4, 14), (4.9, 10.6), (7.9, 17.4), (9, 17), (6.1, 10.3), (10, 10.3)]
    p.poly([(x + px * s, y + py * s) for px, py in inner], fill=INK)


def ripple(p: Pen, x, y, prog: float, color=BRAND):
    if 0 < prog < 1:
        p.circle(x, y, lerp(8, 30, prog), outline=(*color, int(200 * (1 - prog))), width=3)


def spotlight(p: Pen, box, t: float, label: str | None = None, below=False, color=BRAND):
    """Pulsing ring around the control to press, with a small label."""
    pulse = 0.5 + 0.5 * math.sin(t * 2 * math.pi * 1.6)
    grow = lerp(2, 6, pulse)
    x0, y0, x1, y1 = box
    p.rect((x0 - grow, y0 - grow, x1 + grow, y1 + grow), outline=(*color, int(lerp(230, 120, pulse))), width=2.5, r=10)
    if label:
        f = font(11, True)
        w = f.getlength(label) / SS + 16
        cx = (x0 + x1) / 2
        ly = y1 + grow + 6 if below else y0 - grow - 24
        p.rect((cx - w / 2, ly, cx + w / 2, ly + 19), fill=color, r=9.5)
        p.text((cx, ly + 4), label, 11, WHITE, bold=True, anchor="ma")


def path_point(t, keys):
    """keys: [(time, (x, y)), ...] -> eased position at time t."""
    if t <= keys[0][0]:
        return keys[0][1]
    for (t0, a), (t1, b) in zip(keys, keys[1:]):
        if t <= t1:
            q = seg(t, t0, t1)
            return (lerp(a[0], b[0], q), lerp(a[1], b[1], q))
    return keys[-1][1]


def press_amount(t, taps):
    """1 while a tap is happening (0.25s), for each tap time."""
    best = 0.0
    for tt in taps:
        if tt - 0.12 <= t <= tt + 0.18:
            best = max(best, 1 - abs(t - tt) / 0.18)
    return max(0.0, best)


# ---------------------------------------------------------------- shared page content
def interview_page(p: Pen, x, y, w, cam_on: float, blocked=False):
    """Our interview page: header, video tile (camera off -> on), and a status line."""
    p.text((x + 14, y + 14), "Mock interview", 14, INK, bold=True)
    p.text((x + 14, y + 34), "Senior Backend Engineer", 10.5, MUTED)
    tile = (x + 14, y + 58, x + w - 14, y + 58 + (w - 28) * 0.62)
    p.rect(tile, fill=mix((31, 41, 55), (55, 65, 81), cam_on), r=12)
    cx, cy = (tile[0] + tile[2]) / 2, (tile[1] + tile[3]) / 2
    if cam_on > 0.02:
        a = int(255 * cam_on)
        p.circle(cx, cy - 6, 17, fill=(229, 231, 235, a))
        p.d.pieslice(Pen.s((cx - 32, cy + 12, cx + 32, cy + 64)), 180, 360, fill=(229, 231, 235, a))
        p.rect((tile[0] + 8, tile[1] + 8, tile[0] + 52, tile[1] + 24), fill=(22, 163, 74, a), r=8)
        p.text((tile[0] + 30, tile[1] + 11), "LIVE", 9, (255, 255, 255, a), bold=True, anchor="ma")
    if cam_on < 0.98:
        a = int(255 * (1 - cam_on))
        icon_camera(p, cx, cy - 4, 1.4, (156, 163, 175, a))
        p.line([(cx - 13, cy + 8), (cx + 13, cy - 16)], (156, 163, 175, a), 2)
    sy = tile[3] + 14
    if blocked and cam_on < 0.5:
        p.rect((x + 14, sy, x + w - 14, sy + 34), fill=(254, 242, 242), r=8)
        p.circle(x + 30, sy + 17, 7, fill=RED)
        p.text((x + 30, sy + 11), "!", 10, WHITE, bold=True, anchor="ma")
        p.text((x + 44, sy + 10), "Camera & microphone blocked", 11, RED, bold=True)
    elif cam_on > 0.5:
        icon_check(p, x + 30, sy + 17, 8)
        p.text((x + 44, sy + 10), "Camera & microphone on", 11, GREEN, bold=True)
    else:
        for i, ww in enumerate((0.8, 0.6)):
            p.rect((x + 14, sy + 6 + i * 14, x + 14 + (w - 28) * ww, sy + 14 + i * 14), fill=LINE, r=4)


def phone_frame(p: Pen, W, H):
    p.rect((0, 0, W, H), fill=BG)
    p.rect((6, 6, W - 6, H - 6), fill=(31, 41, 55), r=30)
    p.rect((12, 12, W - 12, H - 12), fill=WHITE, r=25)
    return (12, 12, W - 12, H - 12)


def status_bar(p: Pen, x0, y0, x1):
    p.text((x0 + 22, y0 + 8), "9:41", 11, INK, bold=True)
    for i in range(4):
        p.rect((x1 - 62 + i * 4, y0 + 16 - i * 2.2, x1 - 59.5 + i * 4, y0 + 18), fill=INK)
    p.rect((x1 - 38, y0 + 9, x1 - 18, y0 + 18), outline=INK, width=1, r=2.5)
    p.rect((x1 - 36, y0 + 11, x1 - 24, y0 + 16), fill=INK, r=1)


# ================================================================ scenes
@dataclass
class Scene:
    name: str
    size: tuple[int, int]
    duration: float
    draw: Callable[[Pen, float], None]


# ---------------------------------------------------------------- Android Chrome
def android_bar(p: Pen, x0, y, x1, tune_hot=False):
    p.rect((x0 + 8, y + 4, x1 - 8, y + 34), fill=CHROME_BAR, r=15)
    if tune_hot:
        p.circle(x0 + 26, y + 19, 12, fill=(210, 227, 252))
    icon_tune(p, x0 + 26, y + 19)
    p.text((x0 + 44, y + 12), "interviewtrix.com", 12, INK)
    p.rect((x1 - 44, y + 12, x1 - 30, y + 26), outline=INK, width=1.6, r=3)
    p.text((x1 - 37, y + 14), "2", 8, INK, bold=True, anchor="ma")
    for i in range(3):
        p.circle(x1 - 18, y + 13 + i * 6, 1.4, fill=INK)


def android_allow(p: Pen, t: float):
    W, H = p.img.width // SS, p.img.height // SS
    x0, y0, x1, y1 = phone_frame(p, W, H)
    status_bar(p, x0, y0, x1)
    android_bar(p, x0, y0 + 28, x1)
    cam = seg(t, 3.3, 3.8)
    interview_page(p, x0, y0 + 70, x1 - x0, cam)

    show = seg(t, 0.5, 0.9) * (1 - seg(t, 2.9, 3.25))
    if show > 0:
        p.rect((x0, y0, x1, y1), fill=(0, 0, 0, int(110 * show)), r=25)
        sh = 272
        top = lerp(y1, y1 - sh, show)
        p.rect((x0, top, x1, y1 + 30), fill=WHITE, r=22)
        p.rect(((x0 + x1) / 2 - 18, top + 8, (x0 + x1) / 2 + 18, top + 12), fill=LINE, r=2)
        icon_camera(p, (x0 + x1) / 2 - 12, top + 34, 1.2, G_BLUE)
        icon_mic(p, (x0 + x1) / 2 + 14, top + 34, 1.1, G_BLUE)
        p.wrap((x0 + 18, top + 54), "interviewtrix.com wants to use your camera and microphone", x1 - x0 - 36, 12.5, INK, True, center=True)
        labels = ["Allow while visiting the site", "Allow this time", "Don't allow"]
        boxes = []
        for i, lab in enumerate(labels):
            by = top + 128 + i * 44
            box = (x0 + 18, by, x1 - 18, by + 36)
            boxes.append(box)
            pressed = i == 0 and 2.55 <= t <= 2.9
            p.rect(box, fill=(210, 227, 252) if pressed else (232, 240, 254), r=18)
            p.text(((box[0] + box[2]) / 2, by + 11), lab, 12, G_BLUE, bold=True, anchor="ma")
        if 1.5 <= t <= 2.6 and show > 0.99:
            spotlight(p, boxes[0], t, "Tap here")
        target = ((boxes[0][0] + boxes[0][2]) / 2 + 30, (boxes[0][1] + boxes[0][3]) / 2)
        if 0.9 <= t <= 3.0:
            fx, fy = path_point(t, [(0.9, (x1 - 10, y1 - 10)), (1.7, target)])
            ripple(p, *target, (t - 2.55) / 0.45)
            finger(p, fx, fy, press_amount(t, [2.6]))


# ---------------------------------------------------------------- iPhone Safari
def safari_bar(p: Pen, x0, x1, y, aa_hot=False):
    p.rect((x0, y - 6, x1, y + 52), fill=(249, 249, 249))
    p.line([(x0, y - 6), (x1, y - 6)], LINE, 1)
    p.rect((x0 + 10, y + 2, x1 - 10, y + 36), fill=(229, 229, 234), r=12)
    if aa_hot:
        p.rect((x0 + 14, y + 6, x0 + 46, y + 32), fill=(209, 209, 214), r=8)
    p.text((x0 + 22, y + 13), "a", 10, INK, bold=True)
    p.text((x0 + 29, y + 10), "A", 13, INK, bold=True)
    p.text(((x0 + x1) / 2, y + 12), "interviewtrix.com", 12, INK, anchor="ma")
    icon_reload(p, x1 - 28, y + 19, 6, INK)


def ios_allow(p: Pen, t: float):
    W, H = p.img.width // SS, p.img.height // SS
    x0, y0, x1, y1 = phone_frame(p, W, H)
    status_bar(p, x0, y0, x1)
    cam = seg(t, 3.3, 3.8)
    interview_page(p, x0, y0 + 30, x1 - x0, cam)
    safari_bar(p, x0, x1, y1 - 62)
    show = seg(t, 0.5, 0.8) * (1 - seg(t, 2.9, 3.15))
    if show > 0:
        p.rect((x0, y0, x1, y1), fill=(0, 0, 0, int(80 * show)), r=25)
        aw = 238
        ax0 = (x0 + x1) / 2 - aw / 2
        ay0 = (y0 + y1) / 2 - 80
        sc = lerp(1.08, 1.0, show)
        box = ((x0 + x1) / 2 - aw / 2 * sc, ay0, (x0 + x1) / 2 + aw / 2 * sc, ay0 + 142)
        p.rect(box, fill=(242, 242, 247, int(250 * show)), r=14)
        p.wrap((ax0 + 16, ay0 + 18), "“interviewtrix.com” Would Like to Access the Camera and Microphone", aw - 32, 13, INK, True, center=True)
        by = ay0 + 98
        p.line([(box[0], by), (box[2], by)], (200, 200, 205), 1)
        p.line([((x0 + x1) / 2, by), ((x0 + x1) / 2, box[3])], (200, 200, 205), 1)
        allow = ((x0 + x1) / 2, by, box[2], box[3])
        if 2.55 <= t <= 2.9:
            p.rect(allow, fill=(220, 220, 228), r=0)
        p.text(((box[0] + (x0 + x1) / 2) / 2, by + 14), "Don't Allow", 13.5, IOS_BLUE, anchor="ma")
        p.text((((x0 + x1) / 2 + box[2]) / 2, by + 14), "Allow", 13.5, IOS_BLUE, bold=True, anchor="ma")
        if 1.5 <= t <= 2.6 and show > 0.99:
            spotlight(p, (allow[0] + 6, allow[1] + 4, allow[2] - 6, allow[3] - 4), t, "Tap Allow", below=True, color=BRAND)
        target = ((allow[0] + allow[2]) / 2 + 30, (allow[1] + allow[3]) / 2 + 6)
        if 0.9 <= t <= 3.0:
            fx, fy = path_point(t, [(0.9, (x1 - 20, y1 - 30)), (1.7, target)])
            ripple(p, *target, (t - 2.55) / 0.45)
            finger(p, fx, fy, press_amount(t, [2.6]))


# ---------------------------------------------------------------- Desktop Chrome
def desktop_frame(p: Pen, W, H, tune_hot=False):
    p.rect((0, 0, W, H), fill=BG)
    p.rect((10, 10, W - 10, H - 10), fill=WHITE, r=10, outline=LINE, width=1)
    p.rect((10, 10, W - 10, 40), fill=(222, 225, 230), r=10)
    p.rect((10, 30, W - 10, 40), fill=(222, 225, 230))
    for i, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
        p.circle(26 + i * 15, 25, 5, fill=c)
    p.rect((76, 16, 230, 40), fill=WHITE, r=8)
    p.rect((76, 32, 230, 40), fill=WHITE)
    p.circle(92, 28, 6, fill=BRAND)
    p.text((104, 22), "Interview Trix", 11, INK)
    p.rect((10, 40, W - 10, 76), fill=WHITE)
    p.line([(10, 76), (W - 10, 76)], LINE, 1)
    p.text((24, 50), "‹", 18, MUTED)
    p.text((42, 50), "›", 18, (200, 200, 200))
    icon_reload(p, 70, 58, 6, MUTED)
    p.rect((88, 46, W - 60, 70), fill=CHROME_BAR, r=12)
    if tune_hot:
        p.circle(104, 58, 11, fill=(210, 227, 252))
    icon_tune(p, 104, 58)
    p.text((120, 51), "interviewtrix.com/dashboard/interview", 12, INK)
    for i in range(3):
        p.circle(W - 34, 51 + i * 6, 1.5, fill=INK)


def desktop_page(p: Pen, W, H, cam, blocked=False):
    p.text((30, 92), "Mock interview", 15, INK, bold=True)
    p.text((30, 113), "Senior Backend Engineer", 11, MUTED)
    interview_page_tile(p, W, H, cam, blocked)


def interview_page_tile(p: Pen, W, H, cam, blocked):
    tile = (W - 250, 92, W - 30, 92 + 140)
    p.rect(tile, fill=mix((31, 41, 55), (55, 65, 81), cam), r=12)
    cx, cy = (tile[0] + tile[2]) / 2, (tile[1] + tile[3]) / 2
    if cam > 0.02:
        a = int(255 * cam)
        p.circle(cx, cy - 8, 20, fill=(229, 231, 235, a))
        p.d.pieslice(Pen.s((cx - 38, cy + 14, cx + 38, cy + 74)), 180, 360, fill=(229, 231, 235, a))
    if cam < 0.98:
        a = int(255 * (1 - cam))
        icon_camera(p, cx, cy - 4, 1.6, (156, 163, 175, a))
        p.line([(cx - 15, cy + 9), (cx + 15, cy - 18)], (156, 163, 175, a), 2)
    if blocked and cam < 0.5:
        p.rect((30, 140, W - 270, 172), fill=(254, 242, 242), r=8)
        p.text((42, 150), "Camera & mic blocked", 11, RED, bold=True)
    elif cam > 0.5:
        icon_check(p, 40, 156, 8)
        p.text((54, 150), "Camera & microphone on", 11, GREEN, bold=True)
    else:
        for i, ww in enumerate((150, 110, 130)):
            p.rect((30, 142 + i * 16, 30 + ww, 150 + i * 16), fill=LINE, r=4)


def desktop_allow(p: Pen, t: float):
    W, H = p.img.width // SS, p.img.height // SS
    desktop_frame(p, W, H)
    cam = seg(t, 3.3, 3.8)
    desktop_page(p, W, H, cam)
    show = seg(t, 0.5, 0.8) * (1 - seg(t, 2.9, 3.15))
    if show > 0:
        bx0, by0 = 92, 72
        bw = 250
        box = (bx0, by0, bx0 + bw, by0 + 216)
        p.rect((box[0] + 2, box[1] + 3, box[2] + 2, box[3] + 3), fill=(0, 0, 0, int(40 * show)), r=10)
        p.rect(box, fill=(255, 255, 255, int(255 * show)), r=10, outline=LINE, width=1)
        p.text((bx0 + 16, by0 + 14), "interviewtrix.com wants to", 12.5, INK, bold=True)
        icon_mic(p, bx0 + 24, by0 + 46, 0.9, MUTED)
        p.text((bx0 + 38, by0 + 40), "Use your microphone", 11.5, INK)
        icon_camera(p, bx0 + 24, by0 + 68, 0.9, MUTED)
        p.text((bx0 + 38, by0 + 62), "Use your camera", 11.5, INK)
        labels = ["Allow while visiting the site", "Allow this time", "Never allow"]
        boxes = []
        for i, lab in enumerate(labels):
            yy = by0 + 108 + i * 34
            b = (bx0 + 14, yy, bx0 + bw - 14, yy + 28)
            boxes.append(b)
            pressed = i == 0 and 2.55 <= t <= 2.9
            p.rect(b, fill=(210, 227, 252) if pressed else (232, 240, 254), r=14)
            p.text(((b[0] + b[2]) / 2, yy + 8), lab, 11.5, G_BLUE, bold=True, anchor="ma")
        if 1.5 <= t <= 2.6 and show > 0.99:
            spotlight(p, boxes[0], t, "Click here", below=False)
        target = ((boxes[0][0] + boxes[0][2]) / 2 + 40, (boxes[0][1] + boxes[0][3]) / 2)
        if 0.9 <= t <= 3.0:
            cx, cy = path_point(t, [(0.9, (W - 60, H - 40)), (1.7, target)])
            ripple(p, *target, (t - 2.55) / 0.45)
            cursor(p, cx, cy, press_amount(t, [2.6]))


# ---------------------------------------------------------------- Blocked: Android Chrome
def android_unblock(p: Pen, t: float):
    """Tap the tune icon -> Permissions toggles on -> Reload."""
    W, H = p.img.width // SS, p.img.height // SS
    x0, y0, x1, y1 = phone_frame(p, W, H)
    status_bar(p, x0, y0, x1)
    T_TUNE, T_CAM, T_MIC, T_RELOAD = 1.5, 3.0, 3.9, 5.2
    android_bar(p, x0, y0 + 28, x1, tune_hot=T_TUNE - 0.1 <= t <= T_TUNE + 0.4)
    cam = seg(t, T_RELOAD + 0.4, T_RELOAD + 0.9)
    interview_page(p, x0, y0 + 70, x1 - x0, cam, blocked=True)

    tune = (x0 + 26, y0 + 47)
    show = seg(t, T_TUNE + 0.15, T_TUNE + 0.5) * (1 - seg(t, T_RELOAD - 0.6, T_RELOAD - 0.3))
    cam_on = seg(t, T_CAM, T_CAM + 0.25)
    mic_on = seg(t, T_MIC, T_MIC + 0.25)
    pts = [(0.3, (x1 - 20, y1 - 40)), (1.1, tune)]
    taps = [T_TUNE]
    sheet_top = y1 - 220
    cam_tg = (x1 - 58, sheet_top + 96)
    mic_tg = (x1 - 58, sheet_top + 136)
    if show > 0:
        p.rect((x0, y0, x1, y1), fill=(0, 0, 0, int(90 * show)), r=25)
        top = lerp(y1, sheet_top, show)
        p.rect((x0, top, x1, y1 + 30), fill=WHITE, r=22)
        p.text((x0 + 20, top + 20), "interviewtrix.com", 14, INK, bold=True)
        p.text((x0 + 20, top + 40), "Connection is secure", 11, MUTED)
        p.line([(x0 + 16, top + 64), (x1 - 16, top + 64)], LINE, 1)
        p.text((x0 + 20, top + 74), "Permissions", 11, MUTED, bold=True)
        rows = [("Camera", icon_camera, cam_on, top + 96), ("Microphone", icon_mic, mic_on, top + 136)]
        for label, ic, on, ry in rows:
            ic(p, x0 + 30, ry + 9, 1.0, INK)
            p.text((x0 + 48, ry + 2), label, 13, INK)
            toggle(p, x1 - 58, ry, on)
        if show > 0.99:
            if T_TUNE + 0.6 <= t <= T_CAM:
                spotlight(p, (cam_tg[0] - 4, cam_tg[1] - 3, cam_tg[0] + 38, cam_tg[1] + 21), t, "Turn on", below=False)
            elif T_CAM + 0.3 <= t <= T_MIC:
                spotlight(p, (mic_tg[0] - 4, mic_tg[1] - 3, mic_tg[0] + 38, mic_tg[1] + 21), t, "Turn on", below=True)
    pts += [(T_TUNE + 0.7, (cam_tg[0] + 26, cam_tg[1] + 9)), (T_MIC - 0.4, (mic_tg[0] + 26, mic_tg[1] + 9))]
    taps += [T_CAM, T_MIC]
    # Snackbar asking to reload
    snack = seg(t, T_RELOAD - 0.3, T_RELOAD) * (1 - seg(t, T_RELOAD + 0.3, T_RELOAD + 0.6))
    reload_btn = (x1 - 80, y1 - 58, x1 - 22, y1 - 30)
    if snack > 0:
        sy = lerp(y1 + 10, y1 - 66, snack)
        p.rect((x0 + 12, sy, x1 - 12, sy + 44), fill=(50, 50, 56), r=8)
        p.text((x0 + 24, sy + 15), "Reload to apply", 11.5, WHITE)
        p.text((x1 - 51, sy + 15), "Reload", 12, (138, 180, 248), bold=True, anchor="ma")
        if T_RELOAD - 0.05 <= t <= T_RELOAD + 0.2 and snack > 0.9:
            pass
    pts += [(T_RELOAD - 0.2, ((reload_btn[0] + reload_btn[2]) / 2, (reload_btn[1] + reload_btn[3]) / 2 + 2))]
    taps += [T_RELOAD]
    if 0.3 <= t <= T_RELOAD + 0.35:
        fx, fy = path_point(t, pts)
        for tt in taps:
            ripple(p, fx, fy, (t - tt) / 0.45)
        finger(p, fx, fy, press_amount(t, taps))
    if 0.6 <= t <= T_TUNE and seg(t, 0.6, 0.8) > 0:
        spotlight(p, (tune[0] - 12, tune[1] - 12, tune[0] + 12, tune[1] + 12), t, "Tap here", below=True)


# ---------------------------------------------------------------- Blocked: iPhone Safari
def ios_unblock(p: Pen, t: float):
    """aA -> Website Settings -> Camera/Microphone: Allow -> Done -> reload."""
    W, H = p.img.width // SS, p.img.height // SS
    x0, y0, x1, y1 = phone_frame(p, W, H)
    status_bar(p, x0, y0, x1)
    T_AA, T_WS, T_CAM, T_MIC, T_DONE, T_RELOAD = 1.4, 2.6, 3.7, 4.5, 5.3, 6.1
    cam = seg(t, T_RELOAD + 0.3, T_RELOAD + 0.8)
    interview_page(p, x0, y0 + 30, x1 - x0, cam, blocked=True)
    bar_y = y1 - 62
    safari_bar(p, x0, x1, bar_y, aa_hot=T_AA - 0.1 <= t <= T_WS)
    aa = (x0 + 30, bar_y + 19)
    reload = (x1 - 28, bar_y + 19)
    pts = [(0.3, (x1 - 40, y0 + 200)), (1.0, aa)]
    taps = [T_AA]

    # aA menu
    menu = seg(t, T_AA + 0.1, T_AA + 0.35) * (1 - seg(t, T_WS + 0.05, T_WS + 0.25))
    ws_row = (x0 + 12, bar_y - 54, x0 + 210, bar_y - 18)
    if menu > 0:
        mb = (x0 + 12, bar_y - 146, x0 + 210, bar_y - 10)
        p.rect(mb, fill=(250, 250, 252, int(250 * menu)), r=14, outline=LINE, width=1)
        for i, lab in enumerate(["Show Reader", "Hide Toolbar", "Website Settings"]):
            ry = mb[1] + 10 + i * 44
            if i:
                p.line([(mb[0] + 14, ry - 6), (mb[2] - 14, ry - 6)], LINE, 1)
            p.text((mb[0] + 16, ry + 8), lab, 13, INK if i == 2 else MUTED, bold=i == 2)
        if T_AA + 0.4 <= t <= T_WS and menu > 0.99:
            spotlight(p, ws_row, t, "Tap here")
    pts += [(T_AA + 0.6, ((ws_row[0] + ws_row[2]) / 2, (ws_row[1] + ws_row[3]) / 2))]
    taps += [T_WS]

    # Website Settings sheet
    sheet = seg(t, T_WS + 0.2, T_WS + 0.5) * (1 - seg(t, T_DONE + 0.05, T_DONE + 0.35))
    top = y0 + 120
    cam_row = (x0 + 16, top + 90, x1 - 16, top + 128)
    mic_row = (x0 + 16, top + 130, x1 - 16, top + 168)
    done = (x1 - 70, top + 10, x1 - 18, top + 34)
    if sheet > 0:
        p.rect((x0, y0, x1, y1), fill=(0, 0, 0, int(70 * sheet)), r=25)
        st = lerp(y1, top, sheet)
        p.rect((x0, st, x1, y1 + 30), fill=(242, 242, 247), r=16)
        dy = st - top
        p.text((x1 - 44, top + 14 + dy), "Done", 13, IOS_BLUE, bold=True, anchor="ma")
        p.text(((x0 + x1) / 2, top + 44 + dy), "interviewtrix.com", 12, MUTED, anchor="ma")
        p.text((x0 + 22, top + 70 + dy), "ALLOW ACCESS TO", 9.5, MUTED)
        p.rect((x0 + 16, top + 88 + dy, x1 - 16, top + 170 + dy), fill=WHITE, r=10)
        for label, row, tt in (("Camera", cam_row, T_CAM), ("Microphone", mic_row, T_MIC)):
            ry = row[1] + dy
            if row is mic_row:
                p.line([(row[0] + 14, ry - 1), (row[2], ry - 1)], LINE, 1)
            p.text((row[0] + 14, ry + 11), label, 13, INK)
            val = "Allow" if t >= tt + 0.1 else "Deny"
            p.text((row[2] - 24, ry + 11), val, 13, GREEN if val == "Allow" else MUTED, bold=val == "Allow", anchor="ra")
            p.text((row[2] - 12, ry + 9), "›", 15, (199, 199, 204), anchor="ma")
        if sheet > 0.99:
            if T_WS + 0.5 <= t <= T_CAM:
                spotlight(p, cam_row, t, "Set to Allow", below=False)
            elif T_CAM + 0.3 <= t <= T_MIC:
                spotlight(p, mic_row, t, "Set to Allow", below=True)
            elif T_MIC + 0.3 <= t <= T_DONE:
                spotlight(p, done, t, "Tap Done", below=True)
    pts += [
        (T_WS + 0.7, ((cam_row[0] + cam_row[2]) / 2 + 40, (cam_row[1] + cam_row[3]) / 2)),
        (T_CAM + 0.5, ((mic_row[0] + mic_row[2]) / 2 + 40, (mic_row[1] + mic_row[3]) / 2)),
        (T_MIC + 0.5, ((done[0] + done[2]) / 2, (done[1] + done[3]) / 2)),
        (T_DONE + 0.5, reload),
    ]
    taps += [T_CAM, T_MIC, T_DONE, T_RELOAD]
    if T_DONE + 0.4 <= t <= T_RELOAD:
        spotlight(p, (reload[0] - 13, reload[1] - 13, reload[0] + 13, reload[1] + 13), t, "Reload")
    if 0.3 <= t <= T_RELOAD + 0.35:
        fx, fy = path_point(t, pts)
        for tt in taps:
            ripple(p, fx, fy, (t - tt) / 0.45)
        finger(p, fx, fy, press_amount(t, taps))
    if 0.5 <= t <= T_AA:
        spotlight(p, (aa[0] - 16, aa[1] - 13, aa[0] + 16, aa[1] + 13), t, "Tap aA")


# ---------------------------------------------------------------- Blocked: Desktop Chrome
def desktop_unblock(p: Pen, t: float):
    W, H = p.img.width // SS, p.img.height // SS
    T_TUNE, T_CAM, T_MIC, T_RELOAD = 1.4, 2.7, 3.5, 4.5
    desktop_frame(p, W, H, tune_hot=T_TUNE - 0.1 <= t <= T_RELOAD)
    cam = seg(t, T_RELOAD + 0.3, T_RELOAD + 0.8)
    desktop_page(p, W, H, cam, blocked=True)
    tune = (104, 58)
    pts = [(0.3, (W - 80, H - 50)), (1.0, tune)]
    taps = [T_TUNE]
    show = seg(t, T_TUNE + 0.1, T_TUNE + 0.35) * (1 - seg(t, T_RELOAD + 0.05, T_RELOAD + 0.3))
    bx0, by0, bw = 92, 72, 250
    cam_tg = (bx0 + bw - 54, by0 + 70)
    mic_tg = (bx0 + bw - 54, by0 + 100)
    reload_btn = (bx0 + bw - 86, by0 + 152, bx0 + bw - 16, by0 + 176)
    if show > 0:
        box = (bx0, by0, bx0 + bw, by0 + 190)
        p.rect((box[0] + 2, box[1] + 3, box[2] + 2, box[3] + 3), fill=(0, 0, 0, int(40 * show)), r=10)
        p.rect(box, fill=(255, 255, 255, int(255 * show)), r=10, outline=LINE, width=1)
        p.text((bx0 + 16, by0 + 14), "interviewtrix.com", 12.5, INK, bold=True)
        p.text((bx0 + 16, by0 + 32), "Connection is secure", 10.5, MUTED)
        p.line([(bx0 + 12, by0 + 54), (bx0 + bw - 12, by0 + 54)], LINE, 1)
        for label, ic, tg, tt in (("Camera", icon_camera, cam_tg, T_CAM), ("Microphone", icon_mic, mic_tg, T_MIC)):
            ic(p, bx0 + 26, tg[1] + 9, 0.9, INK)
            p.text((bx0 + 42, tg[1] + 3), label, 12, INK)
            toggle(p, tg[0], tg[1], seg(t, tt, tt + 0.25))
        if t >= T_MIC + 0.3:
            p.text((bx0 + 16, by0 + 132), "Reload this page to apply", 10.5, MUTED)
            p.rect(reload_btn, fill=G_BLUE, r=12)
            p.text(((reload_btn[0] + reload_btn[2]) / 2, reload_btn[1] + 6), "Reload", 11, WHITE, bold=True, anchor="ma")
        if show > 0.99:
            if T_TUNE + 0.4 <= t <= T_CAM:
                spotlight(p, (cam_tg[0] - 4, cam_tg[1] - 3, cam_tg[0] + 38, cam_tg[1] + 21), t)
            elif T_CAM + 0.3 <= t <= T_MIC:
                spotlight(p, (mic_tg[0] - 4, mic_tg[1] - 3, mic_tg[0] + 38, mic_tg[1] + 21), t)
            elif T_MIC + 0.4 <= t <= T_RELOAD:
                spotlight(p, reload_btn, t)
    pts += [
        (T_TUNE + 0.6, (cam_tg[0] + 26, cam_tg[1] + 9)),
        (T_MIC - 0.4, (mic_tg[0] + 26, mic_tg[1] + 9)),
        (T_RELOAD - 0.3, ((reload_btn[0] + reload_btn[2]) / 2, (reload_btn[1] + reload_btn[3]) / 2)),
    ]
    taps += [T_CAM, T_MIC, T_RELOAD]
    if 0.5 <= t <= T_TUNE:
        spotlight(p, (tune[0] - 11, tune[1] - 11, tune[0] + 11, tune[1] + 11), t, "Click here", below=True)
    if 0.3 <= t <= T_RELOAD + 0.35:
        cx, cy = path_point(t, pts)
        for tt in taps:
            ripple(p, cx, cy, (t - tt) / 0.45)
        cursor(p, cx, cy, press_amount(t, taps))


SCENES = [
    Scene("allow-android-chrome", (300, 520), 5.0, android_allow),
    Scene("allow-ios-safari", (300, 520), 5.0, ios_allow),
    Scene("allow-desktop-chrome", (520, 340), 5.0, desktop_allow),
    Scene("unblock-android-chrome", (300, 520), 7.0, android_unblock),
    Scene("unblock-ios-safari", (300, 520), 7.8, ios_unblock),
    Scene("unblock-desktop-chrome", (520, 340), 6.2, desktop_unblock),
]


def render(scene: Scene, out_scale: float = 1.5) -> str:
    w, h = scene.size
    frames = []
    n = int(scene.duration * FPS)
    for i in range(n):
        img = Image.new("RGB", (w * SS, h * SS), WHITE)
        scene.draw(Pen(img), i / FPS)
        frames.append(img.resize((int(w * out_scale), int(h * out_scale)), Image.LANCZOS))
    # One shared palette keeps colours steady between frames (no shimmer).
    sheet = Image.new("RGB", (frames[0].width, frames[0].height * min(len(frames), 12)))
    for k in range(min(len(frames), 12)):
        sheet.paste(frames[(k * len(frames)) // 12], (0, frames[0].height * k))
    palette = sheet.quantize(colors=128, method=Image.Quantize.MEDIANCUT)
    paletted = [f.quantize(palette=palette, dither=Image.Dither.NONE) for f in frames]
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"{scene.name}.gif")
    durations = [int(1000 / FPS)] * n
    durations[-1] = 900  # rest on the result before looping
    paletted[0].save(path, save_all=True, append_images=paletted[1:], duration=durations, loop=0, optimize=True, disposal=1)
    return path


if __name__ == "__main__":
    wanted = set(sys.argv[1:])
    for sc in SCENES:
        if wanted and sc.name not in wanted:
            continue
        p = render(sc)
        print(f"{os.path.relpath(p, ROOT)}  {os.path.getsize(p) // 1024} KB")
