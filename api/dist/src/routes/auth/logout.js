export const POST = async (req, res) => {
    res.clearCookie("session");
    return res.status(200).json({ message: "Logged out successfully" });
};
