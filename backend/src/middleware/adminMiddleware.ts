import type { Request, Response, NextFunction } from "express";

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "管理者権限が必要です" });
  }
  next();
};
