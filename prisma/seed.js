import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const ROLE = {
  ADMIN: "ADMIN",
  LEAD: "LEAD",
  RECRUITER: "RECRUITER",
  PANEL: "PANEL",
  CANDIDATE: "CANDIDATE",
}

const DEPARTMENTS = [
  { name: "Technical", slug: "technical", description: "Technical department for engineering roles" },
  { name: "Design", slug: "design", description: "Design department for UI/UX roles" },
  { name: "Operations", slug: "operations", description: "Operations department" },
  { name: "Projects", slug: "projects", description: "Projects department" },
  { name: "Finance", slug: "finance", description: "Finance department" },
  { name: "Research & Development", slug: "research", description: "R&D department" },
]

const APPLICATION_STATUSES = [
  "APPLIED",
  "UNDER_REVIEW",
  "ON_HOLD",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEWED",
  "SELECTED",
  "WAITLISTED",
  "REJECTED",
]

const ROLES_APPLIED = [
  "Web Developer",
  "ML Engineer",
  "UI/UX Designer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Data Scientist",
  "Mobile Developer",
]

const YEARS_OF_STUDY = ["1st Year", "2nd Year", "3rd Year", "4th Year"]

const SKILLS = [
  ["React", "TypeScript", "Node.js"],
  ["Python", "TensorFlow", "PyTorch"],
  ["Figma", "Adobe XD", "Sketch"],
  ["Go", "PostgreSQL", "Docker"],
  ["React Native", "Swift", "Kotlin"],
  ["AWS", "Kubernetes", "Terraform"],
  ["Pandas", "NumPy", "Scikit-learn"],
  ["Vue.js", "Nuxt.js", "Pinia"],
]

async function main() {
  console.log("🌱 Starting seed...")

  const passwordHash = await bcrypt.hash("Hackclub@2026", 10)

  console.log("📦 Creating departments...")
  const departments = []
  for (const dept of DEPARTMENTS) {
    const created = await prisma.department.upsert({
      where: { slug: dept.slug },
      update: {},
      create: dept,
    })
    departments.push(created)
  }
  console.log(`✅ Created ${departments.length} departments`)

  console.log("👤 Creating users...")
  const admin = await prisma.user.upsert({
    where: { email: "admin@hackclub.in" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@hackclub.in",
      passwordHash,
      role: ROLE.ADMIN,
      isPanelActive: false,
    },
  })
  console.log(`✅ Admin: ${admin.email}`)

  const leads = []
  const recruiters = []
  const panelists = []

  for (const dept of departments) {
    const lead = await prisma.user.create({
      data: {
        name: `${dept.name} Lead`,
        email: `lead.${dept.slug}@hackclub.in`,
        passwordHash,
        role: ROLE.LEAD,
        isPanelActive: false,
        departments: { create: { departmentId: dept.id } },
      },
    })
    leads.push(lead)
    console.log(`✅ Lead (${dept.name}): ${lead.email}`)

    for (let i = 1; i <= 2; i++) {
      const recruiter = await prisma.user.create({
        data: {
          name: `${dept.name} Recruiter ${i}`,
          email: `recruiter${i}.${dept.slug}@hackclub.in`,
          passwordHash,
          role: ROLE.RECRUITER,
          isPanelActive: false,
          departments: { create: { departmentId: dept.id } },
        },
      })
      recruiters.push(recruiter)
      console.log(`✅ Recruiter (${dept.name} #${i}): ${recruiter.email}`)
    }

    for (let i = 1; i <= 2; i++) {
      const panelist = await prisma.user.create({
        data: {
          name: `${dept.name} Panelist ${i}`,
          email: `panelist${i}.${dept.slug}@hackclub.in`,
          passwordHash,
          role: ROLE.PANEL,
          isPanelActive: true,
          departments: { create: { departmentId: dept.id } },
        },
      })
      panelists.push(panelist)
      console.log(`✅ Panelist (${dept.name} #${i}): ${panelist.email}`)
    }
  }

  console.log("📝 Creating applications...")
  const applications = []

  for (const dept of departments) {
    const deptRecruiters = recruiters.filter(r =>
      r.email.includes(dept.slug)
    )

    for (let i = 0; i < 18; i++) {
      const status = APPLICATION_STATUSES[i % APPLICATION_STATUSES.length]
      const roleApplied = ROLES_APPLIED[i % ROLES_APPLIED.length]
      const year = YEARS_OF_STUDY[i % YEARS_OF_STUDY.length]
      const skills = SKILLS[i % SKILLS.length]
      const assignedRecruiter = deptRecruiters[i % deptRecruiters.length]

      const app = await prisma.application.create({
        data: {
          departmentId: dept.id,
          name: `Candidate ${dept.name} ${i + 1}`,
          email: `candidate${i + 1}.${dept.slug}@student.in`,
          registerNumber: `${24 + (i % 2)}BCE${1000 + i + dept.id * 100}`,
          phoneNumber: `+91 98765 ${String(43210 + i).padStart(5, "0")}`,
          yearOfStudy: year,
          roleAppliedFor: roleApplied,
          resumeUrl: `https://example.com/resume/${dept.slug}-${i + 1}.pdf`,
          technicalSkills: JSON.stringify(skills),
          answers: JSON.stringify({
            whyJoin: `I want to join HackClub ${dept.name} because...`,
            projectDetails: `My project is about...`,
            expectations: `I expect to learn...`,
            sevenDaysBuild: `In 7 days I would build...`,
            skillToLearn: `I want to learn...`,
          }),
          status,
          assignedRecruiterId: status !== "APPLIED" ? assignedRecruiter.id : null,
        },
      })
      applications.push(app)

      if (status !== "APPLIED") {
        await prisma.statusHistory.create({
          data: {
            applicationId: app.id,
            fromStatus: "APPLIED",
            toStatus: status,
            changedByUserId: assignedRecruiter.id,
            reason: "Initial review",
          },
        })
      }

      if (status === "SHORTLISTED" || status === "INTERVIEW_SCHEDULED" || status === "INTERVIEWED") {
        await prisma.applicationNote.create({
          data: {
            applicationId: app.id,
            authorId: assignedRecruiter.id,
            body: `Strong candidate with good ${skills.join(", ")} skills. Recommended for interview.`,
          },
        })
      }
    }
  }
  console.log(`✅ Created ${applications.length} applications`)

  console.log("📅 Creating interviews...")
  const techDept = departments.find(d => d.slug === "technical")
  const designDept = departments.find(d => d.slug === "design")
  const techApps = applications.filter(a => a.departmentId === techDept.id)
  const designApps = applications.filter(a => a.departmentId === designDept.id)
  const techPanelists = panelists.filter(p => p.email.includes("technical"))
  const designPanelists = panelists.filter(p => p.email.includes("design"))
  const techLead = leads.find(l => l.email.includes("technical"))
  const designLead = leads.find(l => l.email.includes("design"))

  const createInterview = async (app, lead, panelistsForDept, status, dayOffset) => {
    const start = new Date()
    start.setDate(start.getDate() + dayOffset)
    start.setHours(10, 0, 0, 0)
    const end = new Date(start)
    end.setHours(11, 0, 0, 0)

    const interview = await prisma.interview.create({
      data: {
        applicationId: app.id,
        startTime: start,
        endTime: end,
        mode: "ONLINE",
        locationOrLink: "https://meet.google.com/abc-defg-hij",
        status,
        createdByUserId: lead.id,
        panelists: {
          create: panelistsForDept.slice(0, 2).map(p => ({ panelistUserId: p.id })),
        },
      },
    })

    if (status === "COMPLETED") {
      for (const panelist of panelistsForDept.slice(0, 2)) {
        await prisma.feedback.create({
          data: {
            interviewId: interview.id,
            panelistUserId: panelist.id,
            ratings: JSON.stringify({ technical: 4, communication: 5, problemSolving: 4, cultureFit: 5 }),
            overall: 90,
            recommendation: "HIRE",
            comments: "Excellent technical skills and good cultural fit.",
            submittedAt: new Date(start.getTime() + 3600000),
          },
        })
      }
    }

    return interview
  }

  for (let i = 0; i < 3; i++) {
    await createInterview(techApps[i], techLead, techPanelists, "COMPLETED", -5 - i)
  }
  for (let i = 0; i < 2; i++) {
    await createInterview(techApps[3 + i], techLead, techPanelists, "INTERVIEW_SCHEDULED", 2 + i)
  }
  for (let i = 0; i < 2; i++) {
    await createInterview(designApps[i], designLead, designPanelists, "COMPLETED", -3 - i)
  }
  for (let i = 0; i < 2; i++) {
    await createInterview(designApps[2 + i], designLead, designPanelists, "INTERVIEW_SCHEDULED", 3 + i)
  }

  console.log("✅ Created interviews with feedback")

  console.log("\n🎉 Seed complete!")
  console.log("\n📋 Demo Credentials (password: Hackclub@2026):")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("Admin:     admin@hackclub.in")
  for (const lead of leads) {
    console.log(`Lead:      ${lead.email}`)
  }
  for (const recruiter of recruiters) {
    console.log(`Recruiter: ${recruiter.email}`)
  }
  for (const panelist of panelists) {
    console.log(`Panelist:  ${panelist.email}`)
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })