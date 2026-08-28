import { getSession } from "@/lib/auth";
export const GET = async (req, res) => {
    try {
        const session = await getSession(req);
        if (!session) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        return res.status(200).json({ user: session });
    }
    catch (error) {
        console.error("Auth me error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
