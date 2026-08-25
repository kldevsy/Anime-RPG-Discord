import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return function validateBodyMiddleware(req: Request, res: Response, next: NextFunction) {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation error",
        details: result.error.flatten(),
      });
    }
    req.body = result.data;
    return next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return function validateQueryMiddleware(req: Request, res: Response, next: NextFunction) {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation error",
        details: result.error.flatten(),
      });
    }
    req.query = result.data as any;
    return next();
  };
}
