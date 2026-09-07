import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding initial data (additive only)...')

  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@vitstudent.ac.in'
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'pass@123'
  
  // We don't hash here blindly because maybe the user already has a password and we don't want to reset it on every seed run,
  // but if the user doesn't exist, we will create them with the hash.
  
  let user = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!user) {
    if (process.env.ALLOW_USER_CREATION !== 'true') {
      throw new Error(`CRITICAL ERROR: Bootstrap Admin user ${adminEmail} not found in HC database. Do not silently create HC users. Create the user through HC Main first or set ALLOW_USER_CREATION=true to override.`);
    }
    
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    user = await prisma.user.create({
      data: {
        id: BigInt(1),
        name: 'System Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'Member',
      }
    });
    console.log(`[WARNING] Created new HC user for admin: ${adminEmail} (ALLOW_USER_CREATION=true)`);
  } else {
    console.log(`Found existing HC user for admin: ${adminEmail}`);
  }

  // Create RecruitmentRoleAssignment
  await prisma.recruitmentRoleAssignment.upsert({
    where: { user_id: user.id },
    update: { 
      role: 'ADMIN',
      departments: ['CSE', 'ECE', 'DESIGN', 'MANAGEMENT']
    },
    create: {
      user_id: user.id,
      role: 'ADMIN',
      departments: ['CSE', 'ECE', 'DESIGN', 'MANAGEMENT']
    }
  });

  // Create a default Form
  const defaultForm = await prisma.recruitmentForm.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      title: 'HackClub VIT General Recruitment',
      description: 'Standard recruitment application form for all departments.',
      status: 'PUBLISHED',
      published_at: new Date()
    }
  })

  // Create default form questions
  const questions = [
    { form_id: 1, question: 'Why do you want to join HackClub VIT?', type: 'PARAGRAPH', required: true },
    { form_id: 1, question: 'What is your primary tech stack?', type: 'TEXT', required: true },
    { form_id: 1, question: 'Are you available for weekend hackathons?', type: 'RADIO', required: true, options: ['Yes', 'No', 'Maybe'] }
  ]

  for (const q of questions) {
    const existing = await prisma.recruitmentFormQuestion.findFirst({
      where: { form_id: q.form_id, question: q.question }
    })
    
    if (!existing) {
      await prisma.recruitmentFormQuestion.create({
        data: {
          form_id: q.form_id,
          question: q.question,
          type: q.type,
          required: q.required,
          options: q.options || []
        }
      })
    }
  }

  console.log('Seed completed successfully.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
