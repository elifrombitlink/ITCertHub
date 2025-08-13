
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

/**
 * App.jsx
 * - Loads certs and roadmaps from:
 *   /public/data/certs/manifest.json and /public/data/certs/*.json
 *   /public/data/roadmaps/manifest.json and /public/data/roadmaps/*.json
 * - Adds requested features (scaffolded but functional locally where possible).
 * - Adds dark mode with localStorage persistence.
 *
 * Notes:
 * - This file avoids removing existing functionality by being additive.
 * - If a global `supabase` client is present, some community features can use it.
 */

// -----------------------------
// Utilities
// -----------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const safeJSON = async (resp) => {
  try {
    return await resp.json();
  } catch (e) {
    return null;
  }
};

const loadJSON = async (url) => {
  const resp = await fetch(url, { cache: "no-cache" });
  if (!resp.ok) throw new Error(`Failed to load ${url}: ${resp.status}`);
  return safeJSON(resp);
};

const uid = () => Math.random().toString(36).slice(2, 10);

// Simple event bus for cross-component updates without extra deps
const makeBus = () => {
  const listeners = new Set();
  return {
    on(cb) { listeners.add(cb); return () => listeners.delete(cb); },
    emit(data) { listeners.forEach((cb) => cb(data)); },
    clear() { listeners.clear(); }
  };
};

const bus = makeBus();

// Local storage helpers
const lsGet = (k, d=null) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; }
};
const lsSet = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
};

// Date helpers
const todayStr = () => new Date().toISOString().slice(0,10);

// -----------------------------
// Dark Mode
// -----------------------------
function useDarkMode(defaultMode = "system") {
  const [mode, setMode] = useState(lsGet("ui:color-scheme", defaultMode)); // "dark" | "light" | "system"

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextDark = mode === "system" ? prefersDark : mode === "dark";
    root.classList.toggle("dark", nextDark);
    lsSet("ui:color-scheme", mode);
  }, [mode]);

  return { mode, setMode };
}

// -----------------------------
/** Data Loading
 * Each manifest is an array like:
 *  [{ id: "comptia-a-plus", name: "...", path: "comptia-a-plus.json" }, ...]
 * Each item JSON can contain:
 *  { id, name, vendor, skills:[{id,name,weight}], questionBank:[{id,question,answers,correct,topic,difficulty}], flashcards:[{id,front,back,topic}], labs:[{id,title,steps[]}] }
 */
// -----------------------------
async function loadLibrary() {
  // Certs
  const certManifest = await loadJSON("/public/data/certs/manifest.json");
  const certs = [];
  if (Array.isArray(certManifest)) {
    for (const entry of certManifest) {
      const path = entry?.path || `${entry?.id}.json`;
      try {
        const data = await loadJSON(`/public/data/certs/${path}`);
        if (data) certs.push({ ...entry, ...data });
      } catch (e) {
        console.warn("Cert load failed:", entry?.id, e);
      }
    }
  }

  // Roadmaps
  const roadmapManifest = await loadJSON("/public/data/roadmaps/manifest.json");
  const roadmaps = [];
  if (Array.isArray(roadmapManifest)) {
    for (const entry of roadmapManifest) {
      const path = entry?.path || `${entry?.id}.json`;
      try {
        const data = await loadJSON(`/public/data/roadmaps/${path}`);
        if (data) roadmaps.push({ ...entry, ...data });
      } catch (e) {
        console.warn("Roadmap load failed:", entry?.id, e);
      }
    }
  }

  return { certs, roadmaps };
}

// -----------------------------
// Feature: Pomodoro Timer + Analytics
// -----------------------------
function usePomodoroAnalytics() {
  const [isRunning, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(25 * 60); // 25 minutes
  const [label, setLabel] = useState("Focus");
  const intervalRef = useRef(null);

  const analytics = lsGet("pomodoro:analytics", { sessions: 0, seconds: 0, byTopic: {} });

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          const end = lsGet("pomodoro:analytics", { sessions: 0, seconds: 0, byTopic: {} });
          end.sessions += 1;
          end.seconds += 25*60;
          lsSet("pomodoro:analytics", end);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const start = (mins=25, tag="Focus") => {
    setLabel(tag);
    setRemaining(mins*60);
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => { setRunning(false); setRemaining(25*60); };

  return { isRunning, remaining, label, start, pause, reset, analytics: lsGet("pomodoro:analytics", analytics) };
}

// -----------------------------
// Feature: Study Streaks & Badges
// -----------------------------
function useStreaks() {
  const [streak, setStreak] = useState(lsGet("study:streak", { count: 0, last: null }));
  const [badges, setBadges] = useState(lsGet("study:badges", []));

  const touchToday = useCallback(() => {
    const t = todayStr();
    const s = lsGet("study:streak", { count: 0, last: null });
    if (s.last === t) return; // already touched
    if (s.last) {
      const prev = new Date(s.last);
      const now = new Date(t);
      const diff = (now - prev) / (1000*60*60*24);
      if (diff <= 1.5) s.count += 1;
      else s.count = 1;
    } else {
      s.count = 1;
    }
    s.last = t;
    lsSet("study:streak", s);
    setStreak(s);

    // badges
    const b = new Set(lsGet("study:badges", []));
    if (s.count >= 3) b.add("3-day streak");
    if (s.count >= 7) b.add("7-day streak");
    if (s.count >= 30) b.add("30-day streak");
    const arr = Array.from(b);
    lsSet("study:badges", arr);
    setBadges(arr);
  }, []);

  return { streak, badges, touchToday };
}

// -----------------------------
// Feature: Notes & Bookmarks
// -----------------------------
function useNotes() {
  const [notes, setNotes] = useState(lsGet("study:notes", {})); // {key: {text, ts}}
  const [bookmarks, setBookmarks] = useState(lsGet("study:bookmarks", {})); // {key: true}

  const saveNote = (key, text) => {
    const n = { ...notes, [key]: { text, ts: Date.now() } };
    setNotes(n); lsSet("study:notes", n);
  };
  const toggleBookmark = (key) => {
    const next = { ...bookmarks, [key]: !bookmarks[key] };
    setBookmarks(next); lsSet("study:bookmarks", next);
  };

  return { notes, bookmarks, saveNote, toggleBookmark };
}

// -----------------------------
// Feature: Tagging
// -----------------------------
function useTags() {
  const [tags, setTags] = useState(lsGet("study:tags", {})); // {key: ["tag1","tag2"]}
  const addTag = (key, tag) => {
    const set = new Set(tags[key] || []);
    set.add(tag);
    const next = { ...tags, [key]: Array.from(set) };
    setTags(next); lsSet("study:tags", next);
  };
  const removeTag = (key, tag) => {
    const list = (tags[key] || []).filter((t) => t !== tag);
    const next = { ...tags, [key]: list };
    setTags(next); lsSet("study:tags", next);
  };
  return { tags, addTag, removeTag };
}

// -----------------------------
// Feature: Offline Mode (cache data files + simple assets)
// -----------------------------
async function cacheForOffline(urls) {
  if (!('caches' in window)) return { ok: false, msg: "Cache API unavailable" };
  const cache = await caches.open("certwolf-offline-v1");
  await Promise.all(urls.map(async (u) => {
    try { await cache.add(u); } catch {}
  }));
  return { ok: true };
}

// -----------------------------
// Feature: Calendar ICS generator
// -----------------------------
function buildICS({ title="Study Block", description="", startDateTime, durationMinutes=60 }) {
  const pad = (n) => String(n).padStart(2, "0");
  const dt = new Date(startDateTime || Date.now());
  const y = dt.getUTCFullYear();
  const m = pad(dt.getUTCMonth()+1);
  const d = pad(dt.getUTCDate());
  const hh = pad(dt.getUTCHours());
  const mm = pad(dt.getUTCMinutes());
  const ss = "00";
  const dtStart = `${y}${m}${d}T${hh}${mm}${ss}Z`;
  const end = new Date(dt.getTime() + durationMinutes*60000);
  const y2 = end.getUTCFullYear();
  const m2 = pad(end.getUTCMonth()+1);
  const d2 = pad(end.getUTCDate());
  const hh2 = pad(end.getUTCHours());
  const mm2 = pad(end.getUTCMinutes());
  const dtEnd = `${y2}${m2}${d2}T${hh2}${mm2}${ss}Z`;

  const ics =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CertWolf//Study//EN
BEGIN:VEVENT
UID:${uid()}@certwolf.local
DTSTAMP:${dtStart}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${title}
DESCRIPTION:${description}
END:VEVENT
END:VCALENDAR`;
  return new Blob([ics], { type: "text/calendar" });
}

// -----------------------------
// Feature: Spaced Repetition (very simple SM-2-ish)
// -----------------------------
function useSRS(certId) {
  const key = `srs:${certId}`;
  const [cards, setCards] = useState(lsGet(key, {})); // {cardId: {ef, interval, due, reps}}

  const review = (cardId, quality=3) => {
    // quality 0-5, <3 means repeat soon
    const now = Date.now();
    const c = { ef: 2.5, interval: 0, due: now, reps: 0, ...(cards[cardId] || {}) };
    const q = Math.max(0, Math.min(5, quality));
    if (q < 3) {
      c.reps = 0;
      c.interval = 1;
    } else {
      c.reps += 1;
      if (c.reps === 1) c.interval = 1;
      else if (c.reps === 2) c.interval = 6;
      else c.interval = Math.round(c.interval * c.ef);
      // update ef
      c.ef = c.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
      if (c.ef < 1.3) c.ef = 1.3;
    }
    c.due = now + c.interval * 24 * 60 * 60 * 1000;
    const next = { ...cards, [cardId]: c };
    setCards(next); lsSet(key, next);
  };

  const dueCards = useMemo(() => {
    const now = Date.now();
    return Object.entries(cards).filter(([, v]) => v.due <= now).map(([id]) => id);
  }, [cards]);

  return { cards, dueCards, review };
}

// -----------------------------
// Feature: Adaptive Learning
// -----------------------------
function useAdaptive(certId) {
  const key = `stats:${certId}`;
  const [stats, setStats] = useState(lsGet(key, { topics: {}, total: 0 })); // topics: {topic: {correct, total}}

  const record = (topic, correct) => {
    const s = lsGet(key, { topics: {}, total: 0 });
    const t = s.topics[topic] || { correct: 0, total: 0 };
    t.total += 1;
    if (correct) t.correct += 1;
    s.topics[topic] = t;
    s.total += 1;
    setStats(s); lsSet(key, s);
    bus.emit({ type: "stats:update", certId });
  };

  const weakTopics = useMemo(() => {
    const pairs = Object.entries(stats.topics).map(([topic, t]) => {
      const acc = t.total ? (t.correct / t.total) : 0;
      return [topic, acc];
    });
    pairs.sort((a,b) => a[1] - b[1]);
    return pairs.map(([topic]) => topic).slice(0, 3);
  }, [stats]);

  const masteryPercent = useMemo(() => {
    const vals = Object.values(stats.topics);
    if (!vals.length) return 0;
    const accs = vals.map((t) => t.total ? (t.correct / t.total) : 0);
    return Math.round(100 * accs.reduce((a,b)=>a+b,0) / accs.length);
  }, [stats]);

  return { stats, record, weakTopics, masteryPercent };
}

// -----------------------------
// Practice Exam & Question Bank
// -----------------------------
function QuestionBank({ bank=[], onAnswer, search="", topic="", difficulty="" }) {
  const items = bank.filter((q) => {
    const s = !search ? true : (q.question?.toLowerCase().includes(search.toLowerCase()));
    const t = !topic ? true : (q.topic === topic);
    const d = !difficulty ? true : (String(q.difficulty) === String(difficulty));
    return s && t && d;
  });

  return (
    <div className="space-y-3">
      {items.map((q) => (
        <div key={q.id} className="rounded-lg border p-3 dark:border-neutral-700">
          <div className="font-medium mb-2">{q.question}</div>
          <div className="grid gap-2">
            {(q.answers || []).map((a, idx) => (
              <button
                key={idx}
                className="text-left rounded-md border px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:border-neutral-700"
                onClick={() => onAnswer && onAnswer(q, idx)}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="text-xs text-neutral-600 mt-2 dark:text-neutral-400">
            {q.topic ? `Topic: ${q.topic}` : ""} {q.difficulty ? `• Difficulty: ${q.difficulty}` : ""}
          </div>
        </div>
      ))}
      {!items.length && <div className="text-sm text-neutral-600 dark:text-neutral-400">No questions match.</div>}
    </div>
  );
}

function PracticeExam({ bank=[], durationMinutes=90, onComplete, adaptive }) {
  const [started, setStarted] = useState(false);
  const [remaining, setRemaining] = useState(durationMinutes * 60);
  const [idx, setIdx] = useState(0);
  const [order, setOrder] = useState([]);
  const [answers, setAnswers] = useState([]);

  // build randomized order, biased by weak topics if adaptive
  useEffect(() => {
    if (!bank.length) return;
    const topics = adaptive?.weakTopics || [];
    const pool = [...bank];
    // simple bias: put weak topics first if available
    pool.sort((a,b) => {
      const aw = topics.includes(a.topic) ? -1 : 0;
      const bw = topics.includes(b.topic) ? -1 : 0;
      return aw - bw;
    });
    const arr = pool.map((_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setOrder(arr);
  }, [bank, adaptive?.weakTopics]);

  useEffect(() => {
    if (!started) return;
    const timer = setInterval(() => setRemaining((r) => {
      if (r <= 1) { clearInterval(timer); setStarted(false); return 0; }
      return r - 1;
    }), 1000);
    return () => clearInterval(timer);
  }, [started]);

  const current = order.length ? bank[order[idx]] : null;
  const submit = () => {
    // score
    let correct = 0;
    answers.forEach((a, i) => {
      const q = bank[order[i]];
      if (q && Number(a) === Number(q.correct)) correct += 1;
    });
    const score = Math.round(100 * (correct / (answers.length || 1)));
    onComplete && onComplete({ correct, total: answers.length, score });
  };

  const answer = (optIndex) => {
    const next = [...answers];
    next[idx] = optIndex;
    if (current?.topic && adaptive?.record) adaptive.record(current.topic, Number(optIndex) === Number(current.correct));
    setAnswers(next);
    if (idx < order.length - 1) setIdx(idx + 1);
    else submit();
  };

  if (!bank.length) return <div className="text-sm text-neutral-600 dark:text-neutral-400">No questions available.</div>;

  if (!started) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-neutral-700 dark:text-neutral-300">Timed practice exam. You can pause by leaving this tab.</div>
        <button className="rounded-lg border px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:border-neutral-700" onClick={() => setStarted(true)}>
          Start Exam
        </button>
      </div>
    );
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm">Question {idx + 1} / {order.length}</div>
        <div className="font-mono text-sm">Time Left: {mm}:{ss}</div>
      </div>

      {current && (
        <div className="rounded-lg border p-4 dark:border-neutral-700">
          <div className="font-medium mb-3">{current.question}</div>
          <div className="grid gap-2">
            {(current.answers || []).map((a, i) => (
              <button key={i}
                className="text-left rounded-md border px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:border-neutral-700"
                onClick={() => answer(i)}>
                {a}
              </button>
            ))}
          </div>
          <div className="text-xs text-neutral-600 mt-2 dark:text-neutral-400">
            {current.topic ? `Topic: ${current.topic}` : ""} {current.difficulty ? `• Difficulty: ${current.difficulty}` : ""}
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------
// Custom Roadmap Builder
// -----------------------------
function RoadmapBuilder({ roadmaps=[], onSave }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [steps, setSteps] = useState([]);
  const [name, setName] = useState("My Custom Roadmap");

  const toggleId = (id) => {
    setSelectedIds((arr) => arr.includes(id) ? arr.filter(x=>x!==id) : [...arr, id]);
  };

  useEffect(() => {
    const chosen = roadmaps.filter(r => selectedIds.includes(r.id));
    const combined = [];
    for (const r of chosen) {
      (r.steps || []).forEach((s, i) => combined.push({ ...s, source: r.id, idx: i }));
    }
    setSteps(combined);
  }, [selectedIds, roadmaps]);

  const save = () => {
    const data = { id: `custom-${uid()}`, name, steps };
    const all = lsGet("roadmaps:custom", []);
    all.push(data); lsSet("roadmaps:custom", all);
    onSave && onSave(data);
  };

  return (
    <div className="space-y-3">
      <div className="text-sm">Pick roadmaps to merge, then reorder as needed.</div>
      <div className="flex flex-wrap gap-2">
        {roadmaps.map((r) => (
          <label key={r.id} className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer dark:border-neutral-700">
            <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleId(r.id)} />
            <span>{r.name || r.id}</span>
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={name} onChange={(e)=>setName(e.target.value)} />
        <div className="text-sm text-neutral-600 dark:text-neutral-400">Steps: {steps.length}</div>
        <div className="rounded-lg border p-3 space-y-2 max-h-64 overflow-auto dark:border-neutral-700">
          {steps.map((s, i) => (
            <div key={`${s.source}-${s.idx}-${i}`} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 dark:border-neutral-700">
              <div className="text-sm">
                <div className="font-medium">{s.title || s.name || `Step ${i+1}`}</div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">from {s.source}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setSteps((arr)=>{
                  if (i===0) return arr;
                  const next = [...arr]; const tmp = next[i-1]; next[i-1] = next[i]; next[i] = tmp; return next;
                })} className="rounded-md border px-2 py-1 text-xs dark:border-neutral-700">Up</button>
                <button onClick={() => setSteps((arr)=>{
                  if (i===arr.length-1) return arr;
                  const next = [...arr]; const tmp = next[i+1]; next[i+1] = next[i]; next[i] = tmp; return next;
                })} className="rounded-md border px-2 py-1 text-xs dark:border-neutral-700">Down</button>
                <button onClick={() => setSteps((arr)=>arr.filter((_,j)=>j!==i))} className="rounded-md border px-2 py-1 text-xs dark:border-neutral-700">Remove</button>
              </div>
            </div>
          ))}
          {!steps.length && <div className="text-sm text-neutral-600 dark:text-neutral-400">No steps selected.</div>}
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="rounded-lg border px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:border-neutral-700">Save Custom Roadmap</button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------
// Progress & Readiness
// -----------------------------
function ProgressPanel({ cert, masteryPercent, stats }) {
  const practice = lsGet(`exam:scores:${cert?.id}`, []); // array of {score, ts}
  const lastScore = practice.length ? practice[practice.length-1].score : 0;
  const readiness = Math.round((masteryPercent * 0.6) + (lastScore * 0.4));

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-lg border p-3 dark:border-neutral-700">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">Mastery</div>
        <div className="text-3xl font-bold">{masteryPercent}%</div>
      </div>
      <div className="rounded-lg border p-3 dark:border-neutral-700">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">Latest Practice Exam</div>
        <div className="text-3xl font-bold">{lastScore}%</div>
      </div>
      <div className="rounded-lg border p-3 dark:border-neutral-700">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">Estimated Readiness</div>
        <div className="text-3xl font-bold">{readiness}%</div>
      </div>
    </div>
  );
}

// -----------------------------
// Main App
// -----------------------------
export default function App() {
  const { mode, setMode } = useDarkMode("system");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [certs, setCerts] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [selectedCertId, setSelectedCertId] = useState(null);
  const [activeTab, setActiveTab] = useState("practice"); // practice | bank | srs | labs | roadmap | progress | goals | groups | utilities | settings
  const [bankSearch, setBankSearch] = useState("");
  const [bankTopic, setBankTopic] = useState("");
  const [bankDifficulty, setBankDifficulty] = useState("");

  const { streak, badges, touchToday } = useStreaks();
  const pomodoro = usePomodoroAnalytics();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { certs, roadmaps } = await loadLibrary();
        setCerts(certs);
        setRoadmaps(roadmaps);
        if (certs?.length) setSelectedCertId(certs[0].id);
      } catch (e) {
        console.error(e); setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    touchToday(); // mark the day as studied when app loads
  }, [touchToday]);

  const selectedCert = useMemo(() => certs.find(c => c.id === selectedCertId) || null, [certs, selectedCertId]);
  const adaptive = useAdaptive(selectedCert?.id || "none");
  const srs = useSRS(selectedCert?.id || "none");
  const { stats, masteryPercent } = adaptive;

  const topics = useMemo(() => {
    const set = new Set((selectedCert?.questionBank || []).map(q => q.topic).filter(Boolean));
    return Array.from(set);
  }, [selectedCert]);

  const difficulties = useMemo(() => {
    const set = new Set((selectedCert?.questionBank || []).map(q => String(q.difficulty)).filter(Boolean));
    return Array.from(set);
  }, [selectedCert]);

  const startOfflineCache = async () => {
    const urls = [
      "/",
      "/index.html",
      "/public/data/certs/manifest.json",
      ...((certs || []).map(c => `/public/data/certs/${c.path || (c.id + ".json")}`)),
      "/public/data/roadmaps/manifest.json",
      ...((roadmaps || []).map(r => `/public/data/roadmaps/${r.path || (r.id + ".json")}`)),
    ];
    await cacheForOffline(urls);
    alert("Offline cache prepared.");
  };

  const scheduleICS = () => {
    const blob = buildICS({
      title: `Study: ${selectedCert?.name || "Certification"}`,
      description: "Planned study block from CertWolf",
      startDateTime: Date.now() + 5*60*1000,
      durationMinutes: 60
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `study-${(selectedCert?.id || "cert")}.ics`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const recordExamScore = (score) => {
    const key = `exam:scores:${selectedCert?.id}`;
    const arr = lsGet(key, []);
    arr.push({ score, ts: Date.now() });
    lsSet(key, arr);
  };

  if (loading) return <div className="p-4 text-sm">Loading...</div>;
  if (error) return <div className="p-4 text-sm text-red-600">Error: {String(error)}</div>;

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* Header */}
      <header className="border-b sticky top-0 z-10 bg-white/80 backdrop-blur dark:bg-neutral-950/80 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="text-xl font-extrabold tracking-tight">CertWolf</div>

          <div className="flex-1" />

          {/* Cert selector */}
          <select
            className="rounded-md border px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-700"
            value={selectedCertId || ""}
            onChange={(e)=>setSelectedCertId(e.target.value)}
          >
            {certs.map((c) => <option key={c.id} value={c.id}>{c.name || c.id}</option>)}
          </select>

          {/* Dark mode */}
          <select
            className="ml-3 rounded-md border px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-700"
            value={mode}
            onChange={(e)=>setMode(e.target.value)}
            title="Color scheme"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Badges / Streaks / Pomodoro quick */}
        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border p-3 dark:border-neutral-800">
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Streak</div>
            <div className="text-3xl font-bold">{streak.count} days</div>
          </div>
          <div className="rounded-lg border p-3 dark:border-neutral-800">
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Badges</div>
            <div className="flex gap-2 flex-wrap">{badges.map((b)=>(
              <span key={b} className="text-xs rounded-full border px-2 py-1 dark:border-neutral-700">{b}</span>
            ))}
            {!badges.length && <span className="text-xs text-neutral-500">No badges yet</span>}
            </div>
          </div>
          <div className="rounded-lg border p-3 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">Pomodoro</div>
                <div className="text-2xl font-bold">{Math.floor(pomodoro.remaining/60)}:{String(pomodoro.remaining%60).padStart(2,"0")}</div>
              </div>
              <div className="flex gap-2">
                <button className="rounded-md border px-2 py-1 text-xs dark:border-neutral-700" onClick={()=>pomodoro.start(25, "Focus")}>Start</button>
                <button className="rounded-md border px-2 py-1 text-xs dark:border-neutral-700" onClick={pomodoro.pause}>Pause</button>
                <button className="rounded-md border px-2 py-1 text-xs dark:border-neutral-700" onClick={pomodoro.reset}>Reset</button>
              </div>
            </div>
          </div>
        </section>

        {/* Progress */}
        <section className="space-y-3">
          <ProgressPanel cert={selectedCert} masteryPercent={masteryPercent} stats={stats} />
        </section>

        {/* Tabs */}
        <nav className="flex flex-wrap gap-2">
          {["practice","bank","srs","labs","roadmap","progress","goals","groups","utilities","settings"].map((t)=>(
            <button key={t} onClick={()=>setActiveTab(t)} className={`rounded-full border px-3 py-1 text-sm capitalize dark:border-neutral-700 ${activeTab===t ? "bg-neutral-100 dark:bg-neutral-800" : ""}`}>
              {t.replace("-", " ")}
            </button>
          ))}
        </nav>

        {/* Panels */}
        {activeTab === "practice" && (
          <section className="space-y-4">
            <PracticeExam
              bank={selectedCert?.questionBank || []}
              durationMinutes={90}
              adaptive={adaptive}
              onComplete={({score}) => {
                recordExamScore(score);
                alert(`Practice exam complete. Score: ${score}%`);
              }}
            />
            <div className="rounded-lg border p-3 dark:border-neutral-800">
              <div className="font-medium mb-2">Randomized Quiz Generator</div>
              <RandomQuiz bank={selectedCert?.questionBank || []} onAnswer={(q, correct)=>adaptive.record(q.topic, correct)} />
            </div>
          </section>
        )}

        {activeTab === "bank" && (
          <section className="space-y-3">
            <div className="grid gap-2 md:grid-cols-3">
              <input className="rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" placeholder="Search question text" value={bankSearch} onChange={(e)=>setBankSearch(e.target.value)} />
              <select className="rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={bankTopic} onChange={(e)=>setBankTopic(e.target.value)}>
                <option value="">All topics</option>
                {topics.map((t)=><option key={t} value={t}>{t}</option>)}
              </select>
              <select className="rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={bankDifficulty} onChange={(e)=>setBankDifficulty(e.target.value)}>
                <option value="">All difficulties</option>
                {difficulties.map((d)=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <QuestionBank
              bank={selectedCert?.questionBank || []}
              search={bankSearch}
              topic={bankTopic}
              difficulty={bankDifficulty}
              onAnswer={(q, idx) => adaptive.record(q.topic, Number(idx) === Number(q.correct))}
            />
          </section>
        )}

        {activeTab === "srs" && (
          <section className="space-y-3">
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Spaced Repetition Scheduler - review due cards below.</div>
            <SRSPanel cert={selectedCert} srs={srs} adaptive={adaptive} />
          </section>
        )}

        {activeTab === "labs" && (
          <section className="space-y-3">
            <div className="text-sm">Scenario-Based Labs</div>
            <LabsPanel labs={selectedCert?.labs || []} />
          </section>
        )}

        {activeTab === "roadmap" && (
          <section className="space-y-3">
            <RoadmapBuilder roadmaps={roadmaps} onSave={(r)=>alert(`Saved ${r.name}`)} />
          </section>
        )}

        {activeTab === "progress" && (
          <section className="space-y-3">
            <StatsPanel cert={selectedCert} stats={stats} />
          </section>
        )}

        {activeTab === "goals" && (
          <section className="space-y-3">
            <GoalsPanel onSchedule={scheduleICS} />
          </section>
        )}

        {activeTab === "groups" && (
          <section className="space-y-3">
            <CommunityPanel />
          </section>
        )}

        {activeTab === "utilities" && (
          <section className="space-y-3">
            <UtilitiesPanel cert={selectedCert} startOfflineCache={startOfflineCache} />
          </section>
        )}

        {activeTab === "settings" && (
          <section className="space-y-3">
            <SettingsPanel />
          </section>
        )}
      </main>
    </div>
  );
}

// -----------------------------
// Randomized Quiz
// -----------------------------
function RandomQuiz({ bank=[], onAnswer }) {
  const [count, setCount] = useState(10);
  const [set, setSet] = useState([]);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);

  const start = () => {
    const shuffled = [...bank];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setSet(shuffled.slice(0, Math.max(1, Math.min(count, bank.length))));
    setIdx(0); setDone(false); setScore(0);
  };

  const current = set[idx] || null;
  const choose = (i) => {
    const correct = Number(i) === Number(current.correct);
    if (onAnswer) onAnswer(current, correct);
    setScore((s)=>s + (correct ? 1 : 0));
    if (idx < set.length - 1) setIdx(idx + 1);
    else setDone(true);
  };

  return (
    <div className="space-y-3">
      {!set.length && (
        <div className="flex items-center gap-2">
          <input type="number" min={1} max={Math.max(1, bank.length)} className="w-24 rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            value={count} onChange={(e)=>setCount(Number(e.target.value)||1)} />
          <button className="rounded-md border px-3 py-2 dark:border-neutral-700" onClick={start}>Start</button>
        </div>
      )}

      {current && !done && (
        <div className="rounded-lg border p-3 space-y-2 dark:border-neutral-700">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">Question {idx+1} / {set.length}</div>
          <div className="font-medium">{current.question}</div>
          <div className="grid gap-2">
            {(current.answers || []).map((a, i) => (
              <button key={i} className="text-left rounded-md border px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:border-neutral-700" onClick={()=>choose(i)}>{a}</button>
            ))}
          </div>
        </div>
      )}

      {done && (
        <div className="rounded-lg border p-3 dark:border-neutral-700">
          <div className="text-lg font-bold">Score: {Math.round(100 * (score / (set.length || 1)))}%</div>
          <button className="mt-2 rounded-md border px-3 py-2 dark:border-neutral-700" onClick={()=>{ setSet([]); setDone(false); }}>Again</button>
        </div>
      )}
    </div>
  );
}

// -----------------------------
// SRS Panel
// -----------------------------
function SRSPanel({ cert, srs, adaptive }) {
  const cards = cert?.flashcards || [];
  const dueIds = srs.dueCards.length ? srs.dueCards : cards.map(c => c.id); // first-time show all
  const [idx, setIdx] = useState(0);

  const dueCards = cards.filter(c => dueIds.includes(c.id));
  const current = dueCards[idx] || null;

  const grade = (q) => {
    if (!current) return;
    srs.review(current.id, q);
    adaptive?.record(current.topic || "flashcards", q >= 3);
    if (idx < dueCards.length - 1) setIdx(idx + 1);
    else alert("SRS session complete.");
  };

  if (!cards.length) return <div className="text-sm text-neutral-600 dark:text-neutral-400">No flashcards found.</div>;

  return (
    <div className="space-y-3">
      {current ? (
        <div className="rounded-lg border p-3 dark:border-neutral-700">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">Card {idx+1} / {dueCards.length}</div>
          <div className="font-bold mb-2">{current.front}</div>
          <div className="text-neutral-700 dark:text-neutral-300">{current.back}</div>
          <div className="grid grid-cols-6 gap-2 mt-3">
            {[0,1,2,3,4,5].map((q)=>(
              <button key={q} className="rounded-md border px-2 py-1 text-xs dark:border-neutral-700" onClick={()=>grade(q)}>{q}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-neutral-600 dark:text-neutral-400">No cards due.</div>
      )}
    </div>
  );
}

// -----------------------------
// Labs Panel
// -----------------------------
function LabsPanel({ labs=[] }) {
  const [active, setActive] = useState(null);
  if (!labs.length) return <div className="text-sm text-neutral-600 dark:text-neutral-400">No labs available.</div>;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="space-y-2">
        {labs.map((l) => (
          <button key={l.id} onClick={()=>setActive(l)} className="w-full text-left rounded-md border px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:border-neutral-700">
            {l.title || l.id}
          </button>
        ))}
      </div>
      <div className="rounded-lg border p-3 space-y-2 dark:border-neutral-700">
        {!active && <div className="text-sm text-neutral-600 dark:text-neutral-400">Pick a lab.</div>}
        {active && (
          <div>
            <div className="font-bold mb-2">{active.title || active.id}</div>
            {(active.steps || []).map((s, i) => (
              <div key={i} className="rounded-md border p-2 mb-2 dark:border-neutral-700">
                <div className="text-sm font-medium">Step {i+1}</div>
                <div className="text-sm whitespace-pre-wrap">{s}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------
// Stats Panel
// -----------------------------
function StatsPanel({ cert, stats }) {
  const topics = Object.keys(stats.topics || {});
  return (
    <div className="space-y-3">
      <div className="rounded-lg border p-3 dark:border-neutral-700">
        <div className="font-medium mb-2">Skill Mastery Tracker</div>
        {!topics.length && <div className="text-sm text-neutral-600 dark:text-neutral-400">No data yet.</div>}
        {topics.map((t) => {
          const s = stats.topics[t];
          const pct = s.total ? Math.round(100 * s.correct / s.total) : 0;
          return (
            <div key={t} className="mb-2">
              <div className="text-sm">{t}</div>
              <div className="h-2 bg-neutral-200 rounded dark:bg-neutral-800">
                <div className="h-2 bg-neutral-900 rounded dark:bg-neutral-200" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">{pct}% • {s.correct}/{s.total} correct</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------
// Goals Panel (targets + reminders)
// -----------------------------
function GoalsPanel({ onSchedule }) {
  const [goals, setGoals] = useState(lsGet("study:goals", [])); // [{id,text,period:"daily"|"weekly",target:number,progress:number}]
  const [text, setText] = useState("");
  const [period, setPeriod] = useState("daily");
  const [target, setTarget] = useState(30);

  const add = () => {
    if (!text.trim()) return;
    const g = { id: uid(), text: text.trim(), period, target: Number(target)||30, progress: 0 };
    const next = [...goals, g];
    setGoals(next); lsSet("study:goals", next); setText("");
  };
  const tick = (id, mins=5) => {
    const next = goals.map((g)=>g.id===id ? { ...g, progress: g.progress + mins } : g);
    setGoals(next); lsSet("study:goals", next);
  };
  const reset = (id) => {
    const next = goals.map((g)=>g.id===id ? { ...g, progress: 0 } : g);
    setGoals(next); lsSet("study:goals", next);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-3">
        <input className="rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" placeholder="Goal description" value={text} onChange={(e)=>setText(e.target.value)} />
        <select className="rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={period} onChange={(e)=>setPeriod(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
        <input type="number" className="rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" value={target} onChange={(e)=>setTarget(e.target.value)} placeholder="Target minutes" />
      </div>
      <button className="rounded-md border px-3 py-2 dark:border-neutral-700" onClick={add}>Add Goal</button>

      <div className="grid gap-2">
        {goals.map((g)=>(
          <div key={g.id} className="rounded-lg border p-3 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div className="font-medium">{g.text} • {g.period} • {g.progress}/{g.target} mins</div>
              <div className="flex gap-2">
                <button className="rounded-md border px-2 py-1 text-xs dark:border-neutral-700" onClick={()=>tick(g.id, 10)}>+10m</button>
                <button className="rounded-md border px-2 py-1 text-xs dark:border-neutral-700" onClick={()=>reset(g.id)}>Reset</button>
              </div>
            </div>
          </div>
        ))}
        {!goals.length && <div className="text-sm text-neutral-600 dark:text-neutral-400">No goals yet.</div>}
      </div>

      <div className="flex gap-2">
        <button className="rounded-md border px-3 py-2 dark:border-neutral-700" onClick={onSchedule}>Add to Calendar (.ics)</button>
      </div>
    </div>
  );
}

// -----------------------------
// Community Panel (study groups, boards, challenges - stubs with graceful fallback)
// -----------------------------
function CommunityPanel() {
  const hasSupabase = typeof window !== "undefined" && window.supabase;
  return (
    <div className="space-y-3">
      <div className="rounded-lg border p-3 dark:border-neutral-700">
        <div className="font-medium mb-1">Study Groups</div>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">{hasSupabase ? "Connected to backend. Groups feature ready." : "Backend not detected. Showing local-only preview."}</div>
        <div className="flex gap-2 mt-2">
          <button className="rounded-md border px-3 py-2 text-sm dark:border-neutral-700">Create Group</button>
          <button className="rounded-md border px-3 py-2 text-sm dark:border-neutral-700">Browse Groups</button>
        </div>
      </div>

      <div className="rounded-lg border p-3 dark:border-neutral-700">
        <div className="font-medium mb-1">Discussion Boards</div>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">Per-cert boards for Q&A and tips.</div>
        <button className="mt-2 rounded-md border px-3 py-2 text-sm dark:border-neutral-700">Open Board</button>
      </div>

      <div className="rounded-lg border p-3 dark:border-neutral-700">
        <div className="font-medium mb-1">Challenge Friends</div>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">Timed quiz battles. Invite by link.</div>
        <button className="mt-2 rounded-md border px-3 py-2 text-sm dark:border-neutral-700">Create Challenge</button>
      </div>

      <div className="rounded-lg border p-3 dark:border-neutral-700">
        <div className="font-medium mb-1">Leaderboard (opt-in)</div>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">Compare study streaks and scores.</div>
        <button className="mt-2 rounded-md border px-3 py-2 text-sm dark:border-neutral-700">Opt In</button>
      </div>
    </div>
  );
}

// -----------------------------
// Utilities Panel
// -----------------------------
function UtilitiesPanel({ cert, startOfflineCache }) {
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(lsGet("study:quick-notes", ""));

  useEffect(()=>{ setNote(saved); }, []);

  const save = () => { lsSet("study:quick-notes", note); alert("Saved."); };

  const printSummary = () => window.print();

  const downloadRefSheet = () => {
    const content = (cert?.reference || []).join("\n") || "No reference sheet data.";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${cert?.id || "cert"}-reference.txt`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const downloadChecklist = () => {
    const content = `Exam Day Checklist
- Photo ID
- Exam confirmation email
- Arrive 15 minutes early
- Check system requirements (if online)
- Water, snack (if allowed)`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `exam-day-checklist.txt`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border p-3 space-y-2 dark:border-neutral-700">
        <div className="font-medium">Notes</div>
        <textarea className="w-full min-h-40 rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
          value={note} onChange={(e)=>setNote(e.target.value)} />
        <div className="flex gap-2">
          <button className="rounded-md border px-3 py-2 dark:border-neutral-700" onClick={save}>Save</button>
          <button className="rounded-md border px-3 py-2 dark:border-neutral-700" onClick={printSummary}>Printable Study Summary</button>
        </div>
      </div>

      <div className="rounded-lg border p-3 space-y-2 dark:border-neutral-700">
        <div className="font-medium">Quick Tools</div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-md border px-3 py-2 dark:border-neutral-700" onClick={downloadRefSheet}>Reference Sheet</button>
          <button className="rounded-md border px-3 py-2 dark:border-neutral-700" onClick={downloadChecklist}>Exam Day Checklist</button>
          <button className="rounded-md border px-3 py-2 dark:border-neutral-700" onClick={startOfflineCache}>Offline Mode</button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------
// Settings Panel (opt-in leaderboard placeholder + calendar link tips)
// -----------------------------
function SettingsPanel() {
  return (
    <div className="space-y-2 rounded-lg border p-3 dark:border-neutral-700">
      <div className="font-medium">Settings</div>
      <div className="text-sm text-neutral-600 dark:text-neutral-400">Customize behaviors and integrations here as features are added.</div>
    </div>
  );
}
