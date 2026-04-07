// src/generated/prisma/models/Attendance.ts に対応する型
export interface AttendanceRecord {
  id: number;
  date: string;        // "2025-03-05" (YYYY-MM-DD)
  checkIn: string | null;   // "09:00"
  checkOut: string | null;  // "18:30"
  comment: string;
  userId: number;
  createdAt?: string;
  updatedAt?: string;
}

// GET /api/attendance?year=2025&month=3 のレスポンス
export interface AttendanceMonthResponse {
  year: number;
  month: number;
  records: AttendanceRecord[];
}

// PUT /api/attendance/:date のリクエストボディ
export interface UpdateAttendancePayload {
  checkIn: string | null;
  checkOut: string | null;
  comment: string;
}
