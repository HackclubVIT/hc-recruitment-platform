import { redirect } from "next/navigation"

export default function RecruiterPanelsRoute() {
  // Panels for recruiters are managed when scheduling interviews
  redirect("/recruiter/meetings")
}
