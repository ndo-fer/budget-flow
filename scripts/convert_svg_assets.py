from pathlib import Path
import sys
import tempfile

import cairo

sys.modules.setdefault("cairocffi", cairo)

from reportlab.graphics import renderPM
from svglib.svglib import svg2rlg


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT.parent / "budget-flow-svg-assets-v4-1"
ASSETS_DIR = ROOT / "frontend" / "assets"

EXPORTS = [
    ("icon.svg", "brand/icon.png", 1024, 1024),
    ("adaptive-icon.svg", "brand/adaptive-icon.png", 1024, 1024),
    ("splash-icon.svg", "brand/splash-icon.png", 1242, 2436),
    ("favicon.svg", "brand/favicon.png", 256, 256),
    ("logo-mark.svg", "brand/logo-mark.png", 1024, 1024),
    ("logo-horizontal.svg", "brand/logo-horizontal.png", 1600, 500),
    ("avatar-placeholder.svg", "profile/avatar-placeholder.png", 512, 512),
    ("status-healthy.svg", "status/status-healthy.png", 256, 256),
    ("status-watch.svg", "status/status-watch.png", 256, 256),
    ("status-alert.svg", "status/status-alert.png", 256, 256),
    ("onboarding-track.svg", "illustrations/onboarding/track.png", 1200, 1200),
    ("onboarding-budget.svg", "illustrations/onboarding/budget.png", 1200, 1200),
    ("onboarding-plan.svg", "illustrations/onboarding/plan.png", 1200, 1200),
    ("empty-expense.svg", "illustrations/empty/expense.png", 1200, 1200),
    ("empty-income.svg", "illustrations/empty/income.png", 1200, 1200),
    ("empty-recurring.svg", "illustrations/empty/recurring.png", 1200, 1200),
    ("empty-category.svg", "illustrations/empty/category.png", 1200, 1200),
]

GRADIENT_FALLBACKS = {
    "url(#bg)": "#FFF8F4",
    "url(#markGrad)": "#2FA6A0",
    "url(#accentGrad)": "#F26B5B",
}

GRADIENT_ASSETS = {
    "icon.svg",
    "adaptive-icon.svg",
    "splash-icon.svg",
    "logo-mark.svg",
    "logo-horizontal.svg",
}


def export_asset(source_name: str, relative_output: str, width: int, height: int) -> None:
    source_path = SOURCE_DIR / source_name
    output_path = ASSETS_DIR / relative_output
    output_path.parent.mkdir(parents=True, exist_ok=True)

    source_for_render = source_path
    temp_path = None

    if source_name in GRADIENT_ASSETS:
        svg_text = source_path.read_text(encoding="utf-8")
        for gradient_ref, fallback_color in GRADIENT_FALLBACKS.items():
            svg_text = svg_text.replace(gradient_ref, fallback_color)
        with tempfile.NamedTemporaryFile("w", suffix=".svg", delete=False, encoding="utf-8") as temp_file:
            temp_file.write(svg_text)
            temp_path = Path(temp_file.name)
            source_for_render = temp_path

    drawing = svg2rlg(str(source_for_render))
    if drawing is None:
        raise ValueError(f"Failed to parse SVG: {source_path}")

    scale_x = width / drawing.width if drawing.width else 1
    scale_y = height / drawing.height if drawing.height else 1
    drawing.width = width
    drawing.height = height
    drawing.scale(scale_x, scale_y)

    renderPM.drawToFile(drawing, str(output_path), fmt="PNG")

    if temp_path and temp_path.exists():
        temp_path.unlink()

    print(f"Exported {source_name} -> {output_path.relative_to(ASSETS_DIR)}")


def main() -> None:
    if not SOURCE_DIR.exists():
        raise SystemExit(f"Source SVG directory not found: {SOURCE_DIR}")

    for source_name, relative_output, width, height in EXPORTS:
        export_asset(source_name, relative_output, width, height)


if __name__ == "__main__":
    main()
