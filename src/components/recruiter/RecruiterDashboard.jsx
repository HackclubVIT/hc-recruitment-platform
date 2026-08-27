import { useState, useEffect } from 'react';
import { api } from '../../api';
import { HACKCLUB_DEPARTMENTS } from '../../data/departments';
import './RecruiterDashboard.css';

// Status class mapping
function statusClass(status) {
  const s = (status || '').toLowerCase().replace(/\s+/g, '_');
  if (s === 'pending') return 'rc-status-pending';
  if (s === 'applied') return 'rc-status-applied';
  if (s === 'under_review' || s === 'under review') return 'rc-status-review';
  if (s === 'shortlisted') return 'rc-status-shortlisted';
  if (s === 'rejected') return 'rc-status-rejected';
  if (s === 'accepted' || s === 'selected') return 'rc-status-accepted';
  if (s === 'interview_scheduled') return 'rc-status-interview_scheduled';
  if (s === 'interview_completed') return 'rc-status-interview_completed';
  if (s === 'waitlisted') return 'rc-status-waitlisted';
  return 'rc-status-pending';
}

function displayStatus(status) {
  return (status || 'Pending').replace(/_/g, ' ');
}

const SAMPLE_APPLICATIONS = [
  {
    id: 'rec-101',
    name: 'Aarav Sharma',
    email: 'aarav.sharma2024@vitstudent.ac.in',
    registerNumber: '24BCE1042',
    phoneNumber: '+91 98765 43210',
    firstPreference: 'Technical',
    secondPreference: 'Projects',
    domain: 'Technical',
    firstPrefReason: 'Passionate about full-stack web development and distributed systems. Built several React and Node.js projects.',
    secondPrefReason: 'Interested in managing technical milestones and participating in hackathon project sprints.',
    yearOfStudy: '2nd',
    skillLevel: 'Intermediate',
    technicalSkills: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'TypeScript'],
    github: 'https://github.com/aaravsharma',
    linkedin: 'https://linkedin.com/in/aaravsharma',
    portfolio: 'https://aarav.dev',
    whyHackclub: 'HackClub has the most active maker community at VIT Chennai. I want to build and ship impactful software with the team.',
    productiveWebsiteQuestions: 'I would prioritize real-time timetable integration, room-booking status, and an automated assignment reminder bot.',
    projectDetails: 'Developed a campus event hub with live QR ticket scanning and attendance tracking used by 400+ students.',
    skillToLearn: 'Rust and WebAssembly for high-performance frontend data processing.',
    status: 'Pending',
    appliedDate: '2026-02-20'
  },
  {
    id: 'rec-102',
    name: 'Diya Menon',
    email: 'diya.menon2024@vitstudent.ac.in',
    registerNumber: '24BDS1108',
    phoneNumber: '+91 98123 45678',
    firstPreference: 'Design & Social Media',
    secondPreference: 'Operations',
    domain: 'Design & Social Media',
    firstPrefReason: 'UI/UX designer with 2+ years of Figma experience creating design systems, brand guidelines, and 3D illustrations.',
    secondPrefReason: 'Strong logistics and team coordination experience from high school leadership.',
    yearOfStudy: '1st',
    skillLevel: 'Advanced',
    technicalSkills: ['Figma', 'Adobe Illustrator', 'Spline 3D', 'After Effects', 'Design Systems'],
    github: '',
    linkedin: 'https://linkedin.com/in/diyamendon',
    portfolio: 'https://behance.net/diyamendon',
    whyHackclub: 'I love the cyberpunk and retro terminal branding of HackClub and want to create motion graphics and posters for upcoming hackathons.',
    productiveWebsiteQuestions: 'A unified student portal with dark mode, customizable widgets, and quick shortcut launcher.',
    projectDetails: 'Redesigned the onboarding UI for a student freelance network with 90%+ positive usability feedback.',
    skillToLearn: 'Three.js and WebGL motion design for web experiences.',
    status: 'Under Review',
    appliedDate: '2026-02-21'
  },
  {
    id: 'rec-103',
    name: 'Rohan Kulkarni',
    email: 'rohan.kulkarni2024@vitstudent.ac.in',
    registerNumber: '24BCS1250',
    phoneNumber: '+91 97654 32109',
    firstPreference: 'Projects',
    secondPreference: 'Technical',
    domain: 'Projects',
    firstPrefReason: 'Experienced in Agile project management, sprint planning, and coordinating multi-disciplinary hackathon teams.',
    secondPrefReason: 'Hands-on backend development background in Python and Go.',
    yearOfStudy: '2nd',
    skillLevel: 'Intermediate',
    technicalSkills: ['Python', 'FastAPI', 'Go', 'Git', 'Jira', 'Agile'],
    github: 'https://github.com/rohankulkarni',
    linkedin: 'https://linkedin.com/in/rohankulkarni',
    portfolio: '',
    whyHackclub: 'HackClub fosters rapid prototyping and real-world project delivery. I want to lead collaborative builds.',
    productiveWebsiteQuestions: 'A sprint board integrated with student calendar and automated deadline tracking.',
    projectDetails: 'Led a team of 4 to build an automated hostel leave approval Telegram bot.',
    skillToLearn: 'Kubernetes orchestration and CI/CD pipelines.',
    status: 'Shortlisted',
    appliedDate: '2026-02-22'
  },
  {
    id: 'rec-104',
    name: 'Ananya Deshmukh',
    email: 'ananya.deshmukh2025@vitstudent.ac.in',
    registerNumber: '25BCE2011',
    phoneNumber: '+91 99887 76655',
    firstPreference: 'Research & Development',
    secondPreference: 'Technical',
    domain: 'Research & Development',
    firstPrefReason: 'Conducting research on lightweight LLM quantization and edge inference for low-compute devices.',
    secondPrefReason: 'Keen on building deployment pipelines for AI prototypes.',
    yearOfStudy: '1st',
    skillLevel: 'Intermediate',
    technicalSkills: ['PyTorch', 'HuggingFace', 'Python', 'CUDA', 'C++'],
    github: 'https://github.com/ananyadeshmukh',
    linkedin: 'https://linkedin.com/in/ananyadeshmukh',
    portfolio: 'https://ananya.ai',
    whyHackclub: 'HackClub provides the community and support to turn AI research into open-source tools for students.',
    productiveWebsiteQuestions: 'An AI-powered academic paper summarizer and citation graph explorer for coursework.',
    projectDetails: 'Published open-source quantized model benchmarks on HuggingFace with 1,200+ downloads.',
    skillToLearn: 'ONNX runtime optimization and browser-based WebGPU inference.',
    status: 'Shortlisted',
    appliedDate: '2026-02-23'
  },
  {
    id: 'rec-105',
    name: 'Vikramaditya Nair',
    email: 'vikram.nair2024@vitstudent.ac.in',
    registerNumber: '24BEC1190',
    phoneNumber: '+91 98223 34455',
    firstPreference: 'Operations',
    secondPreference: 'Finance',
    domain: 'Operations',
    firstPrefReason: 'Organized major inter-college fests, managed venue logistics, guest speaker communications, and crowd management.',
    secondPrefReason: 'Budget forecasting and sponsorship acquisition experience.',
    yearOfStudy: '2nd',
    skillLevel: 'Beginner',
    technicalSkills: ['Event Management', 'Public Relations', 'Notion', 'Vendor Logistics'],
    github: '',
    linkedin: 'https://linkedin.com/in/vikramnair',
    portfolio: '',
    whyHackclub: 'Want to execute the smoothest and most energetic hackathons in south India under HackClub banner.',
    productiveWebsiteQuestions: 'A centralized room reservation and audio-visual equipment check-out dashboard.',
    projectDetails: 'Managed 30+ volunteer team for a 500-attendee robotics workshop.',
    skillToLearn: 'Data analytics for attendee engagement tracking.',
    status: 'Pending',
    appliedDate: '2026-02-24'
  },
  {
    id: 'rec-106',
    name: 'Meera Iyer',
    email: 'meera.iyer2024@vitstudent.ac.in',
    registerNumber: '24BBA1030',
    phoneNumber: '+91 97112 23344',
    firstPreference: 'Finance',
    secondPreference: 'Operations',
    domain: 'Finance',
    firstPrefReason: 'Skilled in budget allocation, corporate sponsorship pitching, and financial auditing.',
    secondPrefReason: 'Coordination and sponsor relationship management.',
    yearOfStudy: '2nd',
    skillLevel: 'Beginner',
    technicalSkills: ['Excel / Sheets', 'Financial Modeling', 'Sponsorship Pitching', 'Canva'],
    github: '',
    linkedin: 'https://linkedin.com/in/meeraiyer',
    portfolio: '',
    whyHackclub: 'HackClub needs solid funding to give hackers free hardware, swag, and prizes. I will bring top tier sponsors.',
    productiveWebsiteQuestions: 'A student expense splitting and club reimbursement tracker.',
    projectDetails: 'Secured INR 1.5 Lakhs in corporate sponsorship for a national debate tournament.',
    skillToLearn: 'SQL for financial dashboarding.',
    status: 'Under Review',
    appliedDate: '2026-02-24'
  },
  {
    id: 'rec-107',
    name: 'Siddharth Roy',
    email: 'siddharth.roy2025@vitstudent.ac.in',
    registerNumber: '25BCE1892',
    phoneNumber: '+91 96554 43322',
    firstPreference: 'Technical',
    secondPreference: 'Research & Development',
    domain: 'Technical',
    firstPrefReason: 'Low-level systems programming enthusiast with experience in Linux kernel modules and network protocols.',
    secondPrefReason: 'Hardware security and reverse engineering interests.',
    yearOfStudy: '1st',
    skillLevel: 'Advanced',
    technicalSkills: ['C', 'Rust', 'Linux', 'GDB', 'Wireshark', 'Socket Programming'],
    github: 'https://github.com/siddharthroy',
    linkedin: 'https://linkedin.com/in/siddharthroy',
    portfolio: '',
    whyHackclub: 'Want to organize CTF challenges, Linux workshops, and open hardware hacking sessions.',
    productiveWebsiteQuestions: 'A terminal-based CLI tool for campus Wi-Fi authentication and timetable querying.',
    projectDetails: 'Built a custom TCP/IP stack in user-space in Rust.',
    skillToLearn: 'Embedded systems development on ESP32 / RISC-V.',
    status: 'Shortlisted',
    appliedDate: '2026-02-25'
  },
  {
    id: 'rec-108',
    name: 'Kavya Pillai',
    email: 'kavya.pillai2024@vitstudent.ac.in',
    registerNumber: '24BPS1001',
    phoneNumber: '+91 95443 32211',
    firstPreference: 'Design & Social Media',
    secondPreference: 'Projects',
    domain: 'Design & Social Media',
    firstPrefReason: 'Content creator and social media manager with 10k+ tech followers on Instagram and LinkedIn.',
    secondPrefReason: 'Campaign management and creative hackathon branding.',
    yearOfStudy: '2nd',
    skillLevel: 'Intermediate',
    technicalSkills: ['Premiere Pro', 'Figma', 'Copywriting', 'SEO', 'Content Strategy'],
    github: '',
    linkedin: 'https://linkedin.com/in/kavyapillai',
    portfolio: 'https://instagram.com/kavya.creates',
    whyHackclub: 'Want to make HackClub VIT Chennai the most viral and engaging student tech community on campus.',
    productiveWebsiteQuestions: 'A campus event discovery platform with video reels and countdown timers.',
    projectDetails: 'Grew club social impressions by 340% over one semester through viral dev meme campaigns.',
    skillToLearn: 'Blender 3D typography and interactive web animations.',
    status: 'Rejected',
    appliedDate: '2026-02-19'
  }
];

// Generate 10-minute time slots from startHour to endHour (exclusive)
function generate10MinSlots(startHour = 9, endHour = 19) {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += 10) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}
const TIME_SLOTS = generate10MinSlots(9, 19);

function addMinutes(hhmm, mins) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// Interview status helpers
function ivStatusClass(status) {
  const s = (status || '').toUpperCase();
  if (s === 'SCHEDULED') return 'rc-status-interview_scheduled';
  if (s === 'COMPLETED') return 'rc-status-interview_completed';
  if (s === 'CANCELLED') return 'rc-status-rejected';
  if (s === 'RESCHEDULED') return 'rc-status-review';
  return 'rc-status-pending';
}

export default function RecruiterDashboard({ onLogout, isPreview = false }) {
  const [activeView, setActiveView] = useState('overview');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appError, setAppError] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // User auth & department assignments
  const [userRole, setUserRole] = useState('recruiter');
  const [assignedDepts, setAssignedDepts] = useState(['Technical', 'Projects']);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Detail view
  const [selectedApp, setSelectedApp] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // ── Interviews state ──────────────────────────────────────────────
  const [interviews, setInterviews] = useState([]);
  const [interviewsLoading, setInterviewsLoading] = useState(false);
  const [interviewsError, setInterviewsError] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);

  // Schedule modal
  const [scheduleFor, setScheduleFor] = useState(null); // application object
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Reschedule modal — reuses ScheduleModal with prefilled interview
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

  // Toast
  const [toast, setToast] = useState(null); // { msg, type: 'success'|'error' }

  // Load user profile & department assignments
  useEffect(() => {
    (async () => {
      try {
        const p = await api.getProfile();
        if (p) {
          const r = (p.role || '').toLowerCase();
          setUserRole(r);
          if (r === 'admin') {
            setAssignedDepts(HACKCLUB_DEPARTMENTS);
          } else if (p.email === 'recruiter@vitstudent.ac.in') {
            setAssignedDepts(['Technical', 'Projects']);
          }
        }
      } catch (err) {
        console.warn('Could not load recruiter profile:', err.message);
      }
    })();
  }, []);

  const canManageDept = (dept) => {
    if (isPreview || userRole === 'admin') return true;
    if (!dept) return false;
    return assignedDepts.includes(dept);
  };

  // ── Load interviews when tab opens ───────────────────────────────
  useEffect(() => {
    if (activeView !== 'interviews') return;
    let cancelled = false;
    (async () => {
      setInterviewsLoading(true);
      setInterviewsError(null);
      try {
        const data = await api.getRecruitmentInterviews();
        if (!cancelled) setInterviews(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setInterviewsError(err.message || 'Failed to load interviews.');
      } finally {
        if (!cancelled) setInterviewsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeView]);

  const refreshInterviews = async () => {
    try {
      const data = await api.getRecruitmentInterviews();
      setInterviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not refresh interviews:', err.message);
    }
  };

  // ── Toast helper ─────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Interview actions ─────────────────────────────────────────────
  const handleOpenSchedule = (app, dept) => {
    const targetDept = dept || app.targetDepartment || app.firstPreference || app.domain;
    setScheduleFor({ ...app, targetDepartment: targetDept });
    setRescheduleTarget(null);
    setShowScheduleModal(true);
  };

  const handleOpenReschedule = (interview) => {
    setRescheduleTarget(interview);
    setScheduleFor(null);
    setShowScheduleModal(true);
    setSelectedInterview(null);
  };

  const handleCancelInterview = async (interview) => {
    if (!window.confirm(`Are you sure you want to cancel the interview for ${interview.candidateName}?`)) return;
    try {
      await api.cancelRecruitmentInterview(interview.id);
      await refreshInterviews();
      setSelectedInterview(null);
      showToast('Interview cancelled successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to cancel interview.', 'error');
    }
  };

  const handleScheduleSubmit = async (payload) => {
    try {
      if (rescheduleTarget) {
        await api.updateRecruitmentInterview(rescheduleTarget.id, {
          interviewDate: payload.interviewDate,
          startTime: payload.startTime,
          endTime: payload.endTime,
          meetingUrl: payload.meetingUrl,
          panelMembers: payload.panelMembers,
        });
        showToast('Interview rescheduled successfully.');
      } else {
        await api.scheduleRecruitmentInterview(payload);
        showToast('Interview scheduled successfully.');
      }
      setShowScheduleModal(false);
      setScheduleFor(null);
      setRescheduleTarget(null);
      await refreshInterviews();
      if (activeView !== 'interviews') setActiveView('interviews');
    } catch (err) {
      // Surface 409 conflicts clearly
      const msg = err.message || 'Failed to schedule interview.';
      throw new Error(msg, { cause: err });
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setAppError(null);
      try {
        if (isPreview) {
          if (!cancelled) setApplications(SAMPLE_APPLICATIONS);
          return;
        }
        const apps = await api.getRecruitmentApplications();
        if (!cancelled) {
          setApplications(Array.isArray(apps) ? apps : []);
        }
      } catch (err) {
        console.error('Failed to load recruitment applications:', err.message || err);
        if (!cancelled) {
          setAppError(err.message || 'Failed to load recruitment applications.');
          setApplications([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isPreview]);

  const handleStatusUpdate = async (appId, newStatus, dept) => {
    setUpdatingId(`${appId}-${dept || 'all'}`);
    try {
      if (isPreview) {
        setApplications(prev => prev.map(a => {
          if (String(a.id) !== String(appId)) return a;
          let firstPrefStatus = a.firstPrefStatus || a.status;
          let secondPrefStatus = a.secondPrefStatus || 'None';
          if (a.firstPreference === dept) firstPrefStatus = newStatus;
          if (a.secondPreference === dept) secondPrefStatus = newStatus;
          return { ...a, firstPrefStatus, secondPrefStatus, status: newStatus };
        }));
        if (selectedApp && String(selectedApp.id) === String(appId)) {
          setSelectedApp(prev => ({
            ...prev,
            firstPrefStatus: prev.firstPreference === dept ? newStatus : prev.firstPrefStatus,
            secondPrefStatus: prev.secondPreference === dept ? newStatus : prev.secondPrefStatus,
            status: newStatus
          }));
        }
        showToast(`Updated ${dept || 'application'} status to ${newStatus}`);
        return;
      }
      const res = await api.updateRecruitmentApplicationStatus(appId, newStatus, dept);
      const updatedApp = res.application;
      if (updatedApp) {
        setApplications(prev => prev.map(a =>
          String(a.id) === String(appId) ? { ...a, ...updatedApp } : a
        ));
        if (selectedApp && String(selectedApp.id) === String(appId)) {
          setSelectedApp(prev => ({ ...prev, ...updatedApp }));
        }
      } else {
        setApplications(prev => prev.map(a => {
          if (String(a.id) !== String(appId)) return a;
          let firstPrefStatus = a.firstPrefStatus || a.status;
          let secondPrefStatus = a.secondPrefStatus || 'None';
          if (a.firstPreference === dept) firstPrefStatus = newStatus;
          if (a.secondPreference === dept) secondPrefStatus = newStatus;
          return { ...a, firstPrefStatus, secondPrefStatus, status: newStatus };
        }));
      }
      showToast(res.message || `Updated ${dept || 'application'} status to ${newStatus}`);
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Compute stats
  const totalApps = applications.length;
  const pendingCount = applications.filter(a =>
    ['Pending', 'APPLIED', 'Applied'].includes(a.status)
  ).length;
  const reviewCount = applications.filter(a =>
    ['Under Review', 'UNDER_REVIEW'].includes(a.status)
  ).length;
  const shortlistedCount = applications.filter(a =>
    ['Shortlisted', 'SHORTLISTED'].includes(a.status)
  ).length;
  const rejectedCount = applications.filter(a =>
    ['Rejected', 'REJECTED'].includes(a.status)
  ).length;

  // Status options for filter
  const allStatuses = ['Pending', 'Under Review', 'Shortlisted', 'Accepted', 'Rejected'];

  // Filtered applications
  const filtered = applications.filter(app => {
    const matchSearch = !searchTerm || [
      app.name, app.email, app.registerNumber,
      app.firstPreference, app.secondPreference, app.domain
    ].some(f => (f || '').toLowerCase().includes(searchTerm.toLowerCase()));

    const matchDept = filterDept === 'All' ||
      app.firstPreference === filterDept ||
      app.secondPreference === filterDept ||
      app.domain === filterDept;

    let appStatusForFilter = app.status;
    if (filterDept !== 'All') {
      if (app.firstPreference === filterDept) {
        appStatusForFilter = app.firstPrefStatus || app.status || 'Pending';
      } else if (app.secondPreference === filterDept) {
        appStatusForFilter = app.secondPrefStatus || 'Pending';
      }
    }

    const matchStatus = filterStatus === 'All' ||
      appStatusForFilter === filterStatus ||
      app.status === filterStatus;

    return matchSearch && matchDept && matchStatus;
  });

  // Department stats
  const deptStats = HACKCLUB_DEPARTMENTS.map(dept => {
    const deptApps = applications.filter(a =>
      a.firstPreference === dept || a.secondPreference === dept || a.domain === dept
    );
    return {
      name: dept,
      total: deptApps.length,
      pending: deptApps.filter(a => {
        const s = a.firstPreference === dept ? (a.firstPrefStatus || a.status) : a.secondPrefStatus;
        return ['Pending', 'APPLIED', 'Applied'].includes(s);
      }).length,
      shortlisted: deptApps.filter(a => {
        const s = a.firstPreference === dept ? (a.firstPrefStatus || a.status) : a.secondPrefStatus;
        return ['Shortlisted', 'SHORTLISTED'].includes(s);
      }).length,
      rejected: deptApps.filter(a => {
        const s = a.firstPreference === dept ? (a.firstPrefStatus || a.status) : a.secondPrefStatus;
        return ['Rejected', 'REJECTED'].includes(s);
      }).length,
    };
  });

  const navItems = [
    { key: 'overview', label: 'Overview' },
    { key: 'applications', label: 'Applications' },
    { key: 'departments', label: 'Departments' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'interviews', label: 'Interviews' },
  ];

  return (
    <div className="recruiter-shell">
      {/* Top Navigation */}
      <nav className="recruiter-topnav">
        <div className="recruiter-topnav-brand">
          <div className="brand-icon">H</div>
          <div>
            <h1>HACKCLUB</h1>
            <div className="brand-label">RECRUITMENT CONTROL</div>
          </div>
        </div>

        <div className={`recruiter-nav-links${mobileNavOpen ? ' mobile-open' : ''}`}>
          {navItems.map(item => (
            <button
              key={item.key}
              className={`recruiter-nav-link${activeView === item.key ? ' active' : ''}`}
              onClick={() => { setActiveView(item.key); setMobileNavOpen(false); }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="recruiter-topnav-actions">
          <span className="cycle-badge">RECRUITMENT &apos;26</span>
          <button className="recruiter-mobile-toggle" onClick={() => setMobileNavOpen(v => !v)}>
            {mobileNavOpen ? '✕' : '☰'}
          </button>
          <button className="recruiter-logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="recruiter-main">
        {appError && (
          <div className="rc-schedule-error" style={{ marginBottom: '20px' }}>
            ⚠ {appError}
          </div>
        )}
        {loading ? (
          <div className="rc-loading"><div className="rc-spinner" /></div>
        ) : activeView === 'overview' ? (
          <OverviewView
            totalApps={totalApps}
            pendingCount={pendingCount}
            reviewCount={reviewCount}
            shortlistedCount={shortlistedCount}
            rejectedCount={rejectedCount}
            recentApps={applications.slice(0, 8)}
            onViewAll={() => setActiveView('applications')}
            onSelectApp={setSelectedApp}
          />
        ) : activeView === 'applications' ? (
          <ApplicationsView
            applications={filtered}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterDept={filterDept}
            setFilterDept={setFilterDept}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            allStatuses={allStatuses}
            onSelectApp={setSelectedApp}
            onStatusUpdate={handleStatusUpdate}
            updatingId={updatingId}
            canManageDept={canManageDept}
          />
        ) : activeView === 'departments' ? (
          <DepartmentsView deptStats={deptStats} />
        ) : activeView === 'analytics' ? (
          <AnalyticsView
            totalApps={totalApps}
            reviewCount={reviewCount}
            shortlistedCount={shortlistedCount}
            deptStats={deptStats}
            applications={applications}
          />
        ) : activeView === 'interviews' ? (
          <InterviewsView
            interviews={interviews}
            loading={interviewsLoading}
            error={interviewsError}
            onSelectInterview={setSelectedInterview}
            onReschedule={handleOpenReschedule}
            onCancel={handleCancelInterview}
          />
        ) : null}
      </main>

      {/* Application Detail Modal */}
      {selectedApp && (
        <ApplicationDetail
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onStatusUpdate={handleStatusUpdate}
          updatingId={updatingId}
          onScheduleInterview={handleOpenSchedule}
          canManageDept={canManageDept}
        />
      )}

      {/* Interview Detail Modal */}
      {selectedInterview && (
        <InterviewDetailModal
          interview={selectedInterview}
          onClose={() => setSelectedInterview(null)}
          onReschedule={handleOpenReschedule}
          onCancel={handleCancelInterview}
        />
      )}

      {/* Schedule / Reschedule Modal */}
      {showScheduleModal && (
        <ScheduleInterviewModal
          application={scheduleFor}
          rescheduleTarget={rescheduleTarget}
          onClose={() => { setShowScheduleModal(false); setScheduleFor(null); setRescheduleTarget(null); }}
          onSubmit={handleScheduleSubmit}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`rc-toast rc-toast-${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}

/* ==============================
   OVERVIEW VIEW
   ============================== */
function OverviewView({ totalApps, pendingCount, reviewCount, shortlistedCount, rejectedCount, recentApps, onViewAll, onSelectApp }) {
  return (
    <>
      <div className="rc-section-header">
        <div className="rc-eyebrow"><span className="rc-diamond">◇</span> RECRUITMENT // CONTROL</div>
        <h2>Recruitment <span className="rc-accent">Dashboard</span></h2>
        <p className="rc-subtitle">
          HackClub VIT Chennai — Recruitment Cycle 2026. Monitor applications, track progress, and manage the selection pipeline.
        </p>
      </div>

      <div className="rc-stats-grid">
        <div className="rc-stat-card rc-stat-accent">
          <div className="rc-stat-value">{totalApps}</div>
          <div className="rc-stat-label">Total Applications</div>
        </div>
        <div className="rc-stat-card">
          <div className="rc-stat-value">{pendingCount}</div>
          <div className="rc-stat-label">Pending Review</div>
        </div>
        <div className="rc-stat-card">
          <div className="rc-stat-value">{reviewCount}</div>
          <div className="rc-stat-label">Under Review</div>
        </div>
        <div className="rc-stat-card">
          <div className="rc-stat-value">{shortlistedCount}</div>
          <div className="rc-stat-label">Shortlisted</div>
        </div>
        <div className="rc-stat-card">
          <div className="rc-stat-value">{rejectedCount}</div>
          <div className="rc-stat-label">Rejected</div>
        </div>
      </div>

      {/* Recent Applications Preview */}
      <div className="rc-section-header" style={{ marginTop: '12px' }}>
        <div className="rc-eyebrow"><span className="rc-diamond">◇</span> RECENT APPLICATIONS</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Application <span className="rc-accent">Log</span></h2>
          <button className="rc-btn rc-btn-secondary" onClick={onViewAll}>View All →</button>
        </div>
      </div>

      {recentApps.length > 0 ? (
        <div className="rc-table-wrap">
          <table className="rc-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Email</th>
                <th>Preferences</th>
                <th>Overall Status</th>
                <th>Applied</th>
              </tr>
            </thead>
            <tbody>
              {recentApps.map(app => (
                <tr key={app.id} onClick={() => onSelectApp(app)}>
                  <td>{app.name}</td>
                  <td className="rc-td-email">{app.email}</td>
                  <td className="rc-td-dept">
                    <div className="rc-dept-pref-cell">
                      <div className="rc-dept-pref-item">
                        <span className="rc-pref-tag">1st</span> {app.firstPreference || app.domain || '—'}
                      </div>
                      {app.secondPreference && app.secondPreference !== 'None' && (
                        <div className="rc-dept-pref-item">
                          <span className="rc-pref-tag">2nd</span> {app.secondPreference}
                        </div>
                      )}
                    </div>
                  </td>
                  <td><span className={`rc-status ${statusClass(app.status)}`}>{displayStatus(app.status)}</span></td>
                  <td className="rc-td-date">{app.appliedDate || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rc-empty">
          <div className="rc-empty-icon">📋</div>
          <p className="rc-empty-text">No applications received yet.</p>
        </div>
      )}
    </>
  );
}

/* ==============================
   APPLICATIONS VIEW
   ============================== */
function ApplicationsView({ applications, searchTerm, setSearchTerm, filterDept, setFilterDept, filterStatus, setFilterStatus, allStatuses, onSelectApp, onStatusUpdate, updatingId, canManageDept }) {
  const isFilteredByDept = filterDept !== 'All';

  return (
    <>
      <div className="rc-section-header">
        <div className="rc-eyebrow"><span className="rc-diamond">◇</span> APPLICATION LOG</div>
        <h2>All <span className="rc-accent">Applications</span></h2>
      </div>

      <div className="rc-filter-bar">
        <input
          type="text"
          className="rc-search-input"
          placeholder="Search by name, email, register number..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}>
          <option value="All">All Departments</option>
          {HACKCLUB_DEPARTMENTS.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          {allStatuses.map(s => (
            <option key={s} value={s}>{displayStatus(s)}</option>
          ))}
        </select>
      </div>

      <div className="rc-results-count">{applications.length} result{applications.length !== 1 ? 's' : ''}</div>

      {applications.length > 0 ? (
        <div className="rc-table-wrap">
          <table className="rc-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Email</th>
                <th>{isFilteredByDept ? 'Department Preference' : 'Preferences & Decisions'}</th>
                <th>Year</th>
                <th>{isFilteredByDept ? `${filterDept} Status` : 'Overall Status'}</th>
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => {
                const isFirst = app.firstPreference === filterDept || (!app.secondPreference && app.domain === filterDept);
                const isSecond = app.secondPreference === filterDept;
                const deptStatus = isFilteredByDept
                  ? (isFirst ? (app.firstPrefStatus || app.status || 'Pending') : (app.secondPrefStatus || 'Pending'))
                  : app.status;

                const authorizedForAction = isFilteredByDept ? canManageDept(filterDept) : false;

                return (
                  <tr key={app.id} onClick={() => onSelectApp(app)}>
                    <td>{app.name}</td>
                    <td className="rc-td-email">{app.email}</td>
                    <td className="rc-td-dept">
                      {isFilteredByDept ? (
                        <div className="rc-dept-pref-cell">
                          <div className="rc-dept-main">
                            <span className="rc-dept-pill">{filterDept}</span>
                            <span className="rc-pref-rank-badge">{isFirst ? '1st Pref' : '2nd Pref'}</span>
                          </div>
                          {isFirst && app.secondPreference && app.secondPreference !== 'None' && (
                            <div className="rc-dept-sub">
                              2nd Pref: {app.secondPreference} ({displayStatus(app.secondPrefStatus || 'Pending')})
                            </div>
                          )}
                          {isSecond && (
                            <div className="rc-dept-sub">
                              1st Pref: {app.firstPreference || app.domain} ({displayStatus(app.firstPrefStatus || app.status || 'Pending')})
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rc-dept-pref-cell">
                          <div className="rc-dept-pref-item">
                            <span className="rc-pref-tag">1st</span>
                            <span style={{ fontWeight: 600 }}>{app.firstPreference || app.domain || '—'}</span>
                            <span className={`rc-status-mini ${statusClass(app.firstPrefStatus || app.status)}`}>
                              {displayStatus(app.firstPrefStatus || app.status)}
                            </span>
                          </div>
                          {app.secondPreference && app.secondPreference !== 'None' && (
                            <div className="rc-dept-pref-item">
                              <span className="rc-pref-tag">2nd</span>
                              <span style={{ fontWeight: 600 }}>{app.secondPreference}</span>
                              <span className={`rc-status-mini ${statusClass(app.secondPrefStatus || 'Pending')}`}>
                                {displayStatus(app.secondPrefStatus || 'Pending')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{app.yearOfStudy || '—'}</td>
                    <td>
                      <span className={`rc-status ${statusClass(deptStatus)}`}>
                        {displayStatus(deptStatus)}
                      </span>
                    </td>
                    <td className="rc-td-date">{app.appliedDate || '—'}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="rc-actions">
                        {isFilteredByDept ? (
                          authorizedForAction ? (
                            <>
                              {deptStatus !== 'Shortlisted' && (
                                <button
                                  className="rc-btn rc-btn-shortlist"
                                  disabled={updatingId !== null}
                                  onClick={() => onStatusUpdate(app.id, 'Shortlisted', filterDept)}
                                >Shortlist</button>
                              )}
                              {deptStatus !== 'Rejected' && (
                                <button
                                  className="rc-btn rc-btn-reject"
                                  disabled={updatingId !== null}
                                  onClick={() => onStatusUpdate(app.id, 'Rejected', filterDept)}
                                >Reject</button>
                              )}
                            </>
                          ) : (
                            <span className="rc-badge-viewonly" style={{ padding: '3px 8px', fontSize: '0.68rem' }}>
                              View Only
                            </span>
                          )
                        ) : (
                          <button
                            className="rc-btn rc-btn-secondary"
                            onClick={() => onSelectApp(app)}
                          >
                            Review →
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rc-empty">
          <div className="rc-empty-icon">🔍</div>
          <p className="rc-empty-text">No applications match the current filters.</p>
        </div>
      )}
    </>
  );
}

/* ==============================
   DEPARTMENTS VIEW
   ============================== */
function DepartmentsView({ deptStats }) {
  return (
    <>
      <div className="rc-section-header">
        <div className="rc-eyebrow"><span className="rc-diamond">◇</span> DEPARTMENT STATUS</div>
        <h2>Department <span className="rc-accent">Overview</span></h2>
        <p className="rc-subtitle">Application distribution across HackClub departments.</p>
      </div>

      <div className="rc-dept-grid">
        {deptStats.map(dept => (
          <div className="rc-dept-card" key={dept.name}>
            <div className="rc-dept-eyebrow">DEPARTMENT</div>
            <div className="rc-dept-name">{dept.name}</div>
            <div className="rc-dept-stats">
              <div className="rc-dept-stat">
                <span className="rc-ds-value">{dept.total}</span>
                <span className="rc-ds-label">Total</span>
              </div>
              <div className="rc-dept-stat">
                <span className="rc-ds-value" style={{ color: 'var(--highlight)' }}>{dept.pending}</span>
                <span className="rc-ds-label">Pending</span>
              </div>
              <div className="rc-dept-stat">
                <span className="rc-ds-value" style={{ color: '#4caf50' }}>{dept.shortlisted}</span>
                <span className="rc-ds-label">Short.</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ==============================
   ANALYTICS VIEW
   ============================== */
function AnalyticsView({ totalApps, reviewCount, shortlistedCount, deptStats, applications }) {
  const acceptedCount = applications.filter(a => ['Accepted', 'SELECTED', 'Selected'].includes(a.status)).length;
  const maxDeptTotal = Math.max(...deptStats.map(d => d.total), 1);

  // Status breakdown
  const statusGroups = {};
  applications.forEach(a => {
    const s = displayStatus(a.status);
    statusGroups[s] = (statusGroups[s] || 0) + 1;
  });
  const maxStatusCount = Math.max(...Object.values(statusGroups), 1);

  return (
    <>
      <div className="rc-section-header">
        <div className="rc-eyebrow"><span className="rc-diamond">◇</span> MISSION METRICS</div>
        <h2>Recruitment <span className="rc-accent">Analytics</span></h2>
        <p className="rc-subtitle">Pipeline overview and application metrics for the current recruitment cycle.</p>
      </div>

      <div className="rc-analytics-grid">
        {/* Application Flow */}
        <div className="rc-analytics-card">
          <div className="rc-ac-title"><span className="rc-diamond">◇</span> APPLICATION FLOW</div>
          <div className="rc-flow-pipeline">
            <div className="rc-flow-stage">
              <div className="rc-fs-value">{totalApps}</div>
              <div className="rc-fs-label">Applied</div>
            </div>
            <div className="rc-flow-arrow">→</div>
            <div className="rc-flow-stage">
              <div className="rc-fs-value">{reviewCount}</div>
              <div className="rc-fs-label">Review</div>
            </div>
            <div className="rc-flow-arrow">→</div>
            <div className="rc-flow-stage">
              <div className="rc-fs-value">{shortlistedCount}</div>
              <div className="rc-fs-label">Shortlisted</div>
            </div>
            <div className="rc-flow-arrow">→</div>
            <div className="rc-flow-stage">
              <div className="rc-fs-value">{acceptedCount}</div>
              <div className="rc-fs-label">Selected</div>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="rc-analytics-card">
          <div className="rc-ac-title"><span className="rc-diamond">◇</span> STATUS BREAKDOWN</div>
          <div className="rc-bar-chart">
            {Object.entries(statusGroups).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
              <div className="rc-bar-row" key={status}>
                <span className="rc-bar-label">{status}</span>
                <div className="rc-bar-track">
                  <div className="rc-bar-fill" style={{ width: `${(count / maxStatusCount) * 100}%` }} />
                </div>
                <span className="rc-bar-value">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Distribution */}
        <div className="rc-analytics-card" style={{ gridColumn: '1 / -1' }}>
          <div className="rc-ac-title"><span className="rc-diamond">◇</span> DEPARTMENT DISTRIBUTION</div>
          <div className="rc-bar-chart">
            {deptStats.sort((a, b) => b.total - a.total).map(dept => (
              <div className="rc-bar-row" key={dept.name}>
                <span className="rc-bar-label">{dept.name}</span>
                <div className="rc-bar-track">
                  <div className="rc-bar-fill" style={{ width: `${(dept.total / maxDeptTotal) * 100}%` }} />
                </div>
                <span className="rc-bar-value">{dept.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ==============================
   APPLICATION DETAIL MODAL
   ============================== */
function ApplicationDetail({ app, onClose, onStatusUpdate, updatingId, onScheduleInterview, canManageDept }) {
  const isUpdating = updatingId !== null;

  const dept1 = app.firstPreference || app.domain || '';
  const status1 = app.firstPrefStatus || app.status || 'Pending';
  const reason1 = app.firstPrefReason || app.whyJoin || '';

  const hasSecond = app.secondPreference && app.secondPreference !== 'None';
  const dept2 = app.secondPreference || '';
  const status2 = app.secondPrefStatus || 'Pending';
  const reason2 = app.secondPrefReason || '';

  const canManage1 = canManageDept(dept1);
  const canManage2 = hasSecond && canManageDept(dept2);

  return (
    <div className="rc-detail-backdrop" onClick={onClose}>
      <div className="rc-detail-panel" onClick={e => e.stopPropagation()}>
        <div className="rc-detail-header">
          <div>
            <div className="rc-eyebrow" style={{ marginBottom: '4px' }}>
              <span className="rc-diamond">◇</span> APPLICANT // PROFILE
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>{app.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: '0.82rem', marginTop: '4px' }}>
              {app.registerNumber} • {app.yearOfStudy} Year • Applied {app.appliedDate || '—'}
            </p>
          </div>
          <button className="rc-detail-close" onClick={onClose}>×</button>
        </div>

        {/* Contact & Info */}
        <div className="rc-detail-grid">
          <div className="rc-detail-field">
            <span className="rc-df-label">Email</span>
            <span className="rc-df-value">{app.email}</span>
          </div>
          <div className="rc-detail-field">
            <span className="rc-df-label">Phone</span>
            <span className="rc-df-value">{app.phoneNumber || 'N/A'}</span>
          </div>
          <div className="rc-detail-field">
            <span className="rc-df-label">Overall Application Status</span>
            <span className={`rc-status ${statusClass(app.status)}`}>{displayStatus(app.status)}</span>
          </div>
          <div className="rc-detail-field">
            <span className="rc-df-label">Skill Level</span>
            <span className="rc-df-value">{app.skillLevel || 'N/A'}</span>
          </div>
        </div>

        {/* Department Preferences Section */}
        <div className="rc-detail-section" style={{ marginTop: '12px', marginBottom: '16px' }}>
          <div className="rc-ds-title"><span className="rc-diamond">◇</span> DEPARTMENT PREFERENCES</div>
          <div className="rc-prefs-container">
            {/* Preference 1 Card */}
            <div className={`rc-pref-card${canManage1 ? ' rc-pref-active' : ''}`}>
              <div className="rc-pref-card-header">
                <div className="rc-pref-card-title">
                  <span className="rc-pref-num">1</span>
                  <span className="rc-pref-dept-name">{dept1}</span>
                </div>
                <span className={`rc-status ${statusClass(status1)}`}>
                  Status: {displayStatus(status1)}
                </span>
              </div>
              {reason1 && (
                <div className="rc-pref-card-body">
                  <strong>Why {dept1}:</strong> {reason1}
                </div>
              )}
              <div className="rc-pref-card-actions">
                {canManage1 ? (
                  <>
                    {status1 !== 'Pending' && status1 !== 'APPLIED' && (
                      <button className="rc-btn rc-btn-secondary" disabled={isUpdating}
                        onClick={() => onStatusUpdate(app.id, 'Pending', dept1)}>Reset</button>
                    )}
                    {status1 !== 'Under Review' && (
                      <button className="rc-btn rc-btn-review" disabled={isUpdating}
                        onClick={() => onStatusUpdate(app.id, 'Under Review', dept1)}>Review</button>
                    )}
                    {status1 !== 'Shortlisted' && (
                      <button className="rc-btn rc-btn-shortlist" disabled={isUpdating}
                        onClick={() => onStatusUpdate(app.id, 'Shortlisted', dept1)}>Shortlist</button>
                    )}
                    {status1 !== 'Rejected' && (
                      <button className="rc-btn rc-btn-reject" disabled={isUpdating}
                        onClick={() => onStatusUpdate(app.id, 'Rejected', dept1)}>Reject</button>
                    )}
                    {['Shortlisted', 'SHORTLISTED', 'Interview Scheduled', 'INTERVIEW_SCHEDULED'].includes(status1) && onScheduleInterview && (
                      <button className="rc-btn rc-btn-schedule rc-btn-schedule-pref" disabled={isUpdating}
                        onClick={() => { onClose(); onScheduleInterview(app, dept1); }}>
                        Schedule Interview ({dept1})
                      </button>
                    )}
                  </>
                ) : (
                  <span className="rc-badge-viewonly">
                    🔒 VIEW ONLY — NOT YOUR ASSIGNED DEPARTMENT
                  </span>
                )}
              </div>
            </div>

            {/* Preference 2 Card */}
            {hasSecond && (
              <div className={`rc-pref-card${canManage2 ? ' rc-pref-active' : ''}`}>
                <div className="rc-pref-card-header">
                  <div className="rc-pref-card-title">
                    <span className="rc-pref-num">2</span>
                    <span className="rc-pref-dept-name">{dept2}</span>
                  </div>
                  <span className={`rc-status ${statusClass(status2)}`}>
                    Status: {displayStatus(status2)}
                  </span>
                </div>
                {reason2 && (
                  <div className="rc-pref-card-body">
                    <strong>Why {dept2}:</strong> {reason2}
                  </div>
                )}
                <div className="rc-pref-card-actions">
                  {canManage2 ? (
                    <>
                      {status2 !== 'Pending' && status2 !== 'APPLIED' && (
                        <button className="rc-btn rc-btn-secondary" disabled={isUpdating}
                          onClick={() => onStatusUpdate(app.id, 'Pending', dept2)}>Reset</button>
                      )}
                      {status2 !== 'Under Review' && (
                        <button className="rc-btn rc-btn-review" disabled={isUpdating}
                          onClick={() => onStatusUpdate(app.id, 'Under Review', dept2)}>Review</button>
                      )}
                      {status2 !== 'Shortlisted' && (
                        <button className="rc-btn rc-btn-shortlist" disabled={isUpdating}
                          onClick={() => onStatusUpdate(app.id, 'Shortlisted', dept2)}>Shortlist</button>
                      )}
                      {status2 !== 'Rejected' && (
                        <button className="rc-btn rc-btn-reject" disabled={isUpdating}
                          onClick={() => onStatusUpdate(app.id, 'Rejected', dept2)}>Reject</button>
                      )}
                      {['Shortlisted', 'SHORTLISTED', 'Interview Scheduled', 'INTERVIEW_SCHEDULED'].includes(status2) && onScheduleInterview && (
                        <button className="rc-btn rc-btn-schedule rc-btn-schedule-pref" disabled={isUpdating}
                          onClick={() => { onClose(); onScheduleInterview(app, dept2); }}>
                          Schedule Interview ({dept2})
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="rc-badge-viewonly">
                      🔒 VIEW ONLY — NOT YOUR ASSIGNED DEPARTMENT
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Links */}
        {(app.github || app.linkedin || app.portfolio) && (
          <div className="rc-detail-grid" style={{ marginBottom: '8px' }}>
            {app.github && (
              <div className="rc-detail-field">
                <span className="rc-df-label">GitHub</span>
                <span className="rc-df-value">
                  <a href={app.github.startsWith('http') ? app.github : `https://${app.github}`} target="_blank" rel="noreferrer">
                    {app.github} ↗
                  </a>
                </span>
              </div>
            )}
            {app.linkedin && (
              <div className="rc-detail-field">
                <span className="rc-df-label">LinkedIn</span>
                <span className="rc-df-value">
                  <a href={app.linkedin.startsWith('http') ? app.linkedin : `https://${app.linkedin}`} target="_blank" rel="noreferrer">
                    {app.linkedin} ↗
                  </a>
                </span>
              </div>
            )}
            {app.portfolio && (
              <div className="rc-detail-field">
                <span className="rc-df-label">Portfolio</span>
                <span className="rc-df-value">
                  <a href={app.portfolio.startsWith('http') ? app.portfolio : `https://${app.portfolio}`} target="_blank" rel="noreferrer">
                    {app.portfolio} ↗
                  </a>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Technical Skills */}
        {app.technicalSkills && Array.isArray(app.technicalSkills) && app.technicalSkills.length > 0 && (
          <div className="rc-detail-section">
            <div className="rc-ds-title"><span className="rc-diamond">◇</span> TECHNICAL SKILLS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {app.technicalSkills.map((skill, i) => (
                <span key={i} style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  background: 'rgba(208, 125, 34, 0.1)',
                  border: '1px solid rgba(208, 125, 34, 0.15)',
                  fontSize: '0.8rem',
                  color: 'var(--highlight)',
                  fontFamily: 'var(--mono)',
                  letterSpacing: '0.04em',
                }}>{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* Scenario answers */}
        {app.productiveWebsiteQuestions && (
          <div className="rc-detail-section">
            <div className="rc-ds-title"><span className="rc-diamond">◇</span> SCENARIO RESPONSE</div>
            <div className="rc-ds-content">{app.productiveWebsiteQuestions}</div>
          </div>
        )}

        {/* Why HackClub */}
        {app.whyHackclub && (
          <div className="rc-detail-section">
            <div className="rc-ds-title"><span className="rc-diamond">◇</span> WHY HACKCLUB</div>
            <div className="rc-ds-content">{app.whyHackclub}</div>
          </div>
        )}

        {/* Project Details */}
        {(app.projectDetails || app.sevenDaysBuild) && (
          <div className="rc-detail-section">
            <div className="rc-ds-title"><span className="rc-diamond">◇</span> PROJECT DETAILS</div>
            <div className="rc-ds-content">{app.projectDetails || app.sevenDaysBuild}</div>
          </div>
        )}

        {/* Skill to learn */}
        {app.skillToLearn && (
          <div className="rc-detail-section">
            <div className="rc-ds-title"><span className="rc-diamond">◇</span> SKILL TO LEARN</div>
            <div className="rc-ds-content">{app.skillToLearn}</div>
          </div>
        )}

        {/* Bottom actions */}
        <div className="rc-detail-actions">
          <button className="rc-btn rc-btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ==============================
   INTERVIEWS VIEW
   ============================== */
function InterviewsView({ interviews, loading, error, onSelectInterview, onReschedule, onCancel }) {
  const [filterIvStatus, setFilterIvStatus] = useState('All');

  if (loading) return <div className="rc-loading"><div className="rc-spinner" /></div>;
  if (error) return (
    <div className="rc-empty">
      <div className="rc-empty-icon">⚠</div>
      <p className="rc-empty-text">{error}</p>
    </div>
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = filterIvStatus === 'All'
    ? interviews
    : interviews.filter(iv => iv.status === filterIvStatus);

  const upcoming = filtered.filter(iv => {
    const d = new Date(iv.scheduledDate);
    d.setHours(0, 0, 0, 0);
    return d >= today && iv.status !== 'CANCELLED' && iv.status !== 'COMPLETED';
  });
  const todayList = upcoming.filter(iv => {
    const d = new Date(iv.scheduledDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
  const completedList = filtered.filter(iv => iv.status === 'COMPLETED');
  const cancelledList = filtered.filter(iv => iv.status === 'CANCELLED');

  return (
    <>
      <div className="rc-section-header">
        <div className="rc-eyebrow"><span className="rc-diamond">◇</span> INTERVIEW SCHEDULE</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          <h2>Interview <span className="rc-accent">Pipeline</span></h2>
          <select
            value={filterIvStatus}
            onChange={e => setFilterIvStatus(e.target.value)}
            className="rc-iv-status-select"
          >
            <option value="All">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="RESCHEDULED">Rescheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <p className="rc-subtitle">Schedule and manage candidate interviews across your departments.</p>
      </div>

      {/* Today's interviews callout */}
      {todayList.length > 0 && (
        <div className="rc-today-banner">
          <span className="rc-diamond" style={{ color: 'var(--highlight)' }}>◇</span>
          <span><strong style={{ color: 'var(--highlight)' }}>{todayList.length} interview{todayList.length !== 1 ? 's' : ''} today</strong></span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rc-empty">
          <div className="rc-empty-icon">📅</div>
          <p className="rc-empty-text">No interviews scheduled yet. Shortlist candidates from the Applications tab to begin scheduling.</p>
        </div>
      ) : (
        <div className="rc-iv-sections">
          {upcoming.length > 0 && (
            <div className="rc-iv-section">
              <div className="rc-iv-section-title">Upcoming</div>
              <div className="rc-iv-list">
                {upcoming.map(iv => (
                  <InterviewCard key={iv.id} iv={iv} onSelect={onSelectInterview} onReschedule={onReschedule} onCancel={onCancel} />
                ))}
              </div>
            </div>
          )}
          {completedList.length > 0 && (
            <div className="rc-iv-section">
              <div className="rc-iv-section-title">Completed</div>
              <div className="rc-iv-list">
                {completedList.map(iv => (
                  <InterviewCard key={iv.id} iv={iv} onSelect={onSelectInterview} onReschedule={onReschedule} onCancel={onCancel} />
                ))}
              </div>
            </div>
          )}
          {cancelledList.length > 0 && (
            <div className="rc-iv-section">
              <div className="rc-iv-section-title">Cancelled</div>
              <div className="rc-iv-list">
                {cancelledList.map(iv => (
                  <InterviewCard key={iv.id} iv={iv} onSelect={onSelectInterview} onReschedule={onReschedule} onCancel={onCancel} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function InterviewCard({ iv, onSelect, onReschedule, onCancel }) {
  const isCancelled = iv.status === 'CANCELLED';
  const isCompleted = iv.status === 'COMPLETED';
  const d = iv.scheduledDate ? new Date(iv.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  return (
    <div className="rc-iv-card" onClick={() => onSelect(iv)}>
      <div className="rc-iv-card-left">
        <div className="rc-iv-candidate">{iv.candidateName}</div>
        <div className="rc-iv-meta">
          <span className="rc-td-dept">{iv.department}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>•</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{d}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>•</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--highlight)' }}>{iv.startTime} – {iv.endTime}</span>
        </div>
        {(iv.panelMembers || []).length > 0 && (
          <div className="rc-iv-panel">
            {iv.panelMembers.map((p, i) => <span key={i} className="rc-panel-chip">{p.panelName || p.panelEmail}</span>)}
          </div>
        )}
      </div>
      <div className="rc-iv-card-right">
        <span className={`rc-status ${ivStatusClass(iv.status)}`}>{iv.status}</span>
        {iv.meetingUrl ? (
          <a className="rc-btn rc-btn-meeting" href={iv.meetingUrl} target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()}>Join Meeting ↗</a>
        ) : (
          <span className="rc-iv-no-link">No meeting link</span>
        )}
        {!isCancelled && !isCompleted && (
          <div className="rc-iv-card-actions">
            <button className="rc-btn rc-btn-secondary" onClick={e => { e.stopPropagation(); onReschedule(iv); }}>Reschedule</button>
            <button className="rc-btn rc-btn-reject" onClick={e => { e.stopPropagation(); onCancel(iv); }}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==============================
   INTERVIEW DETAIL MODAL
   ============================== */
function InterviewDetailModal({ interview: iv, onClose, onReschedule, onCancel }) {
  const isCancelled = iv.status === 'CANCELLED';
  const isCompleted = iv.status === 'COMPLETED';
  const d = iv.scheduledDate ? new Date(iv.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' }) : '—';
  return (
    <div className="rc-detail-backdrop" onClick={onClose}>
      <div className="rc-detail-panel" onClick={e => e.stopPropagation()}>
        <div className="rc-detail-header">
          <div>
            <div className="rc-eyebrow" style={{ marginBottom: '4px' }}><span className="rc-diamond">◇</span> INTERVIEW // DETAILS</div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>{iv.candidateName}</h2>
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: '0.82rem', marginTop: '4px' }}>
              {iv.candidateEmail}
            </p>
          </div>
          <button className="rc-detail-close" onClick={onClose}>×</button>
        </div>

        <div className="rc-detail-grid">
          <div className="rc-detail-field">
            <span className="rc-df-label">Department</span>
            <span className="rc-df-value" style={{ color: 'var(--highlight)' }}>{iv.department}</span>
          </div>
          <div className="rc-detail-field">
            <span className="rc-df-label">Status</span>
            <span className={`rc-status ${ivStatusClass(iv.status)}`}>{iv.status}</span>
          </div>
          <div className="rc-detail-field">
            <span className="rc-df-label">Date</span>
            <span className="rc-df-value">{d}</span>
          </div>
          <div className="rc-detail-field">
            <span className="rc-df-label">Time</span>
            <span className="rc-df-value" style={{ fontFamily: 'var(--mono)', color: 'var(--highlight)' }}>{iv.startTime} – {iv.endTime}</span>
          </div>
          <div className="rc-detail-field">
            <span className="rc-df-label">Scheduled By</span>
            <span className="rc-df-value">{iv.scheduledBy || '—'}</span>
          </div>
          <div className="rc-detail-field">
            <span className="rc-df-label">Meeting Link</span>
            <span className="rc-df-value">
              {iv.meetingUrl
                ? <a href={iv.meetingUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--highlight)' }}>Join Meeting ↗</a>
                : 'No meeting link'}
            </span>
          </div>
        </div>

        {(iv.panelMembers || []).length > 0 && (
          <div className="rc-detail-section">
            <div className="rc-ds-title"><span className="rc-diamond">◇</span> PANEL MEMBERS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {iv.panelMembers.map((p, i) => (
                <span key={i} style={{ padding: '4px 12px', borderRadius: '6px', background: 'rgba(208,125,34,0.1)', border: '1px solid rgba(208,125,34,0.15)', fontSize: '0.82rem', color: 'var(--highlight)', fontFamily: 'var(--mono)' }}>
                  {p.panelName || p.panelEmail}
                  {p.department ? <span style={{ opacity: 0.6 }}> ({p.department})</span> : null}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="rc-detail-actions">
          <button className="rc-btn rc-btn-secondary" onClick={onClose}>Close</button>
          <div style={{ flex: 1 }} />
          {!isCancelled && !isCompleted && (
            <>
              <button className="rc-btn rc-btn-secondary" onClick={() => { onClose(); onReschedule(iv); }}>Reschedule</button>
              <button className="rc-btn rc-btn-reject" onClick={() => { onCancel(iv); }}>Cancel Interview</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==============================
   SCHEDULE INTERVIEW MODAL
   ============================== */
function ScheduleInterviewModal({ application, rescheduleTarget, onClose, onSubmit }) {
  const isReschedule = !!rescheduleTarget;
  const candidate = application || (rescheduleTarget ? { name: rescheduleTarget.candidateName, email: rescheduleTarget.candidateEmail, firstPreference: rescheduleTarget.department } : null);

  const [interviewDate, setInterviewDate] = useState(
    rescheduleTarget ? (rescheduleTarget.scheduledDate ? new Date(rescheduleTarget.scheduledDate).toISOString().slice(0, 10) : '') : ''
  );
  const [startTime, setStartTime] = useState(rescheduleTarget?.startTime || TIME_SLOTS[0]);
  const [meetingUrl, setMeetingUrl] = useState(rescheduleTarget?.meetingUrl || '');

  const [panelList, setPanelList] = useState([]);
  const [panelLoading, setPanelLoading] = useState(true);
  const [panelError, setPanelError] = useState(null);
  const [selectedPanelEmails, setSelectedPanelEmails] = useState(
    rescheduleTarget?.panelMembers?.map(p => p.panelEmail) || []
  );

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const endTime = startTime ? addMinutes(startTime, 10) : '';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getRecruitmentPanels();
        if (!cancelled) setPanelList(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setPanelError('Could not load panel members.');
      } finally {
        if (!cancelled) setPanelLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const togglePanel = (email) => {
    setSelectedPanelEmails(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!interviewDate) { setSubmitError('Please select an interview date.'); return; }
    if (!startTime) { setSubmitError('Please select a start time.'); return; }
    if (selectedPanelEmails.length === 0) { setSubmitError('Please select at least one panel member.'); return; }

    const panelMembers = panelList
      .filter(p => selectedPanelEmails.includes(p.email))
      .map(p => ({ email: p.email, name: p.name, department: p.department }));

    const targetDept = application?.targetDepartment || candidate?.targetDepartment || candidate?.firstPreference || candidate?.domain || '';

    setSubmitting(true);
    try {
      await onSubmit({
        applicationId: application?.id,
        department: targetDept,
        panelMembers,
        interviewDate,
        startTime,
        endTime,
        meetingUrl: meetingUrl.trim() || null,
      });
    } catch (err) {
      setSubmitError(err.message || 'Failed to schedule interview.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayDept = application?.targetDepartment || candidate?.targetDepartment || candidate?.firstPreference || candidate?.domain || '';

  return (
    <div className="rc-detail-backdrop" onClick={onClose}>
      <div className="rc-detail-panel rc-schedule-panel" onClick={e => e.stopPropagation()}>
        <div className="rc-detail-header">
          <div>
            <div className="rc-eyebrow" style={{ marginBottom: '4px' }}>
              <span className="rc-diamond">◇</span> {isReschedule ? 'RESCHEDULE INTERVIEW' : 'SCHEDULE INTERVIEW'}
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
              {isReschedule ? 'Reschedule' : 'Schedule'} <span style={{ color: 'var(--accent)' }}>Interview</span>
            </h2>
          </div>
          <button className="rc-detail-close" onClick={onClose}>×</button>
        </div>

        {/* Candidate (read-only) */}
        <div className="rc-schedule-candidate">
          <div className="rc-df-label">Candidate</div>
          <div className="rc-schedule-candidate-name">{candidate?.name}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{candidate?.email}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--highlight)', marginTop: '4px', fontWeight: 600 }}>
            Interviewing For: {displayDept}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rc-detail-grid" style={{ marginBottom: '16px' }}>
            {/* Date */}
            <div className="rc-detail-field">
              <label className="rc-df-label" htmlFor="iv-date">Interview Date</label>
              <input
                id="iv-date"
                type="date"
                className="rc-schedule-input"
                value={interviewDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => setInterviewDate(e.target.value)}
                required
              />
            </div>

            {/* Start time — 10-min slot selector */}
            <div className="rc-detail-field">
              <label className="rc-df-label" htmlFor="iv-time">Start Time (10-min slots)</label>
              <select
                id="iv-time"
                className="rc-schedule-input"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
              >
                {TIME_SLOTS.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>

            {/* End time — computed, read-only */}
            <div className="rc-detail-field">
              <label className="rc-df-label">End Time (auto — 10 min)</label>
              <div className="rc-schedule-input rc-schedule-readonly">{endTime}</div>
            </div>

            {/* Meeting URL */}
            <div className="rc-detail-field">
              <label className="rc-df-label" htmlFor="iv-meeting">Meeting URL (optional)</label>
              <input
                id="iv-meeting"
                type="url"
                className="rc-schedule-input"
                placeholder="https://meet.google.com/..."
                value={meetingUrl}
                onChange={e => setMeetingUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Panel Member Selection */}
          <div className="rc-detail-section" style={{ paddingTop: '16px' }}>
            <div className="rc-ds-title"><span className="rc-diamond">◇</span> PANEL MEMBERS</div>
            {panelLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><div className="rc-spinner" /></div>
            ) : panelError ? (
              <p style={{ color: '#e53935', fontFamily: 'var(--mono)', fontSize: '0.82rem' }}>{panelError}</p>
            ) : panelList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No panel members available. Ask an admin to set isReviewer on team members.</p>
            ) : (
              <div className="rc-panel-selector">
                {panelList.map(p => {
                  const selected = selectedPanelEmails.includes(p.email);
                  return (
                    <button
                      key={p.email}
                      type="button"
                      className={`rc-panel-option${selected ? ' selected' : ''}`}
                      onClick={() => togglePanel(p.email)}
                    >
                      <span className="rc-panel-name">{p.name}</span>
                      <span className="rc-panel-dept">{p.department || p.role || ''}</span>
                      {selected && <span className="rc-panel-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
            {selectedPanelEmails.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedPanelEmails.map(email => {
                  const p = panelList.find(x => x.email === email);
                  return <span key={email} className="rc-panel-chip">{p?.name || email}</span>;
                })}
              </div>
            )}
          </div>

          {/* Error */}
          {submitError && (
            <div className="rc-schedule-error">
              {submitError.includes('409') || submitError.toLowerCase().includes('unavailable') || submitError.toLowerCase().includes('already has')
                ? `⚠ That time slot is unavailable — ${submitError}`
                : `⚠ ${submitError}`
              }
            </div>
          )}

          <div className="rc-detail-actions">
            <button type="button" className="rc-btn rc-btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <div style={{ flex: 1 }} />
            <button type="submit" className="rc-btn rc-btn-schedule" disabled={submitting}>
              {submitting ? 'Scheduling...' : isReschedule ? 'Reschedule' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
