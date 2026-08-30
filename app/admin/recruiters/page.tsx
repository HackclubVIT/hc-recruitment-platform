import { redirect } from "next/navigation"

export default function RecruitersRoute() {
  // Recruiters are managed within the main Users interface
  redirect("/admin/users")
}
