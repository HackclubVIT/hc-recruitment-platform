import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
export const GET = async (req, res) => {
    const params = req.params;
    try {
        const session = await getSession(req);
        if (!session)
            return res.status(401).json({ error: "Unauthorized" });
        const resolvedParams = req.params;
        const id = parseInt(resolvedParams.id, 10);
        const candidate = await prisma.candidate.findUnique({
            where: { id },
            include: {
                applications: true,
                interviews: {
                    include: { panel: true, feedback: true }
                }
            }
        });
        if (!candidate)
            return res.status(404).json({ error: "Not found" });
        // Access control: Recruiter can only view their own department
        if (session.role === "RECRUITER" && !session.departments.includes(candidate.department)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        // Access control: Panel Member can only view candidates for their assigned interviews
        if (session.role === "PANEL_MEMBER") {
            const isAssigned = await prisma.interview.findFirst({
                where: {
                    candidate_id: candidate.id,
                    panel: {
                        members: {
                            some: {
                                user_id: session.id
                            }
                        }
                    }
                }
            });
            if (!isAssigned) {
                return res.status(403).json({ error: "Forbidden" });
            }
        }
        return res.status(200).json({ candidate });
    }
    catch (error) {
        console.error("Fetch candidate error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
