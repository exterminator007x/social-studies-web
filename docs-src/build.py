"""สร้างใบความรู้/ใบงาน PDF จากไฟล์ HTML ในโฟลเดอร์นี้ → public/files/m5/

ใช้:  python3 docs-src/build.py          (สร้างทุกไฟล์)
      python3 docs-src/build.py u4-reading  (สร้างไฟล์เดียว)
ต้องมี Microsoft Edge (หรือ Chrome) ในเครื่อง ใช้พิมพ์ HTML เป็น PDF
"""
import pathlib, subprocess, sys, tempfile

HERE = pathlib.Path(__file__).parent
WEB = HERE.parent
OUT = WEB / "public/files/m5"
FONTS = WEB / "node_modules/@fontsource"
BROWSERS = [
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]

COURSES = {1: "ส32102 ประวัติศาสตร์สากล 1", 2: "ส32104 ประวัติศาสตร์สากล 2"}  # หน่วย u1–u3 = ภาค 1, u4–u8 = ภาค 2
TAIL = " · ชั้นมัธยมศึกษาปีที่ 5 · ครูอัศวิน"

CSS = f"""
@font-face {{ font-family: Sarabun; font-weight: 400; src: url({FONTS}/sarabun/files/sarabun-thai-400-normal.woff2), url({FONTS}/sarabun/files/sarabun-latin-400-normal.woff2); }}
@font-face {{ font-family: Sarabun; font-weight: 700; src: url({FONTS}/sarabun/files/sarabun-thai-700-normal.woff2), url({FONTS}/sarabun/files/sarabun-latin-700-normal.woff2); }}
@font-face {{ font-family: Anuphan; font-weight: 100 900; src: url({FONTS}-variable/anuphan/files/anuphan-thai-wght-normal.woff2), url({FONTS}-variable/anuphan/files/anuphan-latin-wght-normal.woff2); }}
@page {{ size: A4; margin: 16mm 17mm 16mm; }}
:root {{ --navy: #14294a; --brand: #c2532d; --soft: #f6f1ea; --line: #d9d2c7; }}
* {{ box-sizing: border-box; }}
body {{ font-family: Sarabun, sans-serif; font-size: 12.5pt; line-height: 1.6; color: #1d2433; margin: 0; }}
h1, h2, h3, .kicker, th {{ font-family: Anuphan, sans-serif; color: var(--navy); }}
.head {{ border-bottom: 3px solid var(--navy); padding-bottom: 8px; margin-bottom: 14px; }}
.kicker {{ color: var(--brand); font-weight: 600; font-size: 11pt; letter-spacing: .04em; }}
h1 {{ font-size: 22pt; line-height: 1.25; margin: 2px 0 2px; font-weight: 700; }}
.course {{ font-size: 10pt; color: #5b6475; }}
.student {{ margin: 10px 0 4px; font-size: 11.5pt; }}
h2 {{ font-size: 14.5pt; margin: 18px 0 6px; padding-left: 10px; border-left: 5px solid var(--brand); break-after: avoid; }}
h3 {{ font-size: 12.5pt; margin: 10px 0 2px; break-after: avoid; }}
p {{ margin: 4px 0 8px; }}
ul, ol {{ margin: 4px 0 8px; padding-left: 22px; }}
li {{ margin: 2px 0; }}
table {{ width: 100%; border-collapse: collapse; margin: 6px 0 10px; font-size: 11.5pt; }}
tr {{ break-inside: avoid; }}
th, td {{ border: 1px solid var(--line); padding: 5px 8px; vertical-align: top; text-align: left; }}
th {{ background: var(--soft); font-weight: 600; }}
.box {{ background: var(--soft); border-radius: 8px; padding: 8px 12px; margin: 8px 0; break-inside: avoid; }}
.box b:first-child {{ color: var(--brand); font-family: Anuphan; }}
.objectives {{ border: 1px solid var(--line); border-radius: 8px; padding: 6px 12px; margin-bottom: 8px; }}
.tl {{ list-style: none; padding: 0; border-left: 2px solid var(--brand); margin-left: 6px; }}
.tl li {{ padding-left: 14px; position: relative; break-inside: avoid; }}
.tl li::before {{ content: ""; position: absolute; left: -6px; top: .55em; width: 10px; height: 10px; border-radius: 50%; background: var(--brand); }}
.tl b {{ color: var(--brand); }}
.lines {{ background-image: repeating-linear-gradient(transparent 0 calc(2.1em - 1px), #b9b2a6 calc(2.1em - 1px) 2.1em); height: calc(2.1em * var(--n, 3)); margin: 4px 0 10px; }}
td.blank {{ height: calc(2.1em * var(--n, 2)); }}
.q {{ break-inside: avoid; margin-top: 10px; }}
.q > b {{ font-family: Anuphan; color: var(--navy); }}
.score {{ float: right; font-size: 10pt; color: #5b6475; font-family: Anuphan; }}
figure {{ margin: 6px 0 10px; text-align: center; break-inside: avoid; }}
figure img {{ max-height: 70mm; max-width: 100%; border-radius: 4px; }}
figcaption {{ font-size: 9.5pt; color: #5b6475; }}
.cols {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }}
.src {{ font-size: 9.5pt; color: #5b6475; margin-top: 14px; border-top: 1px solid var(--line); padding-top: 6px; }}
"""

KINDS = {"reading": "ใบความรู้", "worksheet": "ใบงาน"}


def build(src: pathlib.Path, browser: str):
    unit, kind = src.stem.split("-")
    body = src.read_text(encoding="utf-8")
    title = body.split("\n", 1)[0].removeprefix("<!--").removesuffix("-->").strip()
    student = (
        '<div class="student">ชื่อ–สกุล ...................................................... ชั้น ม.5/...... เลขที่ ......</div>'
        if kind == "worksheet"
        else ""
    )
    html = f"""<!doctype html><html lang="th"><meta charset="utf-8"><style>{CSS}</style>
<div class="head"><div class="kicker">{KINDS[kind]} · หน่วยการเรียนรู้ที่ {unit[1:]}</div>
<h1>{title}</h1><div class="course">{COURSES[1 if int(unit[1:]) <= 3 else 2]}{TAIL}</div>{student}</div>
{body}</html>"""
    with tempfile.NamedTemporaryFile("w", suffix=".html", dir=HERE, delete=False, encoding="utf-8") as f:
        f.write(html)
    out = OUT / f"{src.stem}.pdf"
    try:
        subprocess.run(
            [browser, "--headless", "--disable-gpu", "--no-pdf-header-footer", "--allow-file-access-from-files",
             f"--print-to-pdf={out}", f"file://{f.name}"],
            check=True, capture_output=True, timeout=120,
        )
    finally:
        pathlib.Path(f.name).unlink()
    print("✓", out.name)


if __name__ == "__main__":
    browser = next((b for b in BROWSERS if pathlib.Path(b).exists()), None)
    if not browser:
        sys.exit("ไม่พบ Edge/Chrome สำหรับพิมพ์ PDF")
    only = sys.argv[1:]
    for src in sorted(HERE.glob("u*-*.html")):
        if not only or src.stem in only:
            build(src, browser)
