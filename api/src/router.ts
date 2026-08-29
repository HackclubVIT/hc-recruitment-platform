import { Router } from 'express';

// Analytics
import { GET as getAnalytics } from './routes/analytics.js';
// Applications
import { GET as getApplications, POST as createApplication } from './routes/applications.js';
import { GET as getApplicationById, PUT as updateApplication } from './routes/applications/[id].js';
// Audit Logs
import { GET as getAuditLogs } from './routes/audit-logs.js';
// Auth
import { POST as login } from './routes/auth/login.js';
import { POST as logout } from './routes/auth/logout.js';
import { GET as me } from './routes/auth/me.js';
// Candidates
import { GET as getCandidates } from './routes/candidates.js';
import { GET as getCandidateById } from './routes/candidates/[id].js';
// Feedback
import { POST as submitFeedback } from './routes/feedback.js';
// Forms
import { GET as getForms, POST as createForm } from './routes/forms.js';
import { GET as getFormById, PUT as updateForm, DELETE as deleteForm } from './routes/forms/[id].js';
import { POST as createQuestion } from './routes/forms/[id]/questions.js';
import { PUT as updateQuestion, DELETE as deleteQuestion } from './routes/forms/[id]/questions/[questionId].js';
// Health
import { GET as healthCheck } from './routes/health.js';
// Interviews
import { GET as getInterviews } from './routes/interviews.js';
import { POST as scheduleInterview } from './routes/interviews/schedule.js';
import { GET as getInterviewById, PUT as updateInterview } from './routes/interviews/[id].js';
// Notifications
import { GET as getNotifications } from './routes/notifications.js';
import { PUT as readNotifications } from './routes/notifications/read.js';
// Panels
import { GET as getPanels, POST as createPanel, PUT as updatePanel, DELETE as deletePanel } from './routes/panels.js';
import { GET as getPanelDashboard } from './routes/panels/dashboard.js';
import { POST as addPanelMember, DELETE as removePanelMember } from './routes/panels/members.js';
// Recruiter
import { GET as getRecruiterDashboard } from './routes/recruiter/dashboard.js';
// Users
import { GET as getUsers, PUT as updateUser, DELETE as deleteUser } from './routes/users.js';

export const router = Router();

// Health
router.get('/health', healthCheck);

// Auth
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.get('/auth/me', me);

// Users
router.get('/users', getUsers);
// router.post('/users', createUser);
router.put('/users', updateUser);
router.delete('/users', deleteUser);

// Forms
router.get('/forms', getForms);
router.post('/forms', createForm);
router.get('/forms/:id', getFormById);
router.put('/forms/:id', updateForm);
router.delete('/forms/:id', deleteForm);
router.post('/forms/:id/questions', createQuestion);
router.put('/forms/:id/questions/:questionId', updateQuestion);
router.delete('/forms/:id/questions/:questionId', deleteQuestion);

// Applications
router.get('/applications', getApplications);
router.post('/applications', createApplication);
router.get('/applications/:id', getApplicationById);
router.put('/applications/:id', updateApplication);

// Candidates
router.get('/candidates', getCandidates);
router.get('/candidates/:id', getCandidateById);

// Panels
router.get('/panels', getPanels);
router.post('/panels', createPanel);
router.put('/panels', updatePanel);
router.delete('/panels', deletePanel);
router.post('/panels/members', addPanelMember);
router.delete('/panels/members', removePanelMember);
router.get('/panels/dashboard', getPanelDashboard);

// Interviews
router.get('/interviews', getInterviews);
router.post('/interviews/schedule', scheduleInterview);
router.get('/interviews/:id', getInterviewById);
router.put('/interviews/:id', updateInterview);

// Feedback
router.post('/feedback', submitFeedback);

// Notifications
router.get('/notifications', getNotifications);
router.put('/notifications/read', readNotifications);

// Dashboards & Logs
router.get('/recruiter/dashboard', getRecruiterDashboard);
router.get('/analytics', getAnalytics);
router.get('/audit-logs', getAuditLogs);
