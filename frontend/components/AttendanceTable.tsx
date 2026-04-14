"use client";

import { useState, useEffect, useCallback } from "react";
import type { AttendanceRecord, AttendanceMonthResponse, UpdateAttendancePayload } from "@/types/attendances";
import { fetchAttendance, updateAttendance, applyAttendance, cancelAttendance } from "@/lib/attendanceApi";
import { parseDate, calcWorkTime, getDaysInMonth, formatMonthLabel, formatTimeFromISO } from "@/lib/dateUtils";
import EditModal from "./EditModal";

export default function AttendanceTable() {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // date文字列 → AttendanceRecord のマップ
  const [recordMap, setRecordMap] = useState<Map<string, AttendanceRecord>>(new Map());
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<AttendanceRecord | null>(null);

  // ── データ取得 ─────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAttendance(year, month);
      const map = new Map<string, AttendanceRecord>();
      for (const r of res.records) {
        const dateKey = r.date.slice(0, 10);
        map.set(dateKey, { ...r, date: dateKey });
      }
      setRecordMap(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  // ── 月移動 ─────────────────────────────────────────────
  function changeMonth(delta: number) {
    setMonth((m) => {
      const next = m + delta;
      if (next > 12) { setYear((y) => y + 1); return 1; }
      if (next < 1)  { setYear((y) => y - 1); return 12; }
      return next;
    });
  }

  // ── 保存（楽観的更新） ─────────────────────────────────
  async function handleSave(date: string, payload: UpdateAttendancePayload) {
    await updateAttendance(date, payload);
    setRecordMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(date);
      next.set(date, {
        ...(existing ?? { id: 0, userId: 0, comment: "" }),
        date,
        startTime: payload.startTime,
        finishTime: payload.finishTime,
        comment: payload.comment,
        status: "edited",
        approvalStatus: null,
      });
      return next;
    });
  }

  // ── 申請 ───────────────────────────────────────────────
  async function handleApply(date: string) {
    try {
      const updated = await applyAttendance(date);
      setRecordMap((prev) => {
        const next = new Map(prev);
        const existing = next.get(date);
        next.set(date, { ...(existing ?? updated), approvalStatus: "pending" });
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "申請に失敗しました");
    }
  }

  // ── 申請取消 ───────────────────────────────────────────
  async function handleCancelApply(date: string) {
    try {
      const updated = await cancelAttendance(date);
      setRecordMap((prev) => {
        const next = new Map(prev);
        const existing = next.get(date);
        next.set(date, { ...(existing ?? updated), approvalStatus: "cancelled" });
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "取消に失敗しました");
    }
  }

  // ── 全日付リスト ───────────────────────────────────────
  const allDays = getDaysInMonth(year, month);

  // ── サマリー集計 ───────────────────────────────────────
  const { workedDays, totalMinutes } = allDays.reduce(
    (acc, d) => {
      const r = recordMap.get(d);
      const w = calcWorkTime(
        formatTimeFromISO(r?.startTime ?? null),
        formatTimeFromISO(r?.finishTime ?? null)
      );
      if (w) { acc.workedDays++; acc.totalMinutes += w.totalMinutes; }
      return acc;
    },
    { workedDays: 0, totalMinutes: 0 }
  );
  const totalH = Math.floor(totalMinutes / 60);
  const totalM = totalMinutes % 60;

  return (
    <>
      <div style={{ width: "fit-content", margin: "0 auto", padding: "2rem 1.5rem", fontFamily: '"Noto Sans JP", "Hiragino Sans", sans-serif' }}>

        {/* ── ヘッダー ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111", margin: 0, marginRight: "auto" }}>勤務一覧</h1>
          <SummaryCard label="出勤日数" value={`${workedDays}`} unit="日" />
          <SummaryCard
            label="合計勤務時間"
            value={`${totalH}`}
            unit="h"
            subValue={String(totalM).padStart(2, "0")}
            subUnit="m"
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <NavButton onClick={() => changeMonth(-1)}>‹</NavButton>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#333", minWidth: 90, textAlign: "center" }}>
              {formatMonthLabel(year, month)}
            </span>
            <NavButton onClick={() => changeMonth(1)}>›</NavButton>
          </div>
        </div>

        {/* ── エラー ── */}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "1rem", background: "#fff5f5", border: "1px solid #fdd", borderRadius: 10, color: "#c0392b", fontSize: "0.875rem", marginBottom: "1rem" }}>
            <span>⚠ {error}</span>
            <button onClick={load} style={{ background: "none", border: "1px solid #c0392b", borderRadius: 6, color: "#c0392b", padding: "0.25rem 0.75rem", fontSize: "0.8rem", cursor: "pointer" }}>
              再読み込み
            </button>
          </div>
        )}

        {/* ── テーブル ── */}
        <div style={{ border: "1px solid #16161629", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "auto", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "1px solid #eee" }}>
                {["日付", "出勤", "退勤", "勤務時間", "コメント", "申請承認", ""].map((h, i) => (
                  <th key={i} style={{
                    padding: "0.6rem 0.75rem", textAlign: "left",
                    fontSize: "0.72rem", fontWeight: 600, color: "#999",
                    letterSpacing: "0.04em", whiteSpace: "nowrap",
                    width: i === 0 ? 88 : i === 1 || i === 2 ? 72 : i === 3 ? 84 : i === 4 ? 200 : i === 5 ? 120 : i === 6 ? 52 : undefined,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td colSpan={7} style={{ padding: "0.65rem 0.75rem" }}>
                        <div style={{
                          height: 18, borderRadius: 4,
                          background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)",
                          backgroundSize: "200% 100%",
                          animation: "shimmer 1.4s infinite",
                        }} />
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

                    const bg = isSun
                      ? "rgba(255,235,235,0.55)"
                      : isSat
                      ? "rgba(232,241,255,0.5)"
                      : "transparent";

                    const displayRecord: AttendanceRecord = record ?? {
                      id: 0, userId: 0, date: dateStr,
                      startTime: null, finishTime: null, comment: "",
                    };

                    const isEdited = record?.status === "edited";
                    const approvalStatus = record?.approvalStatus ?? null;
                    const isLocked = approvalStatus === "pending" || approvalStatus === "approved";

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
                          {isWeekend && !record?.startTime
                            ? <Dash />
                            : <TimeVal>{formatTimeFromISO(record?.startTime ?? null) ?? <Dash />}</TimeVal>
                          }
                        </td>

                        {/* 退勤 */}
                        <td style={{ padding: "0.7rem 0.75rem", whiteSpace: "nowrap" }}>
                          {isWeekend && !record?.finishTime
                            ? <Dash />
                            : <TimeVal>{formatTimeFromISO(record?.finishTime ?? null) ?? <Dash />}</TimeVal>
                          }
                        </td>

                        {/* 勤務時間 */}
                        <td style={{ padding: "0.7rem 0.75rem", whiteSpace: "nowrap" }}>
                          {work
                            ? <span style={{ fontSize: "0.875rem", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: isShort ? "#d4800a" : "#222" }}>
                                {work.display}
                              </span>
                            : <Dash />
                          }
                        </td>

                        {/* コメント */}
                        <td style={{ padding: "0.7rem 0.75rem" }}>
                          <span style={{ fontSize: "0.8rem", color: "#777" }}>{record?.comment ?? ""}</span>
                        </td>

                        {/* 申請承認 */}
                        <td style={{ padding: "0.7rem 0.75rem", whiteSpace: "nowrap" }}>
                          {isEdited && (
                            <>
                              {approvalStatus === "pending" && (
                                <ApprovalBadge color="#d4800a" bg="#fff8ec">申請中</ApprovalBadge>
                              )}
                              {approvalStatus === "approved" && (
                                <ApprovalBadge color="#1e7f4e" bg="#edfff4">承認</ApprovalBadge>
                              )}
                              {approvalStatus === "cancelled" && (
                                <ApprovalBadge color="#888" bg="#f5f5f5">取消</ApprovalBadge>
                              )}
                              {(approvalStatus === null || approvalStatus === undefined) && (
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button
                                    onClick={() => handleApply(dateStr)}
                                    style={{
                                      fontSize: "0.72rem", fontWeight: 500,
                                      color: "#fff", background: "#4f7ef8",
                                      border: "none", borderRadius: 6,
                                      padding: "0.2rem 0.55rem", cursor: "pointer",
                                      whiteSpace: "nowrap",
                                    }}
                                  >申請</button>
                                  <button
                                    onClick={() => handleCancelApply(dateStr)}
                                    style={{
                                      fontSize: "0.72rem", fontWeight: 500,
                                      color: "#888", background: "none",
                                      border: "1px solid #ddd", borderRadius: 6,
                                      padding: "0.2rem 0.55rem", cursor: "pointer",
                                      whiteSpace: "nowrap",
                                    }}
                                  >取消</button>
                                </div>
                              )}
                            </>
                          )}
                        </td>

                        {/* 編集ボタン */}
                        <td style={{ padding: "0.7rem 0.75rem", textAlign: "center" }}>
                          {!isLocked && (
                            <button
                              onClick={() => setEditTarget(displayRecord)}
                              aria-label={`${day}日の勤務を編集`}
                              style={{
                                fontSize: "0.75rem", fontWeight: 500,
                                color: "#4f7ef8", background: "none",
                                border: "1px solid #d3e2fd", borderRadius: 6,
                                padding: "0.25rem 0.6rem", cursor: "pointer",
                                transition: "background 0.15s",
                                whiteSpace: "nowrap",
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "#eef3ff";
                                (e.currentTarget as HTMLButtonElement).style.borderColor = "#4f7ef8";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "none";
                                (e.currentTarget as HTMLButtonElement).style.borderColor = "#d3e2fd";
                              }}
                            >
                              編集
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {/* shimmer アニメーション用 */}
        <style>{`
          @keyframes shimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>

      <EditModal
        record={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSave}
      />
    </>
  );
}

// ── 小コンポーネント ──────────────────────────────────────

function NavButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 32, height: 32, border: "1px solid #e2e2e2", borderRadius: 8,
        background: "#fff", fontSize: "1rem", color: "#444", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >{children}</button>
  );
}

function SummaryCard({ label, value, unit, subValue, subUnit }: {
  label: string; value: string; unit: string;
  subValue?: string; subUnit?: string;
}) {
  const unitStyle = { fontSize: "0.75rem", fontWeight: 500, color: "#888", marginLeft: 2 } as const;
  return (
    <div style={{ background: "#f8f8f8", borderRadius: 10, padding: "0.5rem 0.875rem", minWidth: 110 }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 500, color: "#888", letterSpacing: "0.03em", marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111", lineHeight: 1.2 }}>
        {value}<span style={unitStyle}>{unit}</span>
        {subValue !== undefined && <>
          {subValue}<span style={unitStyle}>{subUnit}</span>
        </>}
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

function ApprovalBadge({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{
      display: "inline-block",
      fontSize: "0.72rem", fontWeight: 600,
      color, background: bg,
      borderRadius: 6, padding: "0.2rem 0.55rem",
      whiteSpace: "nowrap",
    }}>{children}</span>
  );
}
