# Hotel Booking REST API

Backend RESTful API สำหรับระบบจองโรงแรม (Software Development Practice — Project #1: Hotel Booking) พัฒนาด้วย **Node.js**, **Express 5**, และ **MongoDB (Mongoose)** พร้อมระบบยืนยันตัวตน JWT, การจัดการสิทธิ์ (RBAC), เอกสาร Swagger UI, ชุดทดสอบ Postman / Newman, ระบบ Cron Job, การสร้างใบกำกับภาษี PDF และการค้นหาโรงแรมเชิงพื้นที่ (Geospatial Search)

---

## Tech Stack & Dependencies

* **Runtime / Framework:** Node.js, Express `^5.2.1`
* **Database & ODM:** MongoDB (`HotelBooking` database), Mongoose `^9.9.4`
* **Authentication & Security:** `jsonwebtoken`, `bcryptjs`, `cookie-parser`, `helmet`, `express-mongo-sanitize`, `express-xss-sanitizer`, `express-rate-limit`, `hpp`, `cors`
* **Extra Features:**
  * `node-cron` — Background job เปลี่ยนสถานะการจองและส่งอีเมลเตือนก่อนเช็กอิน 24 ชม.
  * `nodemailer` — ส่งอีเมลแจ้งเตือนผ่าน SMTP (รองรับ Mailpit และโหมด simulated console)
  * `pdfkit` — สร้างและ stream ไฟล์ใบกำกับภาษี/ใบเสร็จรับเงิน PDF
* **API Documentation & Testing:** `swagger-jsdoc`, `swagger-ui-express`, Postman Collection / Newman

---

## Core & Extra Features

### Core Requirements
1. **Authentication & RBAC (`user` / `admin`):**
   * สมัครสมาชิก (`register`), เข้าสู่ระบบ (`login`), ดูโปรไฟล์ (`me`), ออกจากระบบ (`logout`)
   * เข้ารหัสรหัสผ่านด้วย `bcryptjs` และออก JWT Token (ทั้ง Header Bearer และ HTTP-only Cookie)
2. **Hotel Management:**
   * ดูรายการโรงแรมทั้งหมด (รองรับ filter, `select`, `sort`, pagination) และดูรายละเอียดรายแห่ง (Public)
   * **Confidentiality:** รายการโรงแรมสาธารณะไม่เปิดเผยข้อมูลการจองของผู้ใช้คนอื่น
   * Admin สามารถเพิ่ม แก้ไข และลบโรงแรมได้ (การลบโรงแรมจะ Cascade Delete การจองที่เกี่ยวข้องทั้งหมด)
3. **Booking Management & Business Rules:**
   * ผู้ใช้ที่ล็อกอินแล้วสามารถจองโรงแรมได้ **สูงสุดไม่เกิน 3 คืนต่อ 1 การจอง** (`nights` ต้องเป็นจำนวนเต็ม `1–3`)
   * รองรับทั้ง direct route (`/api/v1/bookings`) และ nested route (`/api/v1/hotels/:hotelId/bookings`)
   * **User:** ดู แก้ไข และลบได้เฉพาะการจองของตนเอง
   * **Admin:** ดู แก้ไข และลบการจองของผู้ใช้ทุกคนในระบบได้

### Extra Requirements
1. **Background Scheduled Job (Cron Job):**
   * รันอัตโนมัติตามรอบเวลา (ค่าเริ่มต้น `*/10 * * * *` ทุก 10 นาที หรือกำหนดผ่าน `CRON_SCHEDULE`)
   * เปลี่ยนสถานะการจองจาก `Confirmed` $\rightarrow$ `Completed` อัตโนมัติเมื่อเลย `checkOutDate`
   * ส่งอีเมลแจ้งเตือนก่อนวันเช็กอินภายใน 24 ชั่วโมง (`reminderEmailSent: false`) พร้อมบันทึก `reminderEmailSent = true` เพื่อไม่ส่งซ้ำ
   * มี endpoint `POST /api/v1/bookings/trigger-cron` สำหรับ Admin สั่งรันทันทีเพื่อทดสอบ
2. **PDF Tax Invoice / Receipt Download:**
   * Endpoint `GET /api/v1/bookings/:id/invoice` สร้างไฟล์ PDF พร้อม stream ส่งกลับเป็นไฟล์ดาวน์โหลด
   * แสดงข้อมูลโรงแรม, เลขประจำตัวผู้เสียภาษี (`taxId`), รหัสอ้างอิงธุรกรรม (`transactionRef`), ข้อมูลผู้เข้าพัก, ค่าห้องพัก (`nights * pricePerNight`), Service Charge 10%, VAT 7%, และยอดรวมสุทธิ
   * อนุญาตให้ดาวน์โหลดเฉพาะเจ้าของรายการหรือ Admin และเฉพาะการจองที่มีสถานะ `Completed` เท่านั้น (หากยังไม่ `Completed` คืน `400`)
3. **Geospatial Hotel Search:**
   * เก็บพิกัดโรงแรมแบบ GeoJSON `Point` (`[longitude, latitude]`) พร้อม index `2dsphere`
   * ค้นหาโรงแรมภายในรัศมีที่กำหนด (กม.) ผ่าน `GET /api/v1/hotels/radius/:lat/:lng/:distance` หรือ `GET /api/v1/hotels?lat=...&lng=...&distance=...` ด้วย `$geoWithin` และ `$centerSphere`

---

## Project Structure

```text
SwDevPrac-Hotel-Booking/
├── config/
│   ├── config.env                         # Environment variables (ไม่ถูก commit ลง Git)
│   └── db.js                              # เชื่อมต่อ MongoDB (dbName: HotelBooking)
├── controllers/
│   ├── auth.js                            # Auth logic (register, login, getMe, logout)
│   ├── hotels.js                          # Hotel CRUD + geospatial search
│   └── bookings.js                        # Booking CRUD + PDF invoice + manual cron trigger
├── jobs/
│   └── bookingJobs.js                     # Cron scheduler และ logic เปลี่ยนสถานะ/ส่งอีเมลเตือน
├── middleware/
│   └── auth.js                            # protect (JWT verify) และ authorize (RBAC)
├── models/
│   ├── User.js                            # User schema + bcrypt pre-save hook + JWT methods
│   ├── Hotel.js                           # Hotel schema + 2dsphere index + virtual bookings
│   └── Booking.js                         # Booking schema + auto checkOutDate & transactionRef
├── routes/
│   ├── auth.js                            # /api/v1/auth routes + Swagger docs
│   ├── hotels.js                          # /api/v1/hotels routes + Swagger docs
│   └── bookings.js                        # /api/v1/bookings routes + Swagger docs
├── utils/
│   ├── pdfInvoice.js                      # สร้างใบกำกับภาษี PDF ด้วย pdfkit
│   └── sendEmail.js                       # ส่งอีเมลด้วย nodemailer (รองรับ Mailpit / simulated mode)
├── HotelBooking.postman_collection.json   # Postman collection (เรียงลำดับ Demo Runner 1-16)
├── seeder.js                              # Script สำหรับ import (-i) และลบ (-d) ข้อมูลจำลอง
├── server.js                              # Entry point, security middleware, Swagger UI, Cron init
└── package.json
```

---

## Getting Started

### 1. ติดตั้ง Dependencies
```powershell
npm install
```

### 2. ตั้งค่า Environment (`config/config.env`)
สร้างหรือแก้ไขไฟล์ `config/config.env`:
```env
PORT = 5000
NODE_ENV = development
MONGO_URI = <your-mongodb-connection-string>

JWT_SECRET = <your-jwt-secret>
JWT_EXPIRE = 30d
JWT_COOKIE_EXPIRE = 30

# Optional: Local SMTP Server (Mailpit)
SMTP_HOST = 127.0.0.1
SMTP_PORT = 1025
FROM_NAME = Hotel Booking System
FROM_EMAIL = noreply@hotelbooking.com
```
*(หมายเหตุ: หากไม่ได้ตั้งค่า `SMTP_HOST` ระบบจะทำงานในโหมดจำลองและแสดงข้อความอีเมลลงใน Console แทน)*

### 3. นำเข้าข้อมูลทดสอบ (Database Seeder)
```powershell
npm run seed          # ล้างข้อมูลเก่าแล้วสร้าง User 3 คน, Hotel 6 แห่ง, Booking 4 รายการ
npm run seed:destroy  # ล้างข้อมูลทั้งหมดในฐานข้อมูล
```

**บัญชีทดสอบที่ถูกสร้างจาก Seeder (รหัสผ่านทั้งหมดคือ `password123`):**
| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| `user` | John Doe | `user@gmail.com` | `password123` |
| `user` | Jane Smith | `jane@gmail.com` | `password123` |
| `admin` | Admin Hotel | `admin@gmail.com` | `password123` |

### 4. รันเซิร์ฟเวอร์
```powershell
npm run dev     # รันด้วย nodemon (development)
# หรือ
node server.js  # รันด้วย node ปกติ
```
* API Server: `http://localhost:5000`
* Swagger API Docs: `http://localhost:5000/api-docs`

### 5. ทดสอบอีเมลด้วย Mailpit (Optional)
หากติดตั้ง Mailpit (`winget install axllent.mailpit`) สามารถเปิดรับอีเมลทดสอบได้ด้วยคำสั่ง:
```powershell
npm run mailpit
```
* **SMTP Server:** `127.0.0.1:1025`
* **Mailpit Web UI:** `http://localhost:8025`

---

## Automated Demo & Testing (Postman / Newman)

โปรเจกต์มีไฟล์ `HotelBooking.postman_collection.json` ที่จัดลำดับ Request ตามเกณฑ์การทดสอบตั้งแต่ **Step 1–12** (User & Admin workflow) และ **Step 13–16** (Extra features)

```powershell
# รันทดสอบอัตโนมัติทั้ง Collection ผ่าน Newman (ต้องเปิด server อยู่ก่อน)
npm run demo
# หรือ
npx newman run HotelBooking.postman_collection.json
```

> สามารถนำไฟล์ `HotelBooking.postman_collection.json` ไป Import เข้า Postman Desktop แล้วกด **Run Collection** ได้เช่นเดียวกัน

---

## API Endpoints Summary

### Auth (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | สมัครสมาชิก (`name`, `email`, `tel`, `password`, `role`) และรับ JWT |
| `POST` | `/api/v1/auth/login` | Public | เข้าสู่ระบบด้วย `email` และ `password` และรับ JWT |
| `GET` | `/api/v1/auth/me` | Private | ดึงข้อมูลผู้ใช้ปัจจุบันจาก JWT Token |
| `GET` | `/api/v1/auth/logout` | Public | ออกจากระบบและล้าง Cookie `token` |

### Hotels (`/api/v1/hotels`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/hotels` | Public | ดูรายการโรงแรมทั้งหมด (รองรับ filter, `select`, `sort`, pagination และ `?lat=&lng=&distance=`) |
| `GET` | `/api/v1/hotels/radius/:lat/:lng/:distance` | Public | ค้นหาโรงแรมภายในรัศมีที่กำหนด (กม.) ด้วย GeoJSON `2dsphere` |
| `GET` | `/api/v1/hotels/:id` | Public | ดูรายละเอียดโรงแรมรายแห่ง |
| `POST` | `/api/v1/hotels` | Admin | สร้างโรงแรมใหม่ (รองรับ `lat`/`lng` เพื่อสร้าง GeoJSON Point) |
| `PUT` | `/api/v1/hotels/:id` | Admin | แก้ไขข้อมูลโรงแรม |
| `DELETE` | `/api/v1/hotels/:id` | Admin | ลบโรงแรม พร้อม Cascade Delete รายการจองของโรงแรมนั้น |

### Bookings (`/api/v1/bookings`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/bookings` | Private | User ดูเฉพาะของตนเอง / Admin ดูรายการจองทั้งหมด |
| `GET` | `/api/v1/hotels/:hotelId/bookings` | Private | ดูรายการจองเฉพาะโรงแรมที่ระบุ (ตามสิทธิ์ User/Admin) |
| `GET` | `/api/v1/bookings/:id` | Private | ดูรายละเอียดการจอง 1 รายการ (เจ้าของหรือ Admin) |
| `POST` | `/api/v1/bookings`<br>`/api/v1/hotels/:hotelId/bookings` | User, Admin | สร้างการจอง (จำกัด `nights` ระหว่าง `1–3` คืน) |
| `PUT` | `/api/v1/bookings/:id` | User, Admin | แก้ไขการจอง (เจ้าของหรือ Admin) พร้อมคำนวณ `checkOutDate` ใหม่ |
| `DELETE` | `/api/v1/bookings/:id` | User, Admin | ลบการจอง (เจ้าของหรือ Admin) |
| `GET` | `/api/v1/bookings/:id/invoice` | User, Admin | ดาวน์โหลดใบกำกับภาษี PDF (เฉพาะสถานะ `Completed`) |
| `POST` | `/api/v1/bookings/trigger-cron` | Admin | สั่งรัน Background Cron Job ทันทีเพื่อทดสอบการเปลี่ยนสถานะและส่งอีเมล |
