# Smart Flashcards

เว็บแฟลชการ์ดที่ใช้อัลกอริทึม **SM-2 (Spaced Repetition)** ตัดสินใจว่าการ์ดใบไหนควรทบทวนวันไหน
และใช้ **Claude API** ช่วยสร้างการ์ดจากโน้ตอัตโนมัติ

โปรเจกต์ปลายภาควิชา Artificial Intelligence in Modern Life

## ฟีเจอร์
- ทบทวนการ์ดพร้อมปุ่มประเมิน (ลืม / ยาก / จำได้ / ง่าย) และแสดงวันทบทวนครั้งต่อไป
- AI สร้างการ์ดจากโน้ต (ถ้าไม่มี API key จะใช้ตัวช่วยในเครื่องแยกรูปแบบ "คำ: คำอธิบาย")
- สถิติ: จำนวนการ์ด, ถึงกำหนดวันนี้, จำได้แม่น, streak, กราฟ 7 วันข้างหน้า
- ส่งออก/นำเข้า JSON, ข้อมูลเก็บใน localStorage ของเบราว์เซอร์

## โครงสร้าง
```
index.html   หน้าเว็บ
style.css    สไตล์
app.js       ตรรกะทั้งหมด (SM-2, UI, สถิติ)
api/generate.js   Vercel Serverless Function เรียก Claude API
```

## วิธี Deploy
1. อัปโหลดโฟลเดอร์นี้ขึ้น GitHub
2. ที่ vercel.com เลือก Add New → Project → Import repo (ไม่ต้องตั้งค่า build ใด ๆ)
3. Settings → Environment Variables เพิ่ม `ANTHROPIC_API_KEY` (ขอได้ที่ console.anthropic.com) แล้ว Redeploy

ถ้าไม่ตั้ง API key เว็บยังใช้งานได้ปกติ เพียงแต่ปุ่มสร้างการ์ดจะใช้ตัวช่วยในเครื่องแทน AI

## การใช้ AI ในการพัฒนา
(เติมเอง: เครื่องมือ, Prompt หลัก, ขั้นตอน และการแบ่งงานของสมาชิก)
