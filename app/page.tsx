"use client";

import React, { useState, useEffect, useRef } from "react";
import { api, getToken, clearToken, BackendApplication } from "./api";

// ── Types ────────────────────────────────────────────────────
interface Applicant {
  id: number | string;
  name: string;
  initials: string;
  email: string;
  registerNumber?: string;
  domain: string;
  firstPreference?: string;
  secondPreference?: string;
  firstPrefReason?: string;
  secondPrefReason?: string;
  status: 'screening' | 'technical' | 'interview' | 'selected' | 'rejected';
  year: string;
  score: number;
  date: string;
  avatarBg: string;
  phoneNumber?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  sevenDaysBuild?: string;
  skillToLearn?: string;
  whyHackclub?: string;
  expectations?: string;
  productiveWebsiteQuestions?: string;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

// ── Sample Data ──────────────────────────────────────────────
const FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna', 'Ishaan', 'Shaurya',
    'Ananya', 'Diya', 'Myra', 'Sara', 'Aadhya', 'Isha', 'Kavya', 'Riya', 'Priya', 'Neha',
    'Rohan', 'Karan', 'Aryan', 'Dev', 'Raj', 'Nikhil', 'Varun', 'Akshat', 'Tanish', 'Harsh',
    'Sneha', 'Pooja', 'Meera', 'Tanya', 'Anika', 'Shruti', 'Nidhi', 'Swara', 'Jiya', 'Kiara'];

const LAST_NAMES = ['Sharma', 'Verma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Joshi', 'Mehta', 'Shah', 'Nair',
    'Menon', 'Reddy', 'Rao', 'Iyer', 'Pillai', 'Das', 'Roy', 'Bhat', 'Hegde', 'Shetty',
    'Kapoor', 'Khanna', 'Malhotra', 'Bose', 'Chatterjee', 'Mukherjee', 'Banerjee', 'Sen', 'Dutta', 'Ghosh'];

const DOMAINS = ['Technical', 'Projects', 'Operations', 'Design & Social Media', 'Research & Development', 'Finance'];
const DOMAIN_LABELS: Record<string, string> = { 
  Technical: 'Technical', 
  Projects: 'Projects', 
  Operations: 'Operations', 
  'Design & Social Media': 'Design & Social Media', 
  'Research & Development': 'Research & Development', 
  Finance: 'Finance' 
};
const STATUS_LABELS: Record<string, string> = { screening: 'SCREENING', technical: 'TECHNICAL', interview: 'INTERVIEW', selected: 'SELECTED', rejected: 'REJECTED' };
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

function mapBackendStatus(raw: string): Applicant['status'] {
  const s = (raw || '').toLowerCase();
  if (s === 'selected' || s === 'accepted') return 'selected';
  if (s === 'interview' || s === 'shortlisted') return 'interview';
  if (s === 'technical' || s === 'under review') return 'technical';
  if (s === 'rejected') return 'rejected';
  return 'screening';
}

function mapDomainKey(raw: string): string {
  const d = (raw || '').toLowerCase();
  if (d.includes('proj')) return 'Projects';
  if (d.includes('oper')) return 'Operations';
  if (d.includes('design') || d.includes('social') || d.includes('media')) return 'Design & Social Media';
  if (d.includes('research') || d.includes('ml') || d.includes('ai')) return 'Research & Development';
  if (d.includes('finan')) return 'Finance';
  return 'Technical';
}

function generateInitialApplicants(): Applicant[] {
  const applicants: Applicant[] = [];
  for (let i = 0; i < 32; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 3) % LAST_NAMES.length];
    const domain = DOMAINS[i % DOMAINS.length];
    const secondDomain = DOMAINS[(i + 2) % DOMAINS.length];
    const statuses: Array<Applicant['status']> = ['screening', 'technical', 'interview', 'selected', 'rejected'];
    const status = statuses[i % statuses.length];
    const year = YEARS[i % YEARS.length];
    const score = Math.floor(Math.random() * 25) + 75;
    const date = new Date(2026, 7, 10 + (i % 15));

    applicants.push({
      id: 1787760000000 + i,
      name: `${first} ${last}`,
      initials: `${first[0]}${last[0]}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@vitstudent.ac.in`,
      registerNumber: `24BCE${1000 + i * 11}`,
      domain,
      firstPreference: domain,
      secondPreference: secondDomain,
      firstPrefReason: `Strong background and passion for ${domain}. Built multiple hackathon projects.`,
      secondPrefReason: `Interested in contributing to ${secondDomain} and collaborating across teams.`,
      status,
      year,
      score,
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      avatarBg: `hsl(${Math.floor(Math.random() * 360)}, 65%, 25%)`,
      sevenDaysBuild: 'Real-time collaborative campus tool for student makers.',
      whyHackclub: 'Want to build open-source products with passionate makers at HackClub.',
      skillToLearn: 'Distributed Systems & Advanced System Design'
    });
  }
  return applicants;
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");

  const [activeSection, setActiveSection] = useState<"overview" | "applicants" | "rounds" | "analytics">("overview");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  
  // Table search & filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  // Animated counters on Overview load
  const [animatedStats, setAnimatedStats] = useState({
    total: 0,
    screening: 0,
    technical: 0,
    interview: 0,
    selected: 0
  });

  // Load applicants from API with fallback
  const loadApplicants = async () => {
    try {
      const rawApps = await api.getRecruitmentApplications();
      if (Array.isArray(rawApps) && rawApps.length > 0) {
        const mapped: Applicant[] = rawApps.map((a, idx) => {
          const initials = a.name ? a.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AP';
          const domainKey = mapDomainKey(a.firstPreference || a.domain || 'web');
          const status = mapBackendStatus(a.status);
          return {
            id: a.id,
            name: a.name,
            initials,
            email: a.email,
            registerNumber: a.registerNumber,
            domain: domainKey,
            firstPreference: a.firstPreference || a.domain,
            secondPreference: a.secondPreference,
            firstPrefReason: a.firstPrefReason || a.whyJoin,
            secondPrefReason: a.secondPrefReason,
            status,
            year: a.yearOfStudy || '1st Year',
            score: Math.floor(Math.random() * 25) + 75,
            date: a.appliedDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            avatarBg: `hsl(${Math.floor(Math.random() * 360)}, 65%, 25%)`,
            phoneNumber: a.phoneNumber,
            github: a.github,
            linkedin: a.linkedin,
            portfolio: a.portfolio,
            sevenDaysBuild: a.sevenDaysBuild || a.projectDetails,
            skillToLearn: a.skillToLearn,
            whyHackclub: a.whyHackclub,
            expectations: a.expectations,
            productiveWebsiteQuestions: a.productiveWebsiteQuestions
          };
        });
        setApplicants(mapped);
        return;
      }
    } catch (err: any) {
      console.warn('Recruitment API notice:', err.message);
    }
    setApplicants(generateInitialApplicants());
  };

  // Restore session from token on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      api.getMe()
        .then(res => {
          const role = (res.user?.role || '').toLowerCase();
          const isOverallAdmin = role === 'admin' || ['vice chairperson', 'secretary', 'co secretary'].includes(role);
          const hasRecruitmentPermission = isOverallAdmin || res.user?.isRecruitmentAdmin === true || (Array.isArray(res.user?.permissions) && res.user.permissions.includes('recruitment-admin'));
          
          if (hasRecruitmentPermission) {
            setIsLoggedIn(true);
            loadApplicants();
          } else {
            clearToken();
            setIsLoggedIn(false);
          }
        })
        .catch(() => {
          clearToken();
          setIsLoggedIn(false);
          loadApplicants();
        });
    } else {
      loadApplicants();
    }
  }, []);

  // Animate stats
  useEffect(() => {
    if (activeSection === "overview" && applicants.length > 0) {
      const stats = {
        total: applicants.length,
        screening: applicants.filter(a => a.status === 'screening').length,
        technical: applicants.filter(a => a.status === 'technical').length,
        interview: applicants.filter(a => a.status === 'interview').length,
        selected: applicants.filter(a => a.status === 'selected').length
      };

      const duration = 1500;
      const start = performance.now();

      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

        setAnimatedStats({
          total: Math.floor(stats.total * eased),
          screening: Math.floor(stats.screening * eased),
          technical: Math.floor(stats.technical * eased),
          interview: Math.floor(stats.interview * eased),
          selected: Math.floor(stats.selected * eased)
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [activeSection, applicants]);

  // Particle background setup
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Array<{ x: number; y: number; vx: number; vy: number; radius: number; opacity: number }> = [];
    const count = 60;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1
      });
    }

    let animationId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Top Red Glow
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, 0, 0,
        canvas.width / 2, 0, canvas.width * 0.7
      );
      gradient.addColorStop(0, 'rgba(127, 29, 29, 0.08)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Bottom Blue Glows (matching HackClub homepage blue corners)
      const blueGlow1 = ctx.createRadialGradient(0, canvas.height, 0, 0, canvas.height, canvas.width * 0.4);
      blueGlow1.addColorStop(0, 'rgba(29, 78, 216, 0.06)');
      blueGlow1.addColorStop(1, 'transparent');
      ctx.fillStyle = blueGlow1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const blueGlow2 = ctx.createRadialGradient(canvas.width, canvas.height, 0, canvas.width, canvas.height, canvas.width * 0.4);
      blueGlow2.addColorStop(0, 'rgba(29, 78, 216, 0.06)');
      blueGlow2.addColorStop(1, 'transparent');
      ctx.fillStyle = blueGlow2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 245, 245, ${p.opacity})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Toast dispatch helper
  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    const id = toastIdRef.current++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3300);
  };

  // Status transition definitions
  const STATUS_NEXT: Record<string, Applicant['status']> = { 
    screening: 'technical', 
    technical: 'interview', 
    interview: 'selected' 
  };

  const handleApprove = async (id: number | string) => {
    const applicant = applicants.find(a => String(a.id) === String(id));
    if (!applicant) return;
    const next = STATUS_NEXT[applicant.status];
    if (!next) {
      triggerToast(`${applicant.name} is already at final stage (${STATUS_LABELS[applicant.status]})`, 'error');
      return;
    }

    try {
      await api.updateRecruitmentStatus(id, next);
      setApplicants(prev => prev.map(a => String(a.id) === String(id) ? { ...a, status: next } : a));

      if (next === 'selected') {
        triggerToast(`🎉 ${applicant.name} officially SELECTED! Auto-added to Allowlist & Members roster.`, 'success');
      } else {
        triggerToast(`${applicant.name} advanced to ${STATUS_LABELS[next]}`, 'success');
      }

      if (selectedApplicant && String(selectedApplicant.id) === String(id)) {
        setSelectedApplicant(prev => prev ? { ...prev, status: next } : null);
      }
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update status on server.', 'error');
    }
  };

  const handleReject = async (id: number | string) => {
    const applicant = applicants.find(a => String(a.id) === String(id));
    if (!applicant) return;

    try {
      await api.updateRecruitmentStatus(id, 'rejected');
      setApplicants(prev => prev.map(a => String(a.id) === String(id) ? { ...a, status: 'rejected' } : a));
      triggerToast(`${applicant.name} marked as REJECTED`, 'error');

      if (selectedApplicant && String(selectedApplicant.id) === String(id)) {
        setSelectedApplicant(prev => prev ? { ...prev, status: 'rejected' } : null);
      }
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update status on server.', 'error');
    }
  };

  // Filter and paginated list mapping
  const filteredList = applicants.filter(a => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
      a.name.toLowerCase().includes(term) || 
      a.email.toLowerCase().includes(term) || 
      (a.registerNumber && a.registerNumber.toLowerCase().includes(term));
    const matchesDomain = domainFilter === 'all' || 
      a.domain === domainFilter || 
      a.firstPreference === domainFilter || 
      a.secondPreference === domainFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesDomain && matchesStatus;
  });

  const totalPages = Math.ceil(filteredList.length / perPage);
  const startIdx = (currentPage - 1) * perPage;
  const paginatedPage = filteredList.slice(startIdx, startIdx + perPage);

  const getScoreColorClass = (score: number) => {
    if (score >= 75) return 'score-high';
    if (score >= 55) return 'score-mid';
    return 'score-low';
  };

  // Handle Auth submission
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      triggerToast("Please fill in both email and password", "error");
      return;
    }
    
    try {
      const res = await api.login(authEmail.trim(), authPassword.trim());
      const role = (res.role || '').toLowerCase();
      const isOverallAdmin = role === 'admin' || ['vice chairperson', 'secretary', 'co secretary'].includes(role);
      const hasRecruitmentPermission = isOverallAdmin || res.user?.isRecruitmentAdmin === true || (Array.isArray(res.user?.permissions) && res.user.permissions.includes('recruitment-admin'));

      if (!hasRecruitmentPermission) {
        triggerToast("Permission Denied: Recruitment monitoring requires overall admin or recruitment-admin privileges.", "error");
        clearToken();
        return;
      }

      setIsLoggedIn(true);
      triggerToast(`Welcome back, ${res.user?.name || 'Admin'}!`, "success");
      loadApplicants();
    } catch (err: any) {
      triggerToast(err.message || "Invalid credentials. Please verify your student email and password.", "error");
    }
  };

  return (
    <>
      <canvas id="particles-canvas" ref={canvasRef}></canvas>

      {!isLoggedIn ? (
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-logo">
                <span className="auth-logo-diamond">◆</span>
                <span className="auth-logo-text">HACKCLUB</span>
              </div>
              <h2>{authMode === "login" ? "Sign In to Dashboard" : "Create Builder Account"}</h2>
              <p>{authMode === "login" ? "Welcome back, enter your credentials" : "Join the club and start building"}</p>
            </div>
            
            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === "signup" && (
                <div className="auth-input-group">
                  <label className="auth-label">// Full Name</label>
                  <input 
                    type="text" 
                    className="auth-input" 
                    placeholder="Atul Krishnan" 
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                  />
                </div>
              )}
              <div className="auth-input-group">
                <label className="auth-label">// Email address</label>
                <input 
                  type="email" 
                  className="auth-input" 
                  placeholder="builder@hackclub.com" 
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </div>
              <div className="auth-input-group">
                <label className="auth-label">// Password</label>
                <input 
                  type="password" 
                  className="auth-input" 
                  placeholder="••••••••" 
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
              </div>
              
              <button type="submit" className="auth-submit-btn">
                {authMode === "login" ? "Access Dashboard" : "Register Now"}
              </button>
            </form>
            
            <div className="auth-toggle">
              {authMode === "login" ? (
                <>
                  New to HackClub? 
                  <span className="auth-toggle-link" onClick={() => setAuthMode("signup")}>Sign Up</span>
                </>
              ) : (
                <>
                  Already have an account? 
                  <span className="auth-toggle-link" onClick={() => setAuthMode("login")}>Sign In</span>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="circuit-line-right">
            <svg width="40" height="100%" viewBox="0 0 40 800" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <line x1="20" y1="0" x2="20" y2="800" stroke="#B91C1C" strokeWidth="1.5" opacity="0.6"/>
              <circle cx="20" cy="80" r="6" fill="none" stroke="#B91C1C" strokeWidth="1.5" opacity="0.8"/>
              <rect x="16" y="196" width="8" height="8" transform="rotate(45 20 200)" fill="none" stroke="#B91C1C" strokeWidth="1.5"/>
              <circle cx="20" cy="350" r="4" fill="#B91C1C" opacity="0.6"/>
              <circle cx="20" cy="500" r="6" fill="none" stroke="#B91C1C" strokeWidth="1.5" opacity="0.8"/>
              <circle cx="20" cy="650" r="4" fill="#B91C1C" opacity="0.6"/>
            </svg>
          </div>

      <nav className="top-nav">
        <div className="nav-left">
          <div className="logo">
            <span className="logo-diamond">◆</span>
            <span className="logo-text">HACKCLUB</span>
          </div>
        </div>
        <div className="nav-center">
          {(["overview", "applicants", "rounds", "analytics"] as const).map(section => (
            <a 
              key={section}
              href="#" 
              className={`nav-link ${activeSection === section ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveSection(section);
                setCurrentPage(1);
              }}
            >
              {section}
            </a>
          ))}
        </div>
        <div className="nav-right">
          <div className="recruitment-badge">
            <span className="badge-dot"></span>
            <span className="badge-text">RECRUITMENT &apos;26 — ONLINE</span>
          </div>
          <button className="btn-logout" onClick={() => {
            setIsLoggedIn(false);
            setAuthEmail("");
            setAuthPassword("");
            setAuthName("");
            triggerToast("Logged out successfully", "success");
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            LOGOUT
          </button>
        </div>
      </nav>

      <main className="main-content">
        {/* OVERVIEW SECTION */}
        {activeSection === "overview" && (
          <section className="dashboard-section active">
            <div className="welcome-banner">
              <div className="welcome-text">
                <span className="section-label"><span className="label-diamond">◆</span> COMMAND CENTER</span>
                <h1>Recruitment Dashboard</h1>
                <p className="welcome-sub">Track applicants, review submissions, and manage recruitment rounds — all in one place.</p>
              </div>
              <div className="welcome-terminal">
                <div className="terminal-window">
                  <div className="terminal-header">
                    <div className="terminal-dots">
                      <span className="dot dot-red"></span>
                      <span className="dot dot-yellow"></span>
                      <span className="dot dot-green"></span>
                    </div>
                    <span className="terminal-title">recruitment.sh</span>
                  </div>
                  <div className="terminal-body">
                    <div className="terminal-line"><span className="term-prompt">$</span> ./recruitment --status</div>
                    <div className="terminal-line"><span className="term-output">loading pipeline: screening → technical → interview</span></div>
                    <div className="terminal-line"><span className="term-output">applicants.count(348) ....... OK</span></div>
                    <div className="terminal-line"><span className="term-output">rounds.active(3) ........... OK</span></div>
                    <div className="terminal-line"><span className="term-output">offers.pending(12) ......... OK</span></div>
                    <div className="terminal-line typing"><span className="term-accent">&gt; pipeline running smoothly_</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{animatedStats.total}</div>
                <div className="stat-label">TOTAL APPLICANTS</div>
                <div className="stat-bar"><div className="stat-bar-fill" style={{ width: '100%' }}></div></div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{animatedStats.screening}</div>
                <div className="stat-label">IN SCREENING</div>
                <div className="stat-bar"><div className="stat-bar-fill" style={{ width: '41%' }}></div></div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{animatedStats.technical}</div>
                <div className="stat-label">TECHNICAL ROUND</div>
                <div className="stat-bar"><div className="stat-bar-fill" style={{ width: '26%' }}></div></div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{animatedStats.interview}</div>
                <div className="stat-label">INTERVIEW STAGE</div>
                <div className="stat-bar"><div className="stat-bar-fill" style={{ width: '13%' }}></div></div>
              </div>
              <div className="stat-card stat-card-accent">
                <div className="stat-number">{animatedStats.selected}<span className="stat-plus">+</span></div>
                <div className="stat-label">SELECTED</div>
                <div className="stat-bar"><div className="stat-bar-fill accent" style={{ width: '9%' }}></div></div>
              </div>
            </div>

            <div className="two-col-grid">
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Recruitment Pipeline</h2>
                  <span className="live-badge"><span className="live-dot"></span> LIVE</span>
                </div>
                <div className="pipeline-funnel">
                  <div className="funnel-stage" style={{ width: '100%' }}>
                    <div className="funnel-bar">
                      <span className="funnel-label">Applications Received</span>
                      <span className="funnel-count">{applicants.length}</span>
                    </div>
                  </div>
                  <div className="funnel-stage" style={{ width: '78%' }}>
                    <div className="funnel-bar">
                      <span className="funnel-label">Screening Passed</span>
                      <span className="funnel-count">271</span>
                    </div>
                  </div>
                  <div className="funnel-stage" style={{ width: '52%' }}>
                    <div className="funnel-bar">
                      <span className="funnel-label">Technical Round</span>
                      <span className="funnel-count">180</span>
                    </div>
                  </div>
                  <div className="funnel-stage" style={{ width: '32%' }}>
                    <div className="funnel-bar">
                      <span className="funnel-label">Interview Cleared</span>
                      <span className="funnel-count">112</span>
                    </div>
                  </div>
                  <div className="funnel-stage" style={{ width: '15%' }}>
                    <div className="funnel-bar funnel-bar-accent">
                      <span className="funnel-label">Offers Extended</span>
                      <span className="funnel-count">52</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Recent Activity</h2>
                  <button className="btn-ghost">View All</button>
                </div>
                <div className="activity-feed">
                  <div className="activity-item">
                    <div className="activity-avatar" style={{ background: '#B91C1C' }}>AK</div>
                    <div className="activity-content">
                      <span className="activity-user">Atul Krishnan</span>
                      <span className="activity-action">approved 5 applicants for interview round</span>
                      <span className="activity-time">2 min ago</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-avatar" style={{ background: '#7F1D1D' }}>PM</div>
                    <div className="activity-content">
                      <span className="activity-user">Priya Menon</span>
                      <span className="activity-action">updated screening criteria for Round 2</span>
                      <span className="activity-time">15 min ago</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-avatar" style={{ background: '#991B1B' }}>RK</div>
                    <div className="activity-content">
                      <span className="activity-user">Rishi Kumar</span>
                      <span className="activity-action">added technical assessment for Web domain</span>
                      <span className="activity-time">1 hour ago</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-avatar" style={{ background: '#450A0A' }}>OS</div>
                    <div className="activity-content">
                      <span className="activity-user">Ojas Singh</span>
                      <span className="activity-action">rejected 3 applications — incomplete submissions</span>
                      <span className="activity-time">2 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="two-col-grid">
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Domain Breakdown</h2>
                </div>
                <div className="domain-bars">
                  <div className="domain-row">
                    <span className="domain-name">Web Development</span>
                    <div className="domain-bar-track">
                      <div className="domain-bar-fill" style={{ width: '35%' }}></div>
                    </div>
                    <span className="domain-count">122</span>
                  </div>
                  <div className="domain-row">
                    <span className="domain-name">Machine Learning</span>
                    <div className="domain-bar-track">
                      <div className="domain-bar-fill" style={{ width: '25%' }}></div>
                    </div>
                    <span className="domain-count">87</span>
                  </div>
                  <div className="domain-row">
                    <span className="domain-name">App Development</span>
                    <div className="domain-bar-track">
                      <div className="domain-bar-fill" style={{ width: '18%' }}></div>
                    </div>
                    <span className="domain-count">63</span>
                  </div>
                  <div className="domain-row">
                    <span className="domain-name">Hardware / IoT</span>
                    <div className="domain-bar-track">
                      <div className="domain-bar-fill" style={{ width: '12%' }}></div>
                    </div>
                    <span className="domain-count">42</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Reviewer Leaderboard</h2>
                  <span className="live-badge"><span className="live-dot"></span> LIVE</span>
                </div>
                <div className="leaderboard-list">
                  <div className="leaderboard-item rank-1">
                    <span className="lb-rank">#1</span>
                    <div className="lb-avatar" style={{ background: '#B91C1C' }}>AK</div>
                    <span className="lb-name">Atul Krishnan</span>
                    <span className="lb-points">93 pts</span>
                  </div>
                  <div className="leaderboard-item rank-2">
                    <span className="lb-rank">#2</span>
                    <div className="lb-avatar" style={{ background: '#991B1B' }}>IG</div>
                    <span className="lb-name">Ishita Gupta</span>
                    <span className="lb-points">87 pts</span>
                  </div>
                  <div className="leaderboard-item rank-3">
                    <span className="lb-rank">#3</span>
                    <div className="lb-avatar" style={{ background: '#7F1D1D' }}>PM</div>
                    <span className="lb-name">Priya Menon</span>
                    <span className="lb-points">82 pts</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* APPLICANTS SECTION */}
        {activeSection === "applicants" && (
          <section className="dashboard-section active">
            <div className="section-header-row">
              <div>
                <span className="section-label"><span className="label-diamond">◆</span> APPLICANT REGISTRY</span>
                <h1>All Applicants</h1>
              </div>
              <div className="header-actions">
                <div className="search-box">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search applicants..." 
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <div className="filter-group">
                  <select 
                    className="filter-select" 
                    value={domainFilter}
                    onChange={(e) => {
                      setDomainFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all">All Departments</option>
                    <option value="Technical">Technical</option>
                    <option value="Projects">Projects</option>
                    <option value="Operations">Operations</option>
                    <option value="Design & Social Media">Design & Social Media</option>
                    <option value="Research & Development">Research & Development</option>
                    <option value="Finance">Finance</option>
                  </select>
                  <select 
                    className="filter-select" 
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="screening">Screening</option>
                    <option value="technical">Technical</option>
                    <option value="interview">Interview</option>
                    <option value="selected">Selected</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card table-card">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>APPLICANT</th>
                      <th>DEPARTMENT PREFERENCES</th>
                      <th>YEAR</th>
                      <th>STATUS</th>
                      <th>SCORE</th>
                      <th>APPLIED</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPage.map(a => (
                      <tr key={a.id}>
                        <td>
                          <div className="applicant-cell">
                            <div className="applicant-avatar-sm" style={{ background: a.avatarBg }}>{a.initials}</div>
                            <div>
                              <div className="applicant-name">{a.name}</div>
                              <div className="applicant-email">{a.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--red-400)' }}>1st: {a.firstPreference || a.domain}</span>
                            {a.secondPreference && a.secondPreference !== 'None' && (
                              <span style={{ fontSize: 11, color: 'var(--neutral-400)' }}>2nd: {a.secondPreference}</span>
                            )}
                          </div>
                        </td>
                        <td>{a.year}</td>
                        <td><span className={`status-badge status-${a.status}`}>{STATUS_LABELS[a.status]}</span></td>
                        <td>
                          <div className="score-display">
                            <span>{a.score}</span>
                            <div className="score-bar-mini">
                              <div className={`score-bar-mini-fill ${getScoreColorClass(a.score)}`} style={{ width: `${a.score}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{a.date}</td>
                        <td>
                          <button className="action-btn" title="View Details" onClick={() => setSelectedApplicant(a)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                          <button className="action-btn" title="Approve" onClick={() => handleApprove(a.id)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </button>
                          <button className="action-btn" title="Reject" onClick={() => handleReject(a.id)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <span className="table-info">
                  Showing {startIdx + 1}-{Math.min(startIdx + perPage, filteredList.length)} of {filteredList.length} applicants
                </span>
                <div className="pagination">
                  <button className="page-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage(prev => prev - 1)}>←</button>
                  <span className="page-numbers">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button 
                          key={pageNum} 
                          className={`page-num ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </span>
                  <button className="page-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>→</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ROUNDS SECTION */}
        {activeSection === "rounds" && (
          <section className="dashboard-section active">
            <div className="section-header-row">
              <div>
                <span className="section-label"><span className="label-diamond">◆</span> RECRUITMENT PIPELINE</span>
                <h1>Manage Rounds</h1>
              </div>
              <button className="btn-primary" onClick={() => triggerToast("Round functionality disabled", "error")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New Round
              </button>
            </div>

            <div className="rounds-grid">
              <div className="round-card round-completed">
                <div className="round-header">
                  <div className="round-number">// 01</div>
                  <span className="round-status-badge completed">COMPLETED</span>
                </div>
                <h3 className="round-title">Application Screening</h3>
                <p className="round-desc">Initial review of applications, resume screening, and basic eligibility checks.</p>
                <div className="round-meta">
                  <div className="round-meta-item">
                    <span className="meta-label">// candidates</span>
                    <span className="meta-value">348 → 271 passed</span>
                  </div>
                  <div className="round-meta-item">
                    <span className="meta-label">// duration</span>
                    <span className="meta-value">Aug 1 – Aug 10, 2026</span>
                  </div>
                </div>
                <div className="round-progress">
                  <div className="round-progress-bar" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="round-card round-active">
                <div className="round-header">
                  <div className="round-number">// 02</div>
                  <span className="round-status-badge active"><span className="active-dot"></span> ACTIVE</span>
                </div>
                <h3 className="round-title">Technical Assessment</h3>
                <p className="round-desc">Domain-specific coding challenges, project reviews, and technical problem-solving tasks.</p>
                <div className="round-meta">
                  <div className="round-meta-item">
                    <span className="meta-label">// candidates</span>
                    <span className="meta-value">271 remaining · 89 in progress</span>
                  </div>
                  <div className="round-meta-item">
                    <span className="meta-label">// deadline</span>
                    <span className="meta-value">Aug 20, 2026</span>
                  </div>
                </div>
                <div className="round-progress">
                  <div className="round-progress-bar active-bar" style={{ width: '67%' }}></div>
                </div>
              </div>

              <div className="round-card round-upcoming">
                <div className="round-header">
                  <div className="round-number">// 03</div>
                  <span className="round-status-badge upcoming">UPCOMING</span>
                </div>
                <h3 className="round-title">Personal Interview</h3>
                <p className="round-desc">One-on-one interviews with board members to assess cultural fit and passion for building.</p>
                <div className="round-meta">
                  <div className="round-meta-item">
                    <span className="meta-label">// expected</span>
                    <span className="meta-value">~120 candidates</span>
                  </div>
                  <div className="round-meta-item">
                    <span className="meta-label">// scheduled</span>
                    <span className="meta-value">Aug 25 – Sep 5, 2026</span>
                  </div>
                </div>
                <div className="round-progress">
                  <div className="round-progress-bar" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ANALYTICS SECTION */}
        {activeSection === "analytics" && (
          <section className="dashboard-section active">
            <div className="section-header-row">
              <div>
                <span className="section-label"><span className="label-diamond">◆</span> DATA INSIGHTS</span>
                <h1>Analytics</h1>
              </div>
            </div>

            <div className="two-col-grid">
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Applications Distribution By Domain</h2>
                </div>
                <div style={{ height: 260, padding: 10, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Domain Bars representation */}
                  <div className="domain-bars" style={{ flex: 1, justifyContent: 'center' }}>
                    <div className="domain-row">
                      <span className="domain-name" style={{ width: 120 }}>Web Dev</span>
                      <div className="domain-bar-track">
                        <div className="domain-bar-fill" style={{ width: '35%' }}></div>
                      </div>
                      <span className="domain-count">122 (35%)</span>
                    </div>
                    <div className="domain-row">
                      <span className="domain-name" style={{ width: 120 }}>ML</span>
                      <div className="domain-bar-track">
                        <div className="domain-bar-fill" style={{ width: '25%' }}></div>
                      </div>
                      <span className="domain-count">87 (25%)</span>
                    </div>
                    <div className="domain-row">
                      <span className="domain-name" style={{ width: 120 }}>App Dev</span>
                      <div className="domain-bar-track">
                        <div className="domain-bar-fill" style={{ width: '18%' }}></div>
                      </div>
                      <span className="domain-count">63 (18%)</span>
                    </div>
                    <div className="domain-row">
                      <span className="domain-name" style={{ width: 120 }}>Hardware</span>
                      <div className="domain-bar-track">
                        <div className="domain-bar-fill" style={{ width: '12%' }}></div>
                      </div>
                      <span className="domain-count">42 (12%)</span>
                    </div>
                    <div className="domain-row">
                      <span className="domain-name" style={{ width: 120 }}>Systems</span>
                      <div className="domain-bar-track">
                        <div className="domain-bar-fill" style={{ width: '10%' }}></div>
                      </div>
                      <span className="domain-count">34 (10%)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Conversion Rates by Round</h2>
                </div>
                <div style={{ height: 260, display: 'flex', alignItems: 'flex-end', gap: 16, padding: '20px 10px 10px' }}>
                  {/* Bar Chart representation */}
                  <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <div style={{ height: '100%', width: 24, background: 'rgba(185, 28, 28, 0.7)', borderRadius: '4px 4px 0 0' }}></div>
                    <span style={{ fontSize: 10, marginTop: 8, fontFamily: 'var(--font-mono)' }}>Applied</span>
                  </div>
                  <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <div style={{ height: '78%', width: 24, background: 'rgba(185, 28, 28, 0.55)', borderRadius: '4px 4px 0 0' }}></div>
                    <span style={{ fontSize: 10, marginTop: 8, fontFamily: 'var(--font-mono)' }}>Screening</span>
                  </div>
                  <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <div style={{ height: '52%', width: 24, background: 'rgba(185, 28, 28, 0.4)', borderRadius: '4px 4px 0 0' }}></div>
                    <span style={{ fontSize: 10, marginTop: 8, fontFamily: 'var(--font-mono)' }}>Technical</span>
                  </div>
                  <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <div style={{ height: '32%', width: 24, background: 'rgba(185, 28, 28, 0.3)', borderRadius: '4px 4px 0 0' }}></div>
                    <span style={{ fontSize: 10, marginTop: 8, fontFamily: 'var(--font-mono)' }}>Interview</span>
                  </div>
                  <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <div style={{ height: '15%', width: 24, background: 'rgba(239, 68, 68, 0.6)', borderRadius: '4px 4px 0 0' }}></div>
                    <span style={{ fontSize: 10, marginTop: 8, fontFamily: 'var(--font-mono)' }}>Offers</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="two-col-grid">
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Year-wise Breakdown</h2>
                </div>
                <div className="year-breakdown">
                  <div className="year-item">
                    <div className="year-label">1st Year</div>
                    <div className="year-bar-track">
                      <div className="year-bar-fill" style={{ width: '45%' }}></div>
                    </div>
                    <span className="year-count">157</span>
                    <span className="year-pct">45%</span>
                  </div>
                  <div className="year-item">
                    <div className="year-label">2nd Year</div>
                    <div className="year-bar-track">
                      <div className="year-bar-fill" style={{ width: '32%' }}></div>
                    </div>
                    <span className="year-count">111</span>
                    <span className="year-pct">32%</span>
                  </div>
                  <div className="year-item">
                    <div className="year-label">3rd Year</div>
                    <div className="year-bar-track">
                      <div className="year-bar-fill" style={{ width: '18%' }}></div>
                    </div>
                    <span className="year-count">63</span>
                    <span className="year-pct">18%</span>
                  </div>
                  <div className="year-item">
                    <div className="year-label">4th Year</div>
                    <div className="year-bar-track">
                      <div className="year-bar-fill" style={{ width: '5%' }}></div>
                    </div>
                    <span className="year-count">17</span>
                    <span className="year-pct">5%</span>
                  </div>
                </div>
              </div>

              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div className="quick-stats-row">
                  <div className="quick-stat">
                    <span className="qs-value">4.2 days</span>
                    <span className="qs-label">Avg. Review Time</span>
                  </div>
                  <div className="quick-stat">
                    <span className="qs-value">78%</span>
                    <span className="qs-label">Response Rate</span>
                  </div>
                  <div className="quick-stat">
                    <span className="qs-value">92%</span>
                    <span className="qs-label">Offer Acceptance</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* APPLICANT DETAIL MODAL */}
      {selectedApplicant && (
        <div className="modal-overlay show">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <span className="section-label"><span className="label-diamond">◆</span> APPLICANT PROFILE</span>
                <h2 className="modal-title">{selectedApplicant.name}</h2>
              </div>
              <button className="modal-close" onClick={() => setSelectedApplicant(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-grid">
                <div className="modal-info-group">
                  <span className="meta-label">// 1st Preference Domain</span>
                  <span className="meta-value">{selectedApplicant.firstPreference || DOMAIN_LABELS[selectedApplicant.domain]}</span>
                </div>
                <div className="modal-info-group">
                  <span className="meta-label">// Register Number</span>
                  <span className="meta-value">{selectedApplicant.registerNumber || 'N/A'}</span>
                </div>
                <div className="modal-info-group">
                  <span className="meta-label">// Year of Study</span>
                  <span className="meta-value">{selectedApplicant.year}</span>
                </div>
                <div className="modal-info-group">
                  <span className="meta-label">// Status</span>
                  <span className="meta-value">
                    <span className={`status-badge status-${selectedApplicant.status}`}>{STATUS_LABELS[selectedApplicant.status]}</span>
                  </span>
                </div>
                <div className="modal-info-group">
                  <span className="meta-label">// Student Email</span>
                  <span className="meta-value">{selectedApplicant.email}</span>
                </div>
                <div className="modal-info-group">
                  <span className="meta-label">// Phone Number</span>
                  <span className="meta-value">{selectedApplicant.phoneNumber || 'N/A'}</span>
                </div>
                <div className="modal-info-group">
                  <span className="meta-label">// Applied Date</span>
                  <span className="meta-value">{selectedApplicant.date}</span>
                </div>
                <div className="modal-info-group">
                  <span className="meta-label">// Evaluation Score</span>
                  <span className="meta-value">{selectedApplicant.score}/100</span>
                </div>
              </div>

              {/* Questionnaire Details */}
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {selectedApplicant.firstPrefReason && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 12, borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--red-400)', marginBottom: 4 }}>// WHY THIS FIRST PREFERENCE</div>
                    <div style={{ fontSize: 13, color: 'var(--neutral-300)', lineHeight: 1.5 }}>{selectedApplicant.firstPrefReason}</div>
                  </div>
                )}

                {selectedApplicant.secondPreference && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 12, borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--red-400)', marginBottom: 4 }}>// 2ND PREFERENCE ({selectedApplicant.secondPreference})</div>
                    <div style={{ fontSize: 13, color: 'var(--neutral-300)', lineHeight: 1.5 }}>{selectedApplicant.secondPrefReason || 'No reason provided'}</div>
                  </div>
                )}

                {selectedApplicant.sevenDaysBuild && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 12, borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--red-400)', marginBottom: 4 }}>// 7-DAY BUILD IDEA & TRADEOFFS</div>
                    <div style={{ fontSize: 13, color: 'var(--neutral-300)', lineHeight: 1.5 }}>{selectedApplicant.sevenDaysBuild}</div>
                  </div>
                )}

                {selectedApplicant.whyHackclub && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 12, borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--red-400)', marginBottom: 4 }}>// WHY HACKCLUB VIT CHENNAI</div>
                    <div style={{ fontSize: 13, color: 'var(--neutral-300)', lineHeight: 1.5 }}>{selectedApplicant.whyHackclub}</div>
                  </div>
                )}

                {selectedApplicant.skillToLearn && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 12, borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--red-400)', marginBottom: 4 }}>// SKILL TO LEARN THROUGH HACKCLUB</div>
                    <div style={{ fontSize: 13, color: 'var(--neutral-300)', lineHeight: 1.5 }}>{selectedApplicant.skillToLearn}</div>
                  </div>
                )}

                {selectedApplicant.productiveWebsiteQuestions && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 12, borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--red-400)', marginBottom: 4 }}>// PRODUCTIVE WEBSITE ARCHITECTURE & QUESTIONS</div>
                    <div style={{ fontSize: 13, color: 'var(--neutral-300)', lineHeight: 1.5 }}>{selectedApplicant.productiveWebsiteQuestions}</div>
                  </div>
                )}

                {/* Candidate Links */}
                {(selectedApplicant.github || selectedApplicant.linkedin || selectedApplicant.portfolio) && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                    {selectedApplicant.github && (
                      <a 
                        href={selectedApplicant.github.startsWith('http') ? selectedApplicant.github : `https://${selectedApplicant.github}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ fontSize: 12, padding: '6px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 4, color: '#fff', textDecoration: 'none' }}
                      >
                        GitHub ↗
                      </a>
                    )}
                    {selectedApplicant.linkedin && (
                      <a 
                        href={selectedApplicant.linkedin.startsWith('http') ? selectedApplicant.linkedin : `https://${selectedApplicant.linkedin}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ fontSize: 12, padding: '6px 12px', background: 'rgba(0,119,181,0.2)', border: '1px solid rgba(0,119,181,0.4)', borderRadius: 4, color: '#60a5fa', textDecoration: 'none' }}
                      >
                        LinkedIn ↗
                      </a>
                    )}
                    {selectedApplicant.portfolio && (
                      <a 
                        href={selectedApplicant.portfolio.startsWith('http') ? selectedApplicant.portfolio : `https://${selectedApplicant.portfolio}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ fontSize: 12, padding: '6px 12px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 4, color: '#f87171', textDecoration: 'none' }}
                      >
                        Portfolio ↗
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button 
                  className="btn-primary btn-approve"
                  onClick={() => {
                    handleApprove(selectedApplicant.id);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {selectedApplicant.status === 'interview' ? 'Accept / Select Candidate' : 'Advance to Next Round'}
                </button>
                <button 
                  className="btn-danger"
                  onClick={() => {
                    handleReject(selectedApplicant.id);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        </>
      )}

      {/* TOASTS CONTAINER */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">{t.type === "success" ? "✓" : "✕"}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}
