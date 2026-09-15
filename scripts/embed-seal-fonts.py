#!/usr/bin/env python3
"""Re-embed the seal's webfonts after editing the artwork.

    python3 scripts/embed-seal-fonts.py          # rewrite public/brand/*.svg
    python3 scripts/embed-seal-fonts.py --check  # verify, change nothing

Why this exists: the seal is loaded as `<img src="/brand/seal-*.svg">`, and an
SVG rendered through <img> is an isolated document that cannot fetch an
external resource — webfonts included. A file that merely names
`font-family="Newsreader"` therefore falls back to Times for the D and DUMAS
and to a system sans for the ring text, which is the whole wordmark. So each
file carries its own font, subsetted to the glyphs it actually sets, as a
data: URI.

The subsets stay *variable* rather than pinned to one instance: Newsreader's
opsz axis has to serve both the 128px D and the 27px DUMAS in the same file,
and a single static instance cannot be optically right at both.

Idempotent — it strips any <style> block it previously inserted before adding
the new one, so it is safe to run repeatedly. public/brand/ is the source of
truth for the artwork; there is no separate un-embedded original.

Needs `fonttools[woff]` (pip install 'fonttools[woff]') and network access to
fonts.googleapis.com.
"""

import argparse
import base64
import io
import re
import sys
import urllib.request
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

BRAND = Path(__file__).resolve().parent.parent / "public" / "brand"
FILES = ["seal.svg", "seal-reversed.svg", "seal-mark.svg", "seal-mark-reversed.svg"]

# Full axis ranges, so the css2 API hands back the variable font rather than a
# static instance. The weight range each @font-face then declares must cover
# the weight the SVG asks for (500).
FAMILIES = {
    "Newsreader": ("Newsreader:opsz,wght@6..72,400..700", "200 800"),
    "Jost": ("Jost:wght@100..900", "100 900"),
}
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

# Matches only a <style> block sitting at the start of <defs>, which is where
# this script puts it — not any styling that belongs to the artwork itself.
EMBEDDED = re.compile(r"(<defs>)\s*<style>.*?</style>", re.S)


def fetch(url: str, accept_css: bool = False) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def variable_font(spec: str) -> bytes:
    """Download one family's latin variable woff2 from Google Fonts."""
    css = fetch(f"https://fonts.googleapis.com/css2?family={spec}&display=swap").decode()
    urls = re.findall(r"https://[^)]*\.woff2", css)
    if not urls:
        sys.exit(f"no woff2 in the css2 response for {spec}")
    # css2 lists subsets in order and ends with latin, which is the one that
    # carries the Basic Latin glyphs the seal sets.
    return fetch(urls[-1])


def subset(raw: bytes, chars: str) -> tuple[str, int]:
    font = TTFont(io.BytesIO(raw))
    opts = Options()
    opts.layout_features = ["*"]  # keep kerning; the ring text is spaced by it
    opts.notdef_outline = True
    sub = Subsetter(options=opts)
    sub.populate(text="".join(sorted(set(chars))))
    sub.subset(font)  # leaves fvar/gvar in place: still variable
    font.flavor = "woff2"
    buf = io.BytesIO()
    font.save(buf)
    return base64.b64encode(buf.getvalue()).decode(), len(buf.getvalue())


def chars_for(svg: str, family: str) -> str:
    """Text content of every <text> whose font-family names this family."""
    return "".join(
        re.sub(r"<[^>]*>", "", m.group(2))
        for m in re.finditer(r"<text\b([^>]*)>(.*?)</text>", svg, re.S)
        if family in m.group(1)
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                    help="exit non-zero if any file would change")
    args = ap.parse_args()

    downloaded: dict[str, bytes] = {}
    stale = []

    for name in FILES:
        path = BRAND / name
        if not path.exists():
            sys.exit(f"missing {path}")
        original = path.read_text()
        bare = EMBEDDED.sub(r"\1", original)  # drop a previous run's block

        faces = []
        for family, (spec, weights) in FAMILIES.items():
            chars = chars_for(bare, family)
            if not chars:
                continue
            if family not in downloaded:
                downloaded[family] = variable_font(spec)
            b64, size = subset(downloaded[family], chars)
            faces.append(
                f"@font-face{{font-family:'{family}';font-style:normal;"
                f"font-weight:{weights};"
                f"src:url(data:font/woff2;base64,{b64}) format('woff2')}}"
            )
            print(f"  {name}: {family} {size}B for {''.join(sorted(set(chars)))!r}")

        if not faces:
            sys.exit(f"{name} sets no text in {'/'.join(FAMILIES)} — has the artwork changed?")

        rebuilt = bare.replace("<defs>", "<defs><style>" + "".join(faces) + "</style>", 1)
        if "<style>" not in rebuilt:
            sys.exit(f"{name} has no <defs> to embed into")

        # A woff2 is not byte-reproducible, so compare the markup around it.
        if EMBEDDED.sub(r"\1", original) != EMBEDDED.sub(r"\1", rebuilt):
            stale.append(name)
        if not args.check:
            path.write_text(rebuilt)
            print(f"{name}: {len(rebuilt)}B written")

    if args.check:
        if stale:
            print("artwork differs from the embedded copy:", ", ".join(stale))
            return 1
        print(f"{len(FILES)} files: embedded fonts present and artwork unchanged")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
