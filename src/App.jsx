import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Star, StarOff, BookOpen, Timer,
  ClipboardList, CheckCircle2, X, ExternalLink, Plus, Minus,
  Download, Upload, Trash2, FolderPlus, NotebookPen,
  RefreshCw, Play, Pause, RotateCcw, FileText, Settings, BadgeCheck,
  Sparkles, HelpCircle, BarChart3, Lightbulb, ArrowRight
, Sun, Moon } from "lucide-react";
import { supabase } from "./supabaseclient";
// minimal dark mode
function useDarkMode(defaultMode = "system") {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem("ui:color-scheme") || defaultMode; } catch { return defaultMode; }
  });
  useEffect(() => {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = mode === "system" ? prefersDark : mode === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    try { localStorage.setItem("ui:color-scheme", mode); } catch {}
  }, [mode]);
  return { mode, setMode };
}


/** =========================================================
 * CertWolf Brand
 * ======================================================= */
const BRAND_DARK = "#111d2a";   // deep navy from logo background
const BRAND_BLUE = "#1a73e8";   // button/link blue
const BRAND_BG   = "#FAFAFA";   // app background
const BRAND_WHITE= "#FFFFFF";

/** =========================================================
 * Tiny UI primitives (framework-agnostic)
 * ======================================================= */
const cx = (...clx) => clx.filter(Boolean).join(" ");

const Button = ({ className = "", variant = "default", size = "md", style, ...props }) => {
  const base = "inline-flex items-center gap-2 rounded-2xl border transition px-3 py-2 text-sm font-medium hover:opacity-90";
  const sizes = { sm: "px-2 py-1 text-xs", md: "px-3 py-2 text-sm", lg: "px-4 py-2 text-base" };

  // Inline styles to guarantee exact brand colors without relying on Tailwind arbitrary values
  const stylesByVariant = {
    default: { backgroundColor: BRAND_DARK, borderColor: BRAND_DARK, color: BRAND_WHITE },
    ghost:   { backgroundColor: "transparent", borderColor: "transparent", color: BRAND_DARK },
    outline: { backgroundColor: BRAND_WHITE, borderColor: "#D1D5DB", color: "#111827" },
    subtle:  { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB", color: "#111827" },
    success: { backgroundColor: "#16A34A", borderColor: "#16A34A", color: BRAND_WHITE },
    danger:  { backgroundColor: "#DC2626", borderColor: "#DC2626", color: BRAND_WHITE },
    accent:  { backgroundColor: BRAND_BLUE, borderColor: BRAND_BLUE, color: BRAND_WHITE },
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
  <div className={cx("rounded-2xl border border-gray-200 bg-white shadow-sm", className)} {...props} />
);

const Badge = ({ children, className = "" }) => (
  <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", className)}>
    {children}
  </span>
);

const Input = ({ className = "", ...props }) => (
  <input
    className={cx(
      "w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2",
      className
    )}
    style={{ boxShadow: `0 0 0 0 rgba(0,0,0,0)`, caretColor: BRAND_DARK }}
    {...props}
  />
);

const Select = ({ className = "", options = [], value, onChange }) => (
  <select
    className={cx("w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2", className)}
    style={{ borderColor: "#D1D5DB" }}
    value={value}
    onChange={e => onChange(e.target.value)}
  >
    {options.map(o => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

const Tabs = ({ tabs, value, onChange }) => (
  <div>
    <div className="flex flex-wrap gap-2">
      {tabs.map(t => (
        <Button
          key={t.value}
          variant={value === t.value ? "default" : "outline"}
          onClick={() => onChange(t.value)}
          style={value === t.value ? { backgroundColor: BRAND_DARK, borderColor: BRAND_DARK, color: BRAND_WHITE } : {}}
        >
          {t.icon && <t.icon size={16} />} {t.label}
        </Button>
      ))}
    </div>
  </div>
);

/** =========================================================
 * Data
 * ======================================================= */
const BASE_CERTS = [
  // CompTIA - Starter
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
      { q: "CIDR for a /26 network?", options: ["255.255.255.0", "/26 is 255.255.255.192", "255.255.255.224", "255.255.255.128"], answer: 1, exp: "/26 equals 255.255.255.192." },
      { q: "802.11ac operates on?", options: ["2.4 GHz", "5 GHz", "Both", "60 GHz"], answer: 2, exp: "802.11ac is 5 GHz." },
    ],
  },
  {
    id: "sec+", name: "CompTIA Security+", vendor: "CompTIA", level: "Intermediate",
    domains: ["Security"], estHours: 110,
    skills: ["threats", "vulns", "crypto", "identity", "risk", "sec ops"],
    resources: [
      { title: "Security+ Home", url: "https://www.comptia.org/certifications/security", type: "guide" },
      { title: "Jason Dion Practice", url: "https://www.diontraining.com/", type: "practice" },
    ],
    flashcards: [
      { q: "CIA triad stands for?", a: "Confidentiality, Integrity, Availability" },
      { q: "What is least privilege?", a: "Grant only needed access" },
    ],
    quiz: [
      { q: "Best control to detect changes to files?", options: ["WAF", "File integrity monitoring", "NAT", "Proxy"], answer: 1, exp: "FIM detects changes." },
      { q: "Salting passwords mitigates?", options: ["Phishing", "Rainbow tables", "DDoS", "Tailgating"], answer: 1, exp: "Salts stop precomputed hashes." },
    ],
  },
  { id: "linux+", name: "CompTIA Linux+", vendor: "CompTIA", level: "Intermediate", domains: ["Linux"], estHours: 90,
    skills: ["shell", "system services", "networking", "security", "troubleshooting"],
    resources: [ { title: "Linux+ Home", url: "https://www.comptia.org/certifications/linux", type: "guide" } ],
    flashcards: [ { q: "What does ls -la show?", a: "Long list, all files" } ],
    quiz: [ { q: "Set executable bit command?", options: ["chmod +x file", "chown", "passwd", "grep"], answer: 0, exp: "Use chmod +x." } ] },
  { id: "project+", name: "CompTIA Project+", vendor: "CompTIA", level: "Starter", domains: ["Project Mgmt"], estHours: 40, skills: ["project basics", "scheduling", "stakeholders"], resources: [ { title: "Project+", url: "https://www.comptia.org/certifications/project", type: "guide" } ] },
  { id: "data+", name: "CompTIA Data+", vendor: "CompTIA", level: "Intermediate", domains: ["Data"], estHours: 60, skills: ["analytics", "data quality", "viz"] },

  // Cisco
  { id: "ccst-net", name: "Cisco CCST Networking", vendor: "Cisco", level: "Starter", domains: ["Networking"], estHours: 40, skills: ["network basics", "IP", "troubleshooting"] },
  { id: "ccst-sec", name: "Cisco CCST Cybersecurity", vendor: "Cisco", level: "Starter", domains: ["Security"], estHours: 40, skills: ["threats", "controls", "monitoring"] },
  { id: "ccna", name: "Cisco CCNA", vendor: "Cisco", level: "Intermediate", domains: ["Networking"], estHours: 140, skills: ["routing", "switching", "wireless", "automation"] },
  { id: "cyberops", name: "Cisco CyberOps Associate", vendor: "Cisco", level: "Intermediate", domains: ["Security"], estHours: 100, skills: ["SOC basics", "SIEM", "IR"] },
  { id: "devnet-assoc", name: "Cisco DevNet Associate", vendor: "Cisco", level: "Intermediate", domains: ["DevOps", "Networking"], estHours: 120, skills: ["APIs", "automation", "python"] },

  // Microsoft
  { id: "az-900", name: "Microsoft AZ-900 Azure Fundamentals", vendor: "Microsoft", level: "Starter", domains: ["Cloud"], estHours: 25, skills: ["cloud models", "Azure basics", "pricing"] },
  { id: "ms-900", name: "Microsoft MS-900 365 Fundamentals", vendor: "Microsoft", level: "Starter", domains: ["Cloud", "Windows"], estHours: 25, skills: ["M365 services", "security", "compliance"] },
  { id: "ai-900", name: "Microsoft AI-900 AI Fundamentals", vendor: "Microsoft", level: "Starter", domains: ["AI"], estHours: 20, skills: ["AI basics", "ML concepts", "Azure AI"] },
  { id: "dp-900", name: "Microsoft DP-900 Data Fundamentals", vendor: "Microsoft", level: "Starter", domains: ["Data"], estHours: 20, skills: ["relational vs non-rel", "analytics"] },
  { id: "md-102", name: "Microsoft MD-102 Endpoint Administrator", vendor: "Microsoft", level: "Intermediate", domains: ["Windows"], estHours: 90, skills: ["Intune", "AAD", "Win11 mgmt"] },
  { id: "az-104", name: "Microsoft AZ-104 Azure Administrator", vendor: "Microsoft", level: "Intermediate", domains: ["Cloud"], estHours: 110, skills: ["compute", "network", "storage", "identity"] },
  { id: "sc-200", name: "Microsoft SC-200 Security Operations Analyst", vendor: "Microsoft", level: "Intermediate", domains: ["Security"], estHours: 100, skills: ["Sentinel", "Defender", "KQL"] },
  { id: "sc-300", name: "Microsoft SC-300 Identity and Access Admin", vendor: "Microsoft", level: "Intermediate", domains: ["Security"], estHours: 90, skills: ["Entra ID", "Identity", "Access"] },

  // AWS
  { id: "aws-ccp", name: "AWS Cloud Practitioner", vendor: "AWS", level: "Starter", domains: ["Cloud"], estHours: 30, skills: ["AWS basics", "billing", "shared responsibility"] },
  { id: "aws-saa", name: "AWS Solutions Architect Associate", vendor: "AWS", level: "Intermediate", domains: ["Cloud"], estHours: 120, skills: ["VPC", "HA", "cost", "security"] },
  { id: "aws-soa", name: "AWS SysOps Admin Associate", vendor: "AWS", level: "Intermediate", domains: ["Cloud"], estHours: 120, skills: ["ops", "monitoring", "automation"] },
  { id: "aws-dev", name: "AWS Developer Associate", vendor: "AWS", level: "Intermediate", domains: ["Cloud", "DevOps"], estHours: 120, skills: ["lambda", "api", "ci/cd"] },

  // Google Cloud
  { id: "gcdl", name: "Google Cloud Digital Leader", vendor: "Google", level: "Starter", domains: ["Cloud"], estHours: 20, skills: ["cloud value", "services"] },
  { id: "g-ace", name: "Google Associate Cloud Engineer", vendor: "Google", level: "Intermediate", domains: ["Cloud"], estHours: 100, skills: ["gce", "gke", "network", "iam"] },

  // Linux Foundation / Red Hat
  { id: "lfcs", name: "Linux Foundation LFCS", vendor: "Linux Foundation", level: "Intermediate", domains: ["Linux"], estHours: 120, skills: ["services", "storage", "networking"] },
  { id: "rhcsa", name: "Red Hat RHCSA", vendor: "Red Hat", level: "Intermediate", domains: ["Linux"], estHours: 140, skills: ["RHEL admin", "selinux", "systemd"] },

  // VMware
  { id: "vcta", name: "VMware VCTA", vendor: "VMware", level: "Starter", domains: ["Virtualization"], estHours: 40, skills: ["vSphere basics"] },
  { id: "vcp-dcv", name: "VMware VCP-DCV", vendor: "VMware", level: "Intermediate", domains: ["Virtualization"], estHours: 130, skills: ["ESXi", "vCenter", "HA"] },

  // Security - ISC2, ITIL, Scrum
  { id: "isc2-cc", name: "ISC2 Certified in Cybersecurity (CC)", vendor: "ISC2", level: "Starter", domains: ["Security"], estHours: 35, skills: ["sec basics", "risk", "network"] },
  { id: "sscp", name: "ISC2 SSCP", vendor: "ISC2", level: "Intermediate", domains: ["Security"], estHours: 120, skills: ["access", "network", "incident"] },
  { id: "itil4f", name: "ITIL 4 Foundation", vendor: "AXELOS", level: "Starter", domains: ["ITSM"], estHours: 25, skills: ["ITSM", "process", "value streams"] },
  { id: "psm1", name: "Scrum.org PSM I", vendor: "Scrum.org", level: "Starter", domains: ["Project Mgmt"], estHours: 20, skills: ["scrum", "agile", "roles & events"] },

  // Palo Alto, Juniper, Aruba
  { id: "pccet", name: "Palo Alto PCCET", vendor: "Palo Alto Networks", level: "Starter", domains: ["Security", "Networking"], estHours: 40, skills: ["firewall basics", "cloud sec"] },
  { id: "pcnsa", name: "Palo Alto PCNSA", vendor: "Palo Alto Networks", level: "Intermediate", domains: ["Security", "Networking"], estHours: 120, skills: ["policy", "NAT", "content id"] },
  { id: "jncia", name: "Juniper JNCIA-Junos", vendor: "Juniper", level: "Starter", domains: ["Networking"], estHours: 60, skills: ["junos cli", "routing", "switching"] },
  { id: "jncis-ent", name: "Juniper JNCIS-ENT", vendor: "Juniper", level: "Intermediate", domains: ["Networking"], estHours: 120, skills: ["ospf", "stp", "security"] },
  { id: "aruba-aca", name: "Aruba ACA Networking", vendor: "HPE Aruba", level: "Starter", domains: ["Networking"], estHours: 60, skills: ["campus switching", "wlan"] },
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
const LS_KEY = "it-cert-hub/v1";
const loadState = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
};
const saveState = (s) => localStorage.setItem(LS_KEY, JSON.stringify(s));

/** =========================================================
 * Utils
 * ======================================================= */
const unique = (arr) => Array.from(new Set(arr));

/** =========================================================
 * Main Component
 * ======================================================= */
export default function ITCertStudyHub() {
  const { mode: themeMode, setMode: setThemeMode } = useDarkMode('system');
  const [tab, setTab] = useState("catalog");
  const [q, setQ] = useState("");
  const [vendor, setVendor] = useState("all");
  const [domain, setDomain] = useState("all");
  const [level, setLevel] = useState("all");
  const [favorites, setFavorites] = useState([]);
  const [plan, setPlan] = useState({}); // certId -> {targetDate, progress:0-100, notes:""}
  const [activeCert, setActiveCert] = useState(null);
  const [pomodoro, setPomodoro] = useState({ running:false, seconds: 25*60, mode: "focus" });
  const [fcProgress, setFcProgress] = useState({}); // certId -> {index, known:Set}
  const [quizState, setQuizState] = useState({}); // certId -> {idx, correct, answers:[]}

  // external certs
  const [external, setExternal] = useState({ certs: [], defaults: { flashcards: {}, quiz: {} } });
  const [externalRoadmaps, setExternalRoadmaps] = useState([]);
  useEffect(() => {
    (async () => {
      const BASE = (import.meta?.env?.BASE_URL || process.env.PUBLIC_URL || "/").replace(/\/+$/, "/");
      try {
        // load certs from manifest
        const cm = await fetch(`${BASE}data/certs/manifest.json`, { cache: "no-cache" }).then(r => r.ok ? r.json() : null);
        const certs = [];
        if (Array.isArray(cm)) {
          for (const entry of cm) {
            const path = entry?.path || `${entry?.id}.json`;
            const data = await fetch(`${BASE}data/certs/${path}`, { cache: "no-cache" }).then(r => r.ok ? r.json() : null);
            if (data) certs.push({ ...entry, ...data });
          }
        } else {
          // fallback to legacy /certs.json
          const legacy = await fetch(`${BASE}certs.json`).then(r => r.ok ? r.json() : null);
          if (legacy?.certs) certs.push(...legacy.certs);
        }

        // load roadmaps from manifest
        const rm = await fetch(`${BASE}data/roadmaps/manifest.json`, { cache: "no-cache" }).then(r => r.ok ? r.json() : null);
        const rms = [];
        if (Array.isArray(rm)) {
          for (const entry of rm) {
            const path = entry?.path || `${entry?.id}.json`;
            const data = await fetch(`${BASE}data/roadmaps/${path}`, { cache: "no-cache" }).then(r => r.ok ? r.json() : null);
            if (data) rms.push({ ...entry, ...data });
          }
        }

        setExternal(prev => ({ ...prev, certs }));
        setExternalRoadmaps(rms);
      } catch (e) {
        // ignore on failure
      }
    })();
  }, []);

  const ALL_CERTS = useMemo(() => [...BASE_CERTS, ...(external.certs || [])], [external]);

  const ALL_ROADMAPS = useMemo(() => [...ROADMAPS, ...(externalRoadmaps || [])], [externalRoadmaps]);

  const allVendors = useMemo(() => unique(ALL_CERTS.map(c => c.vendor)).sort(), [ALL_CERTS]);
  const allDomains = useMemo(() => unique(ALL_CERTS.flatMap(c => c.domains)).sort(), [ALL_CERTS]);
  const allLevels  = useMemo(() => unique(ALL_CERTS.map(c => c.level)), [ALL_CERTS]);

  // load
  useEffect(() => {
    const s = loadState();
    setFavorites(s.favorites || []);
    setPlan(s.plan || {});
    setPomodoro(s.pomodoro || { running:false, seconds:25*60, mode:"focus" });
    setFcProgress(s.fcProgress || {});
    setQuizState(s.quizState || {});
  }, []);

  useEffect(() => {
    saveState({ favorites, plan, pomodoro, fcProgress, quizState });
  }, [favorites, plan, pomodoro, fcProgress, quizState]);

  // timer
  useEffect(() => {
    if (!pomodoro.running) return;
    const id = setInterval(() => {
      setPomodoro(p => {
        if (p.seconds > 0) return { ...p, seconds: p.seconds - 1 };
        if (p.mode === "focus") return { running:false, seconds: 5*60, mode: "break" };
        return { running:false, seconds: 25*60, mode: "focus" };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [pomodoro.running]);

  const filtered = useMemo(() => {
    return ALL_CERTS.filter(c => (
      (vendor === "all" || c.vendor === vendor) &&
      (domain === "all" || c.domains.includes(domain)) &&
      (level === "all" || c.level === level) &&
      (!q || (c.name.toLowerCase().includes(q.toLowerCase()) || c.skills?.some(s => s.includes(q.toLowerCase()))))
    ));
  }, [q, vendor, domain, level, ALL_CERTS]);

  const toggleFavorite = (id) => setFavorites(f => f.includes(id) ? f.filter(x=>x!==id) : [...f, id]);
  const addToPlan = (id) => setPlan(p => ({ ...p, [id]: p[id] || { targetDate: "", progress: 0, notes: "" } }));
  const removeFromPlan = (id) => setPlan(p => { const n = { ...p }; delete n[id]; return n; });

  const certById = (id) => ALL_CERTS.find(c => c.id === id);
  // Pick a current cert consistently everywhere
const currentCertId = useMemo(
  () => activeCert?.id || Object.keys(plan)[0] || ALL_CERTS[0]?.id,
  [activeCert, plan, ALL_CERTS]
);
const currentCert = useMemo(
  () => (currentCertId ? certById(currentCertId) : null),
  [currentCertId, ALL_CERTS]
);

const didInitActive = useRef(false);
const handleCloseDrawer = useCallback(() => { setActiveCert(null); }, []);

// Keep activeCert initialized once on first load
useEffect(() => {
  if (didInitActive.current) return;
  if (currentCert) { setActiveCert(currentCert); didInitActive.current = true; }
}, [currentCert]);

// ---------------- Flashcards helpers (with debug logging) ----------------
const DEBUG = true;

const getFlashcards = (id) => {
  const cert = certById(id);

  const fromCert     = cert?.flashcards || [];
  const fromExternal = external?.defaults?.flashcards?.[id] || [];
  const fromDefault  = DEFAULT_FLASHCARDS?.[id] || [];

  const cards =
    fromCert.length     ? fromCert :
    fromExternal.length ? fromExternal :
    fromDefault.length  ? fromDefault : [];

  if (DEBUG) {
    console.groupCollapsed(`[Flashcards] resolve -> id="${id}"`);
    console.log("certById(id):", cert);
    console.log("source lengths:", {
      fromCert: fromCert.length,
      fromExternal: fromExternal.length,
      fromDefault: fromDefault.length,
      picked: cards.length,
    });
    if (!cards.length) {
      console.warn(
        "No flashcards found. Check that the cert ID matches one of your sources exactly."
      );
      console.table({
        id,
        vendor: cert?.vendor,
        name: cert?.name,
      });
    }
    console.groupEnd();
  }

  return cards;
};

const nextFlash = (id, know) => {
  const cards = getFlashcards(id);
  if (!cards.length) {
    if (DEBUG) console.warn(`[Flashcards] nextFlash skipped. No cards for id="${id}"`);
    return;
  }
  setFcProgress((fp) => {
    const cur = fp[id] || { index: 0, known: [] };
    const known = know ? Array.from(new Set([...(cur.known || []), cur.index])) : (cur.known || []);
    const next = (cur.index + 1) % cards.length;
    return { ...fp, [id]: { index: next, known } };
  });
};


  // Quiz helpers
  const getQuiz = (id) =>
    certById(id)?.quiz || external.defaults?.quiz?.[id] || DEFAULT_QUIZ[id] || [];

  const answerQuiz = (id, choice) => {
    const items = getQuiz(id);
    setQuizState(qs => {
      const cur = qs[id] || { idx: 0, correct: 0, answers: [] };
      const item = items[cur.idx];
      const correct = cur.correct + (choice === item?.answer ? 1 : 0);
      const answers = [...(cur.answers||[]), { choice, correct: choice === item?.answer }];
      const nextIdx = (cur.idx + 1) % (items.length || 1);
      return { ...qs, [id]: { idx: nextIdx, correct, answers } };
    });
  };

  // Export / Import
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ favorites, plan, pomodoro, fcProgress, quizState }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "it-cert-study-data.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file) => {
    const text = await file.text();
    try {
      const obj = JSON.parse(text);
      setFavorites(obj.favorites || []);
      setPlan(obj.plan || {});
      setPomodoro(obj.pomodoro || { running: false, seconds: 25 * 60, mode: "focus" });
      setFcProgress(obj.fcProgress || {});
      setQuizState(obj.quizState || {});
    } catch (err) {
      console.error(err);
      alert("Invalid JSON file");
    }
  };

  return (
    <div className="min-h-screen text-gray-900" style={{ backgroundColor: BRAND_BG }}>

      <style>{`
        :root.dark body { background-color: #0b0f14; color: #e5e7eb; }
        :root.dark .bg-white { background-color: #0f172a !important; }
        :root.dark .bg-white\/80 { background-color: rgba(15,23,42,.8) !important; }
        :root.dark .bg-gray-50 { background-color: #111827 !important; }
        :root.dark .text-gray-900 { color: #e5e7eb !important; }
        :root.dark .text-gray-700 { color: #cbd5e1 !important; }
        :root.dark .text-gray-600 { color: #94a3b8 !important; }
        :root.dark .text-gray-500 { color: #94a3b8 !important; }
        :root.dark .border-gray-200 { border-color: #334155 !important; }
        :root.dark .border-gray-300 { border-color: #475569 !important; }
        :root.dark .shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.4) !important; }
        :root.dark .card, :root.dark .rounded-2xl { background-color: #0f172a !important; }
        :root.dark .btn-accent { background-color: #1a73e8 !important; border-color: #1a73e8 !important; color: #ffffff !important; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="https://i.imgur.com/WqdkIGU.png" alt="CertWolf Logo" className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: BRAND_DARK }}>CertWolf Study Hub</h1>
              <p className="text-xs text-gray-500">Plan, study, quiz, and track your progress</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept="application/json"
                onChange={e => {
                  const file = e.target.files && e.target.files[0];
                  if (file) importData(file);
                  e.target.value = "";
                }}
              />
              <Button variant="outline"><Upload size={16}/> Import</Button>
            </label>
            <Button variant="outline" onClick={exportData}><Download size={16}/> Export</Button>
            <Button variant="outline" onClick={() => setTab("plan")}><ClipboardList size={16}/> My Plan</Button>
            <Button variant="outline" onClick={() => supabase.auth.signOut()}>
              <X size={16}/> Sign out
            </Button>

            <Button
              variant="outline"
              onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
              title={themeMode === "dark" ? "Switch to light" : "Switch to dark"}
            >
              {themeMode === "dark" ? <Sun size={16}/> : <Moon size={16}/>}
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Sidebar Filters */}
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
                <Select value={vendor} onChange={setVendor} options={[{value:"all", label:"All"}, ...allVendors.map(v=>({value:v,label:v}))]}/>
              </div>
              <div className="mb-3">
                <div className="mb-1 text-xs font-semibold">Domain</div>
                <Select value={domain} onChange={setDomain} options={[{value:"all", label:"All"}, ...allDomains.map(v=>({value:v,label:v}))]}/>
              </div>
              <div className="mb-4">
                <div className="mb-1 text-xs font-semibold">Level</div>
                <Select value={level} onChange={setLevel} options={[{value:"all", label:"All"}, ...allLevels.map(v=>({value:v,label:v}))]}/>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="subtle"
                  onClick={() => { setVendor("all"); setDomain("all"); setLevel("all"); setQ(""); }}
                >
                  <RefreshCw size={16}/> Reset
                </Button>
                <Button variant="outline" onClick={() => setTab("roadmaps")}>
                  <Lightbulb size={16}/> Roadmaps
                </Button>
              </div>
            </Card>

            {/* Pomodoro */}
            <Card className="mt-6 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Timer size={16}/> Pomodoro</div>
              <div className="text-3xl font-bold tabular-nums" style={{ color: BRAND_DARK }}>
                {String(Math.floor(pomodoro.seconds/60)).padStart(2,"0")}:{String(pomodoro.seconds%60).padStart(2,"0")}
              </div>
              <div className="mt-1 text-xs text-gray-500">Mode: {pomodoro.mode}</div>
              <div className="mt-3 flex gap-2">
                {!pomodoro.running ? (
                  <Button onClick={()=>setPomodoro(p=>({...p, running:true}))}><Play size={16}/> Start</Button>
                ) : (
                  <Button variant="outline" onClick={()=>setPomodoro(p=>({...p, running:false}))}><Pause size={16}/> Pause</Button>
                )}
                <Button variant="outline" onClick={()=>setPomodoro({running:false, seconds:25*60, mode:"focus"})}><RotateCcw size={16}/> Reset</Button>
              </div>
            </Card>
          </aside>

          {/* Main Panels */}
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
                            <div className="text-sm text-gray-500">{c.vendor}</div>
                            <h3 className="text-lg font-semibold leading-tight" style={{ color: BRAND_DARK }}>{c.name}</h3>
                          </div>
                          <button onClick={()=>toggleFavorite(c.id)} className="text-gray-600 hover:opacity-90" title={fav ? "Unfavorite" : "Favorite"}>
                            {fav ? <Star size={18} className="fill-yellow-400 text-yellow-400"/> : <StarOff size={18}/>}
                          </button>
                        </div>
                        <div className="mb-2 flex flex-wrap gap-2">
                          <Badge className="border-gray-300 bg-gray-50">{c.level}</Badge>
                          {c.domains.slice(0,2).map(d => <Badge key={d} className="border-gray-300 bg-gray-50">{d}</Badge>)}
                          <Badge className="border-gray-300 bg-gray-50">~{c.estHours} hrs</Badge>
                        </div>
                        <p className="mb-3 line-clamp-3 text-sm text-gray-600">Skills: {c.skills?.join(", ")}</p>
                        <div className="mt-auto flex items-center gap-2">
                          <Button onClick={()=>setActiveCert(c)} size="sm"><FileText size={16}/> Details</Button>
                          {!plan[c.id] ? (
                            <Button variant="outline" size="sm" onClick={()=>addToPlan(c.id)}><FolderPlus size={16}/> Add to Plan</Button>
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

            {/* Roadmaps */}
            {tab === "roadmaps" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {ALL_ROADMAPS.map(r => (
                  <Card key={r.id} className="p-4">
                    <div className="mb-2 text-sm font-semibold" style={{ color: BRAND_DARK }}>{r.title}</div>
                    <ol className="mb-3 list-decimal pl-5 text-sm">
                      {r.items.map(step => (
                        <li key={step} className="mb-1">{step}</li>
                      ))}
                    </ol>
                    <div className="mb-3 text-xs text-gray-600">{r.note}</div>
                    <div className="flex flex-wrap gap-2">
                      {r.items.map(step => {
                        const c = ALL_CERTS.find(x=>x.name===step);
                        return (
                          <Button key={step} size="sm" variant={c && plan[c.id] ? "subtle" : "outline"} onClick={()=> c && addToPlan(c.id)}>
                            <Plus size={14}/> Add {c?.vendor || ""}
                          </Button>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Study Plan */}
            {tab === "plan" && (
              <div className="space-y-4">
                {Object.keys(plan).length === 0 && (
                  <Card className="p-6 text-center text-sm text-gray-600">No items yet. Add a cert from the catalog or a roadmap.</Card>
                )}
                {Object.entries(plan).map(([id, meta]) => {
                  const c = certById(id);
                  if (!c) return null;
                  return (
                    <Card key={id} className="p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-xs text-gray-500">{c.vendor} - {c.level}</div>
                          <div className="text-lg font-semibold" style={{ color: BRAND_DARK }}>{c.name}</div>
                          <div className="mt-1 text-xs text-gray-500">
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
                          <Button variant="outline" onClick={()=>setActiveCert(c)} size="sm"><FileText size={16}/> Details</Button>
                          <Button variant="danger" onClick={()=>removeFromPlan(id)} size="sm"><Trash2 size={16}/> Remove</Button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <div className="mb-1 text-xs font-semibold">Progress</div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="subtle" onClick={()=>setPlan(p=>({...p, [id]:{...p[id], progress: Math.max(0, (p[id].progress||0) - 5)}}))}><Minus size={14}/></Button>
                            <div className="w-full rounded-full bg-gray-200">
                              <div
                                className="h-3 rounded-full"
                                style={{ width: `${meta.progress||0}%`, backgroundColor: BRAND_BLUE }}
                              />
                            </div>
                            <Button size="sm" variant="subtle" onClick={()=>setPlan(p=>({...p, [id]:{...p[id], progress: Math.min(100, (p[id].progress||0) + 5)}}))}><Plus size={14}/></Button>
                            <div className="w-10 text-right text-sm tabular-nums">{meta.progress||0}%</div>
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs font-semibold">Notes</div>
                          <textarea
                            value={meta.notes}
                            onChange={e=>setPlan(p=>({...p, [id]:{...p[id], notes:e.target.value}}))}
                            className="h-24 w-full rounded-xl border p-2 text-sm"
                            placeholder="Key topics, weak spots, next steps"
                          />
                        </div>
                        <div>
                          <div className="mb-1 text-xs font-semibold">Quick Actions</div>
                          <div className="flex flex-wrap gap-2">
                            {!!getFlashcards(id).length && <Button size="sm" variant="outline" onClick={()=>setTab("flashcards")}><NotebookPen size={16}/> Flashcards</Button>}
                            {!!getQuiz(id).length && <Button size="sm" variant="outline" onClick={()=>setTab("quiz")}><HelpCircle size={16}/> Quiz</Button>}
                            <Button size="sm" variant="outline" onClick={()=>window.print()}><FileText size={16}/> Print Plan</Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Flashcards */}
            {tab === "flashcards" && (
              <Card className="p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold">Choose a cert</div>
                  <Select
                    value={activeCert?.id || Object.keys(plan)[0] || ALL_CERTS[0]?.id}
                    onChange={val=>setActiveCert(certById(val))}
                    options={ALL_CERTS.map(c=>({value:c.id,label:c.name}))}
                  />
                </div>
                {activeCert ? (
                  <Flashcards cert={activeCert} getFlashcards={getFlashcards} next={nextFlash} fcProgress={fcProgress[activeCert.id]}/>
                ) : (
                  <div className="text-sm text-gray-600">Add a cert to your plan first.</div>
                )}
              </Card>
            )}

            {/* Quiz */}
{tab === "quiz" && (
  <Card className="p-4">
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="text-sm font-semibold">Choose a cert</div>
      <Select
        value={currentCertId}
        onChange={(val) => setActiveCert(certById(val))}
        options={ALL_CERTS.map((c) => ({ value: c.id, label: c.name }))}
      />
    </div>

    {currentCert ? (
      <Quiz
        cert={currentCert}
        getQuiz={getQuiz}
        quizState={quizState[currentCert.id]}
        onAnswer={(choice) => answerQuiz(currentCert.id, choice)}
      />
    ) : (
      Object.keys(plan).length === 0 && (
        <div className="text-sm text-gray-600">Add a cert to your plan first.</div>
      )
    )}
  </Card>
)}


            {/* Progress */}
            {tab === "progress" && (
              <Card className="p-6">
                <div className="mb-4 text-lg font-semibold" style={{ color: BRAND_DARK }}>Overview</div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Stat label="In Plan" value={Object.keys(plan).length} />
                  <Stat label="Favorites" value={favorites.length} />
                </div>
                <div className="mt-6">
                  <div className="mb-2 text-sm font-semibold">Plan Progress</div>
                  <div className="space-y-3">
                    {Object.entries(plan).map(([id, meta]) => (
                      <div key={id} className="flex items-center gap-3">
                        <div className="w-56 truncate text-sm">{certById(id)?.name}</div>
                        <div className="h-3 w-full rounded-full bg-gray-200">
                          <div
                            className="h-3 rounded-full"
                            style={{ width: `${meta.progress||0}%`, backgroundColor: BRAND_DARK }}
                          />
                        </div>
                        <div className="w-12 text-right text-sm tabular-nums">{meta.progress||0}%</div>
                      </div>
                    ))}
                    {Object.keys(plan).length === 0 && <div className="text-sm text-gray-600">Nothing to show yet.</div>}
                  </div>
                </div>
              </Card>
            )}

            {/* Tools */}
            {tab === "tools" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card className="p-4">
                  <div className="mb-2 text-sm font-semibold" style={{ color: BRAND_DARK }}>Exam Day Checklist</div>
                  <ul className="list-disc pl-5 text-sm">
                    <li>Two forms of ID</li>
                    <li>Confirm test center rules or online proctoring</li>
                    <li>Arrive 30 minutes early or test your camera/mic</li>
                    <li>Water and snack for after the exam</li>
                    <li>Plan a calm warm-up - quick flashcard review</li>
                  </ul>
                </Card>
                <Card className="p-4">
                  <div className="mb-2 text-sm font-semibold" style={{ color: BRAND_DARK }}>Acronym Drill</div>
                  <AcronymDrill />
                </Card>
                <Card className="p-4">
                  <div className="mb-2 text-sm font-semibold" style={{ color: BRAND_DARK }}>Common Ports</div>
                  <PortsDrill />
                </Card>
                <Card className="p-4">
                  <div className="mb-2 text-sm font-semibold" style={{ color: BRAND_DARK }}>Quick Notes</div>
                  <QuickNotes />
                </Card>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Details Drawer */}
      <AnimatePresence>
        {activeCert && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-30 bg-black/30" onClick={handleCloseDrawer}>
            <motion.div initial={{y:50, opacity:0}} animate={{y:0, opacity:1}} exit={{y:50, opacity:0}} transition={{type:"spring", damping:20}} className="absolute inset-x-0 bottom-0 max-h-[80vh] rounded-t-3xl bg-white p-6 shadow-xl" onClick={e=>e.stopPropagation()}>
              <div className="mx-auto max-w-4xl">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-gray-500">{activeCert.vendor} - {activeCert.level}</div>
                    <div className="text-xl font-semibold" style={{ color: BRAND_DARK }}>{activeCert.name}</div>
                  </div>
                  <Button variant="outline" onClick={handleCloseDrawer}><X size={16}/> Close</Button>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <div className="mb-2 text-sm font-semibold" style={{ color: BRAND_DARK }}>Skills</div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {activeCert.skills?.map(s => <Badge key={s} className="border-gray-300 bg-gray-50">{s}</Badge>)}
                    </div>
                    {!!activeCert.resources?.length && (
                      <div>
                        <div className="mb-2 text-sm font-semibold" style={{ color: BRAND_DARK }}>Recommended Resources</div>
                        <ul className="space-y-2 text-sm">
                          {activeCert.resources.map(r => (
                            <li key={r.url} className="flex items-center justify-between gap-2">
                              <span>{r.title} <span className="text-xs text-gray-500">({r.type})</span></span>
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 hover:underline"
                                style={{ color: BRAND_BLUE }}
                              >
                                Open <ExternalLink size={14}/>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-semibold" style={{ color: BRAND_DARK }}>At a glance</div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>Domain: {activeCert.domains.join(", ")}</li>
                      <li>Level: {activeCert.level}</li>
                      <li>Time: ~{activeCert.estHours} hours</li>
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => addToPlan(activeCert.id)}>
                        <FolderPlus size={16} /> Add to Plan
                      </Button>
                      {!!getFlashcards(activeCert.id).length && (
                        <Button size="sm" variant="outline" onClick={() => setTab("flashcards")}>
                          <NotebookPen size={16} /> Flashcards
                        </Button>
                      )}
                      {!!getQuiz(activeCert.id).length && (
                        <Button size="sm" variant="outline" onClick={() => setTab("quiz")}>
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
      <footer className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-gray-500">
        Built for focused study. Save your data with Export, and load it anywhere with Import.
      </footer>
    </div>
  );
}

/** =========================================================
 * Helper Components
 * ======================================================= */
function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold" style={{ color: BRAND_DARK }}>{value}</div>
    </div>
  );
}

function Flashcards({ cert, getFlashcards, next, fcProgress }) {
  const cards = getFlashcards(cert.id);
  const [show, setShow] = React.useState(false);
  const index = fcProgress?.index ?? 0;

  if (!cards.length) {
    return <div className="text-sm text-gray-600">No flashcards yet for this cert.</div>;
  }

  const card = cards[index];

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-gray-600">
        {cert.name} • Card {index + 1} of {cards.length}
      </div>
      <Card className="p-6">
        <div className="mb-2 text-xs font-semibold text-gray-500">Question</div>
        <div className="text-lg font-semibold" style={{ color: BRAND_DARK }}>{card.q}</div>

        {show && (
          <div className="mt-4 rounded-xl border bg-gray-50 p-4 text-sm">
            <div className="mb-1 text-xs font-semibold text-gray-500">Answer</div>
            <div>{card.a}</div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {!show ? (
            <Button onClick={() => setShow(true)}>
              <EyeOpenIcon /> Reveal
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setShow(false)}>
              <EyeClosedIcon /> Hide
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setShow(false);
              next(cert.id, true);
            }}
          >
            <CheckCircle2 size={16} /> I knew it
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShow(false);
              next(cert.id, false);
            }}
          >
            <ArrowRight size={16} /> Next
          </Button>
        </div>
      </Card>
      <div className="text-xs text-gray-500">
        Known: {(fcProgress?.known?.length || 0)}/{cards.length}
      </div>
    </div>
  );
}

function Quiz({ cert, getQuiz, quizState = {}, onAnswer }) {
  const items = getQuiz(cert.id);
  if (!items.length) {
    return <div className="text-sm text-gray-600">No quiz for this cert yet.</div>;
  }

  const idx = quizState.idx || 0;
  const item = items[idx];
  const last = (quizState.answers || [])[(quizState.answers || []).length - 1];
  const lastItem = (quizState.answers || []).length
    ? items[(idx - 1 + items.length) % items.length]
    : null;

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        {cert.name} • Question {idx + 1} of {items.length}
      </div>
      <Card className="p-6">
        <div className="mb-3 text-base font-semibold" style={{ color: BRAND_DARK }}>
          {item.q}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {item.options.map((opt, i) => (
            <Button key={i} variant="outline" onClick={() => onAnswer(i)}>
              {opt}
            </Button>
          ))}
        </div>

        {last && lastItem && (
          <div
            className={
              "mt-4 rounded-xl border p-3 text-sm " +
              (last.correct ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")
            }
          >
            <div className="mb-1 text-xs font-semibold text-gray-600">Explanation</div>
            <div>{lastItem.exp}</div>
          </div>
        )}
      </Card>
      <div className="text-xs text-gray-500">Correct answers: {quizState.correct || 0}</div>
    </div>
  );
}

function AcronymDrill() {
  const ITEMS = React.useMemo(
    () => [
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
    ],
    []
  );
  const [i, setI] = React.useState(0);
  const [show, setShow] = React.useState(false);
  const item = ITEMS[i % ITEMS.length];

  return (
    <div>
      <div className="text-lg font-semibold" style={{ color: BRAND_DARK }}>{item[0]}</div>
      {show && <div className="mt-2 rounded-xl border bg-gray-50 p-3 text-sm">{item[1]}</div>}
      <div className="mt-3 flex gap-2">
        {!show ? (
          <Button onClick={() => setShow(true)}>
            <EyeOpenIcon /> Reveal
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setShow(false)}>
            <EyeClosedIcon /> Hide
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => {
            setI(i + 1);
            setShow(false);
          }}
        >
          <ArrowRight size={16} /> Next
        </Button>
      </div>
    </div>
  );
}

function PortsDrill() {
  const PAIRS = React.useMemo(
    () => [
      ["HTTP", "80/TCP"],
      ["HTTPS", "443/TCP"],
      ["SSH", "22/TCP"],
      ["RDP", "3389/TCP"],
      ["DNS", "53/UDP"],
      ["DNS TCP", "53/TCP"],
      ["SMTP", "25/TCP"],
      ["IMAP", "143/TCP"],
      ["IMAPS", "993/TCP"],
      ["POP3", "110/TCP"],
      ["POP3S", "995/TCP"],
      ["FTP", "21/TCP"],
      ["SFTP", "22/TCP"],
      ["SNMP", "161/UDP"],
    ],
    []
  );

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
      <div className="mb-2 text-sm text-gray-600">Match the service to the correct port</div>
      <div className="text-lg font-semibold" style={{ color: BRAND_DARK }}>{q[0]}</div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((o, i) => (
          <Button
            key={i}
            variant="outline"
            onClick={() => {
              const ok = o === q[1];
              setFeedback(ok ? "correct" : "wrong");
              setTimeout(() => {
                setIdx(idx + 1);
                setFeedback(null);
              }, 600);
            }}
          >
            {o}
          </Button>
        ))}
      </div>
      {feedback && (
        <div
          className={
            "mt-3 rounded-xl border p-2 text-xs " +
            (feedback === "correct" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")
          }
        >
          {feedback === "correct" ? "Correct" : "Try again next"}
        </div>
      )}
    </div>
  );
}

function QuickNotes() {
  const KEY = "it-cert-hub/quick-notes";
  const [text, setText] = React.useState("");

  React.useEffect(() => {
    try {
      setText(localStorage.getItem(KEY) || "");
    } catch {}
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(KEY, text);
    } catch {}
  }, [text]);

  const saveTxt = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-48 w-full rounded-xl border p-2 text-sm"
        placeholder="Jot quick notes here..."
      />
      <div className="mt-2">
        <Button variant="outline" onClick={saveTxt}>
          <Download size={16} /> Export Notes
        </Button>
      </div>
    </div>
  );
}

// Inline icons so no extra deps
function EyeOpenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function EyeClosedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M2 12s3.5-6 10-6c2.2 0 4.1.6 5.6 1.4M22 12s-3.5 6-10 6c-2.2 0-4.1-.6-5.6-1.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
