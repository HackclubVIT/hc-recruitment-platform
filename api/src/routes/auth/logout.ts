import { Request, Response } from "express";

export const POST = async (req: Request, res: Response) => {
  res.clearCookie("session")

  return res.status(200).json(
    { message: "Logged out successfully" }
  )
}
