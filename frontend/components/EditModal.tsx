"use client";

import { useState, useEffect, useRef } from "react";
import type { AttendanceRecord, UpdateAttendancePayload } from "@/types/attendance";
import { parseDate } from "@/lib/dateUtils";

interface Props {
  record: AttendanceRecord | null;
  onClose: () => void;
  onSave: (date: string, payload: UpdateAttendancePayload) => Promise<void>;
}

export default function EditModal({ record, onClose, onSave }: Props) {
  const [checkIn, setCheckIn]   = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [comment, setComment]   = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const firstInputRef           = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (record) {
      setCheckIn(record.checkIn ?? "");
      setCheckOut(record.checkOut ?? "");
      setComment(record.comment ?? "");
      setError(null);
      // モーダルが開いたら最初の入力にフォーカス
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
    setSaving(true);
    setError(null);
    try {
      await onSave(record.date, {
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        comment,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
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
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {(["checkIn", "checkOut"] as const).map((field) => (
            <label key={field} style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#666" }}>
                {field === "checkIn" ? "出勤時間" : "退勤時間"}
              </span>
              <input
                ref={field === "checkIn" ? firstInputRef : undefined}
                type="time"
                value={field === "checkIn" ? checkIn : checkOut}
                onChange={(e) => field === "checkIn" ? setCheckIn(e.target.value) : setCheckOut(e.target.value)}
                style={{
                  border: "1px solid #e0e0e0", borderRadius: 8,
                  padding: "0.5rem 0.75rem", fontSize: "0.9rem",
                  color: "#111", outline: "none", width: "100%",
                }}
              />
            </label>
          ))}

          <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#666" }}>コメント</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="備考・メモなど"
              rows={3}
              style={{
                border: "1px solid #e0e0e0", borderRadius: 8,
                padding: "0.5rem 0.75rem", fontSize: "0.9rem",
                color: "#111", outline: "none", resize: "vertical",
                fontFamily: "inherit", width: "100%",
              }}
            />
          </label>
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
