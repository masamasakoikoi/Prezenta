import express from "express";
const { Router } = express;
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";

const router = Router();
router.use(authMiddleware);
router.use(adminMiddleware);

// 従業員一覧
router.get("/users", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        lastName: true,
        firstName: true,
        employeeNumber: true,
        email: true,
        branch: true,
        employmentType: true,
        role: true,
      },
      orderBy: { id: "asc" },
    });
    return res.json(users);
  } catch {
    return res.status(500).json({ error: "DBエラー" });
  }
});

// 従業員詳細
router.get("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, lastName: true, firstName: true, nameKana: true, employeeNumber: true, email: true, branch: true, employmentType: true, role: true },
    });
    if (!user) return res.status(404).json({ error: "ユーザーが見つかりません" });
    return res.json(user);
  } catch {
    return res.status(500).json({ error: "DBエラー" });
  }
});

// 従業員登録
router.post("/users", async (req, res) => {
  const { email, password, employeeNumber, lastName, firstName, nameKana, branch, employmentType, role } = req.body as {
    email: string;
    password: string;
    employeeNumber?: string;
    lastName?: string;
    firstName?: string;
    nameKana?: string;
    branch?: string;
    employmentType?: string;
    role?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ error: "メールアドレスとパスワードは必須です" });
  }
  if (role && role !== "user" && role !== "admin") {
    return res.status(400).json({ error: "role は 'user' または 'admin' のみ指定できます" });
  }

  const name = [lastName, firstName].filter(Boolean).join(" ") || null;

  try {
    // 社員番号の自動採番（既存の最大値 + 1、4桁ゼロ埋め）
    const last = await prisma.user.findFirst({
      where: { employeeNumber: { not: null } },
      orderBy: { employeeNumber: "desc" },
      select: { employeeNumber: true },
    });
    const nextNum = last?.employeeNumber ? parseInt(last.employeeNumber, 10) + 1 : 1;
    const autoEmployeeNumber = String(nextNum).padStart(4, "0");

    const user = await prisma.user.create({
      data: {
        email,
        password,
        name,
        employeeNumber: employeeNumber || autoEmployeeNumber,
        lastName: lastName || null,
        firstName: firstName || null,
        nameKana: nameKana || null,
        branch: branch || null,
        employmentType: employmentType || null,
        role: role ?? "user",
      },
      select: { id: true, name: true, email: true, branch: true, employmentType: true, role: true, employeeNumber: true, lastName: true, firstName: true, nameKana: true },
    });
    return res.status(201).json(user);
  } catch (e: any) {
    if (e?.code === "P2002") {
      return res.status(409).json({ error: "このメールアドレスはすでに登録されています" });
    }
    return res.status(500).json({ error: "DBエラー" });
  }
});

// 従業員情報更新
router.put("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { lastName, firstName, nameKana, branch, employmentType, role } = req.body as {
    lastName?: string;
    firstName?: string;
    nameKana?: string;
    branch?: string;
    employmentType?: string;
    role?: string;
  };

  if (role && role !== "user" && role !== "admin") {
    return res.status(400).json({ error: "role は 'user' または 'admin' のみ指定できます" });
  }

  const name = (lastName !== undefined || firstName !== undefined)
    ? [lastName, firstName].filter(Boolean).join(" ") || null
    : undefined;

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name           !== undefined && { name }),
        ...(lastName       !== undefined && { lastName }),
        ...(firstName      !== undefined && { firstName }),
        ...(nameKana       !== undefined && { nameKana }),
        ...(branch         !== undefined && { branch }),
        ...(employmentType !== undefined && { employmentType }),
        ...(role           !== undefined && { role }),
      },
      select: { id: true, name: true, lastName: true, firstName: true, nameKana: true, email: true, branch: true, employmentType: true, role: true, employeeNumber: true },
    });
    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "DBエラー" });
  }
});

// 従業員の勤怠一覧（月別）
router.get("/users/:id/attendances", async (req, res) => {
  const userId = Number(req.params.id);
  const year   = Number(req.query.year);
  const month  = Number(req.query.month);

  if (!year || !month) return res.status(400).json({ error: "year・month は必須です" });

  const pad = (n: number) => String(n).padStart(2, "0");
  const startDate = `${year}-${pad(month)}-01`;
  const endDate   = `${year}-${pad(month)}-${new Date(year, month, 0).getDate()}`;

  try {
    const records = await prisma.attendance.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      orderBy: { date: "asc" },
    });
    return res.json({ year, month, records });
  } catch {
    return res.status(500).json({ error: "DBエラー" });
  }
});

// 勤怠承認
router.patch("/attendances/:id/approve", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const updated = await prisma.attendance.update({
      where: { id },
      data: { approvalStatus: "approved" },
    });
    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "DBエラー" });
  }
});

// 勤怠却下
router.patch("/attendances/:id/reject", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const updated = await prisma.attendance.update({
      where: { id },
      data: { approvalStatus: "rejected" },
    });
    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "DBエラー" });
  }
});

// 従業員削除
router.delete("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.user.delete({ where: { id } });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "DBエラー" });
  }
});

export default router;
