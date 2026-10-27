"""สร้างใบความรู้/ใบงาน PDF จากไฟล์ HTML → public/files/<วิชา>/
ไฟล์ ม.5 อยู่ในโฟลเดอร์นี้ ไฟล์ ม.2 อยู่ใน m2/

ใช้:  python3 docs-src/build.py                (สร้างทุกไฟล์)
      python3 docs-src/build.py u4-reading     (ไฟล์เดียวของ ม.5)
      python3 docs-src/build.py m2/u1-reading  (ไฟล์เดียวของ ม.2)
      python3 docs-src/build.py m2ac/u1-worksheet  (ต้านทุจริตศึกษา ม.2)
ต้องมี Microsoft Edge (หรือ Chrome) ในเครื่อง ใช้พิมพ์ HTML เป็น PDF
"""
import pathlib, subprocess, sys, tempfile

HERE = pathlib.Path(__file__).parent
WEB = HERE.parent
FONTS = WEB / "node_modules/@fontsource"
BROWSERS = [
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]

# วิชา → (โฟลเดอร์ต้นฉบับ, ชั้น, รหัสและชื่อวิชาตามเลขหน่วย)
SUBJECTS = {
    "m5": (HERE, 5, lambda n: "ส32102 ประวัติศาสตร์สากล 1" if n <= 3 else "ส32104 ประวัติศาสตร์สากล 2"),
    "m2": (HERE / "m2", 2, lambda n: "ส22103 สังคมศึกษา 4"),
    "m2ac": (HERE / "m2ac", 2, lambda n: "รายวิชาเพิ่มเติม การป้องกันการทุจริต (ต้านทุจริตศึกษา)"),
}

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
.student {{ margin: 10px 0 4px; font-size: 12.5pt; line-height: 2; }}
h2 {{ font-size: 14.5pt; margin: 18px 0 6px; padding-left: 10px; border-left: 5px solid var(--brand); break-after: avoid; }}
h3 {{ font-size: 12.5pt; margin: 10px 0 2px; break-after: avoid; }}
p {{ margin: 4px 0 8px; }}
ul, ol {{ margin: 4px 0 8px; padding-left: 22px; }}
li {{ margin: 2px 0; }}
table {{ width: 100%; border-collapse: collapse; margin: 6px 0 10px; font-size: 11.5pt; }}
p:has(+ table), p:has(+ figure), p:has(+ .lines) {{ break-after: avoid; }}
.lines {{ break-inside: avoid; }}
.tl, ul, ol {{ break-inside: avoid; }}
table, tr {{ break-inside: avoid; }}  /* ตารางสั้น ย้ายไปหน้าใหม่ทั้งตาราง ไม่แยกหัวตารางกับแถวสุดท้าย */
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
figure svg {{ max-width: 100%; height: auto; }}
.cols figure img {{ width: 100%; height: 48mm; object-fit: cover; }}
.cols {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }}
.sheet + .sheet {{ break-before: page; }}  /* ใบงานหลายคาบในไฟล์เดียว คาบละหน้า */
.src {{ font-size: 9.5pt; color: #5b6475; margin-top: 14px; border-top: 1px solid var(--line); padding-top: 6px; }}
"""

# ใบงาน ม.2: ใบละไฟล์ ใบละ 1 หน้า A4
ONE_PAGE = """
body { font-size: 11pt; line-height: 1.4; }
.head { padding-bottom: 4px; margin-bottom: 6px; }
h1 { font-size: 18pt; }
h2 { font-size: 13.5pt; margin: 6px 0 4px; }
.box { padding: 4px 10px; margin: 4px 0; }
.q { margin-top: 5px; }
p { margin: 2px 0 3px; }
.lines { background-image: repeating-linear-gradient(transparent 0 calc(1.85em - 1px), #b9b2a6 calc(1.85em - 1px) 1.85em); height: calc(1.85em * var(--n, 3)); margin: 0 0 4px; }
.cols { gap: 16px; }
table { font-size: 10.5pt; margin: 3px 0 4px; }
th, td { padding: 2px 7px; }
.sheet { widows: 1; orphans: 1; }
@page { margin: 12mm 15mm; }
.student { font-size: 11pt; line-height: 1.6; margin: 4px 0 0; }
.cols3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
"""

KINDS = {"reading": "ใบความรู้", "worksheet": "ใบงาน"}


def build(src: pathlib.Path, browser: str, sid: str):
    _, grade, course = SUBJECTS[sid]
    unit, kind = src.stem.split("-")[:2]  # u1-worksheet-2.pdf = ใบงานที่แยกไฟล์
    body = src.read_text(encoding="utf-8")
    title = body.split("\n", 1)[0].removeprefix("<!--").removesuffix("-->").strip()
    student = (
        f'<div class="student">ชื่อ–สกุล ........................................................................ ชั้น ม.{grade}/........ เลขที่ ........ วันที่ ......../......../........</div>'
        if kind == "worksheet"
        else ""
    )
    html = f"""<!doctype html><html lang="th"><meta charset="utf-8"><style>{CSS}{ONE_PAGE if (sid, kind) == ("m2", "worksheet") else ""}</style>
<div class="head"><div class="kicker">{KINDS[kind]} · หน่วยการเรียนรู้ที่ {unit[1:]}</div>
<h1>{title}</h1><div class="course">{course(int(unit[1:]))} · ชั้นมัธยมศึกษาปีที่ {grade} · ครูอัศวิน</div>{student}</div>
{body}</html>"""
    img = src.with_suffix(".png")  # มีภาพใบงานที่ออกแบบแล้ว (ชื่อเดียวกัน) → ใช้ภาพเต็มหน้า A4 แทน HTML
    if img.exists():
        html = f'<!doctype html><style>@page {{ size: A4; margin: 0; }} body {{ margin: 0; }} img {{ display: block; width: 210mm; height: 297mm; }}</style><img src="{img.as_uri()}">'
    with tempfile.NamedTemporaryFile("w", suffix=".html", dir=HERE, delete=False, encoding="utf-8") as f:
        f.write(html)
    out = WEB / "public/files" / sid / f"{src.stem}.pdf"
    out.parent.mkdir(exist_ok=True)
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
    for sid, (folder, _, _) in SUBJECTS.items():
        for src in sorted(folder.glob("u*-*.html")):
            if not only or src.relative_to(HERE).with_suffix("").as_posix() in only:
                build(src, browser, sid)
