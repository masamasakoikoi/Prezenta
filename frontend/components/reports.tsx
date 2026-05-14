"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function reports() {
  const[modalOpen, setModalOpen] = useState(false);

  // API呼び出し
  async function handleSubmit() {
    await fetch("http://localhost:4000/reports", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type, date, reason }),
    });
  }

   return(
    <>
     {/* ボタン */}
      <button onClick={() => setModalOpen(true)}>申請登録</button>
      {/* モーダル */}
      {modalOpen && (
        <div>
          <select>/* 種別 */</select>
          <input type="date" />
          <textarea />
          <button onClick={handleSubmit}>登録</button>
        </div>
      )}
    </>
   )
  
}

