# Vibe Coding SOP for Micro-Frontend Sub-Apps

เพื่อให้ Vibe Coding ทำงานได้อย่างทรงพลังและระบบไม่เละเมื่อขยายสเกล นี่คือ "Standard Operating Procedure (SOP)" ที่ต้องบังคับใช้ทุกครั้งที่จะสร้าง App ย่อยตัวใหม่

## Step 1: ใช้ "Sub-App Boilerplate" เสมอ (ห้ามเริ่มจากศูนย์)
ห้ามให้ AI เริ่มเขียนโปรเจกต์ใหม่แบบ Blank Project เด็ดขาด ให้ใช้โครงสร้างจากโฟลเดอร์นี้เป็นฐานเสมอ ซึ่งได้เตรียมสิ่งเหล่านี้ไว้แล้ว:
- `src/auth-middleware.ts`: โค้ดสำหรับรับและถอดรหัส JWT Token จาก Core App
- `src/api-client.ts`: โค้ดสำหรับยิงไปดึง Master Data จาก Core App (เช่น User, Fiscal Year)
- `app-manifest.json`: ไฟล์ลงทะเบียนการติดตั้ง

**Prompt Example:** "นี่คือโครงสร้างมาตรฐาน ห้ามเปลี่ยน โฟลเดอร์/Architecture ให้เขียน Business Logic ของ App ใหม่ลงในโครงสร้างนี้เท่านั้น"

## Step 2: Contract-First (ออกแบบ API Spec ก่อนเขียนโค้ด)
ให้ AI เขียน OpenAPI (Swagger) Schema หรือโครงสร้าง JSON ออกมาก่อนเสมอ

**Prompt Example:** "ฉันต้องการสร้าง App: EC (จริยธรรมการวิจัย) นี่คือ SRS ... จงเขียน OpenAPI Specification สำหรับ App นี้ โดยให้อิง Project_ID จาก App: PMS เป็น Foreign Key"

## Step 3: Vibe Coding ทีละ Layer (แยกบริบท)
1. **Database Layer:** โยนตารางของ Core App เป็น Reference แล้วสั่ง: "ออกแบบ Database Schema สำหรับ App: EC โดยใช้ Soft Delete และห้ามสร้างตาราง User ใหม่ ให้ใช้ core_user_id อ้างอิง"
2. **Backend Logic:** โยน DB Schema ให้ AI แล้วสั่ง: "เขียน CRUD Controller สำหรับ App: EC และสร้าง Webhook Endpoint สำหรับรับ Event จาก Core App"
3. **Frontend/UI:** โยน API Spec กลับไปให้ AI แล้วสั่ง: "สร้างหน้าจอ UI โดยดึงข้อมูลจาก API นี้ ใช้ Component ตาม 8P 5C Model"

## Step 4: การเสียบ (Integration & Plugin)
เมื่อแอปย่อยเสร็จแล้ว ให้แก้ไขไฟล์ `app-manifest.json` เพื่อระบุข้อมูล App ID, Entry URL, API Endpoint และสิทธิ์การเข้าถึง 
จากนั้นนำข้อมูลนี้ไปกรอกลงทะเบียนในหน้า **App Registry** ของ Core App เพื่อให้ Core App ทำการดูด UI และเชื่อมต่อ API ให้โดยอัตโนมัติ
