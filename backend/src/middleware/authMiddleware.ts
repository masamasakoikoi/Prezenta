// import { error } from "console";
import type{ Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
// import type {JwtPayload} from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev_secret_change_me";


export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "認証が必要です（Bearerトークンがありません）" });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded !== "object" || decoded === null && !("userId" in decoded)) {
      return res.status(401).json({ error: "トークン形式が不正です" });
    }

    const userId = (decoded as any).userId;
    if(typeof userId !== "number") {
      return res.status(401).json({ message: "トークンが不正です(userIdが不正)"});
    }

    req.userId = userId;
    next();
  } catch {
    return res.status(401).json({ error: "トークンが無効または期限切れです" });
  }
};
