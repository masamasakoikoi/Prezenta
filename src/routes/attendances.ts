import express from "express";
const { Router } = express;
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/authMiddleware";
import { Prisma } from "../generated/prisma";

const router = Router();

router.use(authMiddleware);

// 出勤
router.post("/start", async (req, res) => {
  const userId = req.userId;
  const { date } = req.body;

  if (!userId) return res.status(401).json({ message: "認証が必要です" });
  if (!date) return res.status(400).json({ message: "date は必須です" });

  try {
    const attendance = await prisma.attendance.create({
      data: {
        userId,
        date,
        status: "working",
        startTime: new Date().toISOString(),
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
  const { date } = req.body;

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
      data: { status: "finished", finishTime: new Date().toISOString() },
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
  const { checkIn, checkOut, comment } = req.body as {
    checkIn:  string | null;
    checkOut: string | null;
    comment:  string;
  };

  const timePattern = /^\d{2}:\d{2}$/;
  if (checkIn  && !timePattern.test(checkIn))  return res.status(400).json({ message: "checkIn の形式が不正 (HH:MM)" });
  if (checkOut && !timePattern.test(checkOut)) return res.status(400).json({ message: "checkOut の形式が不正 (HH:MM)" });

  try {
    await prisma.attendance.upsert({
      where: { userId_date: { userId, date } },
      update: { checkIn: checkIn ?? null, checkOut: checkOut ?? null, comment: comment ?? "" },
      create: { userId, date, checkIn: checkIn ?? null, checkOut: checkOut ?? null, comment: comment ?? "" },
    });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "サーバーエラー" });
  }
});

export default router;