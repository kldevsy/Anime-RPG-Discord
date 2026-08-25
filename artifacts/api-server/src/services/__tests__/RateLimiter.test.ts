import { describe, it, expect, beforeEach } from "vitest";
import { createRateLimiter, clearRateLimitStore } from "../../middlewares/rateLimiter";

function mockReq(headers: Record<string, string> = {}, body: any = {}, path = "/api/test") {
  return {
    headers,
    body,
    path,
    ip: "127.0.0.1",
  } as any;
}

function mockRes() {
  const res: any = {
    statusCode: 200,
    headers: {},
    setHeader(name: string, val: string) {
      res.headers[name] = val;
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: any) {
      res.payload = payload;
      return res;
    },
  };
  return res;
}

describe("RateLimiter Middleware", () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  it("allows requests under the rate limit", () => {
    const middleware = createRateLimiter({ windowMs: 10000, maxRequests: 2 });
    const req = mockReq({ "x-user-id": "user-1" });
    const res = mockRes();
    let nextCalled = false;

    middleware(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBe(200);
  });

  it("blocks requests that exceed the rate limit", () => {
    const middleware = createRateLimiter({ windowMs: 10000, maxRequests: 2 });
    const req = mockReq({ "x-user-id": "user-spam" });

    middleware(req, mockRes(), () => {});
    middleware(req, mockRes(), () => {});

    const resBlocked = mockRes();
    let nextCalled = false;
    middleware(req, resBlocked, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(resBlocked.statusCode).toBe(429);
    expect(resBlocked.payload.error).toBe("Rate limit exceeded");
  });

  it("differentiates requests by interaction ID or command", () => {
    const middleware = createRateLimiter({ windowMs: 10000, maxRequests: 1 });
    const req1 = mockReq({ "x-user-id": "user-1", "x-button-id": "btn-1" });
    const req2 = mockReq({ "x-user-id": "user-1", "x-button-id": "btn-2" });

    let next1 = false;
    let next2 = false;

    middleware(req1, mockRes(), () => {
      next1 = true;
    });
    middleware(req2, mockRes(), () => {
      next2 = true;
    });

    expect(next1).toBe(true);
    expect(next2).toBe(true);
  });
});
