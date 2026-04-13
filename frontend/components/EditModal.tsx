"use client";

import { useState, useEffect, useRef } from "react";
import type { AttendanceRecord, UpdateAttendancePayload } from "@/types/attendances";
import { parseDate } from "@/lib/dateUtils";

interface Props {
  record: AttendanceRecord | null;
  onClose: () => void;
  onSave: (date: string, payload: UpdateAttendancePayload) => Promise<void>;
}

export default function EditModal({ record, onClose, onSave }: Props) {
  // const [startTime, setstartTime]   = useState("");
  // const [finishTime, setfinishTime] = useState("");
  const [startH, setStartH] = useState("");
  const [startM, setStartM] = useState("");
  const [finishH, setFinishH] = useState("");
  const [finishM, setFinishM] = useState("");
  const [isNextDay, setIsNextDay] = useState(false);
  const [comment, setComment]   = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const firstInputRef           = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (record) {
      const [sh, sm] = (record.startTime ?? "").split(":");
      const [fh, fm] = (record.finishTime ?? "").split(":");
      setStartH(sh ?? "");
      setStartM(sm ?? "");
      setFinishH(fh ?? "");
      setFinishM(fm ?? "");
      setIsNextDay(false);
      setError(null);
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [record]);

  // Escキーで閉じる
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!record) return null;

  const { month, day, dayOfWeek } = parseDate(record.date);

  async function handleSave() {
    if (!record) return;
  
    const startTime  = startH && startM   ? `${startH}:${startM}`   : null;
    const finishTime = finishH && finishM ? `${finishH}:${finishM}` : null;
  
    // 両方入力されている場合のみ時刻チェック
    if (startTime && finishTime && !isNextDay) {
      const [sh, sm] = startTime.split(":").map(Number);
      const [fh, fm] = finishTime.split(":").map(Number);
      if (fh * 60 + fm <= sh * 60 + sm) {
        setError("退勤時間は出勤時間より後の時刻を入力してください");
        return;
      }
    }
  
    setSaving(true);
    setError(null);
    try {
      await onSave(record.date, {
        startTime,
        finishTime,
        comment,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  function TimeSelect({
    value,
    onChange,
    options,
    nextDay,
    onNextDayChange,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: string[];
    nextDay?: boolean;
    onNextDayChange?: (v: boolean) => void;
  }) {
    return (
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {nextDay !== undefined && (
          <span
            onClick={() => onNextDayChange?.(!nextDay)}
            style={{
              position: "absolute", top: -24, left: 0,
              fontSize: "0.75rem", color: nextDay ? "#4f7ef8" : "#666666",
              cursor: "pointer", whiteSpace: "nowrap", userSelect: "none",
            }}
          >退勤</span>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            border: "1px solid #e0e0e0", borderRadius: 8,
            padding: "0.45rem 0.5rem", fontSize: "0.9rem",
            color: "#111", background: "#fff",
            outline: "none", cursor: "pointer",
            appearance: "none", textAlign: "center",
            width: 58,
          }}
        >
          <option value="">--</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50, padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 14,
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        width: "100%", maxWidth: 360, padding: "1.5rem",
      }}>
        {/* ヘッダー */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111" }}>
            {month}/{String(day).padStart(2, "0")}（{dayOfWeek}）を編集
          </span>
          <button
            onClick={onClose}
            aria-label="閉じる"
            style={{ background: "none", border: "none", fontSize: "1rem", color: "#888", cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}
          >✕</button>
        </div>

        {/* フォーム */}
        {/* 出退勤 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#666" }}>出勤</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* 出勤 時 */}
            <TimeSelect
              value={startH}
              onChange={setStartH}
              options={Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))}
            />
            <span style={{ color: "#888" }}>:</span>
            {/* 出勤 分 */}
            <TimeSelect
              value={startM}
              onChange={setStartM}
              options={Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))}
            />
            <span style={{ color: "#aaa", margin: "0 4px" }}>〜</span>
            {/* 退勤 時（翌日含む） */}
            <TimeSelect
              value={finishH}
              onChange={setFinishH}
              options={Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))}
              nextDay={isNextDay}
              onNextDayChange={setIsNextDay}
            />
            <span style={{ color: "#888" }}>:</span>
            {/* 退勤 分 */}
            <TimeSelect
              value={finishM}
              onChange={setFinishM}
              options={Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))}
            />
          </div>
        </div>

        {/* エラー */}
        {error && (
          <p style={{
            marginTop: "0.75rem", fontSize: "0.8rem", color: "#c0392b",
            background: "#fff5f5", borderRadius: 6, padding: "0.4rem 0.6rem",
          }}>{error}</p>
        )}

        {/* アクション */}
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              background: "none", border: "1px solid #e0e0e0",
              borderRadius: 8, padding: "0.45rem 1rem",
              fontSize: "0.875rem", color: "#555", cursor: "pointer",
            }}
          >キャンセル</button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? "#93aff5" : "#4f7ef8",
              border: "none", borderRadius: 8,
              padding: "0.45rem 1.25rem", fontSize: "0.875rem",
              fontWeight: 600, color: "#fff", cursor: saving ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >{saving ? "保存中..." : "保存"}</button>
        </div>
      </div>
    </div>
  );
}
