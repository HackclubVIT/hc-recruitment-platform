import { PrismaClient } from '@prisma/client'
import { signToken } from '../src/lib/auth.js'

const prisma = new PrismaClient()
const API_URL = "http://localhost:3001/api"

async function makeRequest(path: string, method: string, payload?: any, role: string = 'ADMIN', userId: string = 'admin-1', departments: string[] = []) {
  const token = await signToken({ id: userId, role, departments, active: true })
  
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `session=${token}`
    },
    body: payload ? JSON.stringify(payload) : undefined
  })
  
  const text = await res.text()
  try {
    return { status: res.status, data: JSON.parse(text) }
  } catch (e) {
    return { status: res.status, data: text }
  }
}

async function runTests() {
  console.log("Starting Security and Consistency E2E Test Pass...")
  
  // 1. Clean DB (Safe cleanup for local test)
  await prisma.auditLog.deleteMany({})
  await prisma.feedback.deleteMany({})
  await prisma.interview.deleteMany({})
  await prisma.panelMember.deleteMany({})
  await prisma.panel.deleteMany({})
  await prisma.application.deleteMany({})
  await prisma.candidate.deleteMany({})
  await prisma.formQuestion.deleteMany({})
  await prisma.form.deleteMany({})
  await prisma.user.deleteMany({})
  
  // Seed basic users
  const admin = await prisma.user.create({ data: { name: 'Admin', email: 'admin@test.com', role: 'ADMIN', active: true } })
  const recruiter = await prisma.user.create({ data: { name: 'Recruiter', email: 'recruiter@test.com', role: 'RECRUITER', departments: ['Engineering'], active: true } })
  const panelMemberA = await prisma.user.create({ data: { name: 'PM_A', email: 'a@test.com', role: 'PANEL_MEMBER', active: true } })
  const panelMemberB = await prisma.user.create({ data: { name: 'PM_B', email: 'b@test.com', role: 'PANEL_MEMBER', active: true } })
  
  // Create Panel A and Panel B
  const panelA = await prisma.panel.create({ data: { name: 'Panel A', status: 'ACTIVE' } })
  const panelB = await prisma.panel.create({ data: { name: 'Panel B', status: 'ACTIVE' } })
  
  // Create memberships
  await prisma.panelMember.create({ data: { panel_id: panelA.id, user_id: panelMemberA.id, active: true } })
  await prisma.panelMember.create({ data: { panel_id: panelA.id, user_id: panelMemberB.id, active: true } }) // Both in Panel A
  
  // 2. FORM TEST (Req 43)
  const formRes = await makeRequest('/forms', 'POST', { title: 'Test Form', description: 'desc', status: 'PUBLISHED' }, 'ADMIN', admin.id)
  const form = formRes.data.form
  
  await makeRequest(`/forms/${form.id}/questions`, 'POST', { form_id: form.id, type: 'TEXT', question: 'Q1', required: true }, 'ADMIN', admin.id)
  const q2Res = await makeRequest(`/forms/${form.id}/questions`, 'POST', { form_id: form.id, type: 'CHECKBOX', question: 'Q2', required: true, options: ['A','B','C'] }, 'ADMIN', admin.id)
  const q2 = q2Res.data.question
  
  // Public Apply (Candidate A)
  const applyResA = await fetch(`${API_URL}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      form_id: form.id,
      name: 'Candidate A',
      email: 'candA@test.com',
      phone: '1234567890',
      department: 'Engineering',
      registration_number: 'REG001',
      answers: {
        [q2.id.toString()]: ['A', 'B'] // Correct checkbox format
      }
    })
  })
  if (applyResA.status !== 201) throw new Error("Application A failed: " + await applyResA.text())
  const appA = (await applyResA.json()).applicationId
  
  // Validate duplicate rejection
  const dupApply = await fetch(`${API_URL}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      form_id: form.id,
      name: 'Candidate A',
      email: 'candA@test.com',
      phone: '1234567890',
      department: 'Engineering',
      registration_number: 'REG001',
      answers: {}
    })
  })
  if (dupApply.status !== 409) throw new Error("Duplicate rejection failed. Status: " + dupApply.status)
  
  // Public Apply (Candidate B) - Unrelated department
  const applyResB = await fetch(`${API_URL}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      form_id: form.id,
      name: 'Candidate B',
      email: 'candB@test.com',
      phone: '1234567890',
      department: 'Sales',
      registration_number: 'REG002',
      answers: {}
    })
  })
  const appB = (await applyResB.json()).applicationId
  
  // Get Candidates directly
  const candA = await prisma.candidate.findFirst({ where: { email: 'candA@test.com' } })
  const candB = await prisma.candidate.findFirst({ where: { email: 'candB@test.com' } })

  // Recruiter sets SHORTLISTED
  await makeRequest(`/applications/${appA}`, 'PUT', { status: 'SHORTLISTED' }, 'RECRUITER', recruiter.id, ['Engineering'])
  
  // SCHEDULE INTERVIEW A
  const schedARes = await makeRequest('/interviews/schedule', 'POST', {
    candidate_id: candA!.id,
    application_id: appA,
    panel_id: panelA.id,
    date: '2026-10-15',
    start_time: '10:00'
  }, 'RECRUITER', recruiter.id, ['Engineering'])
  
  if (schedARes.status !== 201) throw new Error("Scheduling failed: " + JSON.stringify(schedARes.data))
  const intA = schedARes.data.interview
  
  // Double Booking Test (Req 42)
  const doubleSched = await makeRequest('/interviews/schedule', 'POST', {
    candidate_id: candA!.id,
    application_id: appA,
    panel_id: panelA.id,
    date: '2026-10-15',
    start_time: '10:00'
  }, 'RECRUITER', recruiter.id, ['Engineering'])
  if (doubleSched.status !== 409) throw new Error("Double booking not blocked: " + JSON.stringify(doubleSched.data))
  
  // SECURITY TEST (Req 38)
  // Panel Member A CAN access Interview A
  const intAGet = await makeRequest(`/interviews/${intA.id}`, 'GET', null, 'PANEL_MEMBER', panelMemberA.id)
  if (intAGet.status !== 200) throw new Error("Panel A access Interview A failed")
  
  // Panel Member A CANNOT access Application B
  const appBGet = await makeRequest(`/applications/${appB}`, 'GET', null, 'PANEL_MEMBER', panelMemberA.id)
  if (appBGet.status !== 403 && appBGet.status !== 404) throw new Error("Panel A accessed Application B incorrectly: " + appBGet.status)

  // Start Interview A
  await makeRequest(`/interviews/${intA.id}`, 'PUT', { status: 'IN_PROGRESS' }, 'PANEL_MEMBER', panelMemberA.id)
  await makeRequest(`/interviews/${intA.id}`, 'PUT', { status: 'COMPLETED' }, 'PANEL_MEMBER', panelMemberA.id)
  
  // FEEDBACK TEST (Req 39, Req 23)
  // A submits feedback
  const f1 = await makeRequest('/feedback', 'POST', {
    interview_id: intA.id,
    technical_score: 5, communication_score: 5, problem_solving_score: 5,
    confidence_score: 5, teamwork_score: 5, decision: 'SELECTED', comments: 'good'
  }, 'PANEL_MEMBER', panelMemberA.id)
  
  // Check interview status -> should still be FEEDBACK_PENDING since B hasn't submitted
  const intACheck = await prisma.interview.findUnique({ where: { id: intA.id } })
  if (intACheck!.status !== 'FEEDBACK_PENDING') throw new Error("Interview prematurely submitted: " + intACheck!.status)
  
  // B submits feedback
  const f2 = await makeRequest('/feedback', 'POST', {
    interview_id: intA.id,
    technical_score: 5, communication_score: 5, problem_solving_score: 5,
    confidence_score: 5, teamwork_score: 5, decision: 'SELECTED', comments: 'good'
  }, 'PANEL_MEMBER', panelMemberB.id)

  // Check interview status -> should be FEEDBACK_SUBMITTED
  const intAFin = await prisma.interview.findUnique({ where: { id: intA.id } })
  if (intAFin!.status !== 'FEEDBACK_SUBMITTED') throw new Error("Interview not marked FEEDBACK_SUBMITTED")
  
  // Check application -> INTERVIEW_COMPLETED
  const appAFin = await prisma.application.findUnique({ where: { id: appA } })
  if (appAFin!.status !== 'INTERVIEW_COMPLETED') throw new Error("Application not marked INTERVIEW_COMPLETED")

  // FINAL DECISION TEST (Req 40)
  const decisionRes = await makeRequest(`/applications/${appA}`, 'PUT', { status: 'SELECTED' }, 'RECRUITER', recruiter.id, ['Engineering'])
  if (decisionRes.status !== 200) throw new Error("Final decision failed: " + JSON.stringify(decisionRes.data))
  
  // Verify audit logs and decided_by
  const decApp = await prisma.application.findUnique({ where: { id: appA } })
  if (decApp!.decided_by !== recruiter.id) throw new Error("decided_by not set")
  
  // FURTHER ROUND TEST (Req 41)
  // We need an application in INTERVIEW_COMPLETED. Let's make candidate B ready for further round.
  await makeRequest(`/applications/${appB}`, 'PUT', { status: 'SHORTLISTED' }, 'ADMIN', admin.id)
  const schedBRes = await makeRequest('/interviews/schedule', 'POST', {
    candidate_id: candB!.id, application_id: appB, panel_id: panelA.id,
    date: '2026-10-16', start_time: '10:00'
  }, 'ADMIN', admin.id)
  const intB = schedBRes.data.interview
  await makeRequest(`/interviews/${intB.id}`, 'PUT', { status: 'COMPLETED' }, 'ADMIN', admin.id)
  
  await makeRequest('/feedback', 'POST', {
    interview_id: intB.id,
    technical_score: 5, communication_score: 5, problem_solving_score: 5,
    confidence_score: 5, teamwork_score: 5, decision: 'SELECTED', comments: 'good'
  }, 'PANEL_MEMBER', panelMemberA.id)
  
  await makeRequest('/feedback', 'POST', {
    interview_id: intB.id,
    technical_score: 5, communication_score: 5, problem_solving_score: 5,
    confidence_score: 5, teamwork_score: 5, decision: 'SELECTED', comments: 'good'
  }, 'PANEL_MEMBER', panelMemberB.id)

  const intBFin = await prisma.interview.findUnique({ where: { id: intB.id } })
  if (intBFin!.status !== 'FEEDBACK_SUBMITTED') throw new Error("Interview B not marked FEEDBACK_SUBMITTED")
  
  const appBFin = await prisma.application.findUnique({ where: { id: appB } })
  if (appBFin!.status !== 'INTERVIEW_COMPLETED') throw new Error("Application B not marked INTERVIEW_COMPLETED")

  const frRes = await makeRequest(`/applications/${appB}`, 'PUT', { status: 'FURTHER_ROUND' }, 'ADMIN', admin.id)
  if (frRes.status !== 200) throw new Error("Further round transition failed: " + JSON.stringify(frRes.data))
  
  const frApp = await prisma.application.findUnique({ where: { id: appB } })
  if (frApp!.decided_by !== null) throw new Error("decided_by should be null for FURTHER_ROUND")
  
  // Schedule next round
  const schedB2Res = await makeRequest('/interviews/schedule', 'POST', {
    candidate_id: candB!.id, application_id: appB, panel_id: panelB.id,
    date: '2026-10-17', start_time: '10:00'
  }, 'ADMIN', admin.id)
  if (schedB2Res.data.interview.round !== 2) throw new Error("Further round did not increment round number")
  
  console.log("All Security and E2E Tests Passed Successfully!")
}

runTests().catch(e => {
  console.error("Test Failed!", e)
  process.exit(1)
})
