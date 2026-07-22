import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { extractAccessToken } from "@/lib/server/auth";

describe("extractAccessToken", () => {
  it("prefers accessToken cookie over Authorization header", async () => {
    const request = new NextRequest("http://localhost/api/auth/me", {
      headers: { authorization: "Bearer header-token" },
    });
    request.cookies.set("accessToken", "cookie-token");

    await expect(extractAccessToken(request)).resolves.toBe("cookie-token");
  });

  it("falls back to Bearer header when cookie missing", async () => {
    const request = new NextRequest("http://localhost/api/auth/me", {
      headers: { authorization: "Bearer header-token" },
    });

    await expect(extractAccessToken(request)).resolves.toBe("header-token");
  });

  it("returns null when no credentials present", async () => {
    const request = new NextRequest("http://localhost/api/auth/me");
    await expect(extractAccessToken(request)).resolves.toBeNull();
  });
});
