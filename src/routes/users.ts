import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

console.log("users router loaded");

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
    console.log("users router loaded");
    res.status(500).json({ error:"ユーザー作成失敗" });
  }
});


// router.post("/users", async (req, res) => {
//   const { email, password } = req.body;

//   const user = await prisma.user.create({
//     data: {
//       email,
//       password,
//     },
//   });

//   res.json(user);
// });

export default router;