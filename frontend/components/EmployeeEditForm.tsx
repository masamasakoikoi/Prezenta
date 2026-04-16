"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

const BRANCHES = ["北海道支店", "仙台支店", "千葉支店", "東京支店", "横浜支店", "名古屋支店", "大阪支店", "広島支店", "福岡支店"];
const EMPLOYMENT_TYPES = ["正社員", "契約社員", "派遣社員", "パート・アルバイト"];

interface Employee {
  id: number;
  email: string;
  lastName: string | null;
  firstName: string | null;
  nameKana: string | null;
  employeeNumber: string | null;
  branch: string | null;
  employmentType: string | null;
  role: "user" | "admin";
}

interface FormState {
  email: string;
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  branch: string;
  employmentType: string;
  role: "user" | "admin";
}

export default function EmployeeEditForm({ id }: { id: number }) {
  const router = useRouter();
  const [form, setForm]     = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [employeeNumber, setEmployeeNumber] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Employee>(`/admin/users/${id}`)
      .then((emp) => {
        const [lastNameKana = "", firstNameKana = ""] = (emp.nameKana ?? "").split(" ");
        setEmployeeNumber(emp.employeeNumber);
        setForm({
          email: emp.email,
          lastName: emp.lastName ?? "",
          firstName: emp.firstName ?? "",
          lastNameKana,
          firstNameKana,
          branch: emp.branch ?? "",
          employmentType: emp.employmentType ?? "",
          role: emp.role,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [id]);

  function set(key: keyof FormState, value: string) {
    setForm((f) => f ? { ...f, [key]: value } : f);
  }

  async function handleSubmit() {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const nameKana = [form.lastNameKana, form.firstNameKana].filter(Boolean).join(" ") || undefined;
      await apiFetch(`/admin/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          lastName: form.lastName || undefined,
          firstName: form.firstName || undefined,
          nameKana,
          branch: form.branch || undefined,
          employmentType: form.employmentType || undefined,
          role: form.role,
        }),
      });
      router.push("/admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: "0.8rem", fontWeight: 600, color: "#555",
    padding: "0.65rem 0.75rem",
    borderRight: "1px solid #eee",
    background: "#fafafa",
    whiteSpace: "nowrap",
    width: 160,
    verticalAlign: "middle",
  };
  const inputStyle: React.CSSProperties = {
    border: "1px solid #d3e2fd", borderRadius: 6,
    padding: "0.35rem 0.55rem", fontSize: "0.875rem",
    color: "#111", width: "100%", boxSizing: "border-box",
  };
  const readonlyStyle: React.CSSProperties = {
    ...inputStyle,
    border: "1px solid #eee", background: "#f9f9f9", color: "#888",
  };
  const selectStyle: React.CSSProperties = {
    ...inputStyle, cursor: "pointer", background: "#fff",
  };
  const cellStyle: React.CSSProperties = {
    padding: "0.65rem 0.75rem", verticalAlign: "middle",
  };

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#999", fontSize: "0.875rem" }}>
        読み込み中...
      </div>
    );
  }

  if (!form) return null;

  const rows: { label: string; content: React.ReactNode }[] = [
    {
      label: "社員番号",
      content: (
        <span style={{ fontSize: "0.875rem", color: "#888", fontVariantNumeric: "tabular-nums" }}>
          {employeeNumber ?? "—"}
        </span>
      ),
    },
    {
      label: "メールアドレス",
      content: <input value={form.email} readOnly style={readonlyStyle} />,
    },
    {
      label: "氏名",
      content: (
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.7rem", color: "#999", marginBottom: 3 }}>姓</div>
            <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} style={inputStyle} placeholder="山田" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.7rem", color: "#999", marginBottom: 3 }}>名</div>
            <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} style={inputStyle} placeholder="太郎" />
          </div>
        </div>
      ),
    },
    {
      label: "氏名（カナ）",
      content: (
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.7rem", color: "#999", marginBottom: 3 }}>セイ</div>
            <input value={form.lastNameKana} onChange={(e) => set("lastNameKana", e.target.value)} style={inputStyle} placeholder="ヤマダ" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.7rem", color: "#999", marginBottom: 3 }}>メイ</div>
            <input value={form.firstNameKana} onChange={(e) => set("firstNameKana", e.target.value)} style={inputStyle} placeholder="タロウ" />
          </div>
        </div>
      ),
    },
    {
      label: "支店",
      content: (
        <select value={form.branch} onChange={(e) => set("branch", e.target.value)} style={{ ...selectStyle, maxWidth: 220 }}>
          <option value="">選択してください</option>
          {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      ),
    },
    {
      label: "雇用形態",
      content: (
        <select value={form.employmentType} onChange={(e) => set("employmentType", e.target.value)} style={{ ...selectStyle, maxWidth: 200 }}>
          <option value="">選択してください</option>
          {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      ),
    },
    {
      label: "権限",
      content: (
        <select value={form.role} onChange={(e) => set("role", e.target.value as "user" | "admin")} style={{ ...selectStyle, maxWidth: 140 }}>
          <option value="user">利用者</option>
          <option value="admin">管理者</option>
        </select>
      ),
    },
  ];

  return (
    <div style={{ padding: "2rem 1.5rem", fontFamily: '"Noto Sans JP", "Hiragino Sans", sans-serif' }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem" }}>
        <button
          onClick={() => router.push("/admin")}
          style={{ background: "none", border: "none", color: "#4f7ef8", fontSize: "0.85rem", cursor: "pointer", padding: 0, marginRight: 12 }}
        >← 一覧に戻る</button>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111", margin: 0 }}>従業員情報変更</h2>
      </div>

      {error && (
        <div style={{ padding: "0.75rem 1rem", background: "#fff5f5", border: "1px solid #fdd", borderRadius: 10, color: "#c0392b", fontSize: "0.875rem", marginBottom: "1rem" }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ border: "1px solid #e0e0e0", borderRadius: 12, overflow: "hidden", maxWidth: 640 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: i < rows.length - 1 ? "1px solid #eee" : "none" }}>
                <td style={labelStyle}>{row.label}</td>
                <td style={cellStyle}>{row.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: "1.5rem" }}>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            fontSize: "0.875rem", fontWeight: 600,
            color: "#fff", background: saving ? "#93aff5" : "#4f7ef8",
            border: "none", borderRadius: 8,
            padding: "0.5rem 1.4rem", cursor: saving ? "not-allowed" : "pointer",
          }}
        >{saving ? "更新中..." : "変更する"}</button>
        <button
          onClick={() => router.push("/admin")}
          disabled={saving}
          style={{
            fontSize: "0.875rem", color: "#555",
            background: "none", border: "1px solid #ddd",
            borderRadius: 8, padding: "0.5rem 1rem", cursor: "pointer",
          }}
        >キャンセル</button>
      </div>
    </div>
  );
}
