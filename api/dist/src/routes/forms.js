import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
export const GET = async (req, res) => {
    try {
        const session = await getSession(req);
        if (!session || session.role !== "ADMIN") {
            return res.status(403).json({ error: "Forbidden" });
        }
        const forms = await prisma.form.findMany({
            include: { questions: true },
            orderBy: { created_at: 'desc' }
        });
        return res.status(200).json({ forms });
    }
    catch (error) {
        console.error("Fetch forms error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
export const POST = async (req, res) => {
    try {
        const session = await getSession(req);
        if (!session || session.role !== "ADMIN") {
            return res.status(403).json({ error: "Forbidden" });
        }
        const { title, description } = req.body;
        if (!title) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const form = await prisma.form.create({
            data: {
                title,
                description,
                status: "DRAFT"
            },
            include: { questions: true }
        });
        await logAudit(session.id, "CREATED_FORM", "Form", form.id);
        return res.status(201).json({ form });
    }
    catch (error) {
        console.error("Create form error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
