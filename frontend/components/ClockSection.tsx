"use client";

import { useState, useEffect } from "react";
import type { AttendanceRecord } from "@/types/attendances";
import { fetchToday, checkIn, checkOut } from "@/lib/attendanceApi";

const DAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function ClockSection() {
  const [now, setNow] = useState<Date | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [clocking, setClocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: number; name?: string | null } | null>(null);

  // ハイドレーション対策: クライアント側でのみ時計を起動
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 今日の勤怠・ユーザー情報を取得
  useEffect(() => {
    fetchToday().then(setTodayRecord).catch(() => {});
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  async function handleCheckIn() {
    if (todayRecord?.startTime) { setError("本日の出勤は打刻済みです"); return; }
    setClocking(true); setError(null);
    try {
      setTodayRecord(await checkIn());
    } catch (e) {
      setError(e instanceof Error ? e.message : "出勤打刻に失敗しました");
    } finally { setClocking(false); }
  }

  async function handleCheckOut() {
    if (!todayRecord?.startTime) { setError("出勤打刻がされていません"); return; }
    if (todayRecord?.finishTime) { setError("本日の退勤は打刻済みです"); return; }
    setClocking(true); setError(null);
    try {
      setTodayRecord(await checkOut());
    } catch (e) {
      setError(e instanceof Error ? e.message : "退勤打刻に失敗しました");
    } finally { setClocking(false); }
  }

  const checkedIn  = !!todayRecord?.startTime;
  const checkedOut = !!todayRecord?.finishTime;

  const dateLabel = now
    ? `${now.getMonth() + 1}月${now.getDate()}日（${DAYS[now.getDay()]}）`
    : "";
  const timeLabel = now
    ? `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
    : "--:--:--";

  return (
    <div style={{ fontFamily: '"Noto Sans JP", "Hiragino Sans", sans-serif' }}>

      {/* ユーザー情報バー */}
      <div style={{
        background: "#f5f5f5",
        borderBottom: "1px solid #e8e8e8",
        padding: "0.75rem 1rem",
        textAlign: "center",
        fontSize: "0.9rem",
        color: "#444",
      }}>
        {user ? `${user.id}　${user.name ?? ""}` : "　"}
      </div>

      {/* 時計エリア */}
      <div style={{ textAlign: "center", padding: "3rem 1rem 2.5rem" }}>

        {/* 日付 */}
        <div style={{ fontSize: "1rem", color: "#444", marginBottom: "0.5rem" }}>
          {dateLabel}
        </div>

        {/* 現在時刻 */}
        <div style={{
          fontSize: "3.75rem",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          color: "#111",
          letterSpacing: "0.04em",
          marginBottom: "2.5rem",
          lineHeight: 1.1,
        }}>
          {timeLabel}
        </div>

        {/* 出勤・退勤ボタン */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <ClockButton
            onClick={handleCheckIn}
            disabled={clocking || checkedIn}
            active={!checkedIn}
            color="#4f7ef8"
          >
            {checkedIn ? "出勤済み" : "出勤"}
          </ClockButton>
          <ClockButton
            onClick={handleCheckOut}
            disabled={clocking || !checkedIn || checkedOut}
            active={checkedIn && !checkedOut}
            color="#34c47c"
          >
            {checkedOut ? "退勤済み" : "退勤"}
          </ClockButton>
        </div>

        {error && (
          <p style={{
            marginTop: "1.25rem",
            fontSize: "0.85rem",
            color: "#c0392b",
            background: "#fff5f5",
            display: "inline-block",
            borderRadius: 6,
            padding: "0.4rem 0.75rem",
          }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function ClockButton({
  children,
  onClick,
  disabled,
  active,
  color,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  active: boolean;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 110,
        height: 54,
        fontSize: "1rem",
        fontWeight: 700,
        borderRadius: 8,
        border: "none",
        background: active ? color : "#e0e0e0",
        color: active ? "#fff" : "#999",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.15s",
      }}
    >
      {children}
    </button>
  );
}
