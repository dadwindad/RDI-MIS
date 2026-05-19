# SYSTEM_RULES.md
**Project:** Research Institute Core Platform (RICP)
**Architecture:** Micro-Frontend & Microservices

กฎในเอกสารนี้เป็น "ข้อห้าม" และ "ข้อบังคับ" ขั้นเด็ดขาดสำหรับการเขียนโค้ดในโปรเจกต์นี้ ห้ามละเมิดเด็ดขาดเพื่อรักษาความสม่ำเสมอของสถาปัตยกรรม (Architecture Consistency)

## 1. System Architecture (สถาปัตยกรรมระบบ)
- ระบบถูกแบ่งเป็น 1 Core App (Host) และ หลาย Sub-Apps (Remote/Plugins)
- **Core App** มีหน้าที่: จัดการ IAM (SSO/JWT), Master Data (รายชื่อคน, โครงสร้างองค์กร, ปีงบประมาณ), App Registry, และเป็น API Gateway สำหรับ File Storage
- **Sub-Apps** ถูกจัดกลุ่มตาม Business Domain (เช่น PMS, Finance, EC, IP) ไม่จัดตาม Role ผู้ใช้งาน
- UI ของ Sub-App ต้องออกแบบให้สอดคล้องกับโครงสร้างธุรกิจแบบ **8P 5C Model** เสมอ

## 2. Database & Data Modeling (กฎฐานข้อมูล)
- **แยก Database เด็ดขาด:** แต่ละ Sub-App มี Database หรือ Schema เป็นของตัวเอง 
- **NO Cross-Database Joins:** ห้ามทำ Foreign Key ข้าม Database (เช่น ห้าม `REFERENCES core_db.users(id)`)
- **Reference IDs:** ให้ใช้ ID อ้างอิงแทน เช่น `core_user_id` (อ้างอิงคน) หรือ `project_id` (อ้างอิงโครงการจาก PMS)
- **Denormalization:** อนุญาตและแนะนำให้เก็บข้อมูลสำเนา (เช่น `user_display_name`) ไว้ใน Sub-App เพื่อความเร็วในการ Query โดยไม่ต้องยิง API กลับไปถาม Core App ตลอดเวลา
- **Soft Delete ONLY:** ห้ามใช้คำสั่ง `DELETE` ลบข้อมูลออกจากระบบเด็ดขาด ให้ใช้แนวทาง Soft Delete เช่น การเพิ่มฟิลด์ `is_deleted = true`, `deleted_at` หรือเปลี่ยนสถานะ `status = 'CANCELLED'`
- **Fiscal Year Awareness:** ทุก Transaction หลักที่เกี่ยวกับงบประมาณหรืองานวิจัย ต้องมีฟิลด์ `fiscal_year` (ปีงบประมาณ) กำกับเสมอ และต้องตรวจสอบ State ของปีงบประมาณจาก Core App ว่า "เปิด" หรือ "ปิด" อยู่

## 3. File & Storage Handling (การจัดการไฟล์)
- ห้าม Sub-App เก็บไฟล์ไว้ในเครื่องเซิร์ฟเวอร์หรือฐานข้อมูลของตัวเองเด็ดขาด
- ใช้ **Direct Upload (Pre-signed URL)** เสมอ: 
  1. Frontend ของ Sub-App ขอ Pre-signed URL จาก Backend Sub-App
  2. Backend Sub-App ไปรับ Token จาก Core Storage API
  3. Frontend อัปโหลดไฟล์ตรงเข้า Object Storage (S3/MinIO) 
  4. Frontend ส่ง Path กลับมาให้ Backend บันทึกลงฐานข้อมูล
- เมื่อมีการลบข้อมูลในระบบ ห้ามลบไฟล์จริงออกจาก Object Storage ให้ทำ Soft Delete ที่ฐานข้อมูลของ Sub-App เท่านั้น

## 4. Authentication & Authorization (การยืนยันตัวตนและสิทธิ)
- การสื่อสารระหว่าง Frontend กับ Backend หรือ Backend กับ Backend ต้องแนบ **JWT (JSON Web Token)** ใน `Authorization: Bearer <token>` Header เสมอ
- Sub-App ไม่ต้องทำระบบ Login/Logout เอง ให้ตรวจสอบ Token ที่ได้มาจาก Core App 
- **Role-Based Access Control (RBAC):** เช็คสิทธิ (Permissions) จาก Payload ที่อยู่ใน JWT Token เพื่อตัดสินใจว่าผู้ใช้มีสิทธิทำ Action นั้นๆ ใน Sub-App หรือไม่
- **Custom Roles:** ระบบรองรับการสร้าง Custom Role และการแมปสิทธิ์ (Permissions) จาก Sub-Apps ผ่านหน้า Role & Permission Matrix

## 5. Development Workflow & API (กฎการพัฒนา)
- **API-First Approach:** ต้องเขียนและตกลง OpenAPI Specification (Swagger) ให้เสร็จก่อนเริ่มเขียน Logic โค้ด
- **Idempotency:** API ที่เกี่ยวกับการเปลี่ยนสถานะ (เช่น Approve, Reject) หรือธุรกรรมการเงิน ต้องเป็น Idempotent (ยิงซ้ำผลลัพธ์ต้องเท่าเดิม ไม่เกิด Action ซ้ำซ้อน)
- **Event-Driven:** หากต้องส่งข้อมูลข้าม Sub-App ให้ใช้วิธี Publish/Subscribe (เช่น Webhook, RabbitMQ) ห้ามยิง API ซิงค์ข้อมูลแบบ Real-time ที่จะทำให้เกิดคอขวด

## 6. UI/UX & Interaction Rules (กฎการออกแบบหน้าจอและการโต้ตอบ)
- **Search Filters:** ช่องค้นหาหรือ Filter ในหน้าจัดการข้อมูล ควรออกแบบให้ยืดหยุ่นและใช้พื้นที่เต็มบรรทัด (Flex: 1) เพื่อความสวยงามและใช้งานง่าย
- **Pagination:** ตารางแสดงข้อมูลขนาดใหญ่ (เช่น Audit Log, File List) ต้องมีระบบแบ่งหน้า (Pagination) โดยมีตัวเลือก 10, 50, 100 รายการต่อหน้า
- **Filename Display:** การแสดงชื่อไฟล์ในตารางหรือรายการประวัติ หากชื่อยาวเกิน 20 ตัวอักษร ให้ย่อเหลือ 20 ตัวแรกแล้วต่อด้วย `...` ตามด้วยนามสกุลไฟล์ และต้องใส่ `title` เพื่อให้เห็นชื่อเต็มเมื่อเอาเมาส์ชี้ (Hover)
- **Exception for Filename Display:** สำหรับการแสดงชื่อไฟล์ในส่วนของเอกสารแนบหลักของโครงการ (เช่น เอกสารเสนอโครงการ) ให้แสดงชื่อเต็ม ไม่ต้องย่อ

## 7. Audit Logging (การบันทึกประวัติ)
- **Display Name:** การบันทึกประวัติกิจกรรม (Audit Log) ต้องใช้ชื่อจริงของผู้ใช้งาน (Full Name) เสมอ ไม่ใช้ Username หรือ ID เพื่อให้อ่านง่ายและตรวจสอบได้ชัดเจน
- **Header Encoding:** การส่งชื่อผู้ใช้งานผ่าน HTTP Header (เช่น `X-User-Name`) หากชื่อมีตัวอักษรนอกเหนือจาก ISO-8859-1 (เช่น ภาษาไทย) ต้องใช้ `encodeURIComponent` ก่อนส่ง และฝั่งรับต้องใช้ `decodeURIComponent` เพื่อป้องกัน Error
- **Database & File Operations:** ต้องบันทึกทุกกิจกรรมที่มีการเปลี่ยนแปลงข้อมูลในฐานข้อมูล (สร้าง, แก้ไข, ลบ) และการจัดการไฟล์ (อัปโหลด, ดาวน์โหลด, ลบ) เสมอ
- **Current User Context:** การบันทึกประวัติต้องใช้ข้อมูลผู้ใช้งานปัจจุบัน (Current User) ที่เป็นผู้กระทำกิจกรรมนั้นเสมอ โดยอ้างอิงจากชื่อจริง (Full Name) ตามกฎ Display Name
- **Activity Source:** ต้องบันทึกแหล่งที่มา (Source) ของกิจกรรมเสมอ (เช่น ชื่อ Sub-App หรือระบบย่อยที่เกิดกิจกรรม) เพื่อให้สามารถแยกแยะและตรวจสอบย้อนกลับได้ง่าย

## 8. Local Storage Gateway (ระบบจัดเก็บไฟล์จำลอง)
- **Centralized Storage**: ระบบใช้ Core App (Port 3001) เป็น Gateway ในการจัดการไฟล์ทั้งหมด โดยเก็บไฟล์ไว้ที่โฟลเดอร์ `storage` ใน Root directory
- **Filename Pattern**: การบันทึกไฟล์ลงดิสก์ต้องใช้รูปแบบชื่อไฟล์ที่รวม Metadata เสมอ: `[appSource]_[activity]_[uploader]_Timestamp-Random_OriginalName` เพื่อให้สามารถระบุที่มาและผู้รับผิดชอบได้
- **Soft Delete Mechanism**: เมื่อมีการลบไฟล์ผ่าน API ห้ามลบไฟล์จริงออกจากดิสก์ทันที ให้เปลี่ยนชื่อไฟล์โดยต่อท้ายด้วย `.deleted` เสมอ
- **Bulk Cleanup**: การลบไฟล์จริงออกจากดิสก์ (Hard Delete) จะทำได้ผ่าน Endpoint `/api/storage/clear-deleted` เท่านั้น ซึ่งจะลบเฉพาะไฟล์ที่ลงท้ายด้วย `.deleted`
- **Metadata Association**: การอัปโหลดไฟล์ต้องส่งข้อมูล `appSource`, `activity`, และ `uploader` ผ่าน Body เสมอเพื่อให้ระบบสร้างชื่อไฟล์ที่ถูกต้อง
- **Static Access**: ไฟล์ที่อัปโหลดแล้วสามารถเข้าถึงได้ผ่าน URL `/rdi_mis/storage/ชื่อไฟล์`