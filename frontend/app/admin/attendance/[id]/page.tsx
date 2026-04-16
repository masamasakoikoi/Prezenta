"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminAttendanceTable from "@/components/AdminAttendanceTable";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function fetchEmployee(id: number): Promise<{ name: string | null; lastName: string | null; firstName: string | null }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_BASE}/admin/users/${id}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error("取得失敗");
  return res.json();
}

export default function AdminAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [employeeName, setEmployeeName] = useState("...");

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") ?? "{}");
      if (user.role !== "admin") { router.replace("/attendance"); return; }
    } catch {
      router.replace("/login"); return;
    }

    fetchEmployee(Number(id)).then((emp) => {
      const full = [emp.lastName, emp.firstName].filter(Boolean).join(" ") || emp.name || "従業員";
      setEmployeeName(full);
    }).catch(() => setEmployeeName("従業員"));
  }, [id, router]);

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: '"Noto Sans JP", "Hiragino Sans", sans-serif' }}>
      <nav style={{
        background: "#fff", borderBottom: "2px solid #e8e8e8",
        display: "flex", alignItems: "center",
        padding: "0 1rem", height: 52,
      }}>
        <button
          onClick={() => router.push("/admin")}
          style={{ background: "none", border: "none", color: "#4f7ef8", fontSize: "0.85rem", cursor: "pointer", marginRight: 12 }}
        >← 一覧に戻る</button>
        <span style={{ fontSize: "1rem", fontWeight: 700, color: "#111" }}>管理者ページ</span>
        <button
          onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/login"; }}
          style={{ marginLeft: "auto", fontSize: "0.8rem", fontWeight: 500, color: "#fff", background: "#4f7ef8", border: "none", borderRadius: 8, padding: "0.35rem 0.85rem", cursor: "pointer" }}
        >ログアウト</button>
      </nav>

      <AdminAttendanceTable userId={Number(id)} employeeName={employeeName} />
    </div>
  );
}
