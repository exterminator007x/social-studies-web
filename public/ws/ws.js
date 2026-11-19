// ระบบกลางของใบงานออนไลน์: ข้อมูลนักเรียน, เก็บคำตอบในเครื่อง, ตรวจช่องที่ต้องทำ, สร้างรูป, บันทึก/แชร์
// แต่ละหน้ากำหนด window.WS ก่อนโหลดไฟล์นี้:
//   { key, no, cls, meta, title, total, answers: [ชื่อช่อง], required?: [ชื่อช่อง] (ไม่ใส่ = ทุกช่องใน answers),
//     sheet: (d, esc) => HTML ส่วนคำตอบบนรูป }
(() => {
  const W = window.WS;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const f = $("f");

  f.insertAdjacentHTML("afterbegin", `
    <section class="card">
      <div class="head"><span class="num">👤</span><h2>ข้อมูลนักเรียน</h2></div>
      <label>ชื่อ–สกุล<input type="text" name="name" placeholder="เช่น เด็กหญิงใจดี รักเรียน"></label>
      <div class="row">
        <label>ชั้น ${W.cls}/<input type="number" name="room" inputmode="numeric" min="1" placeholder="ห้อง"></label>
        <label>เลขที่<input type="number" name="no" inputmode="numeric" min="1" placeholder="เลขที่"></label>
      </div>
    </section>`);
  document.body.insertAdjacentHTML("beforeend", `
    <div class="bar"><div>
      <div class="status"><span id="count"></span><span class="saved" id="saved">✓ บันทึกคำตอบในเครื่องแล้ว</span></div>
      <div class="track"><i id="prog"></i></div>
      <div class="btns">
        <button class="main" id="save">บันทึกเป็นรูปภาพ</button>
        <button class="alt" id="share" hidden>แชร์</button>
      </div>
    </div></div>
    <div id="overlay" role="dialog" aria-modal="true" aria-label="รูปใบงาน">
      <p class="tip" id="ohint"></p>
      <img id="oimg" alt="รูปใบงานที่ ${W.no} พร้อมคำตอบ">
      <div class="btns">
        <a class="btn alt" id="odl">ดาวน์โหลด</a>
        <button class="main" id="oshare" hidden>แชร์</button>
      </div>
      <button id="oclose">ปิด กลับไปแก้คำตอบ</button>
    </div>
    <div id="sheet"></div>`);

  const ID = ["name", "room", "no"];
  const REQ = new Set([...ID, ...(W.required || W.answers)]);
  const read = () => Object.fromEntries(new FormData(f));
  const filled = (d, n) => String(d[n] ?? "").trim() !== "";
  const firstEl = (n) => { const el = f.elements[n]; return el instanceof RadioNodeList ? el[0] : el; };
  let attempted = false;

  function progress() {
    const d = read();
    const n = W.answers.filter((k) => filled(d, k)).length;
    $("count").textContent = `ทำแล้ว ${n}/${W.answers.length} ช่อง`;
    $("prog").style.width = (n / W.answers.length) * 100 + "%";
    f.querySelectorAll(".item").forEach((it) => {
      const names = [...new Set([...it.querySelectorAll("[name]")].map((e) => e.name))];
      it.classList.toggle("done", names.every((k) => filled(d, k)));
      it.classList.toggle("need", attempted && names.some((k) => REQ.has(k) && !filled(d, k)));
    });
    for (const k of REQ) {
      const el = f.elements[k];
      if (!(el instanceof RadioNodeList) && !el.closest(".item")) el.classList.toggle("need", attempted && !filled(d, k));
    }
  }

  // เก็บ/คืนคำตอบในเครื่อง
  try {
    const saved = JSON.parse(localStorage.getItem(W.key) || "{}");
    for (const [k, v] of Object.entries(saved)) {
      const el = f.elements[k];
      if (!el) continue;
      if (el instanceof RadioNodeList) { for (const r of el) r.checked = r.value === v; }
      else el.value = v;
    }
  } catch {}
  progress();
  let blob = null, savedTimer;
  f.addEventListener("input", () => {
    blob = null;
    progress();
    try {
      localStorage.setItem(W.key, JSON.stringify(read()));
      $("saved").classList.add("on"); clearTimeout(savedTimer);
      savedTimer = setTimeout(() => $("saved").classList.remove("on"), 1500);
    } catch {}
  });

  function check() {
    attempted = true;
    progress();
    const d = read();
    const miss = [...REQ].filter((k) => !filled(d, k));
    if (miss.length) {
      alert(miss.some((k) => ID.includes(k))
        ? "กรอกชื่อ–สกุล ชั้น และเลขที่ให้ครบก่อนนะ"
        : `ยังทำไม่ครบ ${miss.length} ช่อง ต้องทำให้ครบก่อนจึงจะบันทึกเป็นรูปได้ (ช่องที่ยังไม่ได้ทำมีกรอบสีแดง)`);
      const el = firstEl(miss[0]);
      (el.closest(".item") || el).scrollIntoView({ block: "center" });
      el.focus({ preventScroll: true });
      return false;
    }
    const left = W.answers.filter((k) => !filled(d, k)).length;
    return !left || confirm(`ยังไม่ได้ตอบ ${left} ช่อง จะบันทึกเป็นรูปเลยไหม`);
  }

  let fileName = "";
  function fill() {
    const d = read();
    const when = new Date().toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" });
    $("sheet").innerHTML = `
      <div class="meta"><span>${W.meta}</span><span>ส่งเมื่อ ${esc(when)}</span></div>
      <h1>${W.title}</h1>
      <div class="who"><b>ชื่อ–สกุล</b> ${esc(d.name)} &nbsp; <b>ชั้น</b> ${W.cls}/${esc(d.room)} &nbsp; <b>เลขที่</b> ${esc(d.no)}</div>
      ${W.sheet(d, esc)}
      <div class="foot">รวม ........ / ${W.total} คะแนน</div>`;
    fileName = `ใบงาน${W.no}_${W.cls.replace(".", "")}-${d.room}_เลขที่${d.no}_${d.name.trim().replace(/[\s\\/:*?"<>|]+/g, "-")}.png`;
  }

  async function makeImage() {
    if (blob) return blob;
    fill();
    await document.fonts.ready;
    const opt = { pixelRatio: 1, backgroundColor: "#fff", cacheBust: true, style: { position: "static", left: "0" } };
    // ponytail: Safari มักวาดรอบแรกไม่ครบฟอนต์ จึงวาดทิ้ง 1 รอบก่อน
    await htmlToImage.toBlob($("sheet"), opt);
    return (blob = await htmlToImage.toBlob($("sheet"), opt));
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const canShareFiles = (() => { try { return !!navigator.canShare?.({ files: [new File([""], "a.png", { type: "image/png" })] }); } catch { return false; } })();
  if (canShareFiles) { $("share").hidden = false; $("oshare").hidden = false; }

  let url = "";
  function showOverlay(b, downloaded) {
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(b);
    $("oimg").src = url;
    $("odl").href = url;
    $("odl").download = fileName;
    $("ohint").textContent = isIOS
      ? "📌 แตะค้างที่รูป แล้วเลือก “บันทึกไปยังรูปภาพ” จากนั้นส่งรูปให้ครู"
      : downloaded ? "✅ บันทึกรูปลงเครื่องแล้ว ดูได้ในแกลเลอรีหรือโฟลเดอร์ดาวน์โหลด แล้วส่งรูปให้ครู" : "กดดาวน์โหลดหรือแชร์รูปนี้เพื่อส่งครู";
    $("overlay").classList.add("show");
  }

  async function run(btn, after) {
    if (!check()) return;
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = "กำลังสร้างรูป…";
    try { await after(await makeImage()); }
    catch (e) { alert("สร้างรูปไม่สำเร็จ ลองใหม่อีกครั้ง หรือเปิดลิงก์นี้ใน Chrome/Safari\n(" + e + ")"); }
    finally { btn.disabled = false; btn.textContent = label; }
  }

  async function share(b) {
    try { await navigator.share({ files: [new File([b], fileName, { type: "image/png" })], title: `ใบงานที่ ${W.no}` }); return true; }
    catch (e) { return e.name === "AbortError"; } // ผู้ใช้กดยกเลิกเอง ถือว่าจบ
  }

  $("save").onclick = () => run($("save"), (b) => {
    if (!isIOS) { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = fileName; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1e4); }
    showOverlay(b, !isIOS);
  });
  // Safari อาจไม่ยอมเปิดเมนูแชร์หลังรอสร้างรูปนาน ถ้าไม่ได้ให้เปิดหน้ารูป (ซึ่งมีปุ่มแชร์อีกปุ่ม)
  $("share").onclick = () => run($("share"), async (b) => { if (!(await share(b))) showOverlay(b, false); });
  $("oshare").onclick = () => blob && share(blob);
  $("oclose").onclick = () => $("overlay").classList.remove("show");

  window.WS_DEBUG = { check, makeImage, showOverlay, read }; // ไว้ทดสอบจาก console
})();
