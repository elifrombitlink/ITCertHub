import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Star, StarOff, BookOpen, Timer,
  ClipboardList, CheckCircle2, X, ExternalLink, Plus, Minus,
  Download, Upload, Trash2, FolderPlus, NotebookPen,
  RefreshCw, Play, Pause, RotateCcw, FileText, Settings, BadgeCheck,
  Sparkles, HelpCircle, BarChart3, Lightbulb, ArrowRight,
  Moon, SunMedium, Target, Calendar, Users, MessageSquare, Trophy, Edit3, ListChecks
} from "lucide-react";

/** =========================================================
 * Brand and Theme
 * ======================================================= */
const BRAND_DARK = "#0c1520";    // deep navy
const BRAND_BLUE = "#1a73e8";    // CertWolf blue
const BRAND_BG   = "#FAFAFA";
const BRAND_WHITE= "#FFFFFF";

/** Theme helper */
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cw.dark") || "false"); } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem("cw.dark", JSON.stringify(dark)); } catch {}
    const root = document.documentElement;
    if (dark) {
      root.style.setProperty("--bg", "#0b0f14");
      root.style.setProperty("--surface", "#121922");
      root.style.setProperty("--text", "#E6EDF3");
      root.style.setProperty("--muted", "#99A3AD");
      root.style.setProperty("--brand", BRAND_BLUE);
      root.style.setProperty("--border", "#1f2a37");
    } else {
      root.style.setProperty("--bg", BRAND_BG);
      root.style.setProperty("--surface", "#FFFFFF");
      root.style.setProperty("--text", "#111827");
      root.style.setProperty("--muted", "#6B7280");
      root.style.setProperty("--brand", BRAND_BLUE);
      root.style.setProperty("--border", "#E5E7EB");
    }
  }, [dark]);
  return [dark, setDark];
}

/** Tiny UI primitives */
const cx = (...clx) => clx.filter(Boolean).join(" ");

const Button = ({ className = "", variant = "default", size = "md", style, ...props }) => {
  const base = "inline-flex items-center gap-2 rounded-2xl border transition px-3 py-2 text-sm font-medium hover:opacity-90";
  const sizes = { sm: "px-2 py-1 text-xs", md: "px-3 py-2 text-sm", lg: "px-4 py-2 text-base" };
  const stylesByVariant = {
    default: { backgroundColor: "var(--brand)", borderColor: "var(--brand)", color: "#fff" },
    ghost:   { backgroundColor: "transparent", borderColor: "transparent", color: "var(--text)" },
    outline: { backgroundColor: "transparent", borderColor: "var(--border)", color: "var(--text)" },
    subtle:  { backgroundColor: "rgba(26,115,232,0.08)", borderColor: "rgba(26,115,232,0.12)", color: "var(--text)" },
    success: { backgroundColor: "#16A34A", borderColor: "#16A34A", color: "#fff" },
    danger:  { backgroundColor: "#DC2626", borderColor: "#DC2626", color: "#fff" },
    dark:    { backgroundColor: BRAND_DARK, borderColor: BRAND_DARK, color: "#fff" },
  };
  return (
    <button
      className={cx(base, sizes[size], className)}
      style={{ ...(stylesByVariant[variant] || {}), ...(style || {}) }}
      {...props}
    />
  );
};

const Card = ({ className = "", ...props }) => (
  <div className={cx("rounded-2xl border shadow-sm", className)} style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} {...props} />
);

const Badge = ({ children, className = "" }) => (
  <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", className)} style={{ borderColor:"var(--border)", color:"var(--text)", background:"transparent" }}>
    {children}
  </span>
);

const Input = ({ className = "", ...props }) => (
  <input
    className={cx("w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2", className)}
    style={{ borderColor: "var(--border)", background:"var(--surface)", color:"var(--text)" }}
    {...props}
  />
);

const Select = ({ className = "", options = [], value, onChange }) => (
  <select
    className={cx("w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2", className)}
    style={{ borderColor: "var(--border)", color:"var(--text)" }}
    value={value}
    onChange={e => onChange(e.target.value)}
  >
    {options.map(o => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

const Tabs = ({ tabs, value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {tabs.map(t => (
      <Button
        key={t.value}
        variant={value === t.value ? "dark" : "outline"}
        onClick={() => onChange(t.value)}
      >
        {t.icon && <t.icon size={16} />} {t.label}
      </Button>
    ))}
  </div>
);

/** Data - trimmed for brevity (same as your working set, add more as desired) */
const BASE_CERTS = [
  { id: "itf+", name: "CompTIA ITF+", vendor: "CompTIA", level: "Starter", domains:["Core IT"], estHours:25, skills:["basic hardware","software","troubleshooting","security basics"], tags:["beginner","comptia","core"], flashcards:[{q:"What does CPU stand for?",a:"Central Processing Unit"}], quiz:[{q:"Which is an input device?",options:["Monitor","Keyboard","Projector","GPU"],answer:1,exp:"Keyboard inputs data."}] },
  { id: "a+", name: "CompTIA A+", vendor: "CompTIA", level: "Starter", domains:["Core IT"], estHours:120, skills:["PC hardware","OS install","troubleshooting","basic networking","security"], tags:["beginner","comptia"], quiz:[{q:"What port does RDP use?",options:["22","80","3389","443"],answer:2,exp:"RDP is TCP/3389"}] },
  { id: "net+", name: "CompTIA Network+", vendor: "CompTIA", level: "Intermediate", domains:["Networking"], estHours:100, skills:["routing","switching","wireless","security"], tags:["networking"], quiz:[{q:"What does ARP do?",options:["Assign IPs","Resolve IP to MAC","Encrypt data","Forward frames"],answer:1,exp:"Maps IP to MAC"}] },
];

/** Local storage */
const LS_KEY = "cw.state.v2";
const loadState = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; } };
const saveState = (s) => localStorage.setItem(LS_KEY, JSON.stringify(s));

/** Utilities */
const unique = (arr) => Array.from(new Set(arr));
const nowDayKey = () => new Date().toISOString().slice(0,10);

/** Main App */
export default function App() {
  const [dark, setDark] = useDarkMode();

  const [tab, setTab] = useState("catalog");
  const [q, setQ] = useState("");
  const [vendor, setVendor] = useState("all");
  const [domain, setDomain] = useState("all");
  const [level, setLevel] = useState("all");
  const [tag, setTag] = useState("all");

  const [favorites, setFavorites] = useState([]);
  const [plan, setPlan] = useState({}); // certId -> {targetDate, progress, notes}
  const [activeCert, setActiveCert] = useState(null);
  const [closedForCertId, setClosedForCertId] = useState(null);

  // Timer - editable durations
  const [pomodoro, setPomodoro] = useState({ running:false, seconds:25*60, mode:"focus", focusMins:25, breakMins:5 });
  const [focusByCert, setFocusByCert] = useState({}); // analytics seconds per cert

  // Quiz/Flashcards state
  const [fcProgress, setFcProgress] = useState({}); // spaced repetition dueAt timestamps
  const [quizState, setQuizState] = useState({});   // per cert stats
  const [bookmarks, setBookmarks] = useState({ fc:[], q:[] });

  // Goals & streaks
  const [goals, setGoals] = useState({ dailyMinutes:30, dailyQuestions:20 });
  const [streak, setStreak] = useState({ last: "", days: 0, badges: [] });

  // Roadmap builder
  const [customRoadmap, setCustomRoadmap] = useState([]);

  // Leaderboard (local-only opt-in)
  const [leaderboard, setLeaderboard] = useState({ name:"", optIn:false, score:0, entries:[] });

  // Load
  useEffect(() => {
    const s = loadState();
    setFavorites(s.favorites || []);
    setPlan(s.plan || {});
    setPomodoro(s.pomodoro || { running:false, seconds:25*60, mode:"focus", focusMins:25, breakMins:5 });
    setFcProgress(s.fcProgress || {});
    setQuizState(s.quizState || {});
    setBookmarks(s.bookmarks || { fc:[], q:[] });
    setTab(s.ui?.tab || "catalog");
    setGoals(s.goals || { dailyMinutes:30, dailyQuestions:20 });
    setStreak(s.streak || { last:"", days:0, badges:[] });
    setCustomRoadmap(s.customRoadmap || []);
    setLeaderboard(s.leaderboard || { name:"", optIn:false, score:0, entries:[] });
    setFocusByCert(s.focusByCert || {});
  }, []);

  useEffect(() => {
    saveState({ favorites, plan, pomodoro, fcProgress, quizState, bookmarks, goals, streak, customRoadmap, leaderboard, focusByCert, ui:{ tab } });
  }, [favorites, plan, pomodoro, fcProgress, quizState, bookmarks, goals, streak, customRoadmap, leaderboard, focusByCert, tab]);

  // Timer
  useEffect(() => {
    if (!pomodoro.running) return;
    const id = setInterval(() => {
      setPomodoro(p => {
        if (p.seconds > 0) return { ...p, seconds: p.seconds - 1 };
        // finished a block - log analytics
        const certId = activeCert?.id;
        if (certId) {
          setFocusByCert(prev => ({ ...prev, [certId]: (prev[certId]||0) + (p.mode === "focus" ? p.focusMins*60 : p.breakMins*60) }));
        }
        if (p.mode === "focus") return { ...p, running:false, seconds: p.breakMins*60, mode:"break" };
        return { ...p, running:false, seconds: p.focusMins*60, mode:"focus" };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [pomodoro.running, activeCert]);

  // Streaks
  useEffect(() => {
    const key = nowDayKey();
    if (pomodoro.running) return;
    // mark day as studied if at least one second ticked this session
    // minimalist approach: when pressing Start, we set today's date if not set
  }, [pomodoro.running]);

  // Filters
  const ALL_CERTS = BASE_CERTS;
  const allVendors = useMemo(() => unique(ALL_CERTS.map(c => c.vendor)).sort(), []);
  const allDomains = useMemo(() => unique(ALL_CERTS.flatMap(c => c.domains)).sort(), []);
  const allLevels  = useMemo(() => unique(ALL_CERTS.map(c => c.level)), []);
  const allTags    = useMemo(() => unique(ALL_CERTS.flatMap(c => c.tags||[])).sort(), []);

  const filtered = useMemo(() => {
    const qLower = q.toLowerCase();
    return ALL_CERTS.filter(c => (
      (vendor === "all" || c.vendor === vendor) &&
      (domain === "all" || c.domains.includes(domain)) &&
      (level === "all" || c.level === level) &&
      (tag === "all" || (c.tags||[]).includes(tag)) &&
      (!q || (c.name.toLowerCase().includes(qLower) || c.skills?.some(s => String(s).toLowerCase().includes(qLower))))
    ));
  }, [q, vendor, domain, level, tag]);

  const certById = (id) => ALL_CERTS.find(c => c.id === id);
  const currentCertId = activeCert?.id || Object.keys(plan)[0] || ALL_CERTS[0]?.id;
  const currentCert = currentCertId ? certById(currentCertId) : null;

  // Drawer init logic with "closed for cert" memory
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

  // Export
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ favorites, plan, pomodoro, fcProgress, quizState, bookmarks, goals, streak, customRoadmap, leaderboard, focusByCert, ui:{tab} }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "certwolf-data.json"; a.click(); URL.revokeObjectURL(url);
  };

  // Practice exam - timed
  const [exam, setExam] = useState({ running:false, seconds:0, items:[], idx:0, correct:0 });
  const startExam = (minutes=15) => {
    const items = (currentCert?.quiz || []).slice().sort(()=>Math.random()-0.5);
    setExam({ running:true, seconds: minutes*60, items, idx:0, correct:0 });
  };
  useEffect(() => {
    if (!exam.running) return;
    const id = setInterval(() => {
      setExam(e => e.seconds>0 ? { ...e, seconds:e.seconds-1 } : { ...e, running:false });
    }, 1000);
    return () => clearInterval(id);
  }, [exam.running]);

  // Adaptive learning - prioritize wrong answers
  const getAdaptiveNext = (certId) => {
    const qs = quizState[certId]?.answers || [];
    const stats = new Map(); // question index -> {tries, correct}
    qs.forEach((a,i) => {
      const key = i % (certById(certId)?.quiz?.length || 1);
      const s = stats.get(key) || { tries:0, correct:0 };
      s.tries++; if (a.correct) s.correct++; stats.set(key,s);
    });
    const diff = [...stats.entries()].map(([k,v]) => ({ k, rate: v.correct/(v.tries||1) }))
      .sort((a,b)=>a.rate-b.rate);
    return diff.length ? diff[0].k : 0;
  };

  // Spaced repetition - due list
  const dueFlashcards = useMemo(() => {
    const now = Date.now();
    const entries = Object.entries(fcProgress[currentCertId] || {})
      .filter(([idx, meta]) => !meta.next || meta.next <= now)
      .map(([idx]) => Number(idx));
    return new Set(entries);
  }, [fcProgress, currentCertId]);

  const markFlashResult = (certId, index, knew) => {
    setFcProgress(fp => {
      const cert = fp[certId] || {};
      const cur  = cert[index] || { ease: 2.5, interval: 1, next: 0 };
      const ease = Math.max(1.3, cur.ease + (knew ? +0.1 : -0.2));
      const interval = knew ? Math.ceil(cur.interval * ease) : 1;
      const next = Date.now() + interval * 24*60*60*1000; // days
      return { ...fp, [certId]: { ...cert, [index]: { ease, interval, next } } };
    });
  };

  // Simple ICS export for study blocks
  const exportICS = (dateStr, minutes=60, title="Study Block") => {
    const start = new Date(dateStr + "T09:00:00");
    const dt = start.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
    const end = new Date(start.getTime()+minutes*60000).toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
    const ics = [
      "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//CertWolf//EN","BEGIN:VEVENT",
      `DTSTART:${dt}`,`DTEND:${end}`,`SUMMARY:${title}`,"END:VEVENT","END:VCALENDAR"
    ].join("\\n");
    const blob = new Blob([ics], { type:"text/calendar" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href=url; a.download="study.ics"; a.click(); URL.revokeObjectURL(url);
  };

  // Derived
  const mastery = (id) => {
    const qs = quizState[id]?.answers || [];
    const correct = qs.filter(a=>a.correct).length;
    const tried = qs.length || 1;
    return Math.round((correct / tried) * 100);
  };
  const readiness = (id) => {
    const p = plan[id]?.progress || 0;
    const m = mastery(id);
    return Math.round(0.6*m + 0.4*p);
  };

  return (
    <div className="min-h-screen" style={{ background:"var(--bg)", color:"var(--text)" }}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-[var(--surface)]/90 backdrop-blur" style={{ borderColor:"var(--border)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="https://i.imgur.com/WqdkIGU.png" alt="CertWolf Logo" className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: BRAND_BLUE }}>CertWolf Study Hub</h1>
              <p className="text-xs" style={{ color:"var(--muted)" }}>Plan, study, quiz, and track your progress</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={()=>setDark(!dark)}>
              {dark ? <SunMedium size={16}/> : <Moon size={16}/>} {dark ? "Light" : "Dark"}
            </Button>
            <label className="cursor-pointer">
              <input type="file" className="hidden" accept="application/json"
                onChange={e=>{ const f=e.target.files?.[0]; if(!f) return; f.text().then(t=>{ try{ const s=JSON.parse(t); localStorage.setItem(LS_KEY, JSON.stringify(s)); location.reload(); }catch{ alert("Invalid file"); } }); e.target.value=""; }}/>
              <Button variant="outline"><Upload size={16}/> Import</Button>
            </label>
            <Button variant="outline" onClick={exportData}><Download size={16}/> Export</Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <Card className="p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Filter size={16}/> Filters</div>
              <div className="mb-3">
                <div className="mb-1 text-xs font-semibold">Search</div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5" size={16}/>
                  <Input placeholder="Find a cert" value={q} onChange={e=>setQ(e.target.value)} className="pl-8"/>
                </div>
              </div>
              <div className="mb-3">
                <div className="mb-1 text-xs font-semibold">Vendor</div>
                <Select value={vendor} onChange={setVendor} options={[{value:"all",label:"All"}, ...allVendors.map(v=>({value:v,label:v}))]}/>
              </div>
              <div className="mb-3">
                <div className="mb-1 text-xs font-semibold">Domain</div>
                <Select value={domain} onChange={setDomain} options={[{value:"all",label:"All"}, ...allDomains.map(v=>({value:v,label:v}))]}/>
              </div>
              <div className="mb-3">
                <div className="mb-1 text-xs font-semibold">Level</div>
                <Select value={level} onChange={setLevel} options={[{value:"all",label:"All"}, ...allLevels.map(v=>({value:v,label:v}))]}/>
              </div>
              <div className="mb-4">
                <div className="mb-1 text-xs font-semibold">Tag</div>
                <Select value={tag} onChange={setTag} options={[{value:"all",label:"All"}, ...allTags.map(t=>({value:t,label:t}))]}/>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="subtle" onClick={()=>{ setVendor("all"); setDomain("all"); setLevel("all"); setTag("all"); setQ(""); }}>
                  <RefreshCw size={16}/> Reset
                </Button>
                <Button variant="outline" onClick={()=>setTab("roadmaps")}>
                  <Lightbulb size={16}/> Roadmaps
                </Button>
              </div>
            </Card>

            {/* Pomodoro with editor */}
            <Card className="mt-6 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold"><Timer size={16}/> Pomodoro</div>
                <div className="text-xs" style={{ color:"var(--muted)" }}>Editable</div>
              </div>
              <div className="text-3xl font-bold tabular-nums" style={{ color: BRAND_BLUE }}>
                {String(Math.floor(pomodoro.seconds/60)).padStart(2,"0")}:{String(pomodoro.seconds%60).padStart(2,"0")}
              </div>
              <div className="mt-1 text-xs" style={{ color:"var(--muted)" }}>Mode: {pomodoro.mode}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2">
                  Focus mins <Input type="number" value={pomodoro.focusMins} onChange={e=>setPomodoro(p=>({...p, focusMins:Math.max(1,Number(e.target.value)||25)}))}/>
                </label>
                <label className="flex items-center gap-2">
                  Break mins <Input type="number" value={pomodoro.breakMins} onChange={e=>setPomodoro(p=>({...p, breakMins:Math.max(1,Number(e.target.value)||5)}))}/>
                </label>
              </div>
              <div className="mt-3 flex gap-2">
                {!pomodoro.running ? (
                  <Button onClick={()=>setPomodoro(p=>({...p, running:true, seconds: p.seconds || p.focusMins*60 }))}><Play size={16}/> Start</Button>
                ) : (
                  <Button variant="outline" onClick={()=>setPomodoro(p=>({...p, running:false}))}><Pause size={16}/> Pause</Button>
                )}
                <Button variant="outline" onClick={()=>setPomodoro(p=>({...p, running:false, seconds:p.focusMins*60, mode:"focus"}))}><RotateCcw size={16}/> Reset</Button>
              </div>
            </Card>
          </aside>

          {/* Main */}
          <section className="lg:col-span-3">
            <div className="mb-4">
              <Tabs
                value={tab}
                onChange={setTab}
                tabs={[
                  { value:"catalog", label:"Catalog", icon: BookOpen },
                  { value:"roadmaps", label:"Roadmaps", icon: Sparkles },
                  { value:"plan", label:"Study Plan", icon: ClipboardList },
                  { value:"flashcards", label:"Flashcards", icon: NotebookPen },
                  { value:"quiz", label:"Quizzes", icon: HelpCircle },
                  { value:"exam", label:"Practice Exam", icon: ListChecks },
                  { value:"notes", label:"Notes", icon: Edit3 },
                  { value:"goals", label:"Goals", icon: Target },
                  { value:"groups", label:"Groups", icon: Users },
                  { value:"progress", label:"Progress", icon: BarChart3 },
                  { value:"tools", label:"Tools", icon: Settings },
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
                      <Card className="flex h-full flex-col p-4">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm" style={{ color:"var(--muted)" }}>{c.vendor}</div>
                            <h3 className="text-lg font-semibold leading-tight" style={{ color: BRAND_BLUE }}>{c.name}</h3>
                          </div>
                          <button onClick={()=>setFavorites(f=>f.includes(c.id)?f.filter(x=>x!==c.id):[...f,c.id])} className="hover:opacity-90" title={fav ? "Unfavorite" : "Favorite"}>
                            {fav ? <Star size={18} className="fill-yellow-400 text-yellow-400"/> : <StarOff size={18}/>}
                          </button>
                        </div>
                        <div className="mb-2 flex flex-wrap gap-2">
                          <Badge>{c.level}</Badge>
                          {c.domains.slice(0,2).map(d => <Badge key={d}>{d}</Badge>)}
                          <Badge>~{c.estHours} hrs</Badge>
                        </div>
                        <p className="mb-3 line-clamp-3 text-sm" style={{ color:"var(--muted)" }}>Skills: {c.skills?.join(", ")}</p>
                        <div className="mt-auto flex items-center gap-2">
                          <Button onClick={()=>setActiveCert(c)} size="sm"><FileText size={16}/> Details</Button>
                          {!plan[c.id] ? (
                            <Button variant="default" size="sm" onClick={()=>setPlan(p=>({...p,[c.id]:{targetDate:"",progress:0,notes:""}}))}><FolderPlus size={16}/> Add</Button>
                          ) : (
                            <Button variant="subtle" size="sm" onClick={()=>setTab("plan")}><BadgeCheck size={16}/> In Plan</Button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Roadmaps with Custom Builder */}
            {tab === "roadmaps" && (
              <Card className="p-4">
                <div className="mb-3 text-sm font-semibold" style={{ color: BRAND_BLUE }}>Custom Roadmap Builder</div>
                <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {ALL_CERTS.map(c => (
                    <label key={c.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={customRoadmap.includes(c.id)} onChange={(e)=>setCustomRoadmap(r=>e.target.checked?[...r,c.id]:r.filter(x=>x!==c.id))}/>
                      {c.name}
                    </label>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={()=>customRoadmap.forEach(id=>setPlan(p=>({...p,[id]:p[id]||{targetDate:"",progress:0,notes:""}})))}>Add to Plan</Button>
                  <Button variant="outline" onClick={()=>setCustomRoadmap([])}>Clear</Button>
                </div>
              </Card>
            )}

            {/* Study Plan */}
            {tab === "plan" && (
              <div className="space-y-4">
                {Object.entries(plan).map(([id, meta]) => {
                  const c = certById(id); if (!c) return null;
                  return (
                    <Card key={id} className="p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-xs" style={{ color:"var(--muted)" }}>{c.vendor} - {c.level}</div>
                          <div className="text-lg font-semibold" style={{ color: BRAND_BLUE }}>{c.name}</div>
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <Calendar size={14}/> <input type="date" value={meta.targetDate} onChange={e=>setPlan(p=>({...p,[id]:{...p[id],targetDate:e.target.value}}))} className="rounded border px-1 py-0.5" style={{ borderColor:"var(--border)", background:"transparent" }}/>
                            <Button variant="outline" size="sm" onClick={()=>exportICS(meta.targetDate||new Date().toISOString().slice(0,10), 60, c.name+" study")}>Add to Calendar</Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" onClick={()=>setActiveCert(c)} size="sm"><FileText size={16}/> Details</Button>
                          <Button variant="danger" onClick={()=>setPlan(p=>{ const n={...p}; delete n[id]; return n; })} size="sm"><Trash2 size={16}/> Remove</Button>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <div className="mb-1 text-xs font-semibold">Progress</div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="subtle" onClick={()=>setPlan(p=>({...p, [id]:{...p[id], progress: Math.max(0,(p[id].progress||0)-5)}}))}><Minus size={14}/></Button>
                            <div className="w-full rounded-full" style={{ background:"#1f2937" }}>
                              <div className="h-3 rounded-full" style={{ width:`${meta.progress||0}%`, background:BRAND_BLUE }}/>
                            </div>
                            <Button size="sm" variant="subtle" onClick={()=>setPlan(p=>({...p, [id]:{...p[id], progress: Math.min(100,(p[id].progress||0)+5)}}))}><Plus size={14}/></Button>
                            <div className="w-10 text-right text-sm tabular-nums">{meta.progress||0}%</div>
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs font-semibold">Notes</div>
                          <textarea value={meta.notes} onChange={e=>setPlan(p=>({...p,[id]:{...p[id], notes:e.target.value}}))} className="h-24 w-full rounded-xl border p-2 text-sm" style={{ borderColor:"var(--border)", background:"transparent" }} placeholder="Key topics, weak spots, next steps" />
                        </div>
                        <div>
                          <div className="mb-1 text-xs font-semibold">Quick Actions</div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={()=>{setActiveCert(c); setTab("flashcards");}}><NotebookPen size={16}/> Flashcards</Button>
                            <Button size="sm" variant="outline" onClick={()=>{setActiveCert(c); setTab("quiz");}}><HelpCircle size={16}/> Quiz</Button>
                            <Button size="sm" variant="outline" onClick={()=>setTab("exam")}><ListChecks size={16}/> Exam</Button>
                          </div>
                          <div className="mt-3 text-xs" style={{ color:"var(--muted)" }}>Readiness: {readiness(id)}%</div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                {Object.keys(plan).length === 0 && <Card className="p-6 text-center text-sm" style={{ color:"var(--muted)" }}>No items yet.</Card>}
              </div>
            )}

            {/* Flashcards with spaced repetition */}
            {tab === "flashcards" && (
              <Card className="p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold">Choose a cert</div>
                  <Select value={currentCertId} onChange={val=>setActiveCert(certById(val))} options={ALL_CERTS.map(c=>({value:c.id,label:c.name}))}/>
                </div>
                {currentCert ? <Flashcards cert={currentCert} mark={markFlashResult} fcState={fcProgress[currentCert.id]||{}} onBookmark={(payload)=>setBookmarks(b=>({...b, fc:[...b.fc,payload]}))}/> : <div className="text-sm" style={{ color:"var(--muted)" }}>Add a cert first.</div>}
              </Card>
            )}

            {/* Quiz */}
            {tab === "quiz" && currentCert && (
              <Card className="p-4">
                <AdaptiveQuiz cert={currentCert} quizState={quizState[currentCert.id]} setQuizState={(fn)=>setQuizState(qs=>({ ...qs, [currentCert.id]: fn(qs[currentCert.id]) }))} onBookmark={(payload)=>setBookmarks(b=>({...b, q:[...b.q,payload]}))}/>
              </Card>
            )}
            {tab === "quiz" && !currentCert && <Card className="p-4 text-sm" style={{ color:"var(--muted)" }}>Add a cert first.</Card>}

            {/* Practice Exam */}
            {tab === "exam" && currentCert && (
              <Card className="p-4">
                {!exam.running ? (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold">Timed exam</div>
                    <div className="flex flex-wrap gap-2">
                      {[10,20,30,45,60].map(m => <Button key={m} onClick={()=>startExam(m)}>{m} min</Button>)}
                    </div>
                  </div>
                ) : (
                  <ExamRunner exam={exam} setExam={setExam} />
                )}
              </Card>
            )}

            {/* Notes page */}
            {tab === "notes" && (
              <NotesPage />
            )}

            {/* Goals, streaks, leaderboard */}
            {tab === "goals" && (
              <GoalsPage goals={goals} setGoals={setGoals} leaderboard={leaderboard} setLeaderboard={setLeaderboard} />
            )}

            {/* Groups / Discussion - placeholder local */}
            {tab === "groups" && (
              <GroupsPage />
            )}

            {/* Progress */}
            {tab === "progress" && (
              <ProgressPage plan={plan} certById={certById} mastery={mastery} focusByCert={focusByCert} />
            )}

            {/* Tools */}
            {tab === "tools" && (
              <ToolsPage exportICS={exportICS} />
            )}
          </section>
        </div>
      </main>

      {/* Details Drawer */}
      <AnimatePresence>
        {activeCert && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-30 bg-black/30" onClick={handleCloseDrawer}>
            <motion.div initial={{y:50, opacity:0}} animate={{y:0, opacity:1}} exit={{y:50, opacity:0}} transition={{type:"spring", damping:20}} className="absolute inset-x-0 bottom-0 max-h-[80vh] rounded-t-3xl p-6 shadow-xl" style={{ background:"var(--surface)", color:"var(--text)" }} onClick={e=>e.stopPropagation()}>
              <div className="mx-auto max-w-4xl">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs" style={{ color:"var(--muted)" }}>{activeCert.vendor} - {activeCert.level}</div>
                    <div className="text-xl font-semibold" style={{ color: BRAND_BLUE }}>{activeCert.name}</div>
                  </div>
                  <Button variant="outline" onClick={handleCloseDrawer}>✕ Close</Button>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <div className="mb-2 text-sm font-semibold" style={{ color: BRAND_BLUE }}>Skills</div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {activeCert.skills?.map(s => <Badge key={s}>{s}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-sm font-semibold" style={{ color: BRAND_BLUE }}>At a glance</div>
                    <ul className="space-y-1 text-sm">
                      <li>Domains: {activeCert.domains.join(", ")}</li>
                      <li>Level: {activeCert.level}</li>
                      <li>Time: ~{activeCert.estHours} hours</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => setTab("flashcards")}>
                        <NotebookPen size={16} /> Flashcards
                      </Button>
                      <Button size="sm" onClick={() => setTab("quiz")}>
                        <HelpCircle size={16} /> Quiz
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mx-auto max-w-7xl px-4 py-8 text-center text-xs" style={{ color:"var(--muted)" }}>
        Built for focused study. Dark mode friendly. Data is saved locally for offline quizzes and flashcards.
      </footer>
    </div>
  );
}

/** ========== Subcomponents ========== */

function Flashcards({ cert, mark, fcState, onBookmark }) {
  const cards = cert.flashcards?.length ? cert.flashcards : [{ q: "No flashcards yet.", a:"" }];
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(false);
  const dueSet = new Set(Object.keys(fcState || {}).filter(i => !fcState[i].next || fcState[i].next <= Date.now()).map(Number));
  const isDue = dueSet.has(idx) || !fcState[idx];

  const card = cards[idx];
  const handle = (knew) => {
    setShow(false);
    mark(cert.id, idx, knew);
    setIdx((idx + 1) % cards.length);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm" style={{ color:"var(--muted)" }}>
        {cert.name} • Card {idx + 1} of {cards.length} {isDue ? "• due" : ""}
      </div>
      <Card className="p-6">
        <div className="mb-2 text-xs font-semibold" style={{ color:"var(--muted)" }}>Question</div>
        <div className="text-lg font-semibold" style={{ color: BRAND_BLUE }}>{card.q}</div>

        {show && (
          <div className="mt-4 rounded-xl border p-4 text-sm" style={{ borderColor:"var(--border)" }}>
            <div className="mb-1 text-xs font-semibold" style={{ color:"var(--muted)" }}>Answer</div>
            <div>{card.a}</div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {!show ? (
            <Button onClick={() => setShow(true)}>Reveal</Button>
          ) : (
            <Button variant="outline" onClick={() => setShow(false)}>Hide</Button>
          )}
          <Button variant="success" onClick={() => handle(true)}><CheckCircle2 size={16}/> I knew it</Button>
          <Button variant="outline" onClick={() => handle(false)}><ArrowRight size={16}/> Next</Button>
          <Button variant="outline" onClick={()=>onBookmark({ type:"flashcard", certId:cert.id, index:idx, q:card.q })}>Bookmark</Button>
        </div>
      </Card>
    </div>
  );
}

function AdaptiveQuiz({ cert, quizState = {}, setQuizState, onBookmark }) {
  const items = cert.quiz || [];
  if (!items.length) return <div className="text-sm" style={{ color:"var(--muted)" }}>No quiz for this cert yet.</div>;
  const idx = quizState.idx ?? 0;
  const item = items[idx];
  const percent = Math.round(((quizState.correct || 0) / Math.max((quizState.answers || []).length, 1)) * 100);

  const answer = (choice) => {
    const correctNow = choice === item.answer;
    setQuizState(cur => {
      const base = cur || { idx: 0, correct: 0, answers: [] };
      const nextIdx = (base.idx + 1) % items.length;
      return {
        ...base,
        idx: nextIdx,
        correct: base.correct + (correctNow ? 1 : 0),
        answers: [...(base.answers||[]), { choice, correct: correctNow }]
      };
    });
  };

  return (
    <div className="space-y-3">
      <div className="text-sm" style={{ color:"var(--muted)" }}>
        {cert.name} • Question {idx + 1} of {items.length} • Score {isNaN(percent) ? 0 : percent}%
      </div>
      <Card className="p-6">
        <div className="mb-3 text-base font-semibold" style={{ color: BRAND_BLUE }}>
          {item.q}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {item.options.map((opt, i) => (
            <Button key={i} variant="outline" onClick={() => answer(i)}>{opt}</Button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" onClick={()=>setQuizState(()=>({ idx:0, correct:0, answers:[] }))}>Reset</Button>
          <Button variant="outline" onClick={()=>onBookmark({ type:"question", certId:cert.id, index:idx, q:item.q })}>Bookmark</Button>
        </div>
      </Card>
    </div>
  );
}

function ExamRunner({ exam, setExam }) {
  if (!exam.items.length) return <div className="text-sm" style={{ color:"var(--muted)" }}>No questions to run.</div>;
  const item = exam.items[exam.idx];

  const submit = (i) => {
    const correct = exam.correct + (i === item.answer ? 1 : 0);
    const nextIdx = exam.idx + 1;
    if (nextIdx >= exam.items.length) {
      setExam({ ...exam, running:false, correct, idx:nextIdx });
    } else {
      setExam({ ...exam, correct, idx: nextIdx });
    }
  };

  const mm = String(Math.floor(exam.seconds/60)).padStart(2,"0");
  const ss = String(exam.seconds%60).padStart(2,"0");

  if (!exam.running) {
    const pct = Math.round((exam.correct / Math.max(exam.items.length,1)) * 100);
    return (
      <div className="space-y-3">
        <div className="text-sm" style={{ color:"var(--muted)" }}>Score: {exam.correct}/{exam.items.length} ({pct}%)</div>
        <Button variant="outline" onClick={()=>setExam({ running:false, seconds:0, items:[], idx:0, correct:0 })}>Done</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm" style={{ color:"var(--muted)" }}>Time left: {mm}:{ss}</div>
      <div className="text-base font-semibold" style={{ color: BRAND_BLUE }}>{item.q}</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {item.options.map((opt, i) => (
          <Button key={i} variant="outline" onClick={() => submit(i)}>{opt}</Button>
        ))}
      </div>
    </div>
  );
}

function NotesPage() {
  const KEY = "cw.notes.page";
  const [text, setText] = useState("");
  useEffect(() => { try { setText(localStorage.getItem(KEY) || ""); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem(KEY, text); } catch {} }, [text]);

  return (
    <Card className="p-4">
      <div className="mb-2 text-sm font-semibold" style={{ color: BRAND_BLUE }}>Notes</div>
      <textarea value={text} onChange={(e)=>setText(e.target.value)} className="h-[50vh] w-full rounded-xl border p-2 text-sm" style={{ borderColor:"var(--border)", background:"transparent" }} placeholder="Write anything here..." />
      <div className="mt-2">
        <Button variant="outline" onClick={()=>{
          const blob = new Blob([text], { type:"text/plain" });
          const url = URL.createObjectURL(blob); const a=document.createElement("a");
          a.href=url; a.download="notes.txt"; a.click(); URL.revokeObjectURL(url);
        }}><Download size={16}/> Export</Button>
      </div>
    </Card>
  );
}

function GoalsPage({ goals, setGoals, leaderboard, setLeaderboard }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card className="p-4">
        <div className="mb-2 text-sm font-semibold" style={{ color: BRAND_BLUE }}>Daily/Weekly Goals</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="flex items-center gap-2">Daily minutes <Input type="number" value={goals.dailyMinutes} onChange={e=>setGoals(g=>({...g, dailyMinutes:Number(e.target.value)||0}))}/></label>
          <label className="flex items-center gap-2">Daily questions <Input type="number" value={goals.dailyQuestions} onChange={e=>setGoals(g=>({...g, dailyQuestions:Number(e.target.value)||0}))}/></label>
        </div>
      </Card>
      <Card className="p-4">
        <div className="mb-2 text-sm font-semibold" style={{ color: BRAND_BLUE }}>Leaderboard (local)</div>
        {!leaderboard.optIn ? (
          <div className="flex items-center gap-2">
            <Input placeholder="Display name" value={leaderboard.name} onChange={e=>setLeaderboard(l=>({...l, name:e.target.value}))}/>
            <Button onClick={()=>setLeaderboard(l=>({...l, optIn:true}))}><Trophy size={16}/> Join</Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm" style={{ color:"var(--muted)" }}>You: {leaderboard.name} • Score {leaderboard.score}</div>
            <div className="text-xs" style={{ color:"var(--muted)" }}>Entries stored locally only.</div>
          </div>
        )}
      </Card>
    </div>
  );
}

function GroupsPage() {
  const KEY = "cw.groups.local";
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  useEffect(()=>{ try{ setMsgs(JSON.parse(localStorage.getItem(KEY)||"[]")) }catch{} }, []);
  useEffect(()=>{ try{ localStorage.setItem(KEY, JSON.stringify(msgs)) }catch{} }, [msgs]);

  return (
    <Card className="p-4">
      <div className="mb-2 text-sm font-semibold" style={{ color: BRAND_BLUE }}>Study Group (local)</div>
      <div className="mb-3 h-64 overflow-auto rounded-xl border p-2 text-sm" style={{ borderColor:"var(--border)" }}>
        {msgs.map((m,i)=>(<div key={i} className="mb-1"><span className="font-semibold">{m.me?"Me":"Peer"}:</span> {m.t}</div>))}
      </div>
      <div className="flex gap-2">
        <Input value={text} onChange={e=>setText(e.target.value)} placeholder="Share a resource or ask a question"/>
        <Button onClick={()=>{ if(!text.trim()) return; setMsgs([...msgs,{ me:true, t:text }]); setText(""); }}><MessageSquare size={16}/> Send</Button>
      </div>
    </Card>
  );
}

function ProgressPage({ plan, certById, mastery, focusByCert }) {
  return (
    <Card className="p-6">
      <div className="mb-4 text-lg font-semibold" style={{ color: BRAND_BLUE }}>Overview</div>
      <div className="space-y-3">
        {Object.entries(plan).map(([id, meta]) => (
          <div key={id} className="grid grid-cols-1 gap-2 md:grid-cols-5 md:items-center">
            <div className="md:col-span-2 text-sm">{certById(id)?.name}</div>
            <div className="md:col-span-2 h-3 w-full rounded-full" style={{ background:"#1f2937" }}>
              <div className="h-3 rounded-full" style={{ width:`${meta.progress||0}%`, background:BRAND_BLUE }}/>
            </div>
            <div className="text-right text-sm">Mastery {mastery(id)}%</div>
            <div className="text-right text-xs" style={{ color:"var(--muted)" }}>Focus {Math.round((focusByCert[id]||0)/60)} mins</div>
          </div>
        ))}
        {Object.keys(plan).length === 0 && <div className="text-sm" style={{ color:"var(--muted)" }}>Nothing to show yet.</div>}
      </div>
    </Card>
  );
}

function ToolsPage({ exportICS }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card className="p-4">
        <div className="mb-2 text-sm font-semibold" style={{ color: BRAND_BLUE }}>Exam Day Checklist</div>
        <ul className="list-disc pl-5 text-sm">
          <li>Two forms of ID</li>
          <li>Confirm rules or proctoring</li>
          <li>Arrive early or test camera/mic</li>
          <li>Water and snack for after</li>
          <li>Quick flashcard warm-up</li>
        </ul>
      </Card>
      <Card className="p-4">
        <div className="mb-2 text-sm font-semibold" style={{ color: BRAND_BLUE }}>Formula & Command Reference</div>
        <ul className="grid grid-cols-1 gap-1 text-sm md:grid-cols-2">
          <li><code>ipconfig /all</code> - Windows IP details</li>
          <li><code>netstat -ano</code> - Ports/processes</li>
          <li><code>tracert host</code> - Route path</li>
          <li><code>tcpdump -i eth0</code> - Packet capture</li>
          <li><code>nmap -sV host</code> - Version scan</li>
          <li><code>chmod +x file</code> - Make executable</li>
        </ul>
      </Card>
      <Card className="p-4">
        <div className="mb-2 text-sm font-semibold" style={{ color: BRAND_BLUE }}>Printable Study Summary</div>
        <Button variant="outline" onClick={()=>window.print()}><FileText size={16}/> Print</Button>
      </Card>
      <Card className="p-4">
        <div className="mb-2 text-sm font-semibold" style={{ color: BRAND_BLUE }}>Schedule Study</div>
        <div className="flex gap-2">
          <Input type="date" id="icsDate"/>
          <Button onClick={()=>{
            const el=document.getElementById("icsDate"); if(!el||!el.value) return;
            exportICS(el.value, 60, "Study Session");
          }}><Calendar size={16}/> Export .ics</Button>
        </div>
      </Card>
    </div>
  );
}
