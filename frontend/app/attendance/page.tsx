"use client";

import { useState } from "react";
import ClockSection from "@/components/ClockSection";
import AttendanceTable from "@/components/AttendanceTable";
import Reports from "@/components/reports";

type Tab = "clock" | "attendance" | "report";

function ClockIcon({ active }: { active: boolean }) {
  const c = active ? "#fff" : "#888";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  const c = active ? "#fff" : "#888";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <text x="12" y="20" textAnchor="middle" fontSize="7" fill={c} stroke="none" fontWeight="bold">31</text>
    </svg>
  );
}

function DocumentIcon({ active }: { active: boolean }) {
  const c = active ? "#fff" : "#888";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="12" x2="12" y2="17" />
      <line x1="9.5" y1="14.5" x2="14.5" y2="14.5" />
    </svg>
  );
}

const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ active: boolean }> }[] = [
  { id: "clock",      label: "打刻",     Icon: ClockIcon },
  { id: "attendance", label: "日次勤怠", Icon: CalendarIcon },
  { id: "report",     label: "届出",     Icon: DocumentIcon },
];

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<Tab>("clock");

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: '"Noto Sans JP", "Hiragino Sans", sans-serif' }}>

      {/* ── タブナビゲーション ── */}
      <nav style={{
        background: "#fff",
        borderBottom: "2px solid #e8e8e8",
        display: "flex",
        alignItems: "stretch",
        paddingLeft: "0.5rem",
        paddingRight: "1rem",
      }}>
        <div style={{ display: "flex" }}>
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  padding: "0.6rem 1.1rem",
                  minWidth: 72,
                  border: "none",
                  borderBottom: active ? "2px solid transparent" : "2px solid transparent",
                  cursor: "pointer",
                  background: active ? "#4f7ef8" : "transparent",
                  color: active ? "#fff" : "#888",
                  fontSize: "0.72rem",
                  fontWeight: active ? 700 : 400,
                  marginBottom: active ? -2 : 0,
                  transition: "background 0.15s",
                }}
              >
                <Icon active={active} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
          <button
            onClick={logout}
            style={{
              fontSize: "0.8rem", fontWeight: 500,
              color: "#fff", background: "#4f7ef8",
              border: "none", borderRadius: 8,
              padding: "0.35rem 0.85rem", cursor: "pointer",
            }}
          >ログアウト</button>
        </div>
      </nav>

      {/* ── コンテンツ ── */}
      {activeTab === "clock"      && <ClockSection />}
      {activeTab === "attendance" && <AttendanceTable />}
      {activeTab === "report"     && (
        <button
            style={{
              fontSize: "0.8rem", fontWeight: 500,
              color: "#fff", background: "#4f7ef8",
              border: "none", borderRadius: 8,
              padding: "0.35rem 0.85rem", cursor: "pointer",
            }}
          ><Reports /></button>
      )}
    </div>
  );
}
