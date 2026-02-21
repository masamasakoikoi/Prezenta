import { Router } from "express";
import { prisma } from "../lib/prisma";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if(!user || user.password !== password) {
    return res.status(401).json({ error: "認証失敗" });
  }
  res.json(user);


  const token = jwt.sign(
    {userId: user.id },
    "secret"
  );
  res.json({ token })

});

export default router;
