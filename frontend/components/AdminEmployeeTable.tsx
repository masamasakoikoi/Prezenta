"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Employee {
  id: number;
  name: string | null;
  lastName: string | null;
  firstName: string | null;
  employeeNumber: string | null;
  email: string;
  branch: string | null;
  employmentType: string | null;
  role: "user" | "admin";
}

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

export default function AdminEmployeeTable() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Employee[]>("/admin/users");
      setEmployees(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: number) {
    if (!window.confirm("このユーザーを削除しますか？出退勤データも全て削除されます。")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  }

  const cellStyle: React.CSSProperties = { padding: "0.7rem 0.75rem", fontSize: "0.875rem" };

  return (
    <div style={{ padding: "2rem 1.5rem", fontFamily: '"Noto Sans JP", "Hiragino Sans", sans-serif' }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111", margin: 0 }}>
          従業員一覧
        </h2>
        <button
          onClick={() => router.push("/admin/register")}
          style={{
            marginLeft: "auto", fontSize: "0.8rem", fontWeight: 600,
            color: "#fff", background: "#4f7ef8",
            border: "none", borderRadius: 8,
            padding: "0.4rem 0.9rem", cursor: "pointer",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#3a6ae8"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#4f7ef8"; }}
        >+ 従業員登録</button>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.75rem 1rem", background: "#fff5f5", border: "1px solid #fdd", borderRadius: 10, color: "#c0392b", fontSize: "0.875rem", marginBottom: "1rem" }}>
          <span>⚠ {error}</span>
          <button onClick={load} style={{ background: "none", border: "1px solid #c0392b", borderRadius: 6, color: "#c0392b", padding: "0.2rem 0.6rem", fontSize: "0.8rem", cursor: "pointer" }}>再読み込み</button>
        </div>
      )}

      <div style={{ border: "1px solid #16161629", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid #eee" }}>
              {["社員番号", "氏名", "支店", "雇用形態", "メールアドレス", "権限", ""].map((h, i) => (
                <th key={i} style={{
                  padding: "0.6rem 0.75rem", textAlign: "left",
                  fontSize: "0.72rem", fontWeight: 600, color: "#999",
                  letterSpacing: "0.04em", whiteSpace: "nowrap",
                  width: i === 0 ? 80 : i === 5 ? 100 : i === 6 ? 100 : undefined,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td colSpan={7} style={{ padding: "0.65rem 0.75rem" }}>
                      <div style={{ height: 18, borderRadius: 4, background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
                    </td>
                  </tr>
                ))
              : employees.map((emp) => {
                  const fullName = [emp.lastName, emp.firstName].filter(Boolean).join(" ") || emp.name;
                  return (
                    <tr key={emp.id} style={{ borderBottom: "1px solid #f0f0f0" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#fafafa"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                    >
                      <td style={{ ...cellStyle, color: "#888", fontVariantNumeric: "tabular-nums" }}>
                        {emp.employeeNumber ?? String(emp.id).padStart(4, "0")}
                      </td>
                      <td style={cellStyle}>
                        <span
                          onClick={() => router.push(`/admin/attendance/${emp.id}`)}
                          style={{ fontWeight: 500, color: "#4f7ef8", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}
                        >{fullName ?? <span style={{ color: "#bbb" }}>—</span>}</span>
                      </td>
                      <td style={{ ...cellStyle, color: "#555" }}>
                        {emp.branch ?? <span style={{ color: "#bbb" }}>—</span>}
                      </td>
                      <td style={{ ...cellStyle, color: "#555" }}>
                        {emp.employmentType ?? <span style={{ color: "#bbb" }}>—</span>}
                      </td>
                      <td style={{ ...cellStyle, color: "#555" }}>
                        {emp.email}
                      </td>
                      <td style={cellStyle}>
                        <RoleBadge role={emp.role} />
                      </td>
                      <td style={{ ...cellStyle, textAlign: "center", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                          <button
                            onClick={() => router.push(`/admin/edit/${emp.id}`)}
                            style={{ fontSize: "0.72rem", fontWeight: 500, color: "#4f7ef8", background: "none", border: "1px solid #d3e2fd", borderRadius: 6, padding: "0.25rem 0.6rem", cursor: "pointer" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#eef3ff"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                          >編集</button>
                          <button
                            onClick={() => handleDelete(emp.id)}
                            disabled={deletingId === emp.id}
                            style={{ fontSize: "0.72rem", fontWeight: 500, color: "#c0392b", background: "none", border: "1px solid #fdd", borderRadius: 6, padding: "0.25rem 0.6rem", cursor: deletingId === emp.id ? "not-allowed" : "pointer" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff5f5"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                          >{deletingId === emp.id ? "削除中" : "削除"}</button>
                        </div>
                      </td>
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

function RoleBadge({ role }: { role: "user" | "admin" }) {
  const isAdmin = role === "admin";
  return (
    <span style={{
      display: "inline-block", fontSize: "0.72rem", fontWeight: 600,
      color: isAdmin ? "#1e7f4e" : "#555",
      background: isAdmin ? "#edfff4" : "#f5f5f5",
      borderRadius: 6, padding: "0.2rem 0.55rem", whiteSpace: "nowrap",
    }}>
      {isAdmin ? "管理者" : "利用者"}
    </span>
  );
}
