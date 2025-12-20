import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ?? "your-secret-key-change-in-production";
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 15; // 15 days

export const AUTH_COOKIE_NAME = "happy_pods_jwt_token";

export interface JWTPayload {
  userId: number;
  address: string;
  iat?: number;
  exp?: number;
}

export function generateToken(
  payload: Omit<JWTPayload, "iat" | "exp">
): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "15d", // Token 15天后过期
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error("JWT verification failed===>\n", error, "\n");
    return null;
  }
}

function parseCookies(cookieHeader: string): Record<string, string> {
  return cookieHeader.split(";").reduce<Record<string, string>>(
    (acc, part) => {
      const [name, ...valueParts] = part.trim().split("=");
      if (!name) return acc;
      acc[name] = decodeURIComponent(valueParts.join("=") ?? "");
      return acc;
    },
    {}
  );
}

export function getTokenFromRequest(headers: Headers): string | null {
  const authHeader = headers.get("authorization");
  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      return parts[1] ?? null;
    }

    if (!authHeader.startsWith("Bearer ")) {
      return authHeader;
    }
  }

  const cookieHeader = headers.get("cookie");
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    return cookies[AUTH_COOKIE_NAME] ?? null;
  }

  return null;
}

function buildCookieAttributes(): string {
  const attributes = [
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${TOKEN_MAX_AGE_SECONDS}`,
  ];

  if (process.env.NODE_ENV === "production") {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

export function createAuthCookie(token: string): string {
  return `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; ${buildCookieAttributes()}`;
}

export function clearAuthCookie(): string {
  const attributes = ["Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (process.env.NODE_ENV === "production") {
    attributes.push("Secure");
  }
  return `${AUTH_COOKIE_NAME}=; ${attributes.join("; ")}`;
}
