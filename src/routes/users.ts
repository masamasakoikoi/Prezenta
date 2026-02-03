import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.post("/", async (req,res) => {
  const { email,password} = req.body;

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password,
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error:"ユーザー作成失敗" });
  }
});

export default router;