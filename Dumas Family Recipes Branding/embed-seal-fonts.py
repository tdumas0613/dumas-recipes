import re, base64, io, os
from fontTools.ttLib import TTFont
from fontTools.subset import Subsetter, Options

SRC = "/home/user/dumas-recipes/Dumas Family Recipes Branding/assets"
OUT = "/home/user/dumas-recipes/public/brand"
# Variable originals, so the opsz axis survives: the seal sets Newsreader at
# 128px (the D) and 27px (DUMAS) in the same file, and a single static
# instance cannot be optically correct at both.
FONTS = {"Jost": "fonts/jost-var.woff2", "Newsreader": "fonts/newsreader-var.woff2"}

def subset_b64(path, chars):
    f = TTFont(path)
    o = Options()
    o.layout_features = ["*"]
    o.notdef_outline = True
    s = Subsetter(options=o)
    s.populate(text="".join(sorted(set(chars))))
    s.subset(f)                      # keeps fvar/gvar: still variable
    f.flavor = "woff2"
    buf = io.BytesIO(); f.save(buf)
    axes = [a.axisTag for a in f["fvar"].axes] if "fvar" in f else []
    return base64.b64encode(buf.getvalue()).decode(), len(buf.getvalue()), axes

def chars_for(svg, family):
    out = ""
    for m in re.finditer(r'<text\b([^>]*)>(.*?)</text>', svg, re.S):
        if family in m.group(1):
            out += re.sub(r'<[^>]*>', '', m.group(2))
    return out

os.makedirs(OUT, exist_ok=True)
for name in ["seal.svg", "seal-reversed.svg", "seal-mark.svg", "seal-mark-reversed.svg"]:
    svg = open(os.path.join(SRC, name)).read()
    faces = []
    for fam, path in FONTS.items():
        chars = chars_for(svg, fam)
        if not chars:
            continue
        b64, raw, axes = subset_b64(path, chars)
        rng = "100 900" if fam == "Jost" else "200 800"
        faces.append("@font-face{font-family:'%s';font-style:normal;font-weight:%s;"
                     "src:url(data:font/woff2;base64,%s) format('woff2')}" % (fam, rng, b64))
        print(f"  {fam}: {raw}B, axes={axes}, chars={''.join(sorted(set(chars)))!r}")
    svg = svg.replace("<defs>", "<defs><style>" + "".join(faces) + "</style>", 1)
    open(os.path.join(OUT, name), "w").write(svg)
    print(f"{name}: {len(svg)}B")
