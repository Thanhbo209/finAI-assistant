import type { NextFunction, Response, Request } from "express";
import jwt from "jsonwebtoken";

type AuthUser = {
  userId: string;
  role: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

type JwtPayload = {
  sub: string;
  role: string;
};

export const middleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET!,
    ) as JwtPayload;

    if (!decoded.sub) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.user = {
      userId: decoded.sub,
      role: decoded.role,
    };

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};
