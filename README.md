# Research Institute Core Platform (RICP)

ยินดีต้อนรับสู่โปรเจกต์ **Research Institute Core Platform (RICP)** ซึ่งเป็นระบบแกนกลางสำหรับสถาบันวิจัย พัฒนาขึ้นด้วยสถาปัตยกรรม Micro-Frontend และ Microservices เพื่อรองรับการขยายตัวของระบบต่างๆ ในอนาคต

## 📌 ภาพรวมระบบ (System Overview)
ระบบนี้ทำหน้าที่เป็น **Core App (Host)** ที่คอยจัดการ:
- **IAM (Identity and Access Management)**: ระบบจัดการผู้ใช้และสิทธิ์การใช้งาน
- **Master Data**: ข้อมูลพื้นฐาน เช่น รายชื่อบุคลากร, โครงสร้างองค์กร, ปีงบประมาณ
- **App Registry**: ระบบลงทะเบียนและจัดการ Sub-Apps
- **Storage Gateway**: เป็น API Gateway สำหรับการจัดการไฟล์

## 🏗️ สถาปัตยกรรม (Architecture)
ระบบใช้สถาปัตยกรรมแบบ **Micro-Frontend** และ **Microservices**:
- **Core App**: ควบคุมภาพรวมและให้บริการแชร์ทรัพยากร
- **Sub-Apps**: ระบบเฉพาะด้านที่แยกการทำงานเด็ดขาด (เช่น PMS - Project Management System) โดยแต่ละ Sub-App จะมี Database เป็นของตัวเอง

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)
- **Frontend**: React (TypeScript), Vite
- **Backend**: Node.js, Express
- **Database**: SQLite (สำหรับการพัฒนา)
- **Styling**: Vanilla CSS (ตามแนวทางที่กำหนด)

## 📁 โครงสร้างโปรเจกต์ (Project Structure)
- `/sub-apps/pms-app`: ตัวอย่าง Sub-App ระบบบริหารจัดการโครงการ (Project Management System)
- `/sub-apps/sub-app-boilerplate`: โครงสร้างต้นแบบสำหรับสร้าง Sub-App ใหม่
- `/databases`: ที่เก็บไฟล์ฐานข้อมูล SQLite
- `/storage`: ที่เก็บไฟล์อัปโหลด (จำลองการทำงาน)
- `server.js`: Backend Server ของ Core App
- `SYSTEM_RULES.md`: กฎและข้อบังคับในการพัฒนาโปรเจกต์ (สำคัญมาก โปรดอ่าน!)

## 🚀 วิธีการติดตั้งและเริ่มใช้งาน (Getting Started)

### 1. ติดตั้ง Dependencies
ติดตั้ง dependencies สำหรับ Core App:
```bash
npm install
```
และสำหรับ Sub-App (เช่น pms-app):
```bash
cd sub-apps/pms-app
npm install
cd ../..
```

### 2. รันระบบ

**รันทุกระบบพร้อมกัน (Core + Sub-Apps):**
```bash
npm run start:all
```
(คำสั่งนี้จะรัน Core Backend, Core Frontend และ PMS Backend พร้อมกันในหน้าต่างเดียว โดยมี Prefix บอกชื่อระบบใน Log)

**หรือแยกการรันทีละระบบ:**

*รัน Backend Server (Core):*
```bash
npm run server
```

*รัน Frontend (Core):*
```bash
npm run dev
```

*รัน Backend ของ Sub-App (PMS):*
```bash
cd sub-apps/pms-app
npm start
```

## ⚠️ กฎการพัฒนาที่สำคัญ (System Rules)
โปรดศึกษาและปฏิบัติตามกฎใน `SYSTEM_RULES.md` อย่างเคร่งครัด โดยมีหัวข้อหลักดังนี้:
1. **NO Cross-Database Joins**: ห้ามทำ Foreign Key ข้าม Database
2. **Soft Delete ONLY**: ห้ามลบข้อมูลออกจากระบบเด็ดขาด ให้ใช้ Soft Delete
3. **Fiscal Year Awareness**: ทุกธุรกรรมหลักต้องระบุปีงบประมาณ
4. **File Storage**: ใช้ระบบ Gateway ในการจัดการไฟล์ ห้ามเก็บไฟล์ไว้ใน Sub-App เอง

---
พัฒนาโดยทีมพัฒนาของสถาบันวิจัย (RICP Team)
