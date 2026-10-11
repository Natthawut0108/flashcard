// Vercel Serverless Function: ให้ Claude ช่วยสร้างแฟลชการ์ดจากโน้ต
// ต้องตั้ง Environment Variable ชื่อ ANTHROPIC_API_KEY ใน Vercel
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(501).json({ error: "ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY" });

  const { notes = "", count = 8 } = req.body || {};
  const n = Math.min(20, Math.max(1, parseInt(count) || 8));
  if (!notes.trim()) return res.status(400).json({ error: "ไม่มีโน้ต" });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        system: "คุณคือผู้ช่วยสร้างแฟลชการ์ดสำหรับนักศึกษา ตอบเป็น JSON array เท่านั้น ห้ามมีข้อความอื่นหรือ markdown รูปแบบ [{\"q\":\"คำถาม\",\"a\":\"คำตอบสั้นกระชับ\"}] ใช้ภาษาเดียวกับโน้ต คำถามต้องตอบได้ด้วยความจำ 1 ประเด็นต่อ 1 การ์ด",
        messages: [{ role: "user", content: `สร้างแฟลชการ์ดไม่เกิน ${n} ใบจากโน้ตนี้:\n\n${notes.slice(0, 8000)}` }]
      })
    });
    const data = await r.json();
    const text = (data.content || []).map(b => b.text || "").join("").replace(/```json|```/g, "").trim();
    const cards = JSON.parse(text).filter(c => c && c.q && c.a).slice(0, n);
    res.status(200).json({ cards });
  } catch (e) {
    res.status(500).json({ error: "สร้างการ์ดไม่สำเร็จ" });
  }
};
