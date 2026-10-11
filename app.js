const $ = s => document.querySelector(s);
const DAY = 864e5;
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } };
let cards = load("sf_cards", []);
let log = load("sf_log", []); // วันที่ที่ทบทวน (YYYY-MM-DD)
const save = () => { try { localStorage.setItem("sf_cards", JSON.stringify(cards)); localStorage.setItem("sf_log", JSON.stringify(log)) } catch {} };

/* ---------- SM-2: อัลกอริทึม Spaced Repetition ---------- */
function sm2(c, q) {
  let { ef, reps, interval } = c;
  if (q < 3) { reps = 0; interval = 1; }
  else {
    reps += 1;
    interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(interval * ef);
  }
  ef = Math.max(1.3, ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  return { ef, reps, interval };
}
const newCard = (q, a) => ({ id: Date.now() + Math.random(), q, a, ef: 2.5, reps: 0, interval: 0, due: 0 });
const dueCards = () => cards.filter(c => c.due <= Date.now()).sort((a, b) => a.due - b.due);

/* ---------- แท็บ ---------- */
document.querySelectorAll("nav button").forEach(b => b.onclick = () => {
  document.querySelectorAll("nav button").forEach(x => x.classList.toggle("on", x === b));
  document.querySelectorAll("main > section").forEach(s => s.hidden = s.id !== b.dataset.tab);
  refresh();
});

/* ---------- โหมดทบทวน ---------- */
let current = null, showing = false;
function nextCard() {
  const d = dueCards();
  current = d[0] || null; showing = false;
  $("#studyEmpty").hidden = !!current;
  $("#studyBox").hidden = !current;
  $("#dueBadge").textContent = d.length || "";
  if (!current) return;
  $("#progress").textContent = `เหลือ ${d.length} ใบที่ต้องทบทวนวันนี้`;
  draw();
}
function draw() {
  $("#card").classList.toggle("ans", showing);
  $("#side").textContent = showing ? "คำตอบ" : "คำถาม";
  $("#cardText").textContent = showing ? current.a : current.q;
  $("#flip").hidden = showing; $("#rate").hidden = !showing;
  if (showing) [1, 3, 4, 5].forEach(q => { const n = sm2(current, q).interval; $("#i" + q).textContent = n === 1 ? "พรุ่งนี้" : `อีก ${n} วัน`; });
}
function flip() { if (!current) return; showing = !showing; draw(); }
$("#flip").onclick = flip;
$("#card").onclick = flip;
$("#card").onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } };
document.querySelectorAll("#rate button").forEach(b => b.onclick = () => {
  const q = +b.dataset.q, r = sm2(current, q);
  Object.assign(current, r, { due: Date.now() + (q < 3 ? 60 * 1000 * 10 : r.interval * DAY) });
  const today = new Date().toISOString().slice(0, 10);
  if (!log.includes(today)) log.push(today);
  save(); nextCard();
});

/* ---------- สร้างการ์ด ---------- */
function addCards(arr) {
  arr.filter(x => x.q && x.a).forEach(x => cards.push(newCard(String(x.q).trim(), String(x.a).trim())));
  save(); refresh();
}
$("#addBtn").onclick = () => {
  const q = $("#q").value.trim(), a = $("#a").value.trim();
  if (!q || !a) return;
  addCards([{ q, a }]); $("#q").value = $("#a").value = "";
};

// ทางสำรองเมื่อไม่มี API: แยกโน้ตเป็นการ์ดด้วยรูปแบบ "คำ: คำอธิบาย" หรือ "X คือ Y"
function localGenerate(text, n) {
  const out = [];
  text.split(/\n|(?<=[.!?。])\s+/).map(s => s.trim()).filter(Boolean).forEach(line => {
    let m = line.match(/^(.{2,60}?)\s*[:：]\s*(.+)$/) || line.match(/^(.{2,60}?)\s+คือ\s+(.+)$/) || line.match(/^(.{2,60}?)\s+[-–]\s+(.+)$/);
    if (m) out.push({ q: `${m[1]} คืออะไร`, a: m[2] });
  });
  return out.slice(0, n);
}
$("#gen").onclick = async () => {
  const notes = $("#notes").value.trim(), count = Math.min(20, +$("#count").value || 8);
  if (!notes) { $("#genMsg").textContent = "วางโน้ตก่อนสร้างการ์ด"; return; }
  $("#gen").disabled = true; $("#genMsg").textContent = "AI กำลังสร้างการ์ด...";
  let made = [], by = "AI";
  try {
    const r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes, count }) });
    if (r.ok) made = (await r.json()).cards || [];
  } catch {}
  if (!made.length) { made = localGenerate(notes, count); by = "ตัวช่วยในเครื่อง (ยังไม่ได้ตั้งค่า API key)"; }
  $("#gen").disabled = false;
  if (!made.length) { $("#genMsg").textContent = "สร้างการ์ดไม่ได้ ลองเขียนโน้ตในรูป \"คำ: คำอธิบาย\" หรือเพิ่มการ์ดเอง"; return; }
  addCards(made); $("#genMsg").textContent = `เพิ่ม ${made.length} การ์ดแล้ว (สร้างโดย${by})`;
};

function renderList() {
  $("#total").textContent = `(${cards.length} ใบ)`;
  $("#list").innerHTML = cards.length ? cards.map(c => `<li><div><b>${esc(c.q)}</b><small>${esc(c.a)}</small></div><button data-id="${c.id}" aria-label="ลบการ์ด">ลบ</button></li>`).join("") : '<li class="muted">ยังไม่มีการ์ด วางโน้ตด้านบนเพื่อสร้างการ์ดชุดแรก</li>';
  document.querySelectorAll("#list button").forEach(b => b.onclick = () => { cards = cards.filter(c => String(c.id) !== b.dataset.id); save(); refresh(); });
}
$("#exp").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(cards, null, 2)], { type: "application/json" }));
  a.download = "flashcards.json"; a.click();
};
$("#imp").onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  f.text().then(t => { try { const arr = JSON.parse(t); if (Array.isArray(arr)) { arr.forEach(x => x.q && x.a && cards.push({ ...newCard(x.q, x.a), ...x, id: Date.now() + Math.random() })); save(); refresh(); } } catch { alert("ไฟล์ไม่ถูกต้อง"); } });
};

/* ---------- สถิติ ---------- */
function renderStats() {
  $("#sTotal").textContent = cards.length;
  $("#sDue").textContent = dueCards().length;
  $("#sMaster").textContent = cards.filter(c => c.interval >= 21).length;
  let s = 0, d = new Date();
  if (!log.includes(d.toISOString().slice(0, 10))) d = new Date(Date.now() - DAY);
  while (log.includes(d.toISOString().slice(0, 10))) { s++; d = new Date(d - DAY); }
  $("#sStreak").textContent = s;
  const start = new Date().setHours(0, 0, 0, 0), counts = Array(7).fill(0);
  cards.forEach(c => { const k = Math.max(0, Math.floor((c.due - start) / DAY)); if (k < 7) counts[k]++; });
  const max = Math.max(1, ...counts), names = ["วันนี้", "พรุ่งนี้"];
  $("#bars").innerHTML = counts.map((n, i) => `<div style="height:${n / max * 100}%"><span>${n}</span><em>${names[i] || "+" + i + " วัน"}</em></div>`).join("");
}
function refresh() { renderList(); renderStats(); nextCard(); }
refresh();
