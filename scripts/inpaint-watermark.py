import sys
from pathlib import Path

import cv2
import numpy as np


def fill_rounded_rect(mask: np.ndarray, x: int, y: int, w: int, h: int) -> None:
    height, width = mask.shape[:2]
    x2 = min(width - 1, x + w)
    y2 = min(height - 1, y + h)
    x = max(0, x)
    y = max(0, y)
    if x2 <= x or y2 <= y:
        return
    radius = max(8, int(min(x2 - x, y2 - y) * 0.08))
    cv2.rectangle(mask, (x + radius, y), (x2 - radius, y2), 255, -1)
    cv2.rectangle(mask, (x, y + radius), (x2, y2 - radius), 255, -1)
    cv2.circle(mask, (x + radius, y + radius), radius, 255, -1)
    cv2.circle(mask, (x2 - radius, y + radius), radius, 255, -1)
    cv2.circle(mask, (x + radius, y2 - radius), radius, 255, -1)
    cv2.circle(mask, (x2 - radius, y2 - radius), radius, 255, -1)


def build_mask(width: int, height: int) -> np.ndarray:
    """Cover old center watermarks and previous top-left marks."""
    short_side = min(width, height)
    mask = np.zeros((height, width), dtype=np.uint8)

    # Center logo zone (older stamps)
    mask_w = max(72, int(short_side * 0.34))
    mask_h = max(96, int(short_side * 0.42))
    cx = max(0, (width - mask_w) // 2)
    cy = max(0, (height - mask_h) // 2)
    fill_rounded_rect(mask, cx, cy, mask_w, mask_h)

    band_w = max(80, int(short_side * 0.4))
    band_h = max(28, int(short_side * 0.08))
    bx = max(0, (width - band_w) // 2)
    by = max(0, cy + int(mask_h * 0.62))
    cv2.rectangle(mask, (bx, by), (bx + band_w, min(height - 1, by + band_h)), 255, -1)

    # Top-left zone (recent stamps that were too large / clipped)
    tl_w = max(96, int(short_side * 0.28))
    tl_h = max(110, int(short_side * 0.32))
    fill_rounded_rect(mask, 0, 0, tl_w, tl_h)

    return mask


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: python scripts/inpaint-watermark.py <input> <output>", file=sys.stderr)
        return 1

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])

    image = cv2.imread(str(input_path), cv2.IMREAD_COLOR)
    if image is None:
        print(f"could not read image: {input_path}", file=sys.stderr)
        return 1

    height, width = image.shape[:2]
    mask = build_mask(width, height)
    restored = cv2.inpaint(image, mask, 5, cv2.INPAINT_TELEA)

    ok = cv2.imwrite(str(output_path), restored)
    if not ok:
        print(f"could not write image: {output_path}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
