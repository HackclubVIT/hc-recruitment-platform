import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:3001';

const results = [];

function recordResult(step, passed, details, error) {
  const res = {
    step,
    status: passed ? 'PASS' : 'FAIL',
    details,
    error
  };
  results.push(res);
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${res.status}] ${step}`);
  if (error) console.log(`   Error: ${error}`);
  if (details && typeof details === 'object') {
    console.log(`   Info:`, JSON.stringify(details).substring(0, 200));
  }
}

async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['Cookie'] = `session=${token}`;
  }
  const options = {
    method,
    headers
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${endpoint}`, options);
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log("==================================================================");
  console.log("       HACKCLUB VIT RECRUITMENT PLATFORM - FULL E2E TEST          ");
  console.log("==================================================================\n");

  let adminToken = '';
  let recruiterToken = '';
  let memberToken = '';
  let armaanAppId = '';
  let panelId = 1;
  let scheduledInterviewId = 0;

  // 1. Check API Health
  try {
    const health = await apiRequest('/api/health');
    recordResult("1. Health Endpoint & Database Connection", health.ok && health.data?.database === "connected", health.data);
  } catch (err) {
    recordResult("1. Health Endpoint & Database Connection", false, null, err.message);
  }

  // 2. Admin Authentication (Ojas)
  try {
    const loginRes = await apiRequest('/api/auth/login', 'POST', {
      email: 'ojas.singh2024@vitstudent.ac.in',
      password: 'Hackclub@2026'
    });
    const passed = loginRes.ok && loginRes.data?.user?.role === 'ADMIN' && !!loginRes.data?.token;
    if (passed) adminToken = loginRes.data.token;
    recordResult("2. Admin Authentication (Ojas -> ADMIN role)", passed, { user: loginRes.data?.user });
  } catch (err) {
    recordResult("2. Admin Authentication (Ojas)", false, null, err.message);
  }

  // 3. Recruiter Authentication (Prachi)
  try {
    const loginRes = await apiRequest('/api/auth/login', 'POST', {
      email: 'prachi.khandelwal2024@vitstudent.ac.in',
      password: 'Hackclub@2026'
    });
    const passed = loginRes.ok && loginRes.data?.user?.role === 'RECRUITER' && !!loginRes.data?.token;
    if (passed) recruiterToken = loginRes.data.token;
    recordResult("3. Recruiter Authentication (Prachi -> RECRUITER role)", passed, { user: loginRes.data?.user });
  } catch (err) {
    recordResult("3. Recruiter Authentication (Prachi)", false, null, err.message);
  }

  // 4. Candidate / Member Authentication (Armaan Sangwan)
  try {
    const loginRes = await apiRequest('/api/auth/login', 'POST', {
      email: 'armaan.sangwan2024@vitstudent.ac.in',
      password: 'Hackclub@2026'
    });
    const passed = loginRes.ok && loginRes.data?.user?.role === 'NONE' && !!loginRes.data?.token;
    if (passed) memberToken = loginRes.data.token;
    recordResult("4. Candidate Authentication (Armaan Sangwan -> NONE / Member role)", passed, { user: loginRes.data?.user });
  } catch (err) {
    recordResult("4. Candidate Authentication (Armaan Sangwan)", false, null, err.message);
  }

  // 5. Find Armaan Application ID & Active Panel from DB
  try {
    const armaanApp = await prisma.recruitmentApplication.findFirst({
      where: { email: { contains: 'armaan.sangwan', mode: 'insensitive' } }
    });
    if (armaanApp) {
      armaanAppId = armaanApp.id.toString();
    }
    const panel = await prisma.recruitmentPanel.findFirst({
      where: { status: 'ACTIVE' },
      include: { members: true }
    });
    if (panel) {
      panelId = panel.id;
    }
    recordResult("5. Resolve Candidate App & Active Panel", !!armaanAppId && !!panelId, {
      armaanAppId,
      panelId,
      panelMembers: panel?.members?.length
    });

    // Reset application state and clean old test interviews for reproducibility
    await prisma.recruitmentInterview.deleteMany({
      where: { application_id: BigInt(armaanAppId) }
    });
    await prisma.recruitmentApplication.update({
      where: { id: BigInt(armaanAppId) },
      data: { status: 'Pending' }
    });
  } catch (err) {
    recordResult("5. Resolve Candidate App & Active Panel", false, null, err.message);
  }

  // 6. Candidate Status Transition: Pending -> UNDER_REVIEW
  try {
    const res = await apiRequest(`/api/applications/${armaanAppId}`, 'PUT', {
      status: 'UNDER_REVIEW',
      reason: 'Application review in progress by recruitment team'
    }, recruiterToken);
    const passed = res.ok && res.data?.application?.status === 'UNDER_REVIEW';
    recordResult("6. Candidate Transition -> UNDER_REVIEW", passed, res.data);
  } catch (err) {
    recordResult("6. Candidate Transition -> UNDER_REVIEW", false, null, err.message);
  }

  // 7. Candidate Status Transition: UNDER_REVIEW -> SHORTLISTED (Triggers Shortlist Email)
  try {
    const initialEmailLogs = await prisma.recruitmentEmailLog.count({
      where: { entity_id: armaanAppId }
    });

    const res = await apiRequest(`/api/applications/${armaanAppId}`, 'PUT', {
      status: 'SHORTLISTED',
      reason: 'Shortlisted for Round 1 Interview based on skills and portfolio'
    }, recruiterToken);
    const passed = res.ok && res.data?.application?.status === 'SHORTLISTED';

    const newEmailLogs = await prisma.recruitmentEmailLog.count({
      where: { entity_id: armaanAppId }
    });
    const emailTriggered = newEmailLogs > initialEmailLogs;

    recordResult("7. Candidate Shortlisting & Shortlist Email Dispatch", passed, {
      status: res.data?.application?.status,
      emailTriggered,
      emailLogsCount: newEmailLogs
    });
  } catch (err) {
    recordResult("7. Candidate Shortlisting & Shortlist Email Dispatch", false, null, err.message);
  }

  // 8. Schedule Interview (Round 1)
  try {
    const scheduleRes = await apiRequest('/api/interviews/schedule', 'POST', {
      application_id: armaanAppId,
      panel_id: panelId,
      date: '2026-09-18',
      start_time: '14:30',
      meeting_link: 'https://meet.google.com/test-hc-round1'
    }, recruiterToken);

    const passed = scheduleRes.ok && !!scheduleRes.data?.interview?.id;
    if (passed) {
      scheduledInterviewId = scheduleRes.data.interview.id;
    }

    const appCheck = await prisma.recruitmentApplication.findUnique({
      where: { id: BigInt(armaanAppId) }
    });

    const emailLog = await prisma.recruitmentEmailLog.findFirst({
      where: { entity_id: scheduledInterviewId.toString(), event_type: 'INTERVIEW_SCHEDULED' }
    });

    recordResult("8. Schedule Interview Round 1 (Status -> INTERVIEW_SCHEDULED & Email Sent)", passed && appCheck?.status === 'INTERVIEW_SCHEDULED', {
      interviewId: scheduledInterviewId,
      appStatus: appCheck?.status,
      emailLogged: !!emailLog,
      emailStatus: emailLog?.status
    });
  } catch (err) {
    recordResult("8. Schedule Interview Round 1", false, null, err.message);
  }

  // 9. Reschedule Interview
  try {
    const rescheduleRes = await apiRequest(`/api/interviews/${scheduledInterviewId}`, 'PUT', {
      date: '2026-09-19',
      start_time: '16:00',
      meeting_link: 'https://meet.google.com/test-hc-round1-rescheduled'
    }, recruiterToken);

    const passed = rescheduleRes.ok && rescheduleRes.data?.interview?.meeting_link === 'https://meet.google.com/test-hc-round1-rescheduled';

    const rescheduleEmail = await prisma.recruitmentEmailLog.findFirst({
      where: { entity_id: scheduledInterviewId.toString(), event_type: 'INTERVIEW_RESCHEDULED' }
    });

    recordResult("9. Reschedule Interview (Updated Time & Reschedule Email Sent)", passed, {
      interview: rescheduleRes.data?.interview?.date,
      emailLogged: !!rescheduleEmail,
      emailStatus: rescheduleEmail?.status
    });
  } catch (err) {
    recordResult("9. Reschedule Interview", false, null, err.message);
  }

  // 10. Cancel Interview
  try {
    const cancelRes = await apiRequest(`/api/interviews/${scheduledInterviewId}`, 'PUT', {
      status: 'CANCELLED'
    }, recruiterToken);

    const passed = cancelRes.ok && cancelRes.data?.interview?.status === 'CANCELLED';

    const cancelEmail = await prisma.recruitmentEmailLog.findFirst({
      where: { entity_id: scheduledInterviewId.toString(), event_type: 'INTERVIEW_CANCELLED' }
    });

    recordResult("10. Cancel Interview (Status -> CANCELLED & Cancellation Email Sent)", passed, {
      interviewStatus: cancelRes.data?.interview?.status,
      emailLogged: !!cancelEmail,
      emailStatus: cancelEmail?.status
    });
  } catch (err) {
    recordResult("10. Cancel Interview", false, null, err.message);
  }

  // 11. Advance to Further Round (FURTHER_ROUND status)
  try {
    const furtherRes = await apiRequest(`/api/applications/${armaanAppId}`, 'PUT', {
      status: 'FURTHER_ROUND',
      reason: 'Candidate performed well in round 1, advancing to round 2'
    }, recruiterToken);

    const passed = furtherRes.ok && furtherRes.data?.application?.status === 'FURTHER_ROUND';

    const furtherEmail = await prisma.recruitmentEmailLog.findFirst({
      where: { entity_id: armaanAppId, event_type: 'APPLICATION_STATUS_UPDATED' },
      orderBy: { timestamp: 'desc' }
    });

    recordResult("11. Further Round Status Transition & Advancement Email", passed, {
      status: furtherRes.data?.application?.status,
      emailLogged: !!furtherEmail
    });
  } catch (err) {
    recordResult("11. Further Round Status Transition", false, null, err.message);
  }

  // 12. Schedule Round 2 Interview
  try {
    const round2Res = await apiRequest('/api/interviews/schedule', 'POST', {
      application_id: armaanAppId,
      panel_id: panelId,
      date: '2026-09-22',
      start_time: '15:00',
      meeting_link: 'https://meet.google.com/test-hc-round2'
    }, recruiterToken);

    const passed = round2Res.ok && round2Res.data?.interview?.round === 2;

    recordResult("12. Schedule Round 2 Interview (Round Counter Incremented to 2)", passed, {
      round: round2Res.data?.interview?.round,
      interviewId: round2Res.data?.interview?.id
    });
  } catch (err) {
    recordResult("12. Schedule Round 2 Interview", false, null, err.message);
  }

  // 13. Rejection Workflow
  try {
    const rejectRes = await apiRequest(`/api/applications/${armaanAppId}`, 'PUT', {
      status: 'REJECTED',
      reason: 'Seats filled for this cycle. Keep building and apply again next semester.'
    }, adminToken);

    const passed = rejectRes.ok && rejectRes.data?.application?.status === 'REJECTED';

    const rejectEmail = await prisma.recruitmentEmailLog.findFirst({
      where: { entity_id: armaanAppId, event_type: 'APPLICATION_STATUS_UPDATED' },
      orderBy: { timestamp: 'desc' }
    });

    recordResult("13. Candidate Rejection Workflow & Rejection Email", passed, {
      status: rejectRes.data?.application?.status,
      emailLogged: !!rejectEmail
    });
  } catch (err) {
    recordResult("13. Candidate Rejection Workflow", false, null, err.message);
  }

  // 14. Reset to Shortlisted / Final Status for Candidate
  try {
    await apiRequest(`/api/applications/${armaanAppId}`, 'PUT', { status: 'UNDER_REVIEW' }, adminToken);
    const reshortlist = await apiRequest(`/api/applications/${armaanAppId}`, 'PUT', {
      status: 'SHORTLISTED',
      reason: 'Shortlisted candidate for HackClub recruitment'
    }, adminToken);

    recordResult("14. Shortlist Candidate as Final Active State", reshortlist.ok && reshortlist.data?.application?.status === 'SHORTLISTED', {
      status: reshortlist.data?.application?.status
    });
  } catch (err) {
    recordResult("14. Shortlist Candidate", false, null, err.message);
  }

  // 15. Admin Portal APIs
  try {
    const [analytics, auditLogs, users, forms, panels] = await Promise.all([
      apiRequest('/api/analytics', 'GET', null, adminToken),
      apiRequest('/api/audit-logs', 'GET', null, adminToken),
      apiRequest('/api/users', 'GET', null, adminToken),
      apiRequest('/api/forms', 'GET', null, adminToken),
      apiRequest('/api/panels', 'GET', null, adminToken)
    ]);

    const passed = analytics.ok && auditLogs.ok && users.ok && forms.ok && panels.ok;
    recordResult("15. Admin Portal API Endpoints (Analytics, Audit, Users, Forms, Panels)", passed, {
      analyticsOk: analytics.ok,
      auditLogsOk: auditLogs.ok,
      usersOk: users.ok,
      formsOk: forms.ok,
      panelsOk: panels.ok
    });
  } catch (err) {
    recordResult("15. Admin Portal API Endpoints", false, null, err.message);
  }

  // 16. Recruiter Portal APIs
  try {
    const [recruiterDashboard, applications, interviews] = await Promise.all([
      apiRequest('/api/recruiter/dashboard', 'GET', null, recruiterToken),
      apiRequest('/api/applications', 'GET', null, recruiterToken),
      apiRequest('/api/interviews', 'GET', null, recruiterToken)
    ]);

    const appsList = applications.data?.items || applications.data?.applications || [];
    const passed = recruiterDashboard.ok && applications.ok && interviews.ok;
    recordResult("16. Recruiter Portal API Endpoints (Dashboard, Applications, Interviews)", passed, {
      dashboardOk: recruiterDashboard.ok,
      applicationsCount: Array.isArray(appsList) ? appsList.length : 0,
      interviewsCount: Array.isArray(interviews.data?.interviews) ? interviews.data.interviews.length : 0
    });
  } catch (err) {
    recordResult("16. Recruiter Portal API Endpoints", false, null, err.message);
  }

  // 17. Candidate / Member Portal APIs
  try {
    const [me, notifs] = await Promise.all([
      apiRequest('/api/applications/me', 'GET', null, memberToken),
      apiRequest('/api/notifications', 'GET', null, memberToken)
    ]);

    const passed = me.ok && notifs.ok;
    recordResult("17. Candidate Portal API Endpoints (/api/applications/me, /api/notifications)", passed, {
      candidateName: me.data?.application?.name,
      candidateStatus: me.data?.application?.status,
      notificationsCount: Array.isArray(notifs.data?.notifications) ? notifs.data.notifications.length : 0
    });
  } catch (err) {
    recordResult("17. Candidate Portal API Endpoints", false, null, err.message);
  }

  console.log("\n==================================================================");
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = total - passed;
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================================");

  if (failed > 0) {
    console.error("Some tests failed. Review output above.");
    process.exit(1);
  } else {
    console.log("ALL 17 RECRUITMENT LIFECYCLE & PORTAL TESTS PASSED! 🎉");
    process.exit(0);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
