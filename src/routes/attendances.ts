import { Router } from "express";
import type { Attendance } from "../types/attendance";
import { prisma } from "../lib/prisma";

const router = Router();

// 仮のDB（メモリ）
const attendances = await prisma.attendance.findMany({
  include: {
    user: true,
  }
})

// const user = await prisma.user.create({
//   data: {
//     email: "test@test.com",
//     password: "123456",
//   }
// })

// const attendance = await prisma.attendance.create({
//   data: {
//     date: "2026-02-02",
//     status: "working",
//     userId: user.id,
//   }
// })

 // 一覧取得
 router.get("/",(req,res) => {
  res.json(attendances);
 })

 router.post("/", async (req, res) => {
  const {userId, date } = req.body;

  const attendace = await prisma.attendance.create({
    data: {
      userId,
      date,
      status:"working"
    },
  });

  res.json(attendace);
});

// await prisma.attendance.findMany({
//   include: {
//     user: true,
//   },
// });

// 出勤
router.post("/start", (req,res) => {
  const { userId, date } = req.body;

  const existing = attendances.find(
    a => a.userId === userId && a.date === date
  );

  if(existing && existing.status !== "not_started") {
    return res.status(400).json({ message:"既に出勤済みです" });
  }

  const attendance: Attendance = {
    userId,
    date,
    status: "working",
    startTime: new Date().toISOString(),
  };

  attendances.push(attendance);
  res.json(attendance);
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
  attendance.finishTime_ = new Date().toISOString();

  res.json(attendance);
});

// 一覧取得
router.get("/", (_req,res) => {
  res.json(attendances);
});

export default router;


