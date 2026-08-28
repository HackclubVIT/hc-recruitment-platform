import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    console.log('Seeding initial data...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    // Create default admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@hackclubvit.co' },
        update: { password: hashedPassword },
        create: {
            name: 'System Admin',
            email: 'admin@hackclubvit.co',
            password: hashedPassword,
            role: 'ADMIN',
            departments: ['CSE', 'ECE', 'DESIGN', 'MANAGEMENT']
        },
    });
    // Create a default Form
    const defaultForm = await prisma.form.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            title: 'HackClub VIT General Recruitment',
            description: 'Standard recruitment application form for all departments.',
            status: 'PUBLISHED',
            published_at: new Date()
        }
    });
    // Create default form questions
    const questions = [
        { form_id: 1, question: 'Why do you want to join HackClub VIT?', type: 'PARAGRAPH', required: true },
        { form_id: 1, question: 'What is your primary tech stack?', type: 'TEXT', required: true },
        { form_id: 1, question: 'Are you available for weekend hackathons?', type: 'RADIO', required: true, options: ['Yes', 'No', 'Maybe'] }
    ];
    for (const q of questions) {
        const existing = await prisma.formQuestion.findFirst({
            where: { form_id: q.form_id, question: q.question }
        });
        if (!existing) {
            await prisma.formQuestion.create({
                data: {
                    form_id: q.form_id,
                    question: q.question,
                    type: q.type,
                    required: q.required,
                    options: q.options || []
                }
            });
        }
    }
    console.log('Seed completed successfully.');
    console.log('Admin credentials: admin@hackclubvit.co / password123');
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
