import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Star, StarOff, BookOpen, Timer, ClipboardList,
  CheckCircle2, X, ExternalLink, Plus, Minus, Download, Upload,
  Trash2, FolderPlus, NotebookPen, RefreshCw, Play, Pause, RotateCcw,
  FileText, Settings, BadgeCheck, Sparkles, HelpCircle, BarChart3,
  Lightbulb, ArrowRight, Moon, Sun, Target, Users, Trophy, Calendar,
  Edit, Bookmark, Tag, Layers, Shield, MessageSquare, Swords
} from "lucide-react";

/** =========================================================
 * Brand + Theme
 * ======================================================= */
const BRAND = {
  blue: "#1a73e8",  // CertWolf blue
  dark: "#111d2a",
  lightBg: "#FAFAFA",
  white: "#FFFFFF"
};

const makeTheme = (dark) => ({
  text: dark ? "#F5F7FA" : "#111827",
  subtext: dark ? "#D1D5DB" : "#6B7280",
  bg: dark ? "#0b1320" : BRAND.lightBg,
  card: dark ? "#121a27" : "#FFFFFF",
  border: dark ? "#243244" : "#E5E7EB",
  primary: BRAND.blue,
  primaryText: "#FFFFFF",
  accent: dark ? "#93c5fd" : "#1a73e8",
  brandDark: dark ? "#e6edf6" : BRAND.dark
});

/** =========================================================
 * Tiny UI primitives
 * ======================================================= */
const cx = (...clx) => clx.filter(Boolean).join(" ");

const Button = ({ className = "", variant = "default", size = "md", theme, style, ...props }) => {
  const base = "inline-flex items-center gap-2 rounded-2xl border transition px-3 py-2 text-sm font-medium hover:opacity-90";
  const sizes = { sm: "px-2 py-1 text-xs", md: "px-3 py-2 text-sm", lg: "px-4 py-2 text-base" };
  const s = {
    default: { backgroundColor: theme.brandDark, borderColor: theme.brandDark, color: theme.primaryText },
    ghost:   { backgroundColor: "transparent", borderColor: "transparent", color: theme.text },
    outline: { backgroundColor: "transparent", borderColor: theme.border, color: theme.text },
    subtle:  { backgroundColor: theme.card, borderColor: theme.border, color: theme.text },
    success: { backgroundColor: "#16A34A", borderColor: "#16A34A", color: "#fff" },
    danger:  { backgroundColor: "#DC2626", borderColor: "#DC2626", color: "#fff" },
    accent:  { backgroundColor: theme.primary, borderColor: theme.primary, color: theme.primaryText },
  }[variant];

  return <button className={cx(base, sizes[size], className)} style={{ ...s, ...(style||{}) }} {...props}/>;
};

const Card = ({ className = "", theme, ...props }) => (
  <div className={cx("rounded-2xl border shadow-sm", className)} style={{ backgroundColor: theme.card, borderColor: theme.border }} {...props} />
);

const Badge = ({ children, className = "", theme }) => (
  <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", className)}
        style={{ borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }}>{children}</span>
);

const Input = ({ className = "", theme, ...props }) => (
  <input
    className={cx("w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2", className)}
    style={{ backgroundColor: theme.card, color: theme.text, borderColor: theme.border, caretColor: theme.text }}
    {...props}
  />
);

const Select = ({ className = "", options = [], value, onChange, theme }) => (
  <select
    className={cx("w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2", className)}
    style={{ backgroundColor: theme.card, color: theme.text, borderColor: theme.border }}
    value={value}
    onChange={e => onChange(e.target.value)}
  >
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const Tabs = ({ tabs, value, onChange, theme }) => (
  <div className="flex flex-wrap gap-2">
    {tabs.map(t => (
      <Button key={t.value} theme={theme} variant={value === t.value ? "accent" : "outline"} onClick={() => onChange(t.value)}>
        {t.icon && <t.icon size={16} />} {t.label}
      </Button>
    ))}
  </div>
);

/** =========================================================
 * Data
 * ======================================================= */
// Keep sample certs minimal for demo - real list can be merged externally
const CERTS = [
  { id: "itf+", name: "CompTIA ITF+", vendor: "CompTIA", level: "Starter", domains: ["Core IT"], estHours: 25,
    skills: ["basic hardware", "software", "troubleshooting", "security basics"],
    flashcards: [
      { q: "What does CPU stand for?", a: "Central Processing Unit" },
      { q: "One kilobyte equals how many bytes?", a: "1,024 bytes" },
    ],
    quiz: [
      { q: "Which is an input device?", options: ["Monitor", "Keyboard", "Projector", "GPU"], answer: 1, exp: "Keyboard inputs data." },
      { q: "Best definition of OS?", options: ["A word processor", "System that manages hardware and software", "A type of CPU", "Cloud service"], answer: 1, exp: "OS manages resources." },
    ],
  },
  { id: "a+", name: "CompTIA A+", vendor: "CompTIA", level: "Starter", domains: ["Core IT"], estHours: 120,
    skills: ["PC hardware", "OS install", "troubleshooting", "basic networking", "security"],
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
  { id: "net+", name: "CompTIA Network+", vendor: "CompTIA", level: "Intermediate", domains: ["Networking"], estHours: 100,
    skills: ["layered models", "routing", "switching", "wireless", "security", "troubleshooting"],
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

const LS = (k, v) => (v === undefined ? JSON.parse(localStorage.getItem(k) || "null") : localStorage.setItem(k, JSON.stringify(v)));

/** =========================================================
 * Main Component
 * ======================================================= */
export default function App() {
  // UI
  const [tab, setTab] = useState(LS("ui/tab") || "catalog");
  const [dark, setDark] = useState(LS("ui/dark") ?? true);
  const theme = useMemo(() => makeTheme(dark), [dark]);

  useEffect(() => { LS("ui/tab", tab); }, [tab]);
  useEffect(() => { LS("ui/dark", dark); }, [dark]);

  // Filters
  const [q, setQ] = useState("");
  const [vendor, setVendor] = useState("all");
  const [domain, setDomain] = useState("all");
  const [level, setLevel] = useState("all");

  // Core state
  const [favorites, setFavorites] = useState(LS("favorites") || []);
  const [plan, setPlan]         = useState(LS("plan") || {}); // id -> {targetDate, progress, notes}
  const [activeCert, setActiveCert] = useState(null);
  const [closedForCertId, setClosedForCertId] = useState(null);

  // Pomodoro with editable durations + analytics
  const [pomodoro, setPomodoro] = useState(LS("pomodoro") || { running:false, seconds: 25*60, mode: "focus", focusMins:25, breakMins:5, logged: {} });
  useEffect(() => { LS("pomodoro", pomodoro); }, [pomodoro]);

  // Streaks & goals
  const todayKey = new Date().toISOString().slice(0,10);
  const [streak, setStreak] = useState(LS("streak") || { last: "", days: 0, badges: [] });
  const [goals, setGoals]   = useState(LS("goals") || { dailyMinutes: 30, weeklyMinutes: 210 });
  const [leaderboard, setLeaderboard] = useState(LS("leaderboard") || { nick:"", optIn:false, points:0 });

  // Flashcards SRS (Leitner bins per cert: 1..5) and bookmarks
  const [srs, setSrs] = useState(LS("srs") || {}); // { certId: {binIdxByCardIndex:{}, nextDueByCardIndex:{} } }
  const [bookmarks, setBookmarks] = useState(LS("bookmarks") || []); // [{type:"flashcard"/"quiz", certId, index, note, tags:[]}]

  // Quiz history for adaptive learning
  const [quizHistory, setQuizHistory] = useState(LS("quizHistory") || {}); // { certId: { wrongCountsByIndex: {} } }

  // Practice exam sessions
  const [exam, setExam] = useState(null); // { certId, remaining, idx, answers:[], score }

  // Offline flag (local cache only)
  const [offline, setOffline] = useState(LS("offline") || false);

  // Derived lists
  const allVendors = useMemo(() => ["all", ...Array.from(new Set(CERTS.map(c=>c.vendor)))], []);
  const allDomains = useMemo(() => ["all", ...Array.from(new Set(CERTS.flatMap(c=>c.domains)))], []);
  const allLevels  = useMemo(() => ["all", ...Array.from(new Set(CERTS.map(c=>c.level)))], []);

  const filtered = useMemo(() => {
    const qLower = q.toLowerCase();
    return CERTS.filter(c => (
      (vendor === "all" || c.vendor === vendor) &&
      (domain === "all" || c.domains.includes(domain)) &&
      (level === "all" || c.level === level) &&
      (!q || (c.name.toLowerCase().includes(qLower) || c.skills.some(s => s.toLowerCase().includes(qLower))))
    ));
  }, [q, vendor, domain, level]);

  // Init
  const currentCertId = useMemo(() => activeCert?.id || Object.keys(plan)[0] || CERTS[0]?.id, [activeCert, plan]);
  const currentCert   = useMemo(() => CERTS.find(c=>c.id===currentCertId) || null, [currentCertId]);

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

  // Persist some state
  useEffect(() => { LS("favorites", favorites); }, [favorites]);
  useEffect(() => { LS("plan", plan); }, [plan]);
  useEffect(() => { LS("srs", srs); }, [srs]);
  useEffect(() => { LS("bookmarks", bookmarks); }, [bookmarks]);
  useEffect(() => { LS("quizHistory", quizHistory); }, [quizHistory]);
  useEffect(() => { LS("streak", streak); }, [streak]);
  useEffect(() => { LS("goals", goals); }, [goals]);
  useEffect(() => { LS("offline", offline); }, [offline]);
  useEffect(() => { LS("leaderboard", leaderboard); }, [leaderboard]);

  /** =========== Timers, streaks, analytics =========== */
  useEffect(() => {
    if (!pomodoro.running) return;
    const id = setInterval(() => {
      setPomodoro(p => {
        const next = p.seconds - 1;
        // log time per cert for analytics
        const key = activeCert?.id || "general";
        const logged = { ...(p.logged || {}) };
        logged[key] = (logged[key] || 0) + 1;

        if (next > 0) return { ...p, seconds: next, logged };
        // switch mode
        const focusToBreak = p.mode === "focus";
        return {
          ...p,
          running: false,
          mode: focusToBreak ? "break" : "focus",
          seconds: (focusToBreak ? p.breakMins : p.focusMins) * 60,
          logged,
        };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [pomodoro.running, activeCert]);

  // Streak calc when any study time logged today
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

  /** =========== Handlers =========== */
  const toggleFavorite = (id) => setFavorites(f => f.includes(id) ? f.filter(x=>x!==id) : [...f, id]);
  const addToPlan = (id) => setPlan(p => ({ ...p, [id]: p[id] || { targetDate: "", progress: 0, notes: "" } }));
  const removeFromPlan = (id) => setPlan(p => { const n = { ...p }; delete n[id]; return n; });

  const handleCloseDrawer = () => {
    setClosedForCertId(currentCert?.id || activeCert?.id || null);
    setActiveCert(null);
  };

  // Spaced repetition helpers
  const getCards = (certId) => CERTS.find(c=>c.id===certId)?.flashcards || [];
  const initSrsFor = (certId) => {
    const cards = getCards(certId);
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
    const cards = getCards(certId);
    const conf = srs[certId];
    if (!cards.length || !conf) return 0;
    const now = Date.now();
    const dueIndices = cards.map((_, i) => [i, conf.nextDueByCardIndex?.[i] ?? 0])
      .filter(([_, due]) => due <= now)
      .map(([i]) => i);
    // fallback to any
    const pool = dueIndices.length ? dueIndices : cards.map((_, i) => i);
    // prefer the lowest bin (weakest)
    pool.sort((a, b) => (conf.binIdxByCardIndex[a]||1) - (conf.binIdxByCardIndex[b]||1));
    return pool[0] || 0;
  };

  const gradeCard = (certId, index, knewIt) => {
    const mapBinToDelay = (bin) => {
      // simple schedule in minutes
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

  // Quiz helpers + Adaptive ordering
  const getQuiz = (certId) => {
    const items = CERTS.find(c=>c.id===certId)?.quiz || [];
    const hist = quizHistory[certId]?.wrongCountsByIndex || {};
    // Adaptive mode - sort descending by wrong counts
    return items
      .map((q, i) => ({ ...q, __i: i, __w: hist[i] || 0 }))
      .sort((a, b) => b.__w - a.__w)
      .map(({__i, __w, ...rest}) => rest);
  };

  const markQuizAnswer = (certId, index, isCorrect) => {
    setQuizHistory(h => {
      const cur = h[certId] || { wrongCountsByIndex: {} };
      const map = { ...(cur.wrongCountsByIndex || {}) };
      if (!isCorrect) map[index] = (map[index] || 0) + 1;
      return { ...h, [certId]: { wrongCountsByIndex: map } };
    });
  };

  // Practice exam
  const startExam = (certId, minutes=30, num=20) => {
    const bank = getQuiz(certId);
    const items = shuffle(bank).slice(0, Math.min(num, bank.length));
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
      markQuizAnswer(e.certId, e.idx, correct);
      return { ...e, answers, score, idx: nextIdx };
    });
  };

  /** =========== Utility =========== */
  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
  const pct = (n, d) => (d ? Math.round((n/d)*100) : 0);

  // Mastery tracker per skill - proxy via plan.progress weighted by cert skills count
  const masteryBySkill = useMemo(() => {
    const map = {};
    Object.entries(plan).forEach(([id, meta]) => {
      const c = CERTS.find(x=>x.id===id); if (!c) return;
      const perSkill = (meta.progress || 0) / (c.skills?.length || 1);
      c.skills.forEach(s => { map[s] = Math.max(map[s] || 0, perSkill); });
    });
    return map;
  }, [plan]);

  // Readiness meter - combine progress + quiz correctness + srs depth
  const readinessFor = (certId) => {
    const p = plan[certId]?.progress || 0;
    const hist = quizHistory[certId];
    const attempts = Object.values(hist?.wrongCountsByIndex || {}).reduce((a,b)=>a+b, 0);
    const cards = getCards(certId);
    const s = srs[certId];
    const avgBin = s && cards.length ?
      (cards.reduce((sum, _, i) => sum + (s.binIdxByCardIndex?.[i] || 1), 0) / cards.length) : 1;
    // simple weighted: plan 50%, avgBin 30%, attempts penalty 20%
    const score = 0.5*p + 0.3*(avgBin/5*100) - 0.2*Math.min(100, attempts*2);
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  // Calendar export (.ics) for a study block
  const exportStudyBlock = (title, minutes=60) => {
    const start = new Date();
    const end = new Date(start.getTime() + minutes*60000);
    const dt = (d) => d.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
    const ics = [
      "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//CertWolf//Study//EN",
      "BEGIN:VEVENT",
      `DTSTART:${dt(start)}`,
      `DTEND:${dt(end)}`,
      `SUMMARY:${title}`,
      "END:VEVENT","END:VCALENDAR"
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "study.ics"; a.click();
    URL.revokeObjectURL(url);
  };

  // Export plan summary printable
  const printSummary = () => window.print();

  /** =========== Render =========== */
  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b backdrop-blur" style={{ backgroundColor: dark ? "rgba(11,19,32,0.8)" : "rgba(255,255,255,0.8)", borderColor: theme.border }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="https://i.imgur.com/WqdkIGU.png" alt="logo" className="h-8 w-auto" />
            <div>
              <h1 className="text-lg font-bold tracking-tight" style={{ color: theme.brandDark }}>CertWolf Study Hub</h1>
              <p className="text-xs" style={{ color: theme.subtext }}>Plan, practice, and track</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button theme={theme} variant="outline" onClick={() => setDark(!dark)}>{dark ? <Sun size={16}/> : <Moon size={16}/> } Theme</Button>
            <Button theme={theme} variant="outline" onClick={() => setTab("notes")}><Edit size={16}/> Notes</Button>
            <Button theme={theme} variant="outline" onClick={() => setTab("plan")}><ClipboardList size={16}/> Plan</Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <Card theme={theme} className="p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: theme.brandDark }}><Filter size={16}/> Filters</div>
              <div className="mb-3">
                <div className="mb-1 text-xs font-semibold" style={{ color: theme.subtext }}>Search</div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5" size={16}/>
                  <Input theme={theme} placeholder="Find a cert or skill" value={q} onChange={e=>setQ(e.target.value)} className="pl-8"/>
                </div>
              </div>
              <div className="mb-3">
                <div className="mb-1 text-xs font-semibold" style={{ color: theme.subtext }}>Vendor</div>
                <Select theme={theme} value={vendor} onChange={setVendor} options={allVendors.map(v=>({value:v,label:v}))}/>
              </div>
              <div className="mb-3">
                <div className="mb-1 text-xs font-semibold" style={{ color: theme.subtext }}>Domain</div>
                <Select theme={theme} value={domain} onChange={setDomain} options={allDomains.map(v=>({value:v,label:v}))}/>
              </div>
              <div className="mb-4">
                <div className="mb-1 text-xs font-semibold" style={{ color: theme.subtext }}>Level</div>
                <Select theme={theme} value={level} onChange={setLevel} options={allLevels.map(v=>({value:v,label:v}))}/>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button theme={theme} variant="subtle" onClick={() => { setVendor("all"); setDomain("all"); setLevel("all"); setQ(""); }}><RefreshCw size={16}/> Reset</Button>
                <Button theme={theme} variant="accent" onClick={() => setTab("roadmaps")}><Lightbulb size={16}/> Roadmaps</Button>
              </div>
            </Card>

            {/* Pomodoro */}
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
                <Button theme={theme} variant="outline" onClick={()=>setPomodoro(p=>({...p, running:false, seconds:p.focusMins*60, mode:"focus"}))}><RotateCcw size={16}/> Reset</Button>
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
                <Button theme={theme} variant="outline" onClick={printSummary}><FileText size={16}/> Print</Button>
              </div>
            </Card>
          </aside>

          {/* Main */}
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
                  { value:"exam", label:"Practice Exam", icon: Shield },
                  { value:"bank", label:"Question Bank", icon: Layers },
                  { value:"progress", label:"Progress", icon: BarChart3 },
                  { value:"notes", label:"Notes", icon: Edit },
                  { value:"community", label:"Community", icon: Users },
                  { value:"settings", label:"Settings", icon: Settings },
                ]}
              />
            </div>

            {/* Catalog */}
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
                          <button onClick={()=>toggleFavorite(c.id)} title={fav ? "Unfavorite" : "Favorite"}>{fav ? <Star size={18} className="text-yellow-400"/> : <StarOff size={18}/>}</button>
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

            {/* Roadmaps & Custom Builder */}
            {tab === "roadmaps" && <RoadmapBuilder theme={theme} CERTS={CERTS} plan={plan} setPlan={setPlan} addToPlan={addToPlan} />}

            {/* Study Plan */}
            {tab === "plan" && <StudyPlan theme={theme} plan={plan} setPlan={setPlan} CERTS={CERTS} setActiveCert={setActiveCert} />}

            {/* Flashcards with SRS */}
            {tab === "flashcards" && (
              <Card theme={theme} className="p-4">
                <FlashcardsSRS theme={theme} cert={activeCert || currentCert} getCards={getCards} nextDueIndex={nextDueIndex} gradeCard={gradeCard} addBookmark={(info)=>setBookmarks(b=>[...b, info])} />
              </Card>
            )}

            {/* Quizzes */}
            {tab === "quiz" && (
              <Card theme={theme} className="p-4">
                <QuizPane theme={theme} cert={activeCert || currentCert} getQuiz={getQuiz} markQuizAnswer={markQuizAnswer} addBookmark={(info)=>setBookmarks(b=>[...b, info])} />
              </Card>
            )}

            {/* Practice Exam */}
            {tab === "exam" && (
              <PracticeExam theme={theme} exam={exam} setExam={setExam} startExam={startExam} answerExam={answerExam} CERTS={CERTS} />
            )}

            {/* Question Bank */}
            {tab === "bank" && <QuestionBank theme={theme} CERTS={CERTS} />}

            {/* Progress + mastery + streaks + readiness */}
            {tab === "progress" && (
              <ProgressPane theme={theme} CERTS={CERTS} plan={plan} masteryBySkill={masteryBySkill} readinessFor={readinessFor} streak={streak} goals={goals} pomodoro={pomodoro} leaderboard={leaderboard} setLeaderboard={setLeaderboard} />
            )}

            {/* Notes page */}
            {tab === "notes" && <NotesPage theme={theme} bookmarks={bookmarks} setBookmarks={setBookmarks} />}

            {/* Community (local-only mock) */}
            {tab === "community" && <CommunityMock theme={theme} leaderboard={leaderboard} setLeaderboard={setLeaderboard} />}

            {/* Settings */}
            {tab === "settings" && (
              <SettingsPane theme={theme} dark={dark} setDark={setDark} goals={goals} setGoals={setGoals} offline={offline} setOffline={setOffline} />
            )}
          </section>
        </div>
      </main>

      {/* Drawer */}
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
                  <Button theme={theme} variant="outline" onClick={handleCloseDrawer} size="sm">✕ Close</Button>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Skills</div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {activeCert.skills?.map(s => <Badge key={s} theme={theme}>{s}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>At a glance</div>
                    <ul className="space-y-1 text-sm" style={{ color: theme.text }}>
                      <li>Domain: {activeCert.domains.join(", ")}</li>
                      <li>Level: {activeCert.level}</li>
                      <li>Time: ~{activeCert.estHours} hours</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button theme={theme} size="sm" onClick={() => addToPlan(activeCert.id)}><FolderPlus size={16}/> Add to Plan</Button>
                      <Button theme={theme} variant="outline" size="sm" onClick={() => setTab("flashcards")}><NotebookPen size={16}/> Flashcards</Button>
                      <Button theme={theme} variant="outline" size="sm" onClick={() => setTab("quiz")}><HelpCircle size={16}/> Quiz</Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mx-auto max-w-7xl px-4 py-8 text-center text-xs" style={{ color: theme.subtext }}>
        Dark mode, blue accents, and a few new power tools. Export your calendar block to lock time.
      </footer>
    </div>
  );
}

/** =========================================================
 * Sub-components
 * ======================================================= */
function StudyPlan({ theme, plan, setPlan, CERTS, setActiveCert }) {
  const certById = (id) => CERTS.find(c => c.id === id);
  return (
    <div className="space-y-4">
      {Object.keys(plan).length === 0 && (
        <Card theme={theme} className="p-6 text-center text-sm" style={{ color: theme.subtext }}>No items yet. Add a cert from the catalog.</Card>
      )}
      {Object.entries(plan).map(([id, meta]) => {
        const c = certById(id); if (!c) return null;
        return (
          <Card theme={theme} key={id} className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs" style={{ color: theme.subtext }}>{c.vendor} - {c.level}</div>
                <div className="text-lg font-semibold" style={{ color: theme.brandDark }}>{c.name}</div>
                <div className="mt-1 text-xs" style={{ color: theme.subtext }}>
                  Target:{" "}
                  <input type="date" value={meta.targetDate} onChange={e=>setPlan(p=>({...p, [id]:{...p[id], targetDate:e.target.value}}))} className="rounded border px-1 py-0.5" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button theme={theme} variant="outline" onClick={()=>setActiveCert(c)} size="sm"><FileText size={16}/> Details</Button>
                <Button theme={theme} variant="danger" onClick={()=>setPlan(p=>{ const n={...p}; delete n[id]; return n; })} size="sm"><Trash2 size={16}/> Remove</Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="mb-1 text-xs font-semibold" style={{ color: theme.brandDark }}>Progress</div>
                <div className="flex items-center gap-2">
                  <Button theme={theme} size="sm" variant="subtle" onClick={()=>setPlan(p=>({...p,[id]:{...p[id],progress:Math.max(0,(p[id].progress||0)-5)}}))}><Minus size={14}/></Button>
                  <div className="w-full rounded-full" style={{ backgroundColor: theme.border }}>
                    <div className="h-3 rounded-full" style={{ width: `${meta.progress||0}%`, backgroundColor: theme.primary }} />
                  </div>
                  <Button theme={theme} size="sm" variant="subtle" onClick={()=>setPlan(p=>({...p,[id]:{...p[id],progress:Math.min(100,(p[id].progress||0)+5)}}))}><Plus size={14}/></Button>
                  <div className="w-10 text-right text-sm tabular-nums">{meta.progress||0}%</div>
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold" style={{ color: theme.brandDark }}>Notes</div>
                <textarea value={meta.notes} onChange={e=>setPlan(p=>({...p,[id]:{...p[id],notes:e.target.value}}))} className="h-24 w-full rounded-xl border p-2 text-sm" style={{ backgroundColor: theme.card, color: theme.text, borderColor: theme.border }} placeholder="Key topics, weak spots, next steps"/>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold" style={{ color: theme.brandDark }}>Quick Actions</div>
                <div className="flex flex-wrap gap-2">
                  <Button theme={theme} size="sm" variant="outline" onClick={()=>window.print()}><FileText size={16}/> Print Plan</Button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function FlashcardsSRS({ theme, cert, getCards, nextDueIndex, gradeCard, addBookmark }) {
  if (!cert) return <div className="text-sm" style={{ color: theme.subtext }}>Add a cert to your plan first.</div>;
  const cards = getCards(cert.id);
  if (!cards.length) return <div className="text-sm" style={{ color: theme.subtext }}>No flashcards yet.</div>;
  const [show, setShow] = useState(false);
  const [idx, setIdx] = useState(nextDueIndex(cert.id));
  useEffect(() => setIdx(nextDueIndex(cert.id)), [cert.id]);

  const card = cards[idx];

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm" style={{ color: theme.subtext }}>{cert.name} • Card {idx+1} of {cards.length}</div>
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
          <Button theme={theme} variant="outline" onClick={() => addBookmark({ type:"flashcard", certId: cert.id, index: idx, note: "", tags: [] })}><Bookmark size={16}/> Bookmark</Button>
        </div>
      </Card>
    </div>
  );
}

function QuizPane({ theme, cert, getQuiz, markQuizAnswer, addBookmark }) {
  if (!cert) return <div className="text-sm" style={{ color: theme.subtext }}>Add a cert to your plan first.</div>;
  const items = getQuiz(cert.id);
  const [idx, setIdx] = useState(0);
  const item = items[idx];
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);

  if (!items.length) return <div className="text-sm" style={{ color: theme.subtext }}>No quiz for this cert yet.</div>;

  return (
    <div className="space-y-3">
      <div className="text-sm" style={{ color: theme.subtext }}>{cert.name} • Question {idx+1} of {items.length} • Score {score}</div>
      <Card theme={theme} className="p-6">
        <div className="mb-3 text-base font-semibold" style={{ color: theme.brandDark }}>{item.q}</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {item.options.map((opt, i) => (
            <Button key={i} theme={theme} variant="outline" onClick={() => {
              const correct = i === item.answer;
              markQuizAnswer(cert.id, idx, correct);
              setFeedback(correct ? "Correct" : "Wrong");
              setScore(s => s + (correct ? 1 : 0));
              setTimeout(()=>{ setIdx((idx+1) % items.length); setFeedback(null); }, 600);
            }}>{opt}</Button>
          ))}
        </div>
        {feedback && <div className="mt-4 rounded-xl border p-3 text-sm" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>{feedback}</div>}
        <div className="mt-3">
          <Button theme={theme} variant="outline" onClick={() => addBookmark({ type:"quiz", certId: cert.id, index: idx, note: "", tags: [] })}><Bookmark size={16}/> Bookmark</Button>
        </div>
      </Card>
    </div>
  );
}

function PracticeExam({ theme, exam, setExam, startExam, answerExam, CERTS }) {
  const [certId, setCertId] = useState(CERTS[0]?.id || "");
  const [minutes, setMinutes] = useState(30);
  const [num, setNum] = useState(20);

  if (!exam) {
    return (
      <Card theme={theme} className="p-4">
        <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Start a timed exam</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Select theme={theme} value={certId} onChange={setCertId} options={CERTS.map(c=>({value:c.id,label:c.name}))}/>
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
        <div className="text-sm" style={{ color: theme.subtext }}>{CERTS.find(c=>c.id===exam.certId)?.name} • Question {exam.idx+1}/{exam.items.length}</div>
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
          <Button theme={theme} variant="accent" onClick={() => setExam(null)}><Trophy size={16}/> Finish • Score {pct(exam.score, exam.items.length)}%</Button>
        </div>
      )}
    </Card>
  );
}

function QuestionBank({ theme, CERTS }) {
  const [q, setQ] = useState("");
  const all = useMemo(() => CERTS.flatMap(c => (c.quiz || []).map((item, i) => ({ ...item, cert: c.name, certId: c.id, index: i }))), [CERTS]);
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

function ProgressPane({ theme, CERTS, plan, masteryBySkill, readinessFor, streak, goals, pomodoro, leaderboard, setLeaderboard }) {
  const totalPlan = Object.keys(plan).length;
  const readinessRows = Object.keys(plan).map(id => ({ id, name: CERTS.find(c=>c.id===id)?.name, readiness: readinessFor(id) }));

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
          {readinessRows.map(r => <Bar key={r.id} theme={theme} label={r.name} value={r.readiness} color={theme.primary} />)}
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
          {!leaderboard.optIn ? (
            <div className="space-y-2">
              <Input theme={theme} placeholder="Nickname" value={leaderboard.nick} onChange={e=>setLeaderboard(l=>({...l, nick:e.target.value}))}/>
              <Button theme={theme} variant="accent" onClick={()=>setLeaderboard(l=>({...l, optIn:true, points:0}))}><Users size={16}/> Join</Button>
            </div>
          ) : (
            <div className="text-sm" style={{ color: theme.subtext }}>Welcome, {leaderboard.nick}. Points: {leaderboard.points}</div>
          )}
          <div className="mt-2 text-xs" style={{ color: theme.subtext }}>Peers feature is local-only here.</div>
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
        Local-only demo. Create a group name and share resources with your friends manually.
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button theme={theme} variant="outline" onClick={()=>setLeaderboard(l=>({...l, points:(l.points||0)+10}))}><Swords size={16}/> Win a mock battle (+10)</Button>
        <Button theme={theme} variant="outline"><MessageSquare size={16}/> Discussion Boards (coming soon)</Button>
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
        <div>Offline mode (use local cache)</div>
        <Button theme={theme} variant="outline" onClick={()=>setOffline(o=>!o)}>{offline ? "On" : "Off"}</Button>
      </div>
    </Card>
  );
}

function RoadmapBuilder({ theme, CERTS, plan, setPlan, addToPlan }) {
  const [selected, setSelected] = useState([]);
  const add = (id) => setSelected(s => Array.from(new Set([...s, id])));
  const remove = (id) => setSelected(s => s.filter(x=>x!==id));
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card theme={theme} className="p-4">
        <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Pick certs</div>
        <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-auto pr-2">
          {CERTS.map(c => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border p-2 text-sm" style={{ borderColor: theme.border }}>
              <div>{c.name}</div>
              <div className="flex gap-2">
                <Button theme={theme} size="sm" variant="outline" onClick={()=>add(c.id)}><Plus size={14}/></Button>
                <Button theme={theme} size="sm" variant="outline" onClick={()=>addToPlan(c.id)}><FolderPlus size={14}/></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card theme={theme} className="p-4">
        <div className="mb-2 text-sm font-semibold" style={{ color: theme.brandDark }}>Custom roadmap</div>
        <ol className="mb-3 list-decimal pl-5 text-sm">
          {selected.map(id => <li key={id} className="mb-1">{CERTS.find(c=>c.id===id)?.name} <button onClick={()=>remove(id)} className="ml-2 text-xs" style={{ color: theme.primary }}>remove</button></li>)}
        </ol>
        <Button theme={theme} variant="accent" onClick={() => {
          setSelected([]);
          alert("Saved to memory. Add each to plan when ready.");
        }}><Target size={16}/> Save</Button>
      </Card>
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
        <div className="h-3 rounded-full" style={{ width: `${value}%`, backgroundColor: color || theme.brandDark }} />
      </div>
      <div className="w-12 text-right text-sm tabular-nums">{value}%</div>
    </div>
  );
}