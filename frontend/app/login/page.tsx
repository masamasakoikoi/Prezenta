"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "ログインに失敗しました");
      }

      const { token, user } = await res.json();
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      router.push("/attendance");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: '"Noto Sans JP", "Hiragino Sans", sans-serif',
      background: "#f5f5f5",
    }}>
      <div style={{
        background: "#fff", borderRadius: 14,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        padding: "2rem", width: "100%", maxWidth: 360,
      }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "#111" }}>
          ログイン
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#666" }}>メールアドレス</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: "0.5rem 0.75rem", fontSize: "0.9rem", color: "black" }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#666" }}>パスワード</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: "0.5rem 0.75rem", fontSize: "0.9rem",color: "black" }}
            />
          </label>
        </div>

        {error && (
          <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#c0392b", background: "#fff5f5", borderRadius: 6, padding: "0.4rem 0.6rem" }}>
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            marginTop: "1.25rem", width: "100%",
            background: loading ? "#93aff5" : "#4f7ef8",
            border: "none", borderRadius: 8,
            padding: "0.6rem", fontSize: "0.95rem",
            fontWeight: 600, color: "#fff", cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </div>
    </div>
  );
}