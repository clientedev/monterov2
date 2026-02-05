import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: number;
                role: "ADMIN" | "USER";
                iat: number;
                exp: number;
            };
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export const generateToken = (user: { id: number; role: string }) => {
    return jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: "7d",
    });
};

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return next(); // Proceed without user (public routes might handle this)
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = decoded;
        next();
    } catch (error) {
        // If token is invalid, just proceed without user? Or error?
        // For protected routes, we'll check if req.user exists.
        // Let's just next() for now, `requireAuth` will handle rejection.
        next();
    }
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
    }
    next();
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin access required" });
    }
    next();
};

export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string) => {
    return await bcrypt.compare(password, hash);
};
