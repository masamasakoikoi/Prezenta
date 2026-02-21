import { error } from "console";
import type{ Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type {JwtPayload} from "jsonwebtoken";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "トークンがありません" });
  }

  const token = authHeader.split(" ")[1];

  try {
    if (!token) {
      return res.status(401).json({ error: "トークン形式が不正です" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    
    // ⭐ 型チェック！！
    if (typeof decoded === "object" && decoded !== null && "userId" in decoded) {
      (req as any).userId = (decoded as JwtPayload & { userId: number }).userId;
      next();
    } else {
      return res.status(401).json({ error: "トークン形式が不正です" });
    }
  } catch {
    return res.status(401).json({ error: "トークンが無効です" });
  }
};
