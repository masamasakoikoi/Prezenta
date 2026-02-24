import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// 仮のDB（メモリ）
const attendances = await prisma.attendance.findMany({
  include: {
    user: true,
  }
})

 // 一覧取得
 router.get("/",(req,res) => {
  res.json(attendances);
 })

 // 出勤登録
 router.post("/start", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const { date, status }= req.body;

    if (!date || !status) {
      return res.status(400).json({ error: "dateとstatusは必須です"});
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        date,
        status,
        startTime: new Date().toISOString(),
      },
      // include: {
      //   user: true,
      // }
    });

    res.json(attendance);
  
  } catch (error) {
    console.error("勤怠登録エラー：", error);
    res.status(500).json({ error: "勤怠登録に失敗しました。" });
  }
});

// 退勤
router.post("/finish", (req,res) => {
  const { userId, date } = req.body;

  const attendance = attendances.find(
    a => a.userId === userId && a.date === date
  );

  if (!attendance || attendance.status !== "working") {
    return res.status(400).json({ message: "退勤できません"});
  }
  attendance.status = "finished";
  attendance.finishTime = new Date().toISOString();

  res.json(attendance);
});

// 一覧取得
router.get("/", (_req,res) => {
  res.json(attendances);
});


export default router;


