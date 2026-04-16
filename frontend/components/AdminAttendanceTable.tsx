"use client";

import { useState, useEffect, useCallback } from "react";
import type { AttendanceRecord } from "@/types/attendances";
import { parseDate, calcWorkTime, getDaysInMonth, formatMonthLabel, formatTimeFromISO } from "@/lib/dateUtils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) { window.location.href = "/login"; throw new Error("Unauthorized"); }
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `HTTP ${res.status}`); }
  return res.json() as Promise<T>;
}

interface Props {
  userId: number;
  employeeName: string;
}

export default function AdminAttendanceTable({ userId, employeeName }: Props) {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [recordMap, setRecordMap] = useState<Map<string, AttendanceRecord>>(new Map());
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ year: number; month: number; records: AttendanceRecord[] }>(
        `/admin/users/${userId}/attendances?year=${year}&month=${month}`
      );
      const map = new Map<string, AttendanceRecord>();
      for (const r of res.records) {
        map.set(r.date.slice(0, 10), { ...r, date: r.date.slice(0, 10) });
      }
      setRecordMap(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [userId, year, month]);

  useEffect(() => { load(); }, [load]);

  function changeMonth(delta: number) {
    setMonth((m) => {
      const next = m + delta;
      if (next > 12) { setYear((y) => y + 1); return 1; }
      if (next < 1)  { setYear((y) => y - 1); return 12; }
      return next;
    });
  }

  async function handleApprove(id: number, dateKey: string) {
    try {
      const updated = await apiFetch<AttendanceRecord>(`/admin/attendances/${id}/approve`, { method: "PATCH" });
      setRecordMap((prev) => {
        const next = new Map(prev);
        next.set(dateKey, { ...(prev.get(dateKey)!), approvalStatus: updated.approvalStatus });
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "承認に失敗しました");
    }
  }

  async function handleReject(id: number, dateKey: string) {
    try {
      const updated = await apiFetch<AttendanceRecord>(`/admin/attendances/${id}/reject`, { method: "PATCH" });
      setRecordMap((prev) => {
        const next = new Map(prev);
        next.set(dateKey, { ...(prev.get(dateKey)!), approvalStatus: updated.approvalStatus });
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "却下に失敗しました");
    }
  }

  const allDays = getDaysInMonth(year, month);

  const { workedDays, totalMinutes } = allDays.reduce(
    (acc, d) => {
      const r = recordMap.get(d);
      const w = calcWorkTime(formatTimeFromISO(r?.startTime ?? null), formatTimeFromISO(r?.finishTime ?? null));
      if (w) { acc.workedDays++; acc.totalMinutes += w.totalMinutes; }
      return acc;
    },
    { workedDays: 0, totalMinutes: 0 }
  );
  const totalH = Math.floor(totalMinutes / 60);
  const totalM = totalMinutes % 60;

  return (
    <div style={{ width: "fit-content", margin: "0 auto", padding: "2rem 1.5rem", fontFamily: '"Noto Sans JP", "Hiragino Sans", sans-serif' }}>

      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111", margin: 0, marginRight: "auto" }}>
          {employeeName} の勤務一覧
        </h1>
        <SummaryCard label="出勤日数" value={`${workedDays}`} unit="日" />
        <SummaryCard
          label="合計勤務時間"
          value={`${totalH}`} unit="h"
          subValue={String(totalM).padStart(2, "0")} subUnit="m"
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <NavButton onClick={() => changeMonth(-1)}>‹</NavButton>
          <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#333", minWidth: 90, textAlign: "center" }}>
            {formatMonthLabel(year, month)}
          </span>
          <NavButton onClick={() => changeMonth(1)}>›</NavButton>
        </div>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "1rem", background: "#fff5f5", border: "1px solid #fdd", borderRadius: 10, color: "#c0392b", fontSize: "0.875rem", marginBottom: "1rem" }}>
          <span>⚠ {error}</span>
          <button onClick={load} style={{ background: "none", border: "1px solid #c0392b", borderRadius: 6, color: "#c0392b", padding: "0.25rem 0.75rem", fontSize: "0.8rem", cursor: "pointer" }}>再読み込み</button>
        </div>
      )}

      <div style={{ border: "1px solid #16161629", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "auto", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid #eee" }}>
              {["日付", "出勤", "退勤", "勤務時間", "位置情報", "コメント", "承認/却下", ""].map((h, i) => (
                <th key={i} style={{
                  padding: "0.6rem 0.75rem", textAlign: "left",
                  fontSize: "0.72rem", fontWeight: 600, color: "#999",
                  letterSpacing: "0.04em", whiteSpace: "nowrap",
                  width: i === 0 ? 88 : i === 1 || i === 2 ? 72 : i === 3 ? 84 : i === 4 ? 120 : i === 5 ? 200 : i === 6 ? 140 : 52,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td colSpan={8} style={{ padding: "0.65rem 0.75rem" }}>
                      <div style={{ height: 18, borderRadius: 4, background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
                    </td>
                  </tr>
                ))
              : allDays.map((dateStr) => {
                  const record = recordMap.get(dateStr);
                  const { day, dayOfWeek, dayOfWeekIndex } = parseDate(dateStr);
                  const isSun = dayOfWeekIndex === 0;
                  const isSat = dayOfWeekIndex === 6;
                  const isWeekend = isSun || isSat;
                  const work = calcWorkTime(
                    formatTimeFromISO(record?.startTime ?? null),
                    formatTimeFromISO(record?.finishTime ?? null)
                  );
                  const isShort = work !== null && work.totalMinutes < 480;
                  const bg = isSun ? "rgba(255,235,235,0.55)" : isSat ? "rgba(232,241,255,0.5)" : "transparent";
                  const approvalStatus = record?.approvalStatus ?? null;
                  const isEdited = record?.status === "edited";

                  return (
                    <tr
                      key={dateStr}
                      style={{ borderBottom: "1px solid #f0f0f0", background: bg }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isWeekend ? bg : "#fafafa")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = bg)}
                    >
                      {/* 日付 */}
                      <td style={{ padding: "0.7rem 0.75rem", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#222", marginRight: 4 }}>
                          {String(day).padStart(2, "0")}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: isSun ? "#e05252" : isSat ? "#4f7ef8" : "#aaa" }}>
                          （{dayOfWeek}）
                        </span>
                      </td>

                      {/* 出勤 */}
                      <td style={{ padding: "0.7rem 0.75rem", whiteSpace: "nowrap" }}>
                        {isWeekend && !record?.startTime ? <Dash /> : <TimeVal>{formatTimeFromISO(record?.startTime ?? null) ?? <Dash />}</TimeVal>}
                      </td>

                      {/* 退勤 */}
                      <td style={{ padding: "0.7rem 0.75rem", whiteSpace: "nowrap" }}>
                        {isWeekend && !record?.finishTime ? <Dash /> : <TimeVal>{formatTimeFromISO(record?.finishTime ?? null) ?? <Dash />}</TimeVal>}
                      </td>

                      {/* 勤務時間 */}
                      <td style={{ padding: "0.7rem 0.75rem", whiteSpace: "nowrap" }}>
                        {work
                          ? <span style={{ fontSize: "0.875rem", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: isShort ? "#d4800a" : "#222" }}>{work.display}</span>
                          : <Dash />}
                      </td>

                      {/* 位置情報 */}
                      <td style={{ padding: "0.7rem 0.75rem", whiteSpace: "nowrap" }}>
                        {record?.location ? <span style={{ fontSize: "0.8rem", color: "#555" }}>📍 {record.location}</span> : <Dash />}
                      </td>

                      {/* コメント */}
                      <td style={{ padding: "0.7rem 0.75rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "#777" }}>{record?.comment ?? ""}</span>
                      </td>

                      {/* 承認/却下 */}
                      <td style={{ padding: "0.7rem 0.75rem", whiteSpace: "nowrap" }}>
                        {isEdited && (() => {
                          if (approvalStatus === "pending") {
                            return (
                              <div style={{ display: "flex", gap: 4 }}>
                                <button
                                  onClick={() => handleApprove(record!.id, dateStr)}
                                  style={{ fontSize: "0.72rem", fontWeight: 600, color: "#fff", background: "#1e7f4e", border: "none", borderRadius: 6, padding: "0.2rem 0.6rem", cursor: "pointer" }}
                                >承認</button>
                                <button
                                  onClick={() => handleReject(record!.id, dateStr)}
                                  style={{ fontSize: "0.72rem", fontWeight: 600, color: "#fff", background: "#c0392b", border: "none", borderRadius: 6, padding: "0.2rem 0.6rem", cursor: "pointer" }}
                                >却下</button>
                              </div>
                            );
                          }
                          if (approvalStatus === "approved")  return <Badge color="#1e7f4e" bg="#edfff4">承認済み</Badge>;
                          if (approvalStatus === "rejected")  return <Badge color="#c0392b" bg="#fff5f5">却下済み</Badge>;
                          if (approvalStatus === "cancelled") return <Badge color="#888" bg="#f5f5f5">取消</Badge>;
                          return <Badge color="#d4800a" bg="#fff8ec">未申請</Badge>;
                        })()}
                      </td>

                      {/* 空カラム（タイトルなし） */}
                      <td style={{ padding: "0.7rem 0.75rem" }} />
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

function NavButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ width: 32, height: 32, border: "1px solid #e2e2e2", borderRadius: 8, background: "#fff", fontSize: "1rem", color: "#444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {children}
    </button>
  );
}

function SummaryCard({ label, value, unit, subValue, subUnit }: { label: string; value: string; unit: string; subValue?: string; subUnit?: string }) {
  const unitStyle = { fontSize: "0.75rem", fontWeight: 500, color: "#888", marginLeft: 2 } as const;
  return (
    <div style={{ background: "#f8f8f8", borderRadius: 10, padding: "0.5rem 0.875rem", minWidth: 110 }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 500, color: "#888", letterSpacing: "0.03em", marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111", lineHeight: 1.2 }}>
        {value}<span style={unitStyle}>{unit}</span>
        {subValue !== undefined && <>{subValue}<span style={unitStyle}>{subUnit}</span></>}
      </div>
    </div>
  );
}

function TimeVal({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: "0.875rem", fontVariantNumeric: "tabular-nums", color: "#333" }}>{children}</span>;
}

function Dash() {
  return <span style={{ color: "#ccc", fontSize: "0.85rem" }}>—</span>;
}

function Badge({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{ display: "inline-block", fontSize: "0.72rem", fontWeight: 600, color, background: bg, borderRadius: 6, padding: "0.2rem 0.55rem", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}
