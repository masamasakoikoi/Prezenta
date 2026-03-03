import { Router } from "express";
import { prisma } from "../lib/prisma";
import jwt from "jsonwebtoken";
import { error } from "console";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: "emailとpasswordは必須です"});
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if(!user || user.password !== password) {
    return res.status(401).json({ error: "認証失敗" });
  }

  const token = jwt.sign(
    {userId: user.id },
    process.env.JWT_SECRET ?? "dev_secret_change_me",
    { expiresIn: "7d" }
  );
  return res.json({ 
    token,
    user: { id: user.id, email: user.email, name: user.name }
   })

});

export default router;
