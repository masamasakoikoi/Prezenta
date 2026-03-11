    import { Router } from "express";
    import { prisma } from "../lib/prisma";
    import { authMiddleware } from "../middleware/authMiddleware";
    import { Prisma } from "../generated/prisma";

    const router = Router();

    router.use(authMiddleware);

    // 出勤
    router.post("/start", async (req, res) => {
      const userId = req.userId;
      const { date } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      if (!date) {
        return res.status(400).json({ message: "date は必須です" });
      }

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

      if (!userId) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      if (!date) {
        return res.status(400).json({ message: "date は必須です" });
      }

      try {
        const attendance = await prisma.attendance.findUnique({
          where: {
            userId_date: {
              userId,
              date,
            },
          },
        });

        if (!attendance || attendance.status !== "working") {
          return res.status(400).json({ message: "退勤できません" });
        }

        const updated = await prisma.attendance.update({
          where: {
            id: attendance.id,
          },
          data: {
            status: "finished",
            finishTime: new Date().toISOString(),
          },
        });

        return res.json(updated);
      } catch {
        return res.status(500).json({ message: "DBエラー" });
      }
    });

    // 一覧取得（自分の勤怠だけ）
    router.get("/", async (req, res) => {
      const userId = req.userId;

      if (!userId) {1
    return res.status(401).json({ message: "認証が必要です" });
  }

  try {
    const attendances = await prisma.attendance.findMany({
      where: { userId },
      orderBy: {
        date: "desc",
      },
    });

    return res.json(attendances);
  } catch {
    return res.status(500).json({ message: "DBエラー" });
  }
});

export default router;