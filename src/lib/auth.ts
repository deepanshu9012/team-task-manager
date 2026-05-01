import { verifyToken, type JwtPayload } from "@/src/lib/jwt";

export function getUserFromRequest(req: Request): JwtPayload {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    throw new Error("Authorization header is missing");
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new Error("Invalid authorization header format");
  }

  try {
    return verifyToken(token);
  } catch {
    throw new Error("Invalid or expired token");
  }
}
