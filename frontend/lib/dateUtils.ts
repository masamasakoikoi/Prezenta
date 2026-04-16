export const JP_DAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function parseDate(dateStr: string) {
  // "2025-03-05T00:00:00" のようなISO文字列にも対応
  const d = new Date(dateStr.slice(0, 10) + "T00:00:00");
  return {
    month: d.getMonth() + 1,
    day: d.getDate(),
    dayOfWeek: JP_DAYS[d.getDay()],
    dayOfWeekIndex: d.getDay(), // 0=日, 6=土
  };
}

/** "09:00", "18:30" → { display: "08:15", totalMinutes: 495 }（休憩1h差し引き） */
export function calcWorkTime(
  startTime: string | null,
  finishTime: string | null
): { display: string; totalMinutes: number } | null {
  if (!startTime || !finishTime) return null;
  const [ih, im] = startTime.split(":").map(Number);
  const [oh, om] = finishTime.split(":").map(Number);
  const total = oh * 60 + om - (ih * 60 + im); // 休憩60分
  if (total <= 0) return null;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return {
    display: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    totalMinutes: total,
  };
}

/** その月の全日付(YYYY-MM-DD)を返す */
export function getDaysInMonth(year: number, month: number): string[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  });
}

export function formatMonthLabel(year: number, month: number) {
  return `${year}年${month}月`;
}

/** "2026-04-11T13:46:01.906Z" → "13:46" */
export function formatTimeFromISO(isoString: string | null): string | null {
  if (!isoString) return null;
  // すでに "HH:MM" 形式の場合はそのまま返す
  if (/^\d{2}:\d{2}$/.test(isoString)) return isoString;
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}