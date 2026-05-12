import express from "express";
const { Router } = express;
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();
router.use(authMiddleware);

// 届出登録
router.post("/", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "認証が必要です" });

  const { type, date, reason } = req.body;
  if (!type || !date) return res.status(400).json({ message: "種別と日付は必須です" });

  try {
    const report = await prisma.report.create({
      data: { userId, type, date, reason: reason ?? null },
    });
    return res.status(201).json(report);
  } catch {
    return res.status(500).json({ message: "DBエラー" });
  }
});

// 届出一覧取得
router.get("/", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "認証が必要です" });

  try {
    const reports = await prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return res.json(reports);
  } catch {
    return res.status(500).json({ message: "DBエラー" });
  }
});

export default router;