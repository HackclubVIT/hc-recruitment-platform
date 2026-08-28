import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
export const GET = async (req, res) => {
    try {
        const session = await getSession(req);
        if (!session) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        let whereClause = {};
        if (session.role === "PANEL_MEMBER") {
            // Panel members only see interviews for panels they are part of
            const userPanels = await prisma.panelMember.findMany({
                where: { user_id: session.id },
                select: { panel_id: true }
            });
            const panelIds = userPanels.map((p) => p.panel_id);
            whereClause = { panel_id: { in: panelIds } };
        }
        else if (session.role === "RECRUITER") {
            // Recruiters see interviews for candidates in their departments
            whereClause = {
                candidate: {
                    department: { in: session.departments }
                }
            };
        }
        const interviews = await prisma.interview.findMany({
            where: whereClause,
            include: {
                candidate: true,
                panel: true,
            },
            orderBy: { date: 'asc' }
        });
        return res.status(200).json({ interviews });
    }
    catch (error) {
        console.error("Error fetching interviews:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
