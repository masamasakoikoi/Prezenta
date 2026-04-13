// src/generated/prisma/models/Attendance.ts に対応する型
export interface AttendanceRecord {
  id: number;
  date: string;        // "2025-03-05" (YYYY-MM-DD)
  startTime: string | null;   // "09:00"
  finishTime: string | null;  // "18:30"
  comment: string;
  userId: number;
  status?: string;     // "working" | "finished" | "edited"
  approvalStatus?: string | null; // null | "pending" | "approved" | "cancelled"
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
  startTime: string | null;
  finishTime: string | null;
  comment: string;
}
