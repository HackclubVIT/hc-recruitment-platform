import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import prisma from '../src/lib/db.js';

async function main() {
  console.log("== 1. Synchronizing User Recruitment Roles ==");

  // Define target roles by keyword / email fragment
  const adminKeywords = ['ojas', 'ivan', 'harleen', 'atul'];
  const recruiterKeywords = ['prachi', 'kushagra', 'jesta', 'arya', 'vijayendra', 'manan'];

  const allUsers = await prisma.user.findMany({
    include: { recruitmentRole: true }
  });
  console.log(`Found ${allUsers.length} total users in database.`);

  const adminUserIds: bigint[] = [];
  const recruiterUserIds: bigint[] = [];
  const memberUserIds: bigint[] = [];

  for (const user of allUsers) {
    const lowerName = (user.name || '').toLowerCase();
    const lowerEmail = (user.email || '').toLowerCase();

    // Check if matches admin
    const isAdmin = adminKeywords.some(kw => lowerName.includes(kw) || lowerEmail.includes(kw));
    // Check if matches recruiter
    const isRecruiter = recruiterKeywords.some(kw => lowerName.includes(kw) || lowerEmail.includes(kw));

    if (isAdmin) {
      adminUserIds.push(user.id);
    } else if (isRecruiter) {
      recruiterUserIds.push(user.id);
    } else {
      memberUserIds.push(user.id);
    }
  }

  console.log(`Identified: ${adminUserIds.length} Admins, ${recruiterUserIds.length} Recruiters, ${memberUserIds.length} Members.`);

  // Update Admins
  for (const id of adminUserIds) {
    await prisma.recruitmentRoleAssignment.upsert({
      where: { user_id: id },
      update: { role: 'ADMIN', active: true, departments: ['*'] },
      create: { user_id: id, role: 'ADMIN', active: true, departments: ['*'] }
    });
  }

  // Update Recruiters
  const allDepartments = ["Projects", "Operations", "Technical", "Finance", "Research and Development", "Design & Social Media", "*"];
  for (const id of recruiterUserIds) {
    await prisma.recruitmentRoleAssignment.upsert({
      where: { user_id: id },
      update: { role: 'RECRUITER', active: true, departments: allDepartments },
      create: { user_id: id, role: 'RECRUITER', active: true, departments: allDepartments }
    });
  }

  // Update all other users to Member (role: NONE)
  for (const id of memberUserIds) {
    await prisma.recruitmentRoleAssignment.upsert({
      where: { user_id: id },
      update: { role: 'NONE', active: true, departments: [] },
      create: { user_id: id, role: 'NONE', active: true, departments: [] }
    });
  }
  console.log("✓ Roles successfully synchronized in database.");

  // 2. Ensure candidate Armaan Sangwan exists
  console.log("\n== 2. Checking Candidate Armaan Sangwan ==");
  const targetEmail = "armaan.sangwan2024@vitstudent.ac.in";
  const targetReg = "24BPS1029";

  let armaanUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: targetEmail, mode: "insensitive" } },
        { registerNumber: { equals: targetReg, mode: "insensitive" } }
      ]
    },
    include: { recruitmentRole: true }
  });

  if (!armaanUser) {
    console.log("Creating Armaan Sangwan user account...");
    armaanUser = await prisma.user.create({
      data: {
        id: BigInt(Date.now()),
        name: "Armaan Sangwan",
        email: targetEmail,
        registerNumber: targetReg,
        role: "Member",
        status: "Active",
        recruitmentRole: {
          create: { role: "NONE", active: true, departments: [] }
        }
      },
      include: { recruitmentRole: true }
    });
  } else {
    console.log(`Found existing Armaan user account (ID: ${armaanUser.id.toString()}).`);
    // Ensure role is NONE
    await prisma.recruitmentRoleAssignment.upsert({
      where: { user_id: armaanUser.id },
      update: { role: 'NONE', active: true, departments: [] },
      create: { user_id: armaanUser.id, role: 'NONE', active: true, departments: [] }
    });
  }

  // Ensure Armaan's recruitmentApplication exists
  let armaanApp = await prisma.recruitmentApplication.findFirst({
    where: {
      OR: [
        { email: { equals: targetEmail, mode: "insensitive" } },
        { registerNumber: { equals: targetReg, mode: "insensitive" } }
      ]
    }
  });

  if (!armaanApp) {
    console.log("Creating Armaan Sangwan application...");
    armaanApp = await prisma.recruitmentApplication.create({
      data: {
        id: BigInt(Date.now() + 1),
        recruitmentId: "recruitment-2026",
        name: "Armaan Sangwan",
        registerNumber: targetReg,
        email: targetEmail,
        phoneNumber: "9876543210",
        domain: "Projects",
        firstPreference: "Projects",
        secondPreference: "Technical",
        yearOfStudy: "1",
        status: "Pending"
      }
    });
  } else {
    console.log(`Found existing Armaan application (ID: ${armaanApp.id.toString()}, Status: ${armaanApp.status}).`);
    // Reset to Pending for the lifecycle test
    await prisma.recruitmentApplication.update({
      where: { id: armaanApp.id },
      data: { status: "Pending" }
    });
  }

  // 3. Ensure an active RecruitmentPanel exists with members
  console.log("\n== 3. Ensuring Active Recruitment Panel ==");
  let panel = await prisma.recruitmentPanel.findFirst({
    where: { status: "ACTIVE" },
    include: { members: true }
  });

  if (!panel || panel.members.length === 0) {
    console.log("Creating active interview panel...");
    // Find a user to assign as panel member (e.g. an admin or recruiter)
    const panelUser = allUsers.find(u => u.status === "Active" && u.id !== armaanUser?.id) || allUsers[0];
    
    panel = await prisma.recruitmentPanel.create({
      data: {
        name: "Projects Interview Panel 1",
        description: "Standard technical and cultural interview panel",
        status: "ACTIVE",
        members: {
          create: {
            user_id: panelUser.id,
            active: true
          }
        }
      },
      include: { members: true }
    });
    console.log(`Created panel ${panel.name} (ID: ${panel.id}) with member ID ${panelUser.id}.`);
  } else {
    console.log(`Found active panel: "${panel.name}" (ID: ${panel.id}) with ${panel.members.length} members.`);
  }

  console.log("\n✓ Synchronization complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
