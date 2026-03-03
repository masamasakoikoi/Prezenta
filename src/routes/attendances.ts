import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.use(authMiddleware);

// 出勤登録
router.post("/start", async (req, res) => {
    const userId = req.userId;
    const { date } = (req.body ?? {}) as { date?: string };

    if(!userId) return res.status(401).json({ message: "認証が必要です"});
    if(!date) return res.status(400).json({ message: "dateは必須です"});

    try {
      const existing = await prisma.attendance.findFirst({
        where: { userId, date },
      });

      if( existing && existing.status === "working") {
        return res.status(400).json({ message: "すでに出勤済みです"});
      }
      if( existing && existing.status === "finished") {
        return res.status(400).json({ message: "本日はすでに退勤済みです"});
      }

      const attendance = await prisma.attendance.create({
        data: {
          userId,
          date,
          status: "working",
          startTime: new Date().toISOString(),
        },
      });

      return res.json(attendance);

    } catch (e: any) {
      return res.status(500).json({ message: "DBエラー" });
    }
});

// 退勤
router.post("/finish", async (req, res) => {
  const userId = req.userId;
  const { date }= req.body;

  if(!userId) return res.status(401).json({ message: "認証が必要です"});
  if(!date) return res.status(400).json({ message: "dateは必須です"});

  const attendance = await prisma.attendance.findFirst({
    where: { userId, date },
    orderBy: { id: "desc" },
  });

  if (!attendance || attendance.status !== "working") {
    return res.status(400).json({ message: "退勤できません"});
  }

  const updated = await prisma.attendance.update({
    where: { id: attendance.id },
    date: {
      status: "finished",
      finishTime: new Date().toISOString(),
    },
  });

  return res.json(updated);
});

// 一覧取得
router.get("/", async (req,res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "認証が必要です" });

  const list = await prisma.attendance.findMany({
    where: { userId },
    orderBy: [{ date:"desc" }, {id: "desc"}],
  });
  
  return res.json(list);
 });

 export default router;

// // 仮のDB（メモリ）
// const attendances = await prisma.attendance.findMany({
//   include: {
//     user: true,
//   }
// })





