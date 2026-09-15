"""
Repair frosted-glass / hourglass scars from earlier watermark inpaint,
then place a clean small top-left Offshore logo.

  python scripts/repair-glass-artifacts.py <input> <output>
"""

from __future__ import annotations

import sys
from pathlib import Path

import cv2
import numpy as np
from skimage.restoration import inpaint_biharmonic


def fill_rounded_rect(mask: np.ndarray, x: int, y: int, w: int, h: int) -> None:
    height, width = mask.shape[:2]
    x2 = min(width, x + w)
    y2 = min(height, y + h)
    x = max(0, x)
    y = max(0, y)
    if x2 <= x or y2 <= y:
        return
    radius = max(10, int(min(x2 - x, y2 - y) * 0.1))
    cv2.rectangle(mask, (x + radius, y), (x2 - radius, y2), 255, -1)
    cv2.rectangle(mask, (x, y + radius), (x2, y2 - radius), 255, -1)
    for cx, cy in (
        (x + radius, y + radius),
        (x2 - radius, y + radius),
        (x + radius, y2 - radius),
        (x2 - radius, y2 - radius),
    ):
        cv2.circle(mask, (cx, cy), radius, 255, -1)


def geometric_scar_mask(width: int, height: int) -> np.ndarray:
    short = min(width, height)
    mask = np.zeros((height, width), dtype=np.uint8)

    cw = max(90, int(short * 0.36))
    ch = max(110, int(short * 0.44))
    cx = max(0, (width - cw) // 2)
    cy = max(0, (height - ch) // 2)
    fill_rounded_rect(mask, cx, cy, cw, ch)

    diag = max(70, int(short * 0.26))
    pts = np.array(
        [
            [width // 2, max(0, height // 2 - diag)],
            [min(width - 1, width // 2 + diag), height // 2],
            [width // 2, min(height - 1, height // 2 + diag)],
            [max(0, width // 2 - diag), height // 2],
        ],
        dtype=np.int32,
    )
    cv2.fillConvexPoly(mask, pts, 255)

    tl_w = max(120, int(short * 0.3))
    tl_h = max(140, int(short * 0.34))
    fill_rounded_rect(mask, 0, 0, tl_w, tl_h)
    return mask


def blur_scar_mask(image_bgr: np.ndarray) -> np.ndarray:
    """Find abnormally smooth / smeared patches typical of failed inpaint."""
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    lap = cv2.Laplacian(gray, cv2.CV_32F)
    lap_abs = np.abs(lap)
    # Local mean of edge energy — scars are much smoother than real photo detail
    win = max(9, (min(image_bgr.shape[:2]) // 40) | 1)
    local = cv2.blur(lap_abs, (win, win))
    # Adaptive threshold: keep lowest-detail patches
    thr = float(np.percentile(local, 18))
    soft = (local < thr).astype(np.uint8) * 255

    # Also catch teal/cyan logo-color smears
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    teal = cv2.inRange(hsv, (70, 25, 40), (110, 255, 255))
    teal = cv2.morphologyEx(teal, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))

    combo = cv2.bitwise_or(soft, teal)
    # Restrict to center + top-left zones so we don't wipe sky/walls everywhere
    h, w = gray.shape
    zone = geometric_scar_mask(w, h)
    zone = cv2.dilate(zone, np.ones((21, 21), np.uint8), iterations=1)
    return cv2.bitwise_and(combo, zone)


def build_mask(image_bgr: np.ndarray) -> np.ndarray:
    h, w = image_bgr.shape[:2]
    geo = geometric_scar_mask(w, h)
    blur = blur_scar_mask(image_bgr)
    mask = cv2.bitwise_or(geo, blur)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    mask = cv2.dilate(mask, kernel, iterations=1)
    return mask


def heal(image_bgr: np.ndarray, mask: np.ndarray) -> np.ndarray:
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB).astype(np.float64) / 255.0
    m = (mask > 0).astype(bool)
    if not np.any(m):
        return image_bgr
    # Biharmonic works channel-wise and handles larger holes better than TELEA alone.
    repaired = inpaint_biharmonic(rgb, m, channel_axis=-1)
    repaired_bgr = cv2.cvtColor(
        (np.clip(repaired, 0, 1) * 255).astype(np.uint8),
        cv2.COLOR_RGB2BGR,
    )
    # Light TELEA polish on the mask edge only
    edge = cv2.morphologyEx(mask, cv2.MORPH_GRADIENT, np.ones((5, 5), np.uint8))
    if cv2.countNonZero(edge) > 0:
        repaired_bgr = cv2.inpaint(repaired_bgr, edge, 2, cv2.INPAINT_TELEA)
    return repaired_bgr


def load_logo(logo_path: Path) -> np.ndarray | None:
    logo = cv2.imread(str(logo_path), cv2.IMREAD_UNCHANGED)
    if logo is None:
        return None
    if logo.ndim == 2:
        logo = cv2.cvtColor(logo, cv2.COLOR_GRAY2BGRA)
    elif logo.shape[2] == 3:
        alpha = np.full(logo.shape[:2], 255, dtype=np.uint8)
        logo = np.dstack([logo, alpha])
    return logo


def stamp_logo(image: np.ndarray, logo: np.ndarray) -> np.ndarray:
    h, w = image.shape[:2]
    short = min(w, h)
    target_w = max(44, int(short * 0.095))
    target_w = min(target_w, int(w * 0.15))
    scale = target_w / max(1, logo.shape[1])
    target_h = max(1, int(logo.shape[0] * scale))
    max_h = int(h * 0.15)
    if target_h > max_h:
        shrink = max_h / target_h
        target_h = max_h
        target_w = max(36, int(target_w * shrink))

    resized = cv2.resize(logo, (target_w, target_h), interpolation=cv2.INTER_AREA)
    pad_x = max(28, min(72, int(w * 0.07)))
    pad_y = max(28, min(72, int(h * 0.055)))
    left = min(pad_x, max(0, w - target_w - pad_x))
    top = min(pad_y, max(0, h - target_h - pad_y))

    out = image.copy()
    roi = out[top : top + target_h, left : left + target_w]
    alpha = resized[:, :, 3:4].astype(np.float32) / 255.0
    rgb = resized[:, :, :3].astype(np.float32)
    base = roi.astype(np.float32)
    blended = rgb * alpha + base * (1.0 - alpha)
    out[top : top + target_h, left : left + target_w] = blended.astype(np.uint8)
    return out


def repair_file(input_path: Path, output_path: Path, logo_path: Path | None) -> None:
    image = cv2.imread(str(input_path), cv2.IMREAD_COLOR)
    if image is None:
        raise SystemExit(f"could not read {input_path}")
    mask = build_mask(image)
    healed = heal(image, mask)
    if logo_path and logo_path.exists():
        logo = load_logo(logo_path)
        if logo is not None:
            healed = stamp_logo(healed, logo)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    ok = cv2.imwrite(str(output_path), healed, [int(cv2.IMWRITE_JPEG_QUALITY), 91])
    if not ok:
        raise SystemExit(f"could not write {output_path}")


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    logo = root / "public" / "watermark-mark.png"
    if len(sys.argv) != 3:
        print("usage: python scripts/repair-glass-artifacts.py <input> <output>", file=sys.stderr)
        return 1
    repair_file(Path(sys.argv[1]), Path(sys.argv[2]), logo)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
