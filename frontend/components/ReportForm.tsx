"use client";

import { useState } from "react";
import { useRouter } from "next/router";

interface Props {
  userId: number;
  employeeName: string;
}

export default function ReportForm({ userId, employeeName }: Props) {
  
  const rows: { label: string; content: React.ReactNode }[] = [
    {
      label: "氏名",
      content: (
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            {employeeName}
          </div>
        </div>
      ),
    },
  ]






}