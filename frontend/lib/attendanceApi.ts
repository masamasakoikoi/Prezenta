import type {
  AttendanceMonthResponse,
  UpdateAttendancePayload,
} from "@/types/attendances";

// Express サーバーのURL（.env.local で NEXT_PUBLIC_API_URL=http://localhost:4000 を設定）
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include", // JWT Cookie or session を送る
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 401) {
    // 未認証 → ログインページへ
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body?.message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/**
 * GET /api/attendances?year=2025&month=3
 * 既存の src/routes/attendances.ts に合わせてパスを調整してください
 */
export async function fetchAttendance(
  year: number,
  month: number
): Promise<AttendanceMonthResponse> {
  return apiFetch<AttendanceMonthResponse>(
    `/attendances?year=${year}&month=${month}`
  );
}

/**
 * PUT /api/attendances/:date
 * body: { checkIn, checkOut, comment }
 */
export async function updateAttendance(
  date: string,
  payload: UpdateAttendancePayload
): Promise<void> {
  await apiFetch(`/attendances/${date}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
