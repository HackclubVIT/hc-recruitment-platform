import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding initial data...')

  // Create default admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hackclubvit.co' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@hackclubvit.co',
      password: 'password123', // In a real app, hash this with bcrypt/argon2
      role: 'ADMIN',
      departments: ['CSE', 'ECE', 'DESIGN', 'MANAGEMENT']
    },
  })

  // Create default form questions
  const questions = [
    { form_id: 1, question: 'Why do you want to join HackClub VIT?', type: 'PARAGRAPH', required: true },
    { form_id: 1, question: 'What is your primary tech stack?', type: 'TEXT', required: true },
    { form_id: 1, question: 'Are you available for weekend hackathons?', type: 'RADIO', required: true, options: ['Yes', 'No', 'Maybe'] }
  ]

  for (const q of questions) {
    const existing = await prisma.formQuestion.findFirst({
      where: { form_id: q.form_id, question: q.question }
    })
    
    if (!existing) {
      await prisma.formQuestion.create({
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
  console.log('Admin credentials: admin@hackclubvit.co / password123')
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
