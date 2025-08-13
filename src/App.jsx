import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Star, StarOff, BookOpen, Timer,
  ClipboardList, CheckCircle2, X, ExternalLink, Plus, Minus,
  Download, Upload, Trash2, FolderPlus, NotebookPen,
  RefreshCw, Play, Pause, RotateCcw, FileText, Settings, BadgeCheck,
  Sparkles, HelpCircle, BarChart3, Lightbulb, ArrowRight,
  Moon, Sun, Calendar, Trophy, Users, MessageSquare, Tag, Bookmark, Shield, Layers, Target
} from "lucide-react";

/** =========================================================
 * Brand + Theme
 * ======================================================= */
const BRAND_DARK = "#111d2a";
const BRAND_BLUE = "#1a73e8";
const BRAND_BG   = "#FAFAFA";
const BRAND_WHITE= "#FFFFFF";

const makeTheme = (dark) => ({
  text: dark ? "#F5F7FA" : "#111827",
  subtext: dark ? "#D1D5DB" : "#6B7280",
  bg: dark ? "#0b1320" : BRAND_BG,
  card: dark ? "#121a27" : "#FFFFFF",
  border: dark ? "#243244" : "#E5E7EB",
  primary: BRAND_BLUE,
  brandDark: dark ? "#e6edf6" : BRAND_DARK,
});

const cx = (...clx) => clx.filter(Boolean).join(" ");

const Button = ({ className = "", variant = "default", size = "md", theme, style, ...props }) => {
  const base = "inline-flex items-center gap-2 rounded-2xl border transition px-3 py-2 text-sm font-medium hover:opacity-90";
  const sizes = { sm: "px-2 py-1 text-xs", md: "px-3 py-2 text-sm", lg: "px-4 py-2 text-base" };
  const s = {
    default: { backgroundColor: BRAND_DARK, borderColor: BRAND_DARK, color: BRAND_WHITE },
    ghost:   { backgroundColor: "transparent", borderColor: "transparent", color: theme?.text || "#111827" },
    outline: { backgroundColor: "transparent", borderColor: theme?.border || "#D1D5DB", color: theme?.text || "#111827" },
    subtle:  { backgroundColor: theme?.card || "#F3F4F6", borderColor: theme?.border || "#E5E7EB", color: theme?.text || "#111827" },
    success: { backgroundColor: "#16A34A", borderColor: "#16A34A", color: BRAND_WHITE },
    danger:  { backgroundColor: "#DC2626", borderColor: "#DC2626", color: BRAND_WHITE },
    accent:  { backgroundColor: BRAND_BLUE, borderColor: BRAND_BLUE, color: BRAND_WHITE },
  }[variant];

  return (
    <button
      className={cx(base, sizes[size], className)}
      style={{ ...s, ...(style || {}) }}
      {...props}
    />
  );
};

const Card = ({ className = "", theme, ...props }) => (
  <div className={cx("rounded-2xl border shadow-sm", className)} style={{ backgroundColor: theme?.card || "#fff", borderColor: theme?.border || "#e5e7eb" }} {...props} />
);

const Badge = ({ children, className = "", theme }) => (
  <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", className)}
        style={{ borderColor: theme?.border || "#e5e7eb", color: theme?.text || "#111827", backgroundColor: theme?.bg || "#fafafa" }}>{children}</span>
);

const Input = ({ className = "", theme, ...props }) => (
  <input
    className={cx("w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2", className)}
    style={{ backgroundColor: theme?.card || "#fff", color: theme?.text || "#111827", borderColor: theme?.border || "#e5e7eb", caretColor: theme?.text || "#111827" }}
    {...props}
  />
);

const Select = ({ className = "", options = [], value, onChange, theme }) => (
  <select
    className={cx("w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2", className)}
    style={{ backgroundColor: theme?.card || "#fff", color: theme?.text || "#111827", borderColor: theme?.border || "#e5e7eb" }}
    value={value}
    onChange={e => onChange(e.target.value)}
  >
    {options.map(o => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

const Tabs = ({ tabs, value, onChange, theme }) => (
  <div>
    <div className="flex flex-wrap gap-2">
      {tabs.map(t => (
        <Button
          key={t.value}
          theme={theme}
          variant={value === t.value ? "accent" : "outline"}
          onClick={() => onChange(t.value)}
        >
          {t.icon && <t.icon size={16} />} {t.label}
        </Button>
      ))}
    </div>
  </div>
);

/** =========================================================
 * Sample data and helpers - keeps original structure
 * ======================================================= */
const BASE_CERTS = [
  {
    id: "itf+", name: "CompTIA ITF+", vendor: "CompTIA", level: "Starter",
    domains: ["Core IT"], estHours: 25,
    skills: ["basic hardware", "software", "troubleshooting", "security basics"],
    resources: [
      { title: "Official Overview", url: "https://www.comptia.org/certifications/itf", type: "guide" },
      { title: "Professor Messer Videos", url: "https://www.professormesser.com/", type: "video" },
    ],
    flashcards: [
      { q: "What does CPU stand for?", a: "Central Processing Unit" },
      { q: "One kilobyte equals how many bytes?", a: "1,024 bytes" },
    ],
    quiz: [
      { q: "Which is an input device?", options: ["Monitor", "Keyboard", "Projector", "GPU"], answer: 1, exp: "Keyboard inputs data." },
      { q: "Best definition of OS?", options: ["A word processor", "System that manages hardware and software", "A type of CPU", "Cloud service"], answer: 1, exp: "OS manages resources." },
    ],
  },
  {
    id: "a+", name: "CompTIA A+", vendor: "CompTIA", level: "Starter",
    domains: ["Core IT"], estHours: 120,
    skills: ["PC hardware", "OS install", "troubleshooting", "basic networking", "security"],
    resources: [
      { title: "CompTIA A+ Home", url: "https://www.comptia.org/certifications/a", type: "guide" },
      { title: "Professor Messer A+", url: "https://www.professormesser.com/free-a-plus-training/", type: "video" },
    ],
    flashcards: [
      { q: "What is DHCP used for?", a: "Automatic IP addressing" },
      { q: "What port does RDP use?", a: "TCP 3389" },
      { q: "What does POST check?", a: "Basic hardware at boot" },
    ],
    quiz: [
      { q: "Which connector powers SATA drives?", options: ["Molex", "SATA power", "PCIe", "ATX"], answer: 1, exp: "SATA power connector." },
      { q: "Which command checks disk in Windows?", options: ["ipconfig", "chkdsk", "sfc", "tasklist"], answer: 1, exp: "Use chkdsk for disk checks." },
    ],
  },
  {
    id: "net+", name: "CompTIA Network+", vendor: "CompTIA", level: "Intermediate",
    domains: ["Networking"], estHours: 100,
    skills: ["layered models", "routing", "switching", "wireless", "security", "troubleshooting"],
    resources: [
      { title: "Network+ Home", url: "https://www.comptia.org/certifications/network", type: "guide" },
      { title: "Network Chuck", url: "https://www.youtube.com/@NetworkChuck", type: "video" },
    ],
    flashcards: [
      { q: "Port for HTTPS?", a: "TCP 443" },
      { q: "What does ARP do?", a: "Maps IP to MAC" },
      { q: "OSPF is a...", a: "Link-state routing protocol" },
    ],
    quiz: [
      { q: "CIDR for a /26 network?", options: ["255.255.255.0", "255.255.255.192", "255.255.255.224", "255.255.255.128"], answer: 1, exp: "/26 equals 255.255.255.192." },
      { q: "802.11ac operates on?", options: ["2.4 GHz", "5 GHz", "Both", "60 GHz"], answer: 1, exp: "802.11ac is 5 GHz." },
    ],
  },
];

const DEFAULT_FLASHCARDS = {
  "aws-ccp": [
    { q: "What is the shared responsibility model?", a: "AWS sec of cloud - you sec in the cloud" },
    { q: "Which service stores objects?", a: "Amazon S3" },
  ],
  "az-900": [
    { q: "CapEx vs OpEx in cloud?", a: "CapEx upfront - OpEx pay-as-you-go" },
    { q: "Azure AD is now called?", a: "Microsoft Entra ID" },
  ],
};

const DEFAULT_QUIZ = {
  "aws-ccp": [
    { q: "Which service is serverless compute?", options: ["EC2", "Lambda", "ECS", "EKS"], answer: 1, exp: "Lambda is serverless" },
    { q: "Which is global DNS?", options: ["Route 53", "CloudFront", "Global Accelerator", "ELB"], answer: 0, exp: "Route 53 handles DNS" },
  ],
  "az-900": [
    { q: "What is PaaS example?", options: ["VM Scale Set", "App Service", "Blob Storage", "VNet"], answer: 1, exp: "App Service is PaaS" },
  ],
};

const ROADMAPS = [
  {
    id: "helpdesk",
    title: "Helpdesk to Desktop",
    items: ["CompTIA ITF+", "CompTIA A+", "Microsoft MS-900", "CompTIA Network+"],
    note: "Hands-on labs weekly. Aim for ticket triage speed and documentation."
  },
  {
    id: "networking",
    title: "Networking Associate Path",
    items: ["CompTIA Network+", "Cisco CCNA", "Juniper JNCIA-Junos", "Aruba ACA Networking"],
    note: "Build a home lab with two switches and a router, practice VLANs and OSPF."
  },
  {
    id: "security",
    title: "Security Analyst Path",
    items: ["CompTIA Security+", "ISC2 Certified in Cybersecurity (CC)", "Cisco CyberOps Associate", "Microsoft SC-200"],
    note: "Practice SIEM with Sentinel or Splunk Free, run capture-the-flag weekly."
  },
  {
    id: "cloud",
    title: "Cloud Associate Path",
    items: ["AWS Cloud Practitioner", "Microsoft AZ-900 Azure Fundamentals", "AWS Solutions Architect Associate", "Microsoft AZ-104 Azure Administrator"],
    note: "Keep personal cloud costs under $20 per month using free tiers and budgets."
  },
];

/** =========================================================
 * Persistence
 * ======================================================= */
const LS_KEY = "it-cert-hub/v2";
const loadState = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
};
const saveState = (s) => localStorage.setItem(LS_KEY, JSON.stringify(s));

/** =========================================================
 * Main Component - original name preserved
 * ======================================================= */
export default function IICertStudyHub() {
  // theme
  const [dark, setDark] = useState(loadState().ui?.dark ?? false);
  const theme = useMemo(() => makeTheme(dark), [dark]);

  // UI
  const [tab, setTab] = useState(loadState().ui?.tab || "catalog");
  const [q, setQ] = useState("");
  const [vendor, setVendor] = useState("all");
  const [domain, setDomain] = useState("all");
  const [level, setLevel] = useState("all");

  // original state
  const [favorites, setFavorites] = useState(loadState().favorites || []);
  const [plan, setPlan] = useState(loadState().plan || {}); // certId -> {targetDate, progress:0-100, notes:""}
  const [activeCert, setActiveCert] = useState(null);
  const [closedForCertId, setClosedForCertId] = useState(null);
  const [pomodoro, setPomodoro] = useState(loadState().pomodoro || { running:false, seconds: 25*60, mode: "focus", focusMins:25, breakMins:5, logged:{} });
  const [fcProgress, setFcProgress] = useState(loadState().fcProgress || {}); // kept for backward compat
  const [quizState, setQuizState] = useState(loadState().quizState || {});

  // new additive state
  const [bookmarks, setBookmarks] = useState(loadState().bookmarks || []);
  const [srs, setSrs] = useState(loadState().srs || {}); // spaced repetition
  const [quizHistory, setQuizHistory] = useState(loadState().quizHistory || {}); // adaptive
  const [exam, setExam] = useState(null);
  const [goals, setGoals] = useState(loadState().goals || { dailyMinutes: 30, weeklyMinutes: 210 });
  const [streak, setStreak] = useState(loadState().streak || { last: "", days: 0, badges: [] });
  const [leaderboard, setLeaderboard] = useState(loadState().leaderboard || { nick:"", optIn:false, points:0 });
  const [offline, setOffline] = useState(loadState().offline || false);

  // save
  useEffect(() => {
    saveState({ favorites, plan, pomodoro, fcProgress, quizState, bookmarks, srs, quizHistory, goals, streak, leaderboard, offline, ui:{ tab, dark } });
  }, [favorites, plan, pomodoro, fcProgress, quizState, bookmarks, srs, quizHistory, goals, streak, leaderboard, offline, tab, dark]);

  const ALL_CERTS = useMemo(() => [...BASE_CERTS], []);

  const allVendors = useMemo(() => Array.from(new Set(ALL_CERTS.map(c => c.vendor))).sort(), [ALL_CERTS]);
  const allDomains = useMemo(() => Array.from(new Set(ALL_CERTS.flatMap(c => c.domains))).sort(), [ALL_CERTS]);
  const allLevels  = useMemo(() => Array.from(new Set(ALL_CERTS.map(c => c.level))), [ALL_CERTS]);

  const filtered = useMemo(() => {
    const qLower = q.toLowerCase();
    return ALL_CERTS.filter(c => (
      (vendor === "all" || c.vendor === vendor) &&
      (domain === "all" || c.domains.includes(domain)) &&
      (level === "all" || c.level === level) &&
      (!q || (c.name.toLowerCase().includes(qLower) || c.skills?.some(s => String(s).toLowerCase().includes(qLower))))
    ));
  }, [q, vendor, domain, level, ALL_CERTS]);

  const toggleFavorite = (id) => setFavorites(f => f.includes(id) ? f.filter(x=>x!==id) : [...f, id]);
  const addToPlan = (id) => setPlan(p => ({ ...p, [id]: p[id] || { targetDate: "", progress: 0, notes: "" } }));
  const removeFromPlan = (id) => setPlan(p => { const n = { ...p }; delete n[id]; return n; });
  const certById = (id) => ALL_CERTS.find(c => c.id === id);

  // choose cert like before
  const currentCertId = useMemo(() => activeCert?.id || Object.keys(plan)[0] || ALL_CERTS[0]?.id, [activeCert, plan, ALL_CERTS]);
  const currentCert = useMemo(() => (currentCertId ? certById(currentCertId) : null), [currentCertId, ALL_CERTS]);

  // keep activeCert initialized once - original fix
  const didInitActive = useRef(false);
  useEffect(() => {
    if (!didInitActive.current && currentCert) {
      setActiveCert(currentCert);
      didInitActive.current = true;
      return;
    }
    if (!currentCert) return;
    if (closedForCertId === currentCert.id) return;
    setActiveCert(currentCert);
  }, [currentCert, closedForCertId]);

  const handleCloseDrawer = () => {
    setClosedForCertId(currentCert?.id || activeCert?.id || null);
    setActiveCert(null);
  };

  // Esc to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && activeCert) handleCloseDrawer(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeCert, currentCertId]);

  /** ---------------- Pomodoro with editable times + analytics ---------------- */
  useEffect(() => {
    if (!pomodoro.running) return;
    const id = setInterval(() => {
      setPomodoro(p => {
        const logged = { ...(p.logged||{}) };
        const key = activeCert?.id || "general";
        logged[key] = (logged[key] || 0) + 1;
        if (p.seconds > 1) return { ...p, seconds: p.seconds - 1, logged };
        const nextMode = p.mode === "focus" ? "break" : "focus";
        const nextSeconds = (nextMode === "focus" ? p.focusMins : p.breakMins) * 60;
        return { ...p, running:false, mode: nextMode, seconds: nextSeconds, logged };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [pomodoro.running, activeCert]);

  /** ---------------- Flashcards helpers + SRS ---------------- */
  const getFlashcards = (id) => certById(id)?.flashcards || DEFAULT_FLASHCARDS[id] || [];
  const [srsMode, setSrsMode] = useState(false);

  const initSrsFor = (certId) => {
    const cards = getFlashcards(certId);
    setSrs(prev => {
      const cur = prev[certId] || { binIdxByCardIndex: {}, nextDueByCardIndex: {} };
      const bin = { ...cur.binIdxByCardIndex };
      const due = { ...cur.nextDueByCardIndex };
      cards.forEach((_, i) => {
        if (bin[i] == null) bin[i] = 1;
        if (!due[i]) due[i] = 0;
      });
      return { ...prev, [certId]: { binIdxByCardIndex: bin, nextDueByCardIndex: due } };
    });
  };
  useEffect(() => { if (activeCert) initSrsFor(activeCert.id); }, [activeCert]);

  const nextDueIndex = (certId) => {
    const cards = getFlashcards(certId);
    const conf = srs[certId];
    if (!cards.length || !conf) return 0;
    const now = Date.now();
    const dueIndices = cards.map((_, i) => [i, conf.nextDueByCardIndex?.[i] ?? 0]).filter(([,d]) => d <= now).map(([i])=>i);
    const pool = dueIndices.length ? dueIndices : cards.map((_, i) => i);
    pool.sort((a,b) => (conf.binIdxByCardIndex[a]||1) - (conf.binIdxByCardIndex[b]||1));
    return pool[0] || 0;
  };

  const gradeCard = (certId, index, knewIt) => {
    const mapBinToDelay = (bin) => {
      const mins = { 1: 5, 2: 30, 3: 12*60, 4: 24*60, 5: 72*60 }[bin] || 5;
      return mins * 60000;
    };
    setSrs(prev => {
      const cur = prev[certId] || { binIdxByCardIndex: {}, nextDueByCardIndex: {} };
      const bin = { ...cur.binIdxByCardIndex };
      const due = { ...cur.nextDueByCardIndex };
      const current = bin[index] || 1;
      const nextBin = Math.max(1, Math.min(5, current + (knewIt ? 1 : -1)));
      bin[index] = nextBin;
      due[index] = Date.now() + mapBinToDelay(nextBin);
      return { ...prev, [certId]: { binIdxByCardIndex: bin, nextDueByCardIndex: due } };
    });
  };

  const nextFlash = (id, know) => {
    const cards = getFlashcards(id);
    if (!cards.length) return;
    setFcProgress((fp) => {
      const cur = fp[id] || { index: 0, known: [] };
      const known = know ? Array.from(new Set([...(cur.known || []), cur.index])) : (cur.known || []);
      const next = (cur.index + 1) % cards.length;
      return { ...fp, [id]: { index: next, known } };
    });
  };
  const resetFlash = (id) => setFcProgress(fp => ({ ...fp, [id]: { index: 0, known: [] } }));
  const shuffleFlash = (id) => {
    const cards = getFlashcards(id);
    if (!cards.length) return;
    const idx = Math.floor(Math.random() * cards.length);
    setFcProgress(fp => {
      const cur = fp[id] || { index: 0, known: [] };
      return { ...fp, [id]: { ...cur, index: idx } };
    });
  };

  /** ---------------- Quiz helpers + Adaptive ---------------- */
  const getQuiz = (id) => {
    const base = certById(id)?.quiz || DEFAULT_QUIZ[id] || [];
    const hist = quizHistory[id]?.wrongCountsByIndex || {};
    // Adaptive mode - weak first
    return base
      .map((q, i) => ({ ...q, __i: i, __w: hist[i] || 0 }))
      .sort((a, b) => b.__w - a.__w)
      .map(({__i, __w, ...rest}) => rest);
  };

  const answerQuiz = (id, choice) => {
    const items = getQuiz(id);
    setQuizState(qs => {
      const cur = qs[id] || { idx: 0, correct: 0, answers: [] };
      const item = items[cur.idx];
      const isCorrect = choice === item?.answer;
      const answers = [...(cur.answers||[]), { choice, correct: isCorrect }];
      const correct = cur.correct + (isCorrect ? 1 : 0);
      const nextIdx = (cur.idx + 1) % (items.length || 1);
      // record history for adaptive
      setQuizHistory(h => {
        const prev = h[id] || { wrongCountsByIndex: {} };
        const map = { ...(prev.wrongCountsByIndex || {}) };
        if (!isCorrect) map[cur.idx] = (map[cur.idx] || 0) + 1;
        return { ...h, [id]: { wrongCountsByIndex: map } };
      });
      return { ...qs, [id]: { idx: nextIdx, correct, answers } };
    });
  };
  const resetQuiz = (id) => setQuizState(qs => ({ ...qs, [id]: { idx: 0, correct: 0, answers: [] } }));

  /** ---------------- Practice Exam (timed) ---------------- */
  const startExam = (certId, minutes=30, num=20) => {
    const bank = getQuiz(certId);
    const items = [...bank].sort(() => Math.random() - 0.5).slice(0, Math.min(num, bank.length));
    setExam({ certId, items, remaining: minutes*60, idx: 0, answers: [], score: 0, started: Date.now() });
  };
  useEffect(() => {
    if (!exam) return;
    const id = setInterval(() => {
      setExam(e => {
        if (!e) return e;
        if (e.remaining <= 0) return e;
        return { ...e, remaining: e.remaining - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [exam?.started]);

  const answerExam = (choice) => {
    setExam(e => {
      if (!e) return e;
      const item = e.items[e.idx];
      const correct = choice === item.answer;
      const answers = [...e.answers, { choice, correct }];
      const score = e.score + (correct ? 1 : 0);
      const nextIdx = Math.min(e.idx + 1, e.items.length - 1);
      return { ...e, answers, score, idx: nextIdx };
    });
  };

  /** ---------------- Utilities ---------------- */
  const exportStudyBlock = (title, minutes=60) => {
    const start = new Date();
    const end = new Date(start.getTime() + minutes*60000);
    const dt = (d) => d.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
    const ics = [
      "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//CertWolf//Study//EN",
      "BEGIN:VEVENT",`DTSTART:${dt(start)}`,`DTEND:${dt(end)}`,`SUMMARY:${title}`,"END:VEVENT","END:VCALENDAR"
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "study.ics"; a.click(); URL.revokeObjectURL(url);
  };

  const todayKey = new Date().toISOString().slice(0,10);
  useEffect(() => {
    const secToday = (pomodoro.logged?.[activeCert?.id || "general"] || 0);
    if (secToday > 0 && streak.last !== todayKey) {
      const diff = streak.last ? (Date.parse(todayKey) - Date.parse(streak.last)) / 86400000 : 1;
      const newDays = diff === 1 ? streak.days + 1 : 1;
      const badges = [...(streak.badges||[])];
      if (newDays === 3 && !badges.includes("3-day")) badges.push("3-day");
      if (newDays === 7 && !badges.includes("7-day")) badges.push("7-day");
      if (newDays === 30 && !badges.includes("30-day")) badges.push("30-day");
      setStreak({ last: todayKey, days: newDays, badges });
    }
  }, [pomodoro.logged]);

  const masteryBySkill = useMemo(() => {
    const map = {};
    Object.entries(plan).forEach(([id, meta]) => {
      const c = certById(id); if (!c) return;
      const perSkill = (meta.progress || 0) / (c.skills?.length || 1);
      c.skills.forEach(s => { map[s] = Math.max(map[s] || 0, perSkill); });
    });
    return map;
  }, [plan]);

  const readinessFor = (certId) => {
    const p = plan[certId]?.progress || 0;
    const hist = quizHistory[certId];
    const attempts = Object.values(hist?.wrongCountsByIndex || {}).reduce((a,b)=>a+b, 0);
    const cards = getFlashcards(certId);
    const conf = srs[certId];
    const avgBin = conf && cards.length ? (cards.reduce((sum,_,i)=>sum + (conf.binIdxByCardIndex?.[i]||1),0)/cards.length) : 1;
    const score = 0.5*p + 0.3*(avgBin/5*100) - 0.2*Math.min(100, attempts*2);
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b backdrop-blur" style={{ backgroundColor: dark ? "rgba(11,19,32,0.85)" : "rgba(255,255,255,0.85)", borderColor: theme.border }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="https://i.imgur.com/WqdkIGU.png" alt="CertWolf Logo" className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: theme.brandDark }}>CertWolf Study Hub</h1>
              <p className="text-xs" style={{ color: theme.subtext }}>Plan, study, quiz, and track your progress</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button theme={theme} variant="outline" onClick={() => setDark(!dark)}>{dark ? <Sun size={16}/> : <Moon size={16}/> } Theme</Button>
            <Button theme={theme} variant="outline" onClick={() => setTab("notes")}><FileText size={16}/> Notes</Button>
            <Button theme={theme} variant="outline" onClick={() => setTab("plan")}><ClipboardList size={16}/> My Plan</Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1">
            <Card theme={theme} className="p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: theme.brandDark }}><Filter size={16}/> Filters</div>
              <div className="mb-3">
                <div className="mb-1 text-xs font-semibold" style={{ color: theme.subtext }}>Search</div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5" size={16}/>
                  <Input theme={theme} placeholder="Find a cert" value={q} onChange={e=>setQ(e.target.value)} className="pl-8"/>
                </div>
              </div>
              <div className="mb-3">
                <div className="mb-1 text-xs font-semibold" style={{ color: theme.subtext }}>Vendor</div>
                <Select theme={theme} value={vendor} onChange={setVendor} options={[{value:"all", label:"All"}, ...allVendors.map(v=>({value:v,label:v}))]}/>
              </div>
              <div className="mb-3">
                <div className="mb-1 text-xs font-semibold" style={{ color: theme.subtext }}>Domain</div>
                <Select theme={theme} value={domain} onChange={setDomain} options={[{value:"all", label:"All"}, ...allDomains.map(v=>({value:v,label:v}))]}/>
              </div>
              <div className="mb-4">
                <div className="mb-1 text-xs font-semibold" style={{ color: theme.subtext }}>Level</div>
                <Select theme={theme} value={level} onChange={setLevel} options={[{value:"all", label:"All"}, ...allLevels.map(v=>({value:v,label:v}))]}/>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button theme={theme} variant="subtle" onClick={() => { setVendor("all"); setDomain("all"); setLevel("all"); setQ(""); }}>
                  <RefreshCw size={16}/> Reset
                </Button>
                <Button theme={theme} variant="accent" onClick={() => setTab("roadmaps")}>
                  <Lightbulb size={16}/> Roadmaps
                </Button>
              </div>
            </Card>

            {/* Pomodoro - preserved, now editable */}
            <Card theme={theme} className="mt-6 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: theme.brandDark }}><Timer size={16}/> Pomodoro</div>
              <div className="text-3xl font-bold tabular-nums" style={{ color: theme.brandDark }}>
                {String(Math.floor(pomodoro.seconds/60)).padStart(2,"0")}:{String(pomodoro.seconds%60).padStart(2,"0")}
              </div>
              <div className="mt-1 text-xs" style={{ color: theme.subtext }}>Mode: {pomodoro.mode}</div>
              <div className="mt-3 flex gap-2">
                {!pomodoro.running ? (
                  <Button theme={theme} variant="accent" onClick={()=>setPomodoro(p=>({...p, running:true}))}><Play size={16}/> Start</Button>
                ) : (
                  <Button theme={theme} variant="outline" onClick={()=>setPomodoro(p=>({...p, running:false}))}><Pause size={16}/> Pause</Button>
                )}
                <Button theme={theme} variant="outline" onClick={()=>setPomodoro({running:false, seconds:pomodoro.focusMins*60, mode:"focus", focusMins:pomodoro.focusMins, breakMins:pomodoro.breakMins, logged:pomodoro.logged})}><RotateCcw size={16}/> Reset</Button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2">
                  Focus
                  <Input theme={theme} type="number" min="5" max="180" value={pomodoro.focusMins} onChange={e=>setPomodoro(p=>({...p, focusMins:+e.target.value}))} className="w-20" />
                </label>
                <label className="flex items-center gap-2">
                  Break
                  <Input theme={theme} type="number" min="1" max="60" value={pomodoro.breakMins} onChange={e=>setPomodoro(p=>({...p, breakMins:+e.target.value}))} className="w-20" />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button theme={theme} variant="outline" onClick={() => exportStudyBlock("Study Block", pomodoro.focusMins)}><Calendar size={16}/> Calendar</Button>
                <Button theme={theme} variant="outline" onClick={()=>window.print()}><FileText size={16}/> Print</Button>
              </div>
            </Card>
          </aside>

          {/* Main Panels */}
          <section className="lg:col-span-3">
            <div className="mb-4">
              <Tabs
                theme={theme}
                value={tab}
                onChange={setTab}
                tabs={[
                  { value:"catalog", label:"Catalog", icon: BookOpen },
                  { value:"roadmaps", label:"Roadmaps", icon: Sparkles },
                  { value:"plan", label:"Study Plan", icon: ClipboardList },
                  { value:"flashcards", label:"Flashcards", icon: NotebookPen },
                  { value:"quiz", label:"Quizzes", icon: HelpCircle },
                  // new additive tabs
                  { value:"exam", label:"Practice Exam", icon: Shield },
                  { value:"bank", label:"Question Bank", icon: Layers },
                  { value:"notes", label:"Notes", icon: FileText },
                  { value:"progress", label:"Progress", icon: BarChart3 },
                  { value:"tools", label:"Tools", icon: Settings },
                  { value:"community", label:"Community", icon: Users },
                  { value:"settings", label:"Settings", icon: Settings },
                ]}
              />
            </div>

            {/* Catalog (unchanged) */}
            {tab === "catalog" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map(c => {
                  const fav = favorites.includes(c.id);
                  return (
                    <motion.div key={c.id} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
                      <Card theme={theme} className="flex h-full flex-col p-4">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm" style={{ color: theme.subtext }}>{c.vendor}</div>
                            <h3 className="text-lg font-semibold leading-tight" style={{ color: theme.brandDark }}>{c.name}</h3>
                          </div>
                          <button onClick={()=>toggleFavorite(c.id)} className="text-gray-600 hover:opacity-90" title={fav ? "Unfavorite" : "Favorite"}>
                            {fav ? <Star size={18} className="text-yellow-400"/> : <StarOff size={18}/>}
                          </button>
                        </div>
                        <div className="mb-2 flex flex-wrap gap-2">
                          <Badge theme={theme}>{c.level}</Badge>
                          {c.domains.slice(0,2).map(d => <Badge key={d} theme={theme}>{d}</Badge>)}
                          <Badge theme={theme}>~{c.estHours} hrs</Badge>
                        </div>
                        <p className="mb-3 line-clamp-3 text-sm" style={{ color: theme.subtext }}>Skills: {c.skills?.join(", ")}</p>
                        <div className="mt-auto flex items-center gap-2">
                          <Button theme={theme} onClick={()=>setActiveCert(c)} size="sm"><FileText size={16}/> Details</Button>
                          {!plan[c.id] ? (
                            <Button theme={theme} variant="accent" size="sm" onClick={()=>addToPlan(c.id)}><FolderPlus size={16}/> Add to Plan</Button>
                          ) : (
                            <Button theme={theme} variant="subtle" size="sm" onClick={()=>setTab("plan")}><BadgeCheck size={16}/> In Plan</Button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Roadmaps + Custom Builder (additive) */}
            {tab === "roadmaps" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {ALL_ROADMAPS.map(r => (
                    <Card key={r.id} theme={theme} className="p-4">
                      <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>{r.title}</div>
                      <ol className="mb-3 list-decimal pl-5 text-sm">
                        {r.items.map(step => (<li key={step} className="mb-1">{step}</li>))}
                      </ol>
                      <div className="mb-3 text-xs" style={{ color: theme.subtext }}>{r.note}</div>
                      <div className="flex flex-wrap gap-2">
                        {r.items.map(step => {
                          const c = ALL_CERTS.find(x=>x.name===step);
                          return (
                            <Button key={step} theme={theme} size="sm" variant={c && plan[c.id] ? "subtle" : "outline"} onClick={()=> c && addToPlan(c.id)}>
                              <Plus size={14}/> Add {c?.vendor || ""}
                            </Button>
                          );
                        })}
                      </div>
                    </Card>
                  ))}
                </div>
                <Card theme={theme} className="p-4">
                  <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Custom Roadmap Builder</div>
                  <RoadmapBuilderInline theme={theme} certs={ALL_CERTS} onAdd={(id)=>addToPlan(id)} />
                </Card>
              </div>
            )}

            {/* Study Plan (original preserved) */}
            {tab === "plan" && (
              <div className="space-y-4">
                {Object.keys(plan).length === 0 && (
                  <Card theme={theme} className="p-6 text-center text-sm" style={{ color: theme.subtext }}>No items yet. Add a cert from the catalog or a roadmap.</Card>
                )}
                {Object.entries(plan).map(([id, meta]) => {
                  const c = certById(id);
                  if (!c) return null;
                  return (
                    <Card key={id} theme={theme} className="p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-xs" style={{ color: theme.subtext }}>{c.vendor} - {c.level}</div>
                          <div className="text-lg font-semibold" style={{ color: theme.brandDark }}>{c.name}</div>
                          <div className="mt-1 text-xs" style={{ color: theme.subtext }}>
                            Target:{" "}
                            <input
                              type="date"
                              value={meta.targetDate}
                              onChange={e=>setPlan(p=>({...p, [id]:{...p[id], targetDate:e.target.value}}))}
                              className="rounded border px-1 py-0.5"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button theme={theme} variant="outline" onClick={()=>setActiveCert(c)} size="sm"><FileText size={16}/> Details</Button>
                          <Button theme={theme} variant="danger" onClick={()=>removeFromPlan(id)} size="sm"><Trash2 size={16}/> Remove</Button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <div className="mb-1 text-xs font-semibold" style={{ color: theme.brandDark }}>Progress</div>
                          <div className="flex items-center gap-2">
                            <Button theme={theme} size="sm" variant="subtle" onClick={()=>setPlan(p=>({...p, [id]:{...p[id], progress: Math.max(0, (p[id].progress||0) - 5)}}))}><Minus size={14}/></Button>
                            <div className="w-full rounded-full" style={{ backgroundColor: theme.border }}>
                              <div className="h-3 rounded-full" style={{ width: `${meta.progress||0}%`, backgroundColor: BRAND_BLUE }} />
                            </div>
                            <Button theme={theme} size="sm" variant="subtle" onClick={()=>setPlan(p=>({...p, [id]:{...p[id], progress: Math.min(100, (p[id].progress||0) + 5)}}))}><Plus size={14}/></Button>
                            <div className="w-10 text-right text-sm tabular-nums">{meta.progress||0}%</div>
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs font-semibold" style={{ color: theme.brandDark }}>Notes</div>
                          <textarea
                            value={meta.notes}
                            onChange={e=>setPlan(p=>({...p, [id]:{...p[id], notes:e.target.value}}))}
                            className="h-24 w-full rounded-xl border p-2 text-sm"
                            style={{ backgroundColor: theme.card, color: theme.text, borderColor: theme.border }}
                            placeholder="Key topics, weak spots, next steps"
                          />
                        </div>
                        <div>
                          <div className="mb-1 text-xs font-semibold" style={{ color: theme.brandDark }}>Quick Actions</div>
                          <div className="flex flex-wrap gap-2">
                            {!!getFlashcards(id).length && <Button theme={theme} size="sm" variant="outline" onClick={()=>{setActiveCert(c); setTab("flashcards");}}><NotebookPen size={16}/> Flashcards</Button>}
                            {!!getQuiz(id).length && <Button theme={theme} size="sm" variant="outline" onClick={()=>{setActiveCert(c); setTab("quiz");}}><HelpCircle size={16}/> Quiz</Button>}
                            <Button theme={theme} size="sm" variant="outline" onClick={()=>window.print()}><FileText size={16}/> Print Plan</Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Flashcards (original preserved) + SRS toggle */}
            {tab === "flashcards" && (
              <Card theme={theme} className="p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold">Choose a cert</div>
                  <Select
                    theme={theme}
                    value={activeCert?.id || Object.keys(plan)[0] || ALL_CERTS[0]?.id}
                    onChange={val=>setActiveCert(certById(val))}
                    options={ALL_CERTS.map(c=>({value:c.id,label:c.name}))}
                  />
                  {activeCert && (
                    <div className="flex flex-wrap gap-2">
                      <Button theme={theme} size="sm" variant="subtle" onClick={()=>shuffleFlash(activeCert.id)}>Shuffle</Button>
                      <Button theme={theme} size="sm" variant="outline" onClick={()=>resetFlash(activeCert.id)}>Reset</Button>
                      <Button theme={theme} size="sm" variant={srsMode ? "accent" : "outline"} onClick={()=>setSrsMode(v=>!v)}>SRS Mode</Button>
                    </div>
                  )}
                </div>
                {activeCert ? (
                  srsMode ? (
                    <FlashcardsSRS cert={activeCert} theme={theme} getCards={getFlashcards} nextDueIndex={nextDueIndex} gradeCard={gradeCard} addBookmark={(info)=>setBookmarks(b=>[...b, info])} />
                  ) : (
                    <FlashcardsBasic cert={activeCert} theme={theme} getFlashcards={getFlashcards} next={nextFlash} fcProgress={fcProgress[activeCert.id]} addBookmark={(info)=>setBookmarks(b=>[...b, info])} />
                  )
                ) : (
                  <div className="text-sm" style={{ color: theme.subtext }}>Add a cert to your plan first.</div>
                )}
              </Card>
            )}

            {/* Quizzes (original preserved) - adaptive is internal */}
            {tab === "quiz" && (
              <Card theme={theme} className="p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold">Choose a cert</div>
                  <Select
                    theme={theme}
                    value={currentCertId}
                    onChange={(val) => setActiveCert(certById(val))}
                    options={ALL_CERTS.map((c) => ({ value: c.id, label: c.name }))}
                  />
                  {currentCert && (
                    <Button theme={theme} size="sm" variant="outline" onClick={()=>resetQuiz(currentCert.id)}>Reset Quiz</Button>
                  )}
                </div>

                {currentCert ? (
                  <QuizPane theme={theme} cert={currentCert} getQuiz={getQuiz} quizState={quizState[currentCert.id]} onAnswer={(choice) => answerQuiz(currentCert.id, choice)} addBookmark={(info)=>setBookmarks(b=>[...b, info])}/>
                ) : (
                  Object.keys(plan).length === 0 && (
                    <div className="text-sm" style={{ color: theme.subtext }}>Add a cert to your plan first.</div>
                  )
                )}
              </Card>
            )}

            {/* Practice Exam */}
            {tab === "exam" && <PracticeExam theme={theme} exam={exam} setExam={setExam} startExam={startExam} answerExam={answerExam} certs={ALL_CERTS} />}

            {/* Question Bank */}
            {tab === "bank" && <QuestionBank theme={theme} certs={ALL_CERTS} />}

            {/* Separate Notes page */}
            {tab === "notes" && <NotesPage theme={theme} bookmarks={bookmarks} setBookmarks={setBookmarks} />}

            {/* Progress - enhanced */}
            {tab === "progress" && <ProgressPane theme={theme} plan={plan} certs={ALL_CERTS} masteryBySkill={masteryBySkill} readinessFor={readinessFor} streak={streak} goals={goals} pomodoro={pomodoro} leaderboard={leaderboard} setLeaderboard={setLeaderboard} />}

            {/* Tools (original kept) + extra utilities */}
            {tab === "tools" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card theme={theme} className="p-4">
                  <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Exam Day Checklist</div>
                  <ul className="list-disc pl-5 text-sm" style={{ color: theme.text }}>
                    <li>Two forms of ID</li>
                    <li>Confirm test center rules or online proctoring</li>
                    <li>Arrive 30 minutes early or test your camera/mic</li>
                    <li>Water and snack for after the exam</li>
                    <li>Plan a calm warm-up - quick flashcard review</li>
                  </ul>
                </Card>
                <Card theme={theme} className="p-4">
                  <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Acronym Drill</div>
                  <AcronymDrill theme={theme} />
                </Card>
                <Card theme={theme} className="p-4">
                  <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Common Ports</div>
                  <PortsDrill theme={theme} />
                </Card>
                <Card theme={theme} className="p-4">
                  <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Quick Notes</div>
                  <QuickNotes theme={theme} />
                </Card>
                <Card theme={theme} className="p-4">
                  <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Scenario Labs</div>
                  <ScenarioLabs theme={theme} />
                </Card>
                <Card theme={theme} className="p-4">
                  <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Formula & Commands</div>
                  <ReferenceSheets theme={theme} />
                </Card>
              </div>
            )}

            {/* Community/Collab mock */}
            {tab === "community" && <CommunityMock theme={theme} leaderboard={leaderboard} setLeaderboard={setLeaderboard} />}

            {/* Settings */}
            {tab === "settings" && <SettingsPane theme={theme} dark={dark} setDark={setDark} goals={goals} setGoals={setGoals} offline={offline} setOffline={setOffline} />}
          </section>
        </div>
      </main>

      {/* Details Drawer */}
      <AnimatePresence>
        {activeCert && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-30" style={{ backgroundColor: dark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)" }} onClick={handleCloseDrawer}>
            <motion.div initial={{y:50, opacity:0}} animate={{y:0, opacity:1}} exit={{y:50, opacity:0}} transition={{type:"spring", damping:20}} className="absolute inset-x-0 bottom-0 max-h-[80vh] rounded-t-3xl p-6 shadow-xl" style={{ backgroundColor: theme.card }} onClick={e=>e.stopPropagation()}>
              <div className="mx-auto max-w-4xl">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs" style={{ color: theme.subtext }}>{activeCert.vendor} - {activeCert.level}</div>
                    <div className="text-xl font-semibold" style={{ color: theme.brandDark }}>{activeCert.name}</div>
                  </div>
                  <Button variant="outline" theme={theme} onClick={handleCloseDrawer} size="sm">✕ Close</Button>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Skills</div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {activeCert.skills?.map(s => <Badge key={s} theme={theme}>{s}</Badge>)}
                    </div>
                    {!!activeCert.resources?.length && (
                      <div>
                        <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Recommended Resources</div>
                        <ul className="space-y-2 text-sm">
                          {activeCert.resources.map(r => (
                            <li key={r.url} className="flex items-center justify-between gap-2">
                              <span>{r.title} <span className="text-xs" style={{ color: theme.subtext }}>({r.type})</span></span>
                              <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline" style={{ color: BRAND_BLUE }}>
                                Open <ExternalLink size={14}/>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>At a glance</div>
                    <ul className="space-y-1 text-sm">
                      <li>Domain: {activeCert.domains.join(", ")}</li>
                      <li>Level: {activeCert.level}</li>
                      <li>Time: ~{activeCert.estHours} hours</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" theme={theme} onClick={() => addToPlan(activeCert.id)}>
                        <FolderPlus size={16} /> Add to Plan
                      </Button>
                      {!!getFlashcards(activeCert.id).length && (
                        <Button size="sm" variant="outline" theme={theme} onClick={() => { setTab("flashcards"); }}>
                          <NotebookPen size={16} /> Flashcards
                        </Button>
                      )}
                      {!!getQuiz(activeCert.id).length && (
                        <Button size="sm" variant="outline" theme={theme} onClick={() => { setTab("quiz"); }}>
                          <HelpCircle size={16} /> Quiz
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl px-4 py-8 text-center text-xs" style={{ color: theme.subtext }}>
        Everything original is intact. Added dark mode, blue accents, and extra tools on top.
      </footer>
    </div>
  );
}

/** =========================================================
 * Helper Components - additive
 * ======================================================= */
function FlashcardsBasic({ theme, cert, getFlashcards, next, fcProgress = {}, addBookmark }) {
  const cards = getFlashcards(cert.id);
  const [show, setShow] = useState(false);
  const index = fcProgress?.index ?? 0;

  if (!cards.length) return <div className="text-sm" style={{ color: theme.subtext }}>No flashcards yet for this cert.</div>;

  const card = cards[index];

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm" style={{ color: theme.subtext }}>
        {cert.name} • Card {index + 1} of {cards.length}
      </div>
      <Card theme={theme} className="p-6">
        <div className="mb-2 text-xs font-semibold" style={{ color: theme.subtext }}>Question</div>
        <div className="text-lg font-semibold" style={{ color: theme.brandDark }}>{card.q}</div>

        {show && (
          <div className="mt-4 rounded-xl border p-4 text-sm" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
            <div className="mb-1 text-xs font-semibold" style={{ color: theme.subtext }}>Answer</div>
            <div>{card.a}</div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {!show ? (
            <Button theme={theme} onClick={() => setShow(true)}>
              Reveal
            </Button>
          ) : (
            <Button theme={theme} variant="outline" onClick={() => setShow(false)}>
              Hide
            </Button>
          )}
          <Button
            theme={theme}
            variant="accent"
            onClick={() => {
              setShow(false);
              next(cert.id, true);
            }}
          >
            <CheckCircle2 size={16} /> I knew it
          </Button>
          <Button
            theme={theme}
            variant="outline"
            onClick={() => {
              setShow(false);
              next(cert.id, false);
            }}
          >
            <ArrowRight size={16} /> Next
          </Button>
          <Button theme={theme} variant="outline" onClick={() => addBookmark({ type:"flashcard", certId: cert.id, index, note:"", tags:[] })}><Bookmark size={16}/> Bookmark</Button>
        </div>
      </Card>
      <div className="text-xs" style={{ color: theme.subtext }}>
        Known: {(fcProgress?.known?.length || 0)}/{cards.length}
      </div>
    </div>
  );
}

function FlashcardsSRS({ theme, cert, getCards, nextDueIndex, gradeCard, addBookmark }) {
  if (!cert) return null;
  const cards = getCards(cert.id);
  if (!cards.length) return <div className="text-sm" style={{ color: theme.subtext }}>No flashcards yet.</div>;
  const [show, setShow] = useState(false);
  const [idx, setIdx] = useState(nextDueIndex(cert.id));
  useEffect(() => setIdx(nextDueIndex(cert.id)), [cert.id]);

  const card = cards[idx];

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm" style={{ color: theme.subtext }}>{cert.name} • Due card #{idx+1} of {cards.length}</div>
      <Card theme={theme} className="p-6">
        <div className="mb-2 text-xs font-semibold" style={{ color: theme.subtext }}>Question</div>
        <div className="text-lg font-semibold" style={{ color: theme.brandDark }}>{card.q}</div>

        {show && (
          <div className="mt-4 rounded-xl border p-4 text-sm" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
            <div className="mb-1 text-xs font-semibold" style={{ color: theme.subtext }}>Answer</div>
            <div>{card.a}</div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {!show ? (
            <Button theme={theme} variant="accent" onClick={() => setShow(true)}>Reveal</Button>
          ) : (
            <Button theme={theme} variant="outline" onClick={() => setShow(false)}>Hide</Button>
          )}
          <Button theme={theme} variant="accent" onClick={() => { setShow(false); gradeCard(cert.id, idx, true); setIdx(nextDueIndex(cert.id)); }}><CheckCircle2 size={16}/> I knew it</Button>
          <Button theme={theme} variant="outline" onClick={() => { setShow(false); gradeCard(cert.id, idx, false); setIdx(nextDueIndex(cert.id)); }}><ArrowRight size={16}/> Next</Button>
          <Button theme={theme} variant="outline" onClick={() => addBookmark({ type:"flashcard", certId: cert.id, index: idx, note:"", tags:[] })}><Bookmark size={16}/> Bookmark</Button>
        </div>
      </Card>
    </div>
  );
}

function QuizPane({ theme, cert, getQuiz, quizState = {}, onAnswer, addBookmark }) {
  const items = getQuiz(cert.id);
  if (!items.length) return <div className="text-sm" style={{ color: theme.subtext }}>No quiz for this cert yet.</div>;

  const idx = quizState.idx || 0;
  const item = items[idx];
  const last = (quizState.answers || [])[(quizState.answers || []).length - 1];
  const lastItem = (quizState.answers || []).length ? items[(idx - 1 + items.length) % items.length] : null;
  const percent = Math.round(((quizState.correct || 0) / Math.max((quizState.answers || []).length, 1)) * 100);

  return (
    <div className="space-y-3">
      <div className="text-sm" style={{ color: theme.subtext }}>
        {cert.name} • Question {idx + 1} of {items.length} • Score {isNaN(percent) ? 0 : percent}%
      </div>
      <Card theme={theme} className="p-6">
        <div className="mb-3 text-base font-semibold" style={{ color: theme.brandDark }}>
          {item.q}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {item.options.map((opt, i) => (
            <Button key={i} theme={theme} variant="outline" onClick={() => onAnswer(i)}>
              {opt}
            </Button>
          ))}
        </div>

        {last && lastItem && (
          <div className="mt-4 rounded-xl border p-3 text-sm" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
            <div className="mb-1 text-xs font-semibold" style={{ color: theme.subtext }}>Explanation</div>
            <div>{lastItem.exp}</div>
          </div>
        )}

        <div className="mt-3">
          <Button theme={theme} variant="outline" onClick={() => addBookmark({ type:"quiz", certId: cert.id, index: idx, note:"", tags:[] })}><Bookmark size={16}/> Bookmark</Button>
        </div>
      </Card>
      <div className="text-xs" style={{ color: theme.subtext }}>Correct answers: {quizState.correct || 0}</div>
    </div>
  );
}

function PracticeExam({ theme, exam, setExam, startExam, answerExam, certs }) {
  const [certId, setCertId] = useState(certs[0]?.id || "");
  const [minutes, setMinutes] = useState(30);
  const [num, setNum] = useState(20);

  if (!exam) {
    return (
      <Card theme={theme} className="p-4">
        <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Start a timed exam</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Select theme={theme} value={certId} onChange={setCertId} options={certs.map(c=>({value:c.id,label:c.name}))}/>
          <Input theme={theme} type="number" min="10" max="240" value={minutes} onChange={e=>setMinutes(+e.target.value)} />
          <Input theme={theme} type="number" min="5" max="100" value={num} onChange={e=>setNum(+e.target.value)} />
        </div>
        <div className="mt-3">
          <Button theme={theme} variant="accent" onClick={()=>startExam(certId, minutes, num)}><Shield size={16}/> Start</Button>
        </div>
      </Card>
    );
  }

  const item = exam.items[exam.idx];
  const mm = String(Math.floor(exam.remaining/60)).padStart(2,"0");
  const ss = String(exam.remaining%60).padStart(2,"0");

  return (
    <Card theme={theme} className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm" style={{ color: theme.subtext }}>{certs.find(c=>c.id===exam.certId)?.name} • Question {exam.idx+1}/{exam.items.length}</div>
        <div className="rounded px-2 py-1 text-sm" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>⏱ {mm}:{ss}</div>
      </div>
      <div className="mb-3 text-base font-semibold" style={{ color: theme.brandDark }}>{item.q}</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {item.options.map((opt, i) => (
          <Button key={i} theme={theme} variant="outline" onClick={() => answerExam(i)}>{opt}</Button>
        ))}
      </div>
      {exam.idx === exam.items.length - 1 && (
        <div className="mt-4">
          <Button theme={theme} variant="accent" onClick={() => setExam(null)}><Trophy size={16}/> Finish • Score {Math.round(exam.score / exam.items.length * 100)}%</Button>
        </div>
      )}
    </Card>
  );
}

function QuestionBank({ theme, certs }) {
  const [q, setQ] = useState("");
  const all = useMemo(() => certs.flatMap(c => (c.quiz || []).map((item, i) => ({ ...item, cert: c.name, certId: c.id, index: i }))), [certs]);
  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return all.filter(it => it.q.toLowerCase().includes(s) || it.options.some(o => o.toLowerCase().includes(s)));
  }, [q, all]);

  return (
    <Card theme={theme} className="p-4">
      <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Question Bank Search</div>
      <Input theme={theme} placeholder="Search questions or options" value={q} onChange={e=>setQ(e.target.value)} />
      <div className="mt-3 space-y-3 max-h-[60vh] overflow-auto pr-2">
        {filtered.map((it, idx) => (
          <div key={idx} className="rounded-xl border p-3 text-sm" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
            <div className="mb-1 text-xs" style={{ color: theme.subtext }}>{it.cert}</div>
            <div className="font-medium" style={{ color: theme.brandDark }}>{it.q}</div>
          </div>
        ))}
        {!filtered.length && <div className="text-sm" style={{ color: theme.subtext }}>No matches.</div>}
      </div>
    </Card>
  );
}

function ProgressPane({ theme, plan, certs, masteryBySkill, readinessFor, streak, goals, pomodoro, leaderboard, setLeaderboard }) {
  const totalPlan = Object.keys(plan).length;
  const readinessRows = Object.keys(plan).map(id => ({ id, name: certs.find(c=>c.id===id)?.name, readiness: readinessFor(id) }));
  const minsToday = Math.round((pomodoro.logged?.general || 0)/60);
  const weekly = Object.values(pomodoro.logged || {}).reduce((a,b)=>a+b,0);
  const minsWeekly = Math.round(weekly/60);

  return (
    <Card theme={theme} className="p-6 space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Stat theme={theme} label="In Plan" value={totalPlan} />
        <Stat theme={theme} label="Streak" value={`${streak.days} days`} />
      </div>
      <div>
        <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Mastery by Skill</div>
        <div className="space-y-2">
          {Object.entries(masteryBySkill).map(([skill, v]) => (
            <Bar theme={theme} key={skill} label={skill} value={Math.round(v)} />
          ))}
          {!Object.keys(masteryBySkill).length && <div className="text-sm" style={{ color: theme.subtext }}>Add progress to see mastery.</div>}
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Readiness</div>
        <div className="space-y-2">
          {readinessRows.map(r => <Bar key={r.id} theme={theme} label={r.name} value={r.readiness} color={BRAND_BLUE} />)}
          {!readinessRows.length && <div className="text-sm" style={{ color: theme.subtext }}>Add a cert to your plan.</div>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card theme={theme} className="p-4">
          <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Goals</div>
          <div className="text-sm" style={{ color: theme.subtext }}>Daily {goals.dailyMinutes}m • Weekly {goals.weeklyMinutes}m</div>
          <Bar theme={theme} label="Today" value={Math.min(100, Math.round(minsToday / goals.dailyMinutes * 100))} />
          <Bar theme={theme} label="This week" value={Math.min(100, Math.round(minsWeekly / goals.weeklyMinutes * 100))} />
        </Card>
        <Card theme={theme} className="p-4">
          <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Leaderboard (opt-in)</div>
          <div className="text-sm" style={{ color: theme.subtext }}>Local-only demo for now.</div>
          {!leaderboard.optIn ? (
            <div className="mt-2 flex gap-2">
              <Input theme={theme} placeholder="Nickname" value={leaderboard.nick} onChange={e=>setLeaderboard(l=>({...l, nick:e.target.value}))}/>
              <Button theme={theme} variant="accent" onClick={()=>setLeaderboard(l=>({...l, optIn:true, points:0}))}><Users size={16}/> Join</Button>
            </div>
          ) : (
            <div className="mt-2 text-sm" style={{ color: theme.subtext }}>Welcome, {leaderboard.nick}. Points: {leaderboard.points}</div>
          )}
        </Card>
      </div>
    </Card>
  );
}

function NotesPage({ theme, bookmarks, setBookmarks }) {
  const KEY = "notes/page";
  const [text, setText] = useState(localStorage.getItem(KEY) || "");
  useEffect(() => { localStorage.setItem(KEY, text); }, [text]);
  const addTag = (i, tag) => setBookmarks(b => b.map((x, idx) => idx===i ? { ...x, tags: Array.from(new Set([...(x.tags||[]), tag])) } : x));

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card theme={theme} className="p-4">
        <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Notes</div>
        <textarea value={text} onChange={e=>setText(e.target.value)} className="h-80 w-full rounded-xl border p-2 text-sm"
                  style={{ backgroundColor: theme.card, color: theme.text, borderColor: theme.border }} placeholder="Type notes here..." />
        <div className="mt-2">
          <Button theme={theme} variant="outline" onClick={() => {
            const blob = new Blob([text], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = "notes.txt"; a.click();
            URL.revokeObjectURL(url);
          }}><Download size={16}/> Export</Button>
        </div>
      </Card>
      <Card theme={theme} className="p-4">
        <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Bookmarks</div>
        <div className="space-y-2 max-h-[24rem] overflow-auto pr-2">
          {bookmarks.map((b, i) => (
            <div key={i} className="rounded-xl border p-2 text-sm" style={{ borderColor: theme.border }}>
              <div className="mb-1 flex items-center justify-between">
                <div className="text-xs" style={{ color: theme.subtext }}>{b.type} • {b.certId} • #{b.index+1}</div>
                <div className="flex gap-2">
                  <Button theme={theme} variant="subtle" size="sm" onClick={()=>addTag(i, "review")}><Tag size={14}/> review</Button>
                  <Button theme={theme} variant="subtle" size="sm" onClick={()=>setBookmarks(bs => bs.filter((_,idx)=>idx!==i))}><Trash2 size={14}/> remove</Button>
                </div>
              </div>
              <Input theme={theme} placeholder="Add a note" value={b.note || ""} onChange={e=>setBookmarks(bs => bs.map((x,idx)=>idx===i?{...x,note:e.target.value}:x))} />
              <div className="mt-1 text-xs" style={{ color: theme.subtext }}>tags: {(b.tags||[]).join(", ")}</div>
            </div>
          ))}
          {!bookmarks.length && <div className="text-sm" style={{ color: theme.subtext }}>No bookmarks yet.</div>}
        </div>
      </Card>
    </div>
  );
}

function CommunityMock({ theme, leaderboard, setLeaderboard }) {
  return (
    <Card theme={theme} className="p-4">
      <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Study Groups & Battles</div>
      <div className="text-sm" style={{ color: theme.subtext }}>
        Local-only demo. Share a group name with friends. Timed battles add points.
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button theme={theme} variant="outline" onClick={()=>setLeaderboard(l=>({...l, points:(l.points||0)+10}))}><Users size={16}/> Join group</Button>
        <Button theme={theme} variant="outline" onClick={()=>setLeaderboard(l=>({...l, points:(l.points||0)+5}))}><Trophy size={16}/> Win a challenge</Button>
        <Button theme={theme} variant="outline"><MessageSquare size={16}/> Discussion Boards (placeholder)</Button>
      </div>
    </Card>
  );
}

function SettingsPane({ theme, dark, setDark, goals, setGoals, offline, setOffline }) {
  return (
    <Card theme={theme} className="p-4 space-y-4">
      <div className="text-sm font-semibold" style={{ color: theme.brandDark }}>Settings</div>
      <div className="flex items-center justify-between">
        <div>Theme</div>
        <Button theme={theme} variant="outline" onClick={()=>setDark(!dark)}>{dark ? <Sun size={16}/> : <Moon size={16}/>}</Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm">
          Daily goal (minutes)
          <Input theme={theme} type="number" min="10" max="600" value={goals.dailyMinutes} onChange={e=>setGoals(g=>({...g,dailyMinutes:+e.target.value}))}/>
        </label>
        <label className="text-sm">
          Weekly goal (minutes)
          <Input theme={theme} type="number" min="30" max="3000" value={goals.weeklyMinutes} onChange={e=>setGoals(g=>({...g,weeklyMinutes:+e.target.value}))}/>
        </label>
      </div>
      <div className="flex items-center justify-between">
        <div>Offline mode (local cache)</div>
        <Button theme={theme} variant="outline" onClick={()=>setOffline(o=>!o)}>{offline ? "On" : "Off"}</Button>
      </div>
    </Card>
  );
}

function AcronymDrill({ theme }) {
  const ITEMS = React.useMemo(() => [
    ["CIA", "Confidentiality, Integrity, Availability"],
    ["AAA", "Authentication, Authorization, Accounting"],
    ["ACL", "Access Control List"],
    ["IDS", "Intrusion Detection System"],
    ["IPS", "Intrusion Prevention System"],
    ["SLA", "Service Level Agreement"],
    ["SAML", "Security Assertion Markup Language"],
    ["OIDC", "OpenID Connect"],
    ["IAM", "Identity and Access Management"],
    ["TLS", "Transport Layer Security"],
    ["FIM", "File Integrity Monitoring"],
  ], []);
  const [i, setI] = React.useState(0);
  const [show, setShow] = React.useState(false);
  const item = ITEMS[i % ITEMS.length];
  return (
    <div>
      <div className="text-lg font-semibold" style={{ color: BRAND_DARK }}>{item[0]}</div>
      {show && <div className="mt-2 rounded-xl border p-3 text-sm"> {item[1]} </div>}
      <div className="mt-3 flex gap-2">
        {!show ? <Button onClick={()=>setShow(true)}>Reveal</Button> : <Button variant="outline" onClick={()=>setShow(false)}>Hide</Button>}
        <Button variant="outline" onClick={()=>{ setI(i+1); setShow(false); }}><ArrowRight size={16}/> Next</Button>
      </div>
    </div>
  );
}

function PortsDrill({ theme }) {
  const PAIRS = React.useMemo(() => [
    ["HTTP", "80/TCP"],["HTTPS", "443/TCP"],["SSH", "22/TCP"],["RDP", "3389/TCP"],["DNS", "53/UDP"],["DNS TCP", "53/TCP"],
    ["SMTP", "25/TCP"],["IMAP", "143/TCP"],["IMAPS", "993/TCP"],["POP3", "110/TCP"],["POP3S", "995/TCP"],["FTP", "21/TCP"],["SFTP", "22/TCP"],["SNMP", "161/UDP"],
  ], []);
  const [idx, setIdx] = React.useState(0);
  const [feedback, setFeedback] = React.useState(null);
  const q = PAIRS[idx % PAIRS.length];
  const options = React.useMemo(() => {
    const shuffled = [...PAIRS].sort(() => Math.random() - 0.5).slice(0, 3).map((p) => p[1]);
    if (!shuffled.includes(q[1])) shuffled[Math.floor(Math.random() * shuffled.length)] = q[1];
    return shuffled.sort(() => Math.random() - 0.5);
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="mb-2 text-sm" style={{ color: BRAND_DARK }}>Match the service to the correct port</div>
      <div className="text-lg font-semibold" style={{ color: BRAND_DARK }}>{q[0]}</div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((o, i) => (
          <Button key={i} variant="outline" onClick={() => {
            const ok = o === q[1];
            setFeedback(ok ? "correct" : "wrong");
            setTimeout(() => { setIdx(idx + 1); setFeedback(null); }, 600);
          }}>{o}</Button>
        ))}
      </div>
      {feedback && (
        <div className={"mt-3 rounded-xl border p-2 text-xs " + (feedback === "correct" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
          {feedback === "correct" ? "Correct" : "Try again next"}
        </div>
      )}
    </div>
  );
}

function QuickNotes({ theme }) {
  const KEY = "it-cert-hub/quick-notes";
  const [text, setText] = React.useState("");
  React.useEffect(() => { try { setText(localStorage.getItem(KEY) || ""); } catch {} }, []);
  React.useEffect(() => { try { localStorage.setItem(KEY, text); } catch {} }, [text]);
  const saveTxt = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "notes.txt"; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} className="h-48 w-full rounded-xl border p-2 text-sm" placeholder="Jot quick notes here..." />
      <div className="mt-2"><Button variant="outline" onClick={saveTxt}><Download size={16} /> Export Notes</Button></div>
    </div>
  );
}

function ScenarioLabs({ theme }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="rounded-xl border p-3" style={{ borderColor: theme.border }}>
        <div className="font-semibold" style={{ color: theme.brandDark }}>Networking Lab</div>
        <div>Create two VLANs and assign ports. Explain how devices communicate across them.</div>
      </div>
      <div className="rounded-xl border p-3" style={{ borderColor: theme.border }}>
        <div className="font-semibold" style={{ color: theme.brandDark }}>Security Lab</div>
        <div>Draft a minimum-password policy and map it to NIST 800-53 families.</div>
      </div>
    </div>
  );
}

function ReferenceSheets({ theme }) {
  return (
    <div className="space-y-2 text-sm">
      <div>IPv4 Private Ranges: 10.0.0.0/8 • 172.16.0.0/12 • 192.168.0.0/16</div>
      <div>OSI: 7 App, 6 Pres, 5 Sess, 4 Trans, 3 Net, 2 Data, 1 Phys</div>
      <div>CIDR: /24=256 • /25=128 • /26=64 • /27=32 • /28=16</div>
      <div>Windows tools: ipconfig, sfc, chkdsk, tasklist</div>
      <div>Linux tools: ip, ss, journalctl, systemctl</div>
    </div>
  );
}

function RoadmapBuilderInline({ theme, certs, onAdd }) {
  const [selected, setSelected] = useState([]);
  const add = (id) => setSelected(s => Array.from(new Set([...s, id])));
  const remove = (id) => setSelected(s => s.filter(x=>x!==id));
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="max-h-[40vh] overflow-auto pr-2">
        {certs.map(c => (
          <div key={c.id} className="mb-2 flex items-center justify-between rounded-xl border p-2 text-sm">
            <div>{c.name}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={()=>add(c.id)}><Plus size={14}/></Button>
              <Button size="sm" variant="outline" onClick={()=>onAdd(c.id)}><FolderPlus size={14}/></Button>
            </div>
          </div>
        ))}
      </div>
      <div>
        <div className="mb-2 text-sm font-semibold" style={{ color: BRAND_DARK }}>Your steps</div>
        <ol className="mb-3 list-decimal pl-5 text-sm">
          {selected.map(id => <li key={id} className="mb-1">{certs.find(c=>c.id===id)?.name} <button onClick={()=>remove(id)} className="ml-2 text-xs" style={{ color: BRAND_BLUE }}>remove</button></li>)}
        </ol>
        <Button variant="accent" onClick={()=>{ setSelected([]); alert("Saved locally. Add items to plan as needed."); }}><Target size={16}/> Save</Button>
      </div>
    </div>
  );
}

function Stat({ theme, label, value }) {
  return (
    <div className="rounded-2xl border p-4" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
      <div className="text-xs" style={{ color: theme.subtext }}>{label}</div>
      <div className="text-2xl font-bold" style={{ color: theme.brandDark }}>{value}</div>
    </div>
  );
}

function Bar({ theme, label, value, color }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-56 truncate text-sm">{label}</div>
      <div className="h-3 w-full rounded-full" style={{ backgroundColor: theme.border }}>
        <div className="h-3 rounded-full" style={{ width: `${value}%`, backgroundColor: color || BRAND_DARK }} />
      </div>
      <div className="w-12 text-right text-sm tabular-nums">{value}%</div>
    </div>
  );
}