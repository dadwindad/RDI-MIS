# RICP API Documentation

เอกสารฉบับนี้รวบรวม API Endpoints ทั้งหมดของระบบ Core App และ PMS Sub-App ให้เป็นปัจจุบัน

---

## 🏢 Core App (Port: 3001)

### 1. Audit Logs
ระบบบันทึกกิจกรรมการใช้งาน

#### `POST /api/audit`
สร้างรายการบันทึกกิจกรรมใหม่

**Request Body:**
```json
{
  "user_name": "string",
  "action": "string",
  "details": "string"
}
```

**Response:**
```json
{
  "success": true,
  "id": 123
}
```

### 2. Storage Gateway
ระบบจัดการไฟล์ส่วนกลาง

#### `GET /api/storage/files`
ดึงรายการไฟล์ทั้งหมดใน Storage (รวมถึงไฟล์ที่ถูก Soft Delete)

**Response:**
```json
[
  {
    "name": "string",
    "isDeleted": boolean,
    "size": number,
    "updatedAt": "string"
  }
]
```

#### `DELETE /api/storage/files/:filename`
ลบไฟล์แบบ Soft Delete (เปลี่ยนนามสกุลเป็น .deleted)

**Response:**
```json
{
  "success": true,
  "message": "File soft-deleted successfully"
}
```

---

## 📁 PMS Sub-App (Port: 3002)
ระบบบริหารจัดการโครงการ

### 1. Projects (การจัดการโครงการ)

#### `GET /api/pms/projects`
ดึงรายการโครงการทั้งหมด (เฉพาะที่ยังไม่ถูกลบ)

**Response:**
```json
[
  {
    "id": "PRJ-123",
    "fiscal_year_id": "2569",
    "fund_type": "string",
    "title_th": "string",
    "title_en": "string",
    "budget_amount": number,
    "budget_balance": number,
    "status": "DRAFT | APPROVED | CLOSED",
    "is_ec_approved": number,
    "is_deleted": 0,
    "created_at": "string",
    "updated_at": "string",
    "manager_name": "string",
    "staff_name": "string"
  }
]
```

#### `POST /api/pms/projects`
สร้างโครงการใหม่ (สถานะเริ่มต้นจะเป็น DRAFT)

**Request Body:**
```json
{
  "fiscal_year_id": "string",
  "fund_type": "string",
  "title_th": "string",
  "title_en": "string",
  "budget_amount": number,
  "manager_name": "string",
  "staff_name": "string"
}
```

**Response:**
```json
{
  "success": true,
  "id": "PRJ-123",
  "status": "DRAFT"
}
```

#### `PUT /api/pms/projects/:id`
แก้ไขข้อมูลโครงการ (เฉพาะสถานะ DRAFT เท่านั้น)

**Request Body:**
```json
{
  "fiscal_year_id": "string",
  "fund_type": "string",
  "title_th": "string",
  "title_en": "string",
  "budget_amount": number
}
```

#### `DELETE /api/pms/projects/:id`
ลบโครงการแบบ Soft Delete (เฉพาะสถานะ DRAFT เท่านั้น)

### 2. Fund Types (การจัดการประเภททุน)

#### `GET /api/pms/fund-types`
ดึงรายการประเภททุนทั้งหมด

#### `POST /api/pms/fund-types`
เพิ่มประเภททุนใหม่

#### `DELETE /api/pms/fund-types/:id`
ลบประเภททุน

### 3. Budget & Documents (การเงินและเอกสาร)

#### `POST /api/pms/projects/:id/deduct`
ตัดยอดงบประมาณ (สร้าง Transaction)

#### `GET /api/pms/projects/:id/transactions`
ดึงรายการ Transaction ของโครงการ

#### `POST /api/pms/projects/:id/attach`
แนบเอกสารโครงการ

#### `POST /api/pms/projects/:id/close`
ปิดโครงการ (ต้องแนบเอกสาร)
