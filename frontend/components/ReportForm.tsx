"use client";

import { useState } from "react";
import { useRouter } from "next/router";

interface Props {
  userId: number;
  employeeName: string;
}

export default function ReportForm({ userId, employeeName }: Props) {
  
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    email: "", password: "", passwordConfirm: "",
    lastName: "", firstName: "",
    lastNameKana: "", firstNameKana: "",
    branch:"", employmentType: "", role: "user",
  })
  const [error, serError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div style={{ padding: "3rem", textAlign: "center", color: "#999", fontSize: "0.875rem" }}>
        読み込み中...
      </div>
  )

}