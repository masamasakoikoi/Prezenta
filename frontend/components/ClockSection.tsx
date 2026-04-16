"use client";

import { useState, useEffect } from "react";
import type { AttendanceRecord } from "@/types/attendances";
import { fetchToday, checkIn, checkOut } from "@/lib/attendanceApi";
import { JP_DAYS } from "@/lib/dateUtils";

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ja`;
  const res = await fetch(url, { headers: { "Accept-Language": "ja" } });
  const data = await res.json();
  const addr = data.address ?? {};
  return [
    addr.state,
    addr.city ?? addr.town ?? addr.village ?? addr.county,
  ].filter(Boolean).join("");
}

export default function ClockSection() {
  const [now, setNow] = useState<Date | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [clocking, setClocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: number; name?: string | null; lastName?: string | null; firstName?: string | null } | null>(null);
  const [locationModal, setLocationModal] = useState<{ action: "in" | "out" } | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchToday().then(setTodayRecord).catch(() => {});
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  async function executeClock(action: "in" | "out", location?: string) {
    setLocationModal(null);
    setClocking(true);
    setError(null);
    try {
      setTodayRecord(action === "in" ? await checkIn(location) : await checkOut(location));
    } catch (e) {
      setError(e instanceof Error ? e.message : (action === "in" ? "出勤打刻に失敗しました" : "退勤打刻に失敗しました"));
    } finally {
      setClocking(false);
    }
  }

  async function handleLocationYes() {
    if (!locationModal) return;
    const action = locationModal.action;
    setLocating(true);
    let location: string | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      );
      location = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
    } catch {
      // 取得失敗しても打刻は続行
    } finally {
      setLocating(false);
    }
    await executeClock(action, location);
  }

  function handleCheckIn() {
    if (todayRecord?.startTime) { setError("本日の出勤は打刻済みです"); return; }
    setLocationModal({ action: "in" });
  }

  function handleCheckOut() {
    if (!todayRecord?.startTime) { setError("出勤打刻がされていません"); return; }
    if (todayRecord?.finishTime) { setError("本日の退勤は打刻済みです"); return; }
    setLocationModal({ action: "out" });
  }

  const checkedIn  = !!todayRecord?.startTime;
  const checkedOut = !!todayRecord?.finishTime;

  const dateLabel = now
    ? `${now.getMonth() + 1}月${now.getDate()}日（${JP_DAYS[now.getDay()]}）`
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
        fontSize: "1.05rem",
        fontWeight: 600,
        color: "#222",
      }}>
        {user
          ? ([user.lastName, user.firstName].filter(Boolean).join(" ") || user.name || "")
          : "　"}
      </div>

      {/* 時計エリア */}
      <div style={{ textAlign: "center", padding: "3rem 1rem 2.5rem" }}>
        <div style={{ fontSize: "1rem", color: "#444", marginBottom: "0.5rem" }}>
          {dateLabel}
        </div>
        <div style={{
          fontSize: "3.75rem", fontWeight: 700,
          fontVariantNumeric: "tabular-nums", color: "#111",
          letterSpacing: "0.04em", marginBottom: "2.5rem", lineHeight: 1.1,
        }}>
          {timeLabel}
        </div>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <ClockButton onClick={handleCheckIn} disabled={clocking || checkedIn} active={!checkedIn} color="#4f7ef8">
            {checkedIn ? "出勤済み" : "出勤"}
          </ClockButton>
          <ClockButton onClick={handleCheckOut} disabled={clocking || !checkedIn || checkedOut} active={checkedIn && !checkedOut} color="#34c47c">
            {checkedOut ? "退勤済み" : "退勤"}
          </ClockButton>
        </div>
        {error && (
          <p style={{
            marginTop: "1.25rem", fontSize: "0.85rem", color: "#c0392b",
            background: "#fff5f5", display: "inline-block",
            borderRadius: 6, padding: "0.4rem 0.75rem",
          }}>
            {error}
          </p>
        )}
      </div>

      {/* 位置情報確認モーダル */}
      {locationModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 50, padding: "1rem",
        }}>
          <div style={{
            background: "#fff", borderRadius: 14,
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            width: "100%", maxWidth: 320, padding: "1.5rem", textAlign: "center",
          }}>
            <div style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>📍</div>
            <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111", marginBottom: "0.5rem" }}>
              位置情報を記録しますか？
            </p>
            <p style={{ fontSize: "0.8rem", color: "#888", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              都道府県・市区町村を{locationModal.action === "in" ? "出勤" : "退勤"}記録に保存します。
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                onClick={() => executeClock(locationModal.action)}
                disabled={locating}
                style={{
                  flex: 1, padding: "0.55rem 0",
                  border: "1px solid #e0e0e0", borderRadius: 8,
                  background: "none", fontSize: "0.9rem",
                  color: "#555", cursor: locating ? "not-allowed" : "pointer",
                }}
              >
                いいえ
              </button>
              <button
                onClick={handleLocationYes}
                disabled={locating}
                style={{
                  flex: 1, padding: "0.55rem 0",
                  border: "none", borderRadius: 8,
                  background: locating ? "#93aff5" : "#4f7ef8", fontSize: "0.9rem",
                  fontWeight: 600, color: "#fff", cursor: locating ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                {locating ? "取得中..." : "はい"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClockButton({ children, onClick, disabled, active, color }: {
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
        width: 110, height: 54, fontSize: "1rem", fontWeight: 700,
        borderRadius: 8, border: "none",
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
