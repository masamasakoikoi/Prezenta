import type {
  AttendanceRecord,
  AttendanceMonthResponse,
  UpdateAttendancePayload,
} from "@/types/attendances";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("token")
    : null;

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body?.message ?? `HTTP ${res.status}`);
  }

  const data = await res.json();
  console.log("API response:", data); // ← 追加
  return data as T;
}

export async function fetchAttendance(
  year: number,
  month: number
): Promise<AttendanceMonthResponse> {
  return apiFetch<AttendanceMonthResponse>(
    `/attendances?year=${year}&month=${month}`
  );
}

export async function updateAttendance(
  date: string,
  payload: UpdateAttendancePayload
): Promise<void> {
  await apiFetch(`/attendances/${date}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// 今日の勤怠を取得
export async function fetchToday(): Promise<AttendanceRecord | null> {
  return apiFetch<AttendanceRecord | null>("/attendances/today");
}

// 出勤
export async function checkIn(): Promise<AttendanceRecord> {
  return apiFetch<AttendanceRecord>("/attendances/start", {
    method: "POST",
    body: JSON.stringify({ date: getTodayString() }),
  });
}

// 退勤
export async function checkOut(): Promise<AttendanceRecord> {
  return apiFetch<AttendanceRecord>("/attendances/finish", {
    method: "POST",
    body: JSON.stringify({ date: getTodayString() }),
  });
}

// 申請
export async function applyAttendance(date: string): Promise<AttendanceRecord> {
  return apiFetch<AttendanceRecord>(`/attendances/${date}/apply`, {
    method: "POST",
  });
}

// 申請取消
export async function cancelAttendance(date: string): Promise<AttendanceRecord> {
  return apiFetch<AttendanceRecord>(`/attendances/${date}/cancel-application`, {
    method: "POST",
  });
}

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}