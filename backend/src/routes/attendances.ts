import express from "express";
const { Router } = express;
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/authMiddleware";
import { Prisma } from "../generated/prisma";

const router = Router();

const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

router.use(authMiddleware);

// 出勤
router.post("/start", async (req, res) => {
  const userId = req.userId;
  const { date, location: startLocation } = req.body;

  if (!userId) return res.status(401).json({ message: "認証が必要です" });
  if (!date) return res.status(400).json({ message: "date は必須です" });

  try {
    const attendance = await prisma.attendance.create({
      data: {
        userId,
        date,
        status: "working",
        startTime: nowHHMM(),
        location: startLocation ?? null,
      },
    });
    return res.json(attendance);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(400).json({ message: "すでに出勤済みです" });
    }
    return res.status(500).json({ message: "DBエラー" });
  }
});

// 退勤
router.post("/finish", async (req, res) => {
  const userId = req.userId;
  const { date, location: finishLocation } = req.body;

  if (!userId) return res.status(401).json({ message: "認証が必要です" });
  if (!date) return res.status(400).json({ message: "date は必須です" });

  try {
    const attendance = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date } },
    });

    if (!attendance || attendance.status !== "working") {
      return res.status(400).json({ message: "退勤できません" });
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { status: "finished", finishTime: nowHHMM(), ...(finishLocation != null ? { location: finishLocation } : {}) },
    });
    return res.json(updated);
  } catch {
    return res.status(500).json({ message: "DBエラー" });
  }
});

// 今日の勤怠
router.get("/today", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "認証が必要です" });

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  try {
    const attendance = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    return res.json(attendance);
  } catch {
    return res.status(500).json({ message: "DBエラー" });
  }
});

// 月別一覧
router.get("/", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "認証が必要です" });

  const year  = Number(req.query.year);
  const month = Number(req.query.month);

  // year・month がない場合は全件返す（既存の挙動を維持）
  if (!year || !month) {
    try {
      const attendances = await prisma.attendance.findMany({
        where: { userId },
        orderBy: { date: "desc" },
      });
      return res.json(attendances);
    } catch {
      return res.status(500).json({ message: "DBエラー" });
    }
  }

  // year・month がある場合は月別フィルタ
  const pad = (n: number) => String(n).padStart(2, "0");
  const startDate = `${year}-${pad(month)}-01`;
  const endDate   = `${year}-${pad(month)}-${new Date(year, month, 0).getDate()}`;

  try {
    const records = await prisma.attendance.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: "asc" },
    });

    return res.json({ year, month, records });
  } catch {
    return res.status(500).json({ message: "DBエラー" });
  }
});

// 勤務時間編集
router.put("/:date", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "認証が必要です" });

  const { date } = req.params;
  const { startTime, finishTime, comment } = req.body as {
    startTime:  string | null;
    finishTime: string | null;
    comment:  string;
  };

  const timePattern = /^\d{2}:\d{2}$/;
  if (startTime  && !timePattern.test(startTime))  return res.status(400).json({ message: "startTime の形式が不正 (HH:MM)" });
  if (finishTime && !timePattern.test(finishTime)) return res.status(400).json({ message: "finishTime の形式が不正 (HH:MM)" });

  try {
     // 申請中・承認済みは編集不可
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date } },
    });
    if (existing && (existing.approvalStatus === "pending" || existing.approvalStatus === "approved")) {
      return res.status(403).json({ message: "申請中または承認済みのため編集できません" });
    }
    await prisma.attendance.upsert({
      where: { userId_date: { userId, date } },
      update: { startTime: startTime ?? null, finishTime: finishTime ?? null, comment: comment ?? "", status: "edited", approvalStatus: null },
      create: { userId, date, startTime: startTime ?? null, finishTime: finishTime ?? null, comment: comment ?? "", status: "edited", approvalStatus: null },
    });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "サーバーエラー" });
  }
});

// 申請
router.post("/:date/apply", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "認証が必要です" });

  const { date } = req.params;

  try {
    const attendance = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date } },
    });

    if (!attendance) return res.status(404).json({ message: "勤怠が見つかりません" });
    if (attendance.approvalStatus === "pending")  return res.status(400).json({ message: "既に申請中です" });
    if (attendance.approvalStatus === "approved") return res.status(400).json({ message: "既に承認済みです" });

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { approvalStatus: "pending" },
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "サーバーエラー" });
  }
});

// 申請取消
router.post("/:date/cancel-application", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "認証が必要です" });

  const { date } = req.params;

  try {
    const attendance = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date } },
    });

    if (!attendance) return res.status(404).json({ message: "勤怠が見つかりません" });
    if (attendance.approvalStatus === "approved") return res.status(400).json({ message: "承認済みのため取り消しできません" });

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { approvalStatus: "cancelled" },
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "サーバーエラー" });
  }
});

export default router;