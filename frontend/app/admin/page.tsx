"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminEmployeeTable from "@/components/AdminEmployeeTable";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") ?? "{}");
      if (user.role !== "admin") router.replace("/attendance");
    } catch {
      router.replace("/login");
    }
  }, [router]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: '"Noto Sans JP", "Hiragino Sans", sans-serif' }}>
      <nav style={{
        background: "#fff", borderBottom: "2px solid #e8e8e8",
        display: "flex", alignItems: "center",
        padding: "0 1rem", height: 52,
      }}>
        <span style={{ fontSize: "1rem", fontWeight: 700, color: "#111" }}>管理者ページ</span>
        <button
          onClick={logout}
          style={{
            marginLeft: "auto", fontSize: "0.8rem", fontWeight: 500,
            color: "#fff", background: "#4f7ef8",
            border: "none", borderRadius: 8,
            padding: "0.35rem 0.85rem", cursor: "pointer",
          }}
        >ログアウト</button>
      </nav>

      <AdminEmployeeTable />
    </div>
  );
}
