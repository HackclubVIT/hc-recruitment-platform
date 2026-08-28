import { SignJWT, jwtVerify } from "jose";
function getSecretKey() {
    if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET must be provided in production");
    }
    return process.env.JWT_SECRET || "development_secret_only";
}
const getEncodedKey = () => new TextEncoder().encode(getSecretKey());
export async function signToken(payload) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(getEncodedKey());
}
export async function verifyToken(token = "") {
    try {
        const { payload } = await jwtVerify(token, getEncodedKey(), {
            algorithms: ["HS256"],
        });
        return payload;
    }
    catch (error) {
        return null;
    }
}
// Updated to use Express Request
export async function getSession(req) {
    if (!req)
        return null;
    const token = req.cookies?.session;
    if (!token)
        return null;
    const payload = await verifyToken(token);
    if (!payload)
        return null;
    return payload;
}
