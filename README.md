# 🎓 Course Forecast Website

เว็บแอปสำหรับ **พยากรณ์หลักสูตรสาขาวิชา** จากผลการเรียนและประวัติส่วนตัว  
พร้อมระบบล็อกอินผ่าน 🔐 Google OAuth2 สำหรับผู้ดูแล (Admin)

---

## 📋 Features

✨ คุณสมบัติหลักของระบบ:

- 🔐 **Google OAuth2 Login** (ผ่าน Passport.js) โดยกำหนด Admin ผ่านอีเมล
- 📁 **อัปโหลดไฟล์** CSV / ARFF เพื่อใช้ในการวิเคราะห์
- 📊 **แสดงผลข้อมูล** ด้วยเทมเพลต EJS
- 💬 **แสดงข้อความแจ้งเตือน** ด้วย Flash Message
- 💾 **เชื่อมต่อฐานข้อมูล MongoDB** ด้วย Mongoose
- 🎨 **รองรับ Font Awesome** และ SweetAlert2 สำหรับ UI ที่สวยงาม

---

## 🚀 Installation

📦 ทำตามขั้นตอนด้านล่างเพื่อเริ่มใช้งาน:

1. 🔽 **Clone โปรเจกต์**
  git clone https://github.com/rikiduckman/Course-Forecast-Website.git
  cd Course-Forecast-Website
2. 📁 ติดตั้ง dependencies
  npm install
3. ⚙️ สร้างไฟล์ .env ที่ root directory แล้วใส่ค่าดังนี้:
  PORT=3000
  MONGO_URI=your_mongo_uri
  GOOGLE_CLIENT_ID=your_google_client_id
  GOOGLE_CLIENT_SECRET=your_google_client_secret
  ADMIN_ID=email_admin
4. 🏁 Run the App
  npm run dev
