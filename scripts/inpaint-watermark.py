import sys
from pathlib import Path

import cv2
import numpy as np


def build_mask(width: int, height: int) -> np.ndarray:
    short_side = min(width, height)
    mask_w = max(80, int(short_side * 0.5))
    mask_h = max(64, int(mask_w * 0.72))
    x = max(0, (width - mask_w) // 2)
    y = max(0, (height - mask_h) // 2)

    mask = np.zeros((height, width), dtype=np.uint8)
    radius = max(12, int(min(mask_w, mask_h) * 0.08))
    cv2.rectangle(mask, (x + radius, y), (x + mask_w - radius, y + mask_h), 255, -1)
    cv2.rectangle(mask, (x, y + radius), (x + mask_w, y + mask_h - radius), 255, -1)
    cv2.circle(mask, (x + radius, y + radius), radius, 255, -1)
    cv2.circle(mask, (x + mask_w - radius, y + radius), radius, 255, -1)
    cv2.circle(mask, (x + radius, y + mask_h - radius), radius, 255, -1)
    cv2.circle(mask, (x + mask_w - radius, y + mask_h - radius), radius, 255, -1)
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
    restored = cv2.inpaint(image, mask, 7, cv2.INPAINT_TELEA)

    ok = cv2.imwrite(str(output_path), restored)
    if not ok:
        print(f"could not write image: {output_path}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
