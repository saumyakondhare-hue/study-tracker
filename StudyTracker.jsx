import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Home, Calendar as CalendarIcon, Timer, BarChart3, BookOpen, CheckSquare,
  Flame, Settings as SettingsIcon, ChevronLeft, ChevronRight, Plus, Trash2,
  X, Star, Play, Pause, RotateCcw, Menu, Download, Sparkles, Pencil, Check,
  Sun, Moon, Bell, BellOff, Target, Trophy, Clock, Coffee, Leaf
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";

/* ---------------------------------- THEME ---------------------------------- */

const PALETTE_LIGHT = {
  bg: "#FFFBF3",
  card: "#FFFFFF",
  cardSoft: "#FFF7ED",
  text: "#5B4A42",
  textSoft: "#9A8A81",
  border: "#F1E6DC",
  pink: "#FBD3E2",
  pinkDeep: "#F5A6C4",
  lavender: "#DED2F7",
  lavenderDeep: "#B7A0EA",
  blue: "#CFE7F5",
  blueDeep: "#8FC3E0",
  mint: "#CFF0DD",
  mintDeep: "#8FD6AE",
  peach: "#FCE0C6",
  peachDeep: "#F3B87E",
  yellow: "#FBF0BE",
  yellowDeep: "#F0D876",
};

const PALETTE_DARK = {
  bg: "#241E2A",
  card: "#2E2733",
  cardSoft: "#352C3C",
  text: "#F3E9F0",
  textSoft: "#B7A6BE",
  border: "#443A4E",
  pink: "#5A3B4C",
  pinkDeep: "#E79BC0",
  lavender: "#463B57",
  lavenderDeep: "#B39CE8",
  blue: "#33455A",
  blueDeep: "#8CC2E8",
  mint: "#2E4A3D",
  mintDeep: "#8FDDB0",
  peach: "#523F35",
  peachDeep: "#F0B87C",
  yellow: "#4E4830",
  yellowDeep: "#F0DC80",
};

const HEADING_FONT = "'Fredoka', 'Baloo 2', sans-serif";
const BODY_FONT = "'Quicksand', 'Nunito', sans-serif";

function useGoogleFonts() {
  useEffect(() => {
    if (document.getElementById("study-tracker-fonts")) return;
    const link = document.createElement("link");
    link.id = "study-tracker-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Quicksand:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

/* ---------------------------------- STORAGE ---------------------------------- */

const STORAGE_KEY = "study-tracker-data-v1";

const SUBJECT_SEED = [
  { id: "s1", name: "Chemistry", emoji: "🧪", color: "mint", totalMinutes: 0, sessions: 0, topicsCompleted: 0, targetHours: 30 },
  { id: "s2", name: "Physics", emoji: "⚡", color: "blue", totalMinutes: 0, sessions: 0, topicsCompleted: 0, targetHours: 30 },
  { id: "s3", name: "Mathematics", emoji: "📐", color: "lavender", totalMinutes: 0, sessions: 0, topicsCompleted: 0, targetHours: 30 },
  { id: "s4", name: "Biology", emoji: "🧬", color: "pink", totalMinutes: 0, sessions: 0, topicsCompleted: 0, targetHours: 30 },
  { id: "s5", name: "English", emoji: "📖", color: "peach", totalMinutes: 0, sessions: 0, topicsCompleted: 0, targetHours: 30 },
];

const QUOTES = [
  "Small progress every day adds up to big results.",
  "Consistency beats motivation. 🌱",
  "Future you will thank you.",
  "Study now, relax later. ☕",
  "Small steps every day. 🌱",
  "Discipline is choosing what you want most over what you want now.",
  "You don't have to be perfect, just persistent. 🌷",
  "Every page you read is a page you'll never have to read again.",
  "Your only competition is who you were yesterday.",
  "Progress, not perfection. 🎀",
];

function defaultData() {
  return {
    dailyLogs: {},
    subjects: SUBJECT_SEED,
    tasks: [],
    settings: {
      dailyGoalHours: 4,
      focusMin: 25,
      shortBreakMin: 5,
      longBreakMin: 15,
      sessionsBeforeLong: 4,
      theme: "light",
      notifications: true,
      userName: "Saumya",
    },
  };
}

async function loadData() {
  try {
    const res = await window.storage.get(STORAGE_KEY, false);
    if (res && res.value) {
      const parsed = JSON.parse(res.value);
      const base = defaultData();
      return {
        ...base,
        ...parsed,
        settings: { ...base.settings, ...(parsed.settings || {}) },
      };
    }
  } catch (e) {
    /* no existing data yet */
  }
  return defaultData();
}

async function saveData(data) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(data), false);
  } catch (e) {
    console.error("Could not save study data", e);
  }
}

/* ---------------------------------- HELPERS ---------------------------------- */

function pad(n) { return String(n).padStart(2, "0"); }
function dateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function todayKey() { return dateKey(new Date()); }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function fmtMinutes(mins) {
  mins = Math.max(0, Math.round(mins || 0));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${pad(m)}m`;
}
function monthLabel(d) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function uid() { return Math.random().toString(36).slice(2, 10); }

function dayQualifies(log, goalHours) {
  if (!log) return false;
  const goalMin = goalHours * 60;
  return (log.studyMinutes || 0) >= goalMin || (log.pomodoros || 0) >= 1;
}

function computeStreaks(dailyLogs, goalHours) {
  const dates = Object.keys(dailyLogs).sort();
  if (dates.length === 0) return { current: 0, longest: 0 };
  const dateSet = new Set(dates.filter((k) => dayQualifies(dailyLogs[k], goalHours)));

  // longest
  let longest = 0, run = 0;
  const sortedQualifying = [...dateSet].sort();
  let prevDate = null;
  for (const key of sortedQualifying) {
    const d = new Date(key + "T00:00:00");
    if (prevDate && (d - prevDate) / 86400000 === 1) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
    prevDate = d;
  }

  // current: walk backward from today
  let current = 0;
  let cursor = new Date();
  const todayK = dateKey(cursor);
  if (!dateSet.has(todayK)) {
    cursor = addDays(cursor, -1);
  }
  while (dateSet.has(dateKey(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  return { current, longest };
}

function studyScore(log, goalHours) {
  if (!log) return 0;
  const goalMin = goalHours * 60;
  const goalPct = goalMin > 0 ? Math.min((log.studyMinutes || 0) / goalMin, 1) : 0;
  const plannedCount = (log.tasksPlanned || []).length;
  const doneCount = (log.tasksPlanned || []).filter((t) => t.done).length;
  const taskPct = plannedCount > 0 ? doneCount / plannedCount : (log.pomodoros || 0) > 0 ? 1 : 0;
  const pomoPct = Math.min((log.pomodoros || 0) / 4, 1);
  const focusPct = (log.focusRating || 0) / 5;
  const score = goalPct * 40 + taskPct * 20 + pomoPct * 20 + focusPct * 20;
  return Math.round(score);
}

function moodForLog(log) {
  return log && log.mood ? log.mood : null;
}

const MOOD_META = {
  excellent: { emoji: "🏆", label: "Excellent" },
  good: { emoji: "🙂", label: "Good" },
  poor: { emoji: "😴", label: "Poor" },
};

function encouragement(mood) {
  if (mood === "excellent") return "YOU ATE THAT UP. 🏆✨ Keep going!";
  if (mood === "good") return "Not perfect, but you showed up. That counts. 🌷";
  if (mood === "poor") return "Tomorrow is a fresh start. No guilt, just restart. 💗";
  return "Log today's study to see how you did. 🌱";
}

/* ---------------------------------- SMALL UI PRIMITIVES ---------------------------------- */

function Card({ children, style, className = "", onClick }) {
  const { theme } = useTheme();
  return (
    <div
      onClick={onClick}
      className={`rounded-3xl p-5 ${className}`}
      style={{
        background: theme.card,
        boxShadow: "0 4px 20px rgba(150,120,100,0.08)",
        border: `1px solid ${theme.border}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PillButton({ children, onClick, active, colorKey = "pink", style, small, type = "button", disabled }) {
  const { theme } = useTheme();
  const bg = active ? theme[colorKey + "Deep"] : theme[colorKey];
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${small ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm"}`}
      style={{
        background: bg,
        color: theme.text,
        fontFamily: BODY_FONT,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function IconGhostButton({ icon: Icon, onClick, title, size = 18 }) {
  const { theme } = useTheme();
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 rounded-full transition-all hover:scale-110 active:scale-95"
      style={{ background: theme.cardSoft }}
    >
      <Icon size={size} color={theme.text} />
    </button>
  );
}

function SectionTitle({ children, icon: Icon }) {
  const { theme } = useTheme();
  return (
    <h2
      className="text-2xl mb-4 flex items-center gap-2"
      style={{ fontFamily: HEADING_FONT, color: theme.text, fontWeight: 600 }}
    >
      {Icon && <Icon size={22} color={theme.pinkDeep} />}
      {children}
    </h2>
  );
}

function Stars({ value, onChange, size = 20 }) {
  const { theme } = useTheme();
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} className="transition-transform hover:scale-125">
          <Star
            size={size}
            color={theme.peachDeep}
            fill={n <= value ? theme.peachDeep : "transparent"}
          />
        </button>
      ))}
    </div>
  );
}

function ProgressRing({ pct, size = 120, stroke = 12, colorKey = "pinkDeep", label, sub }) {
  const { theme } = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = c - (clamped / 100) * c;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={theme.border} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={theme[colorKey]} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span style={{ fontFamily: HEADING_FONT, fontSize: size * 0.2, color: theme.text, fontWeight: 600 }}>{label}</span>
        {sub && <span style={{ fontFamily: BODY_FONT, fontSize: size * 0.09, color: theme.textSoft }}>{sub}</span>}
      </div>
    </div>
  );
}

function Sparkle({ show }) {
  if (!show) return null;
  return <span className="inline-block animate-ping ml-1">✨</span>;
}

/* ---------------------------------- THEME CONTEXT ---------------------------------- */

const ThemeContext = React.createContext(null);
function useTheme() { return React.useContext(ThemeContext); }

/* ---------------------------------- NAVIGATION ---------------------------------- */

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "calendar", label: "Calendar", icon: CalendarIcon },
  { key: "pomodoro", label: "Pomodoro", icon: Timer },
  { key: "performance", label: "Performance", icon: BarChart3 },
  { key: "subjects", label: "Subjects", icon: BookOpen },
  { key: "tasks", label: "Tasks", icon: CheckSquare },
  { key: "streak", label: "Streak", icon: Flame },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

function Sidebar({ tab, setTab }) {
  const { theme } = useTheme();
  return (
    <div
      className="hidden md:flex flex-col w-60 shrink-0 p-5 gap-1 h-screen sticky top-0"
      style={{ background: theme.card, borderRight: `1px solid ${theme.border}` }}
    >
      <div className="flex items-center gap-2 mb-6 px-2">
        <span style={{ fontSize: 26 }}>🌷</span>
        <span style={{ fontFamily: HEADING_FONT, fontSize: 20, color: theme.text, fontWeight: 600 }}>
          StudyNook
        </span>
      </div>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = tab === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all duration-150 hover:scale-[1.02]"
            style={{
              background: active ? theme.pink : "transparent",
              color: theme.text,
              fontFamily: BODY_FONT,
              fontWeight: active ? 700 : 500,
            }}
          >
            <Icon size={19} color={active ? theme.pinkDeep : theme.textSoft} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function MobileNav({ tab, setTab }) {
  const { theme } = useTheme();
  const items = NAV_ITEMS.slice(0, 5);
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around items-center py-2 z-40"
        style={{ background: theme.card, borderTop: `1px solid ${theme.border}` }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = tab === item.key;
          return (
            <button key={item.key} onClick={() => setTab(item.key)} className="flex flex-col items-center gap-0.5 px-2 py-1">
              <Icon size={20} color={active ? theme.pinkDeep : theme.textSoft} />
              <span style={{ fontSize: 10, fontFamily: BODY_FONT, color: active ? theme.pinkDeep : theme.textSoft }}>{item.label}</span>
            </button>
          );
        })}
        <button onClick={() => setMenuOpen(true)} className="flex flex-col items-center gap-0.5 px-2 py-1">
          <Menu size={20} color={theme.textSoft} />
          <span style={{ fontSize: 10, fontFamily: BODY_FONT, color: theme.textSoft }}>More</span>
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.3)" }} onClick={() => setMenuOpen(false)}>
          <div className="w-full rounded-t-3xl p-5" style={{ background: theme.card }} onClick={(e) => e.stopPropagation()}>
            {NAV_ITEMS.slice(5).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => { setTab(item.key); setMenuOpen(false); }}
                  className="flex items-center gap-3 px-2 py-3 w-full text-left"
                  style={{ fontFamily: BODY_FONT, color: theme.text }}
                >
                  <Icon size={19} color={theme.textSoft} />
                  {item.label}
                </button>
              );
            })}
            <button onClick={() => setMenuOpen(false)} className="mt-2 w-full py-2 rounded-full text-center" style={{ background: theme.pink, fontFamily: BODY_FONT, color: theme.text }}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------------------------- DASHBOARD ---------------------------------- */

function Dashboard({ data, setTab, quote }) {
  const { theme } = useTheme();
  const tKey = todayKey();
  const log = data.dailyLogs[tKey];
  const goalHours = data.settings.dailyGoalHours;
  const goalMin = goalHours * 60;
  const studiedMin = log ? log.studyMinutes || 0 : 0;
  const pct = goalMin > 0 ? Math.round((studiedMin / goalMin) * 100) : 0;
  const { current } = computeStreaks(data.dailyLogs, goalHours);
  const pomos = log ? log.pomodoros || 0 : 0;
  const tasksToday = data.tasks.filter((t) => t.date === tKey);
  const tasksDone = tasksToday.filter((t) => t.completed).length;

  // weekly progress: last 7 days total minutes vs goal*7
  let weekMin = 0;
  for (let i = 0; i < 7; i++) {
    const k = dateKey(addDays(new Date(), -i));
    weekMin += (data.dailyLogs[k] && data.dailyLogs[k].studyMinutes) || 0;
  }
  const weekPct = Math.min(100, Math.round((weekMin / (goalMin * 7)) * 100));

  const cards = [
    { label: "Today's Study Time", value: fmtMinutes(studiedMin), icon: "📚", color: "blue" },
    { label: "Current Streak", value: `${current} day${current === 1 ? "" : "s"} 🔥`, icon: "🔥", color: "peach" },
    { label: "Today's Goal", value: `${fmtMinutes(studiedMin)} / ${goalHours}h`, icon: "🎯", color: "lavender" },
    { label: "Tasks Completed", value: `${tasksDone} / ${tasksToday.length}`, icon: "✅", color: "mint" },
    { label: "Pomodoro Sessions", value: `${pomos} completed`, icon: "🍅", color: "pink" },
    { label: "Weekly Progress", value: `${weekPct}%`, icon: "📈", color: "yellow" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontFamily: HEADING_FONT, fontSize: 30, color: theme.text, fontWeight: 700 }}>
          Hey {data.settings.userName || "there"}! 🌷
        </h1>
        <p style={{ fontFamily: BODY_FONT, color: theme.textSoft, fontSize: 16, marginTop: 4 }}>
          Small progress every day adds up to big results.
        </p>
        <p style={{ fontFamily: BODY_FONT, color: theme.textSoft, fontSize: 13, marginTop: 6 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <Card style={{ background: theme.cardSoft }} className="flex items-center gap-2">
        <Sparkles size={18} color={theme.pinkDeep} />
        <p style={{ fontFamily: BODY_FONT, color: theme.text, fontStyle: "italic" }}>{quote}</p>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="col-span-2 md:col-span-1 flex flex-col items-center justify-center gap-2">
          <ProgressRing pct={pct} label={`${pct}%`} sub="of daily goal" colorKey="pinkDeep" />
          <p style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft }}>
            {fmtMinutes(studiedMin)} of {goalHours}h goal
          </p>
        </Card>
        {cards.map((c) => (
          <Card key={c.label} style={{ background: theme[c.color] }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 22 }}>{c.icon}</span>
            </div>
            <p style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft, fontWeight: 600 }}>{c.label}</p>
            <p style={{ fontFamily: HEADING_FONT, fontSize: 20, color: theme.text, fontWeight: 600 }}>{c.value}</p>
          </Card>
        ))}
      </div>

      <Card style={{ background: theme.lavender }}>
        <p style={{ fontFamily: BODY_FONT, color: theme.text, fontWeight: 600 }}>
          {encouragement(moodForLog(log))}
        </p>
      </Card>

      <div className="flex flex-wrap gap-3">
        <PillButton colorKey="pink" onClick={() => setTab("pomodoro")}>🍅 Start a Pomodoro</PillButton>
        <PillButton colorKey="blue" onClick={() => setTab("calendar")}>📅 Log today's study</PillButton>
        <PillButton colorKey="mint" onClick={() => setTab("tasks")}>✅ View tasks</PillButton>
      </div>
    </div>
  );
}

/* ---------------------------------- CALENDAR ---------------------------------- */

function DayLogModal({ dateObj, log, subjects, onClose, onSave }) {
  const { theme } = useTheme();
  const key = dateKey(dateObj);
  const [mood, setMood] = useState(log?.mood || null);
  const [hours, setHours] = useState(log ? Math.floor((log.studyMinutes || 0) / 60) : 0);
  const [mins, setMins] = useState(log ? (log.studyMinutes || 0) % 60 : 0);
  const [targetHours, setTargetHours] = useState(log ? Math.floor((log.targetMinutes || 0) / 60) : 0);
  const [targetMins, setTargetMins] = useState(log ? (log.targetMinutes || 0) % 60 : 0);
  const [pomodoros, setPomodoros] = useState(log?.pomodoros || 0);
  const [subject, setSubject] = useState(log?.subject || (subjects[0] ? subjects[0].name : ""));
  const [chapter, setChapter] = useState(log?.chapter || "");
  const [notes, setNotes] = useState(log?.notes || "");
  const [tasksPlanned, setTasksPlanned] = useState(log?.tasksPlanned || []);
  const [newTask, setNewTask] = useState("");
  const [focusRating, setFocusRating] = useState(log?.focusRating || 0);
  const [reflection, setReflection] = useState(log?.reflection || { accomplished: "", distracted: "", improve: "", proud: "" });

  const tasksCompleted = tasksPlanned.filter((t) => t.done).length;

  function addTask() {
    if (!newTask.trim()) return;
    setTasksPlanned([...tasksPlanned, { id: uid(), text: newTask.trim(), done: false }]);
    setNewTask("");
  }
  function toggleTask(id) {
    setTasksPlanned(tasksPlanned.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }
  function removeTask(id) {
    setTasksPlanned(tasksPlanned.filter((t) => t.id !== id));
  }

  function handleSave() {
    onSave(key, {
      mood, studyMinutes: hours * 60 + mins, targetMinutes: targetHours * 60 + targetMins,
      pomodoros, subject, chapter, notes, tasksPlanned, focusRating, reflection,
    });
    onClose();
  }

  const inputStyle = {
    background: theme.cardSoft, border: `1px solid ${theme.border}`, borderRadius: 14,
    padding: "8px 12px", fontFamily: BODY_FONT, color: theme.text, width: "100%", outline: "none",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3" style={{ background: "rgba(60,40,40,0.35)" }} onClick={onClose}>
      <div
        className="rounded-3xl w-full max-w-lg max-h-[88vh] overflow-y-auto p-6"
        style={{ background: theme.card }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: HEADING_FONT, fontSize: 20, color: theme.text, fontWeight: 600 }}>
            {dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </h3>
          <IconGhostButton icon={X} onClick={onClose} />
        </div>

        <div className="space-y-4">
          <div>
            <p style={{ fontFamily: BODY_FONT, color: theme.textSoft, fontSize: 13, marginBottom: 6 }}>How was your study day?</p>
            <div className="flex gap-2">
              {Object.entries(MOOD_META).map(([k, m]) => (
                <button
                  key={k}
                  onClick={() => setMood(k)}
                  className="flex-1 py-3 rounded-2xl text-center transition-transform hover:scale-105"
                  style={{ background: mood === k ? theme.pinkDeep : theme.cardSoft, border: `1px solid ${theme.border}` }}
                >
                  <div style={{ fontSize: 22 }}>{m.emoji}</div>
                  <div style={{ fontFamily: BODY_FONT, fontSize: 11, color: theme.text }}>{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft }}>Study time</p>
              <div className="flex gap-2 mt-1">
                <input type="number" min="0" value={hours} onChange={(e) => setHours(+e.target.value)} style={inputStyle} placeholder="hr" />
                <input type="number" min="0" max="59" value={mins} onChange={(e) => setMins(+e.target.value)} style={inputStyle} placeholder="min" />
              </div>
            </div>
            <div>
              <p style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft }}>Target time</p>
              <div className="flex gap-2 mt-1">
                <input type="number" min="0" value={targetHours} onChange={(e) => setTargetHours(+e.target.value)} style={inputStyle} placeholder="hr" />
                <input type="number" min="0" max="59" value={targetMins} onChange={(e) => setTargetMins(+e.target.value)} style={inputStyle} placeholder="min" />
              </div>
            </div>
          </div>

          <div>
            <p style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft, marginBottom: 4 }}>Pomodoro sessions</p>
            <input type="number" min="0" value={pomodoros} onChange={(e) => setPomodoros(+e.target.value)} style={inputStyle} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft, marginBottom: 4 }}>Subject</p>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} style={inputStyle}>
                {subjects.map((s) => <option key={s.id} value={s.name}>{s.emoji} {s.name}</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft, marginBottom: 4 }}>Chapter / topic</p>
              <input value={chapter} onChange={(e) => setChapter(e.target.value)} style={inputStyle} placeholder="e.g. Thermodynamics" />
            </div>
          </div>

          <div>
            <p style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft, marginBottom: 4 }}>Tasks planned ({tasksCompleted}/{tasksPlanned.length} done)</p>
            <div className="space-y-1 mb-2">
              {tasksPlanned.map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <button onClick={() => toggleTask(t.id)} className="flex items-center gap-2 flex-1 text-left">
                    <span style={{
                      width: 18, height: 18, borderRadius: 6, border: `2px solid ${theme.pinkDeep}`,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      background: t.done ? theme.pinkDeep : "transparent",
                    }}>
                      {t.done && <Check size={12} color="white" />}
                    </span>
                    <span style={{ fontFamily: BODY_FONT, color: theme.text, textDecoration: t.done ? "line-through" : "none", fontSize: 14 }}>{t.text}</span>
                  </button>
                  <button onClick={() => removeTask(t.id)}><Trash2 size={14} color={theme.textSoft} /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} style={inputStyle} placeholder="Add a task..." />
              <PillButton small colorKey="mint" onClick={addTask}><Plus size={14} /></PillButton>
            </div>
          </div>

          <div>
            <p style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft, marginBottom: 4 }}>How focused were you?</p>
            <Stars value={focusRating} onChange={setFocusRating} />
          </div>

          <div>
            <p style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft, marginBottom: 4 }}>Notes / Reflection</p>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...inputStyle, minHeight: 60 }} placeholder="How did today go?" />
          </div>

          <details>
            <summary style={{ fontFamily: BODY_FONT, fontSize: 13, color: theme.pinkDeep, cursor: "pointer" }}>Daily reflection (optional)</summary>
            <div className="space-y-2 mt-2">
              {[
                ["accomplished", "What did I accomplish today?"],
                ["distracted", "What distracted me?"],
                ["improve", "What should I improve tomorrow?"],
                ["proud", "One thing I'm proud of today"],
              ].map(([field, ph]) => (
                <input
                  key={field}
                  value={reflection[field] || ""}
                  onChange={(e) => setReflection({ ...reflection, [field]: e.target.value })}
                  style={inputStyle}
                  placeholder={ph}
                />
              ))}
            </div>
          </details>

          <div className="flex justify-end gap-2 pt-2">
            <PillButton colorKey="lavender" onClick={onClose}>Cancel</PillButton>
            <PillButton colorKey="pink" onClick={handleSave}>Save entry 🌷</PillButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarPage({ data, saveDayLog }) {
  const { theme } = useTheme();
  const [viewDate, setViewDate] = useState(new Date(2026, 7, 1)); // August 2026
  const [selectedDate, setSelectedDate] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      <SectionTitle icon={CalendarIcon}>Study Calendar</SectionTitle>
      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <IconGhostButton icon={ChevronLeft} onClick={() => setViewDate(new Date(year, month - 1, 1))} />
            <select
              value={month}
              onChange={(e) => setViewDate(new Date(year, +e.target.value, 1))}
              style={{ background: theme.cardSoft, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "6px 10px", fontFamily: BODY_FONT, color: theme.text }}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i} value={i}>{new Date(2000, i, 1).toLocaleDateString("en-US", { month: "long" })}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setViewDate(new Date(+e.target.value, month, 1))}
              style={{ background: theme.cardSoft, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "6px 10px", fontFamily: BODY_FONT, color: theme.text }}
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <IconGhostButton icon={ChevronRight} onClick={() => setViewDate(new Date(year, month + 1, 1))} />
          </div>
          <PillButton small colorKey="blue" onClick={() => setViewDate(new Date())}>Today</PillButton>
        </div>

        <div className="grid grid-cols-7 gap-1.5 md:gap-2 mb-2">
          {weekDayLabels.map((w) => (
            <div key={w} className="text-center" style={{ fontFamily: BODY_FONT, fontSize: 11, color: theme.textSoft, fontWeight: 700 }}>{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const k = dateKey(d);
            const log = data.dailyLogs[k];
            const mood = moodForLog(log);
            const isToday = k === todayKey();
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(d)}
                className="aspect-square rounded-2xl flex flex-col items-center justify-center transition-transform hover:scale-105"
                style={{
                  background: mood ? theme[{ excellent: "yellow", good: "mint", poor: "blue" }[mood]] : theme.cardSoft,
                  border: isToday ? `2px solid ${theme.pinkDeep}` : `1px solid ${theme.border}`,
                }}
              >
                <span style={{ fontFamily: BODY_FONT, fontSize: 11, color: theme.textSoft }}>{d.getDate()}</span>
                <span style={{ fontSize: 16 }}>{mood ? MOOD_META[mood].emoji : ""}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="flex gap-4 mt-4 flex-wrap">
        {Object.entries(MOOD_META).map(([k, m]) => (
          <div key={k} className="flex items-center gap-1.5" style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft }}>
            <span>{m.emoji}</span> {m.label}
          </div>
        ))}
      </div>

      {selectedDate && (
        <DayLogModal
          dateObj={selectedDate}
          log={data.dailyLogs[dateKey(selectedDate)]}
          subjects={data.subjects}
          onClose={() => setSelectedDate(null)}
          onSave={saveDayLog}
        />
      )}
    </div>
  );
}

/* ---------------------------------- POMODORO ---------------------------------- */

function PomodoroPage({ data, saveDayLog, updateSettings }) {
  const { theme } = useTheme();
  const s = data.settings;
  const [mode, setMode] = useState("focus");
  const durations = { focus: s.focusMin, short: s.shortBreakMin, long: s.longBreakMin };
  const [secondsLeft, setSecondsLeft] = useState(durations.focus * 60);
  const [running, setRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [celebration, setCelebration] = useState(null);
  const intervalRef = useRef(null);
  const startedAtSecondsRef = useRef(durations.focus * 60);

  useEffect(() => {
    if (!running) setSecondsLeft(durations[mode] * 60);
    startedAtSecondsRef.current = durations[mode] * 60;
    // eslint-disable-next-line
  }, [mode, s.focusMin, s.shortBreakMin, s.longBreakMin]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line
  }, [running]);

  function playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.value = 660;
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);
      o.start(); o.stop(ctx.currentTime + 1.1);
    } catch (e) { /* audio not available */ }
  }

  function handleComplete() {
    setRunning(false);
    if (s.notifications) playChime();
    if (mode === "focus") {
      const k = todayKey();
      const existing = data.dailyLogs[k] || {};
      const newPomos = (existing.pomodoros || 0) + 1;
      saveDayLog(k, { ...existing, pomodoros: newPomos, studyMinutes: (existing.studyMinutes || 0) + s.focusMin });
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      setCelebration("Pomodoro complete! 🌷 You did great. Take a little break!");
      setMode(newCount % s.sessionsBeforeLong === 0 ? "long" : "short");
    } else {
      setCelebration("Break's over — ready for another focus round? 🍅");
      setMode("focus");
    }
    setTimeout(() => setCelebration(null), 4000);
  }

  function logPartialSession() {
    const elapsedMin = Math.round((startedAtSecondsRef.current - secondsLeft) / 60);
    if (elapsedMin <= 0) return;
    const k = todayKey();
    const existing = data.dailyLogs[k] || {};
    saveDayLog(k, { ...existing, studyMinutes: (existing.studyMinutes || 0) + elapsedMin });
    setCelebration(`Logged ${elapsedMin} min of focus time. ✨`);
    setTimeout(() => setCelebration(null), 3000);
  }

  const total = durations[mode] * 60;
  const pct = Math.round(((total - secondsLeft) / total) * 100);
  const mm = pad(Math.floor(secondsLeft / 60));
  const ss = pad(secondsLeft % 60);

  const todayLog = data.dailyLogs[todayKey()];
  const todayPomos = todayLog?.pomodoros || 0;

  const modeMeta = {
    focus: { label: "Focus", icon: "🍅", color: "pink" },
    short: { label: "Short Break", icon: "☕", color: "mint" },
    long: { label: "Long Break", icon: "🌿", color: "lavender" },
  };

  return (
    <div>
      <SectionTitle icon={Timer}>Pomodoro Timer</SectionTitle>

      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.entries(modeMeta).map(([k, m]) => (
          <PillButton key={k} colorKey={m.color} active={mode === k} onClick={() => { setRunning(false); setMode(k); }}>
            {m.icon} {m.label}
          </PillButton>
        ))}
      </div>

      <Card className="flex flex-col items-center py-10">
        <ProgressRing pct={pct} size={220} stroke={16} colorKey={modeMeta[mode].color + "Deep"} label={`${mm}:${ss}`} sub={modeMeta[mode].label} />
        <div className="flex gap-3 mt-8">
          <PillButton colorKey="pink" onClick={() => setRunning((r) => !r)}>
            {running ? <span className="flex items-center gap-1"><Pause size={16} /> Pause</span> : <span className="flex items-center gap-1"><Play size={16} /> Start</span>}
          </PillButton>
          <PillButton colorKey="lavender" onClick={() => { setRunning(false); setSecondsLeft(durations[mode] * 60); startedAtSecondsRef.current = durations[mode] * 60; }}>
            <span className="flex items-center gap-1"><RotateCcw size={16} /> Reset</span>
          </PillButton>
          {mode === "focus" && running && (
            <PillButton colorKey="mint" onClick={logPartialSession}>Log this session</PillButton>
          )}
        </div>
        {celebration && (
          <div className="mt-6 px-4 py-2 rounded-2xl" style={{ background: theme.yellow, fontFamily: BODY_FONT, color: theme.text }}>
            {celebration}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Card>
          <p style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft }}>Today's Pomodoros</p>
          <p style={{ fontSize: 22, marginTop: 4 }}>{"🍅".repeat(Math.min(todayPomos, 12)) || "—"}</p>
          <p style={{ fontFamily: BODY_FONT, fontSize: 13, color: theme.textSoft, marginTop: 4 }}>{todayPomos} completed</p>
        </Card>
        <Card>
          <p style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft }}>Total focus time today</p>
          <p style={{ fontFamily: HEADING_FONT, fontSize: 22, color: theme.text, marginTop: 4 }}>{fmtMinutes(todayLog?.studyMinutes || 0)}</p>
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------- PERFORMANCE ---------------------------------- */

function PerformancePage({ data }) {
  const { theme } = useTheme();
  const goalHours = data.settings.dailyGoalHours;
  const tKey = todayKey();
  const todayLog = data.dailyLogs[tKey];

  const last7 = Array.from({ length: 7 }).map((_, i) => dateKey(addDays(new Date(), -(6 - i))));
  const last14 = Array.from({ length: 14 }).map((_, i) => dateKey(addDays(new Date(), -(13 - i))));

  const weekLogs = last7.map((k) => data.dailyLogs[k]).filter(Boolean);
  const weekTotalMin = weekLogs.reduce((a, l) => a + (l.studyMinutes || 0), 0);
  const weekAvgMin = weekLogs.length ? weekTotalMin / 7 : 0;
  const weekAvgFocus = weekLogs.length ? (weekLogs.reduce((a, l) => a + (l.focusRating || 0), 0) / weekLogs.length).toFixed(1) : "—";
  const weekPomos = weekLogs.reduce((a, l) => a + (l.pomodoros || 0), 0);
  const weekTasksDone = weekLogs.reduce((a, l) => a + (l.tasksPlanned || []).filter((t) => t.done).length, 0);
  const weekProductiveDays = last7.filter((k) => dayQualifies(data.dailyLogs[k], goalHours)).length;

  const now = new Date();
  const monthKeys = Array.from({ length: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() })
    .map((_, i) => dateKey(new Date(now.getFullYear(), now.getMonth(), i + 1)));
  const monthLogs = monthKeys.map((k) => data.dailyLogs[k]).filter(Boolean);
  const monthTotalMin = monthLogs.reduce((a, l) => a + (l.studyMinutes || 0), 0);
  const monthAvgMin = monthLogs.length ? monthTotalMin / monthLogs.length : 0;
  const bestDay = monthLogs.length ? monthKeys.reduce((best, k) => {
    const l = data.dailyLogs[k];
    if (!l) return best;
    if (!best || (l.studyMinutes || 0) > (data.dailyLogs[best]?.studyMinutes || 0)) return k;
    return best;
  }, null) : null;
  const moodCounts = { excellent: 0, good: 0, poor: 0 };
  monthLogs.forEach((l) => { if (l.mood) moodCounts[l.mood] += 1; });
  const monthPomos = monthLogs.reduce((a, l) => a + (l.pomodoros || 0), 0);
  const { longest } = computeStreaks(data.dailyLogs, goalHours);

  const lineData = last14.map((k) => ({
    day: new Date(k + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" }),
    hours: +(((data.dailyLogs[k]?.studyMinutes) || 0) / 60).toFixed(2),
  }));

  const donutData = [
    { name: "Excellent", value: moodCounts.excellent, color: theme.yellowDeep },
    { name: "Good", value: moodCounts.good, color: theme.mintDeep },
    { name: "Poor", value: moodCounts.poor, color: theme.blueDeep },
  ].filter((d) => d.value > 0);

  const subjectData = data.subjects.map((s) => ({ name: s.name, hours: +((s.totalMinutes || 0) / 60).toFixed(1) }));

  const todayScore = studyScore(todayLog, goalHours);
  const weekScoreAvg = weekLogs.length ? Math.round(weekLogs.reduce((a, l) => a + studyScore(l, goalHours), 0) / weekLogs.length) : 0;
  const monthScoreAvg = monthLogs.length ? Math.round(monthLogs.reduce((a, l) => a + studyScore(l, goalHours), 0) / monthLogs.length) : 0;

  const statBox = (label, value) => (
    <div>
      <p style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft }}>{label}</p>
      <p style={{ fontFamily: HEADING_FONT, fontSize: 17, color: theme.text, fontWeight: 600 }}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <SectionTitle icon={BarChart3}>Performance</SectionTitle>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card style={{ background: theme.yellow }}>
          <p style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft }}>Today's Study Score</p>
          <p style={{ fontFamily: HEADING_FONT, fontSize: 30, color: theme.text }}>{todayScore} / 100 🌟</p>
        </Card>
        <Card style={{ background: theme.mint }}>
          <p style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft }}>Weekly Average</p>
          <p style={{ fontFamily: HEADING_FONT, fontSize: 30, color: theme.text }}>{weekScoreAvg} / 100</p>
        </Card>
        <Card style={{ background: theme.blue }}>
          <p style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft }}>Monthly Average</p>
          <p style={{ fontFamily: HEADING_FONT, fontSize: 30, color: theme.text }}>{monthScoreAvg} / 100</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p style={{ fontFamily: HEADING_FONT, fontSize: 15, color: theme.pinkDeep, marginBottom: 8 }}>Today</p>
          <div className="space-y-2">
            {statBox("Total study time", fmtMinutes(todayLog?.studyMinutes || 0))}
            {statBox("Daily target", `${goalHours}h`)}
            {statBox("Pomodoros", todayLog?.pomodoros || 0)}
            {statBox("Tasks completed", (todayLog?.tasksPlanned || []).filter((t) => t.done).length)}
            {statBox("Focus rating", `${todayLog?.focusRating || 0} / 5`)}
          </div>
        </Card>
        <Card>
          <p style={{ fontFamily: HEADING_FONT, fontSize: 15, color: theme.pinkDeep, marginBottom: 8 }}>This Week</p>
          <div className="space-y-2">
            {statBox("Total study hours", fmtMinutes(weekTotalMin))}
            {statBox("Average daily time", fmtMinutes(weekAvgMin))}
            {statBox("Average focus rating", weekAvgFocus)}
            {statBox("Pomodoros completed", weekPomos)}
            {statBox("Tasks completed", weekTasksDone)}
            {statBox("Productive days", `${weekProductiveDays} / 7`)}
          </div>
        </Card>
        <Card>
          <p style={{ fontFamily: HEADING_FONT, fontSize: 15, color: theme.pinkDeep, marginBottom: 8 }}>This Month</p>
          <div className="space-y-2">
            {statBox("Total study hours", fmtMinutes(monthTotalMin))}
            {statBox("Average time/day", fmtMinutes(monthAvgMin))}
            {statBox("Best study day", bestDay ? new Date(bestDay + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—")}
            {statBox("🏆 Excellent days", moodCounts.excellent)}
            {statBox("🙂 Good days", moodCounts.good)}
            {statBox("😴 Poor days", moodCounts.poor)}
            {statBox("Total Pomodoros", monthPomos)}
            {statBox("Longest streak", `${longest} days`)}
          </div>
        </Card>
      </div>

      <Card>
        <p style={{ fontFamily: HEADING_FONT, fontSize: 15, color: theme.text, marginBottom: 10 }}>📈 Study hours — last 14 days</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: BODY_FONT, fill: theme.textSoft }} />
            <YAxis tick={{ fontSize: 11, fontFamily: BODY_FONT, fill: theme.textSoft }} />
            <Tooltip contentStyle={{ borderRadius: 12, fontFamily: BODY_FONT, border: `1px solid ${theme.border}` }} />
            <Line type="monotone" dataKey="hours" stroke={theme.pinkDeep} strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <p style={{ fontFamily: HEADING_FONT, fontSize: 15, color: theme.text, marginBottom: 10 }}>🍩 Day quality this month</p>
          {donutData.length === 0 ? (
            <p style={{ fontFamily: BODY_FONT, color: theme.textSoft, fontSize: 13 }}>Log a few days to see this chart.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontFamily: BODY_FONT }} />
                <Legend wrapperStyle={{ fontFamily: BODY_FONT, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
        <Card>
          <p style={{ fontFamily: HEADING_FONT, fontSize: 15, color: theme.text, marginBottom: 10 }}>📚 Subject-wise time</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={subjectData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: BODY_FONT, fill: theme.textSoft }} />
              <YAxis tick={{ fontSize: 11, fontFamily: BODY_FONT, fill: theme.textSoft }} />
              <Tooltip contentStyle={{ borderRadius: 12, fontFamily: BODY_FONT }} />
              <Bar dataKey="hours" fill={theme.mintDeep} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------- SUBJECTS ---------------------------------- */

function SubjectsPage({ data, updateSubjects }) {
  const { theme } = useTheme();
  const [newName, setNewName] = useState("");
  const [logFor, setLogFor] = useState(null);
  const [logMin, setLogMin] = useState(30);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  function addSubject() {
    if (!newName.trim()) return;
    const colors = ["pink", "blue", "mint", "lavender", "peach", "yellow"];
    updateSubjects([...data.subjects, {
      id: uid(), name: newName.trim(), emoji: "📘",
      color: colors[data.subjects.length % colors.length],
      totalMinutes: 0, sessions: 0, topicsCompleted: 0, targetHours: 20,
    }]);
    setNewName("");
  }
  function removeSubject(id) {
    updateSubjects(data.subjects.filter((s) => s.id !== id));
  }
  function renameSubject(id) {
    updateSubjects(data.subjects.map((s) => (s.id === id ? { ...s, name: editName } : s)));
    setEditingId(null);
  }
  function logTime(id) {
    updateSubjects(data.subjects.map((s) => (
      s.id === id ? { ...s, totalMinutes: (s.totalMinutes || 0) + logMin, sessions: (s.sessions || 0) + 1 } : s
    )));
    setLogFor(null);
    setLogMin(30);
  }

  const inputStyle = {
    background: theme.cardSoft, border: `1px solid ${theme.border}`, borderRadius: 14,
    padding: "8px 12px", fontFamily: BODY_FONT, color: theme.text, outline: "none",
  };

  return (
    <div>
      <SectionTitle icon={BookOpen}>Subjects</SectionTitle>

      <div className="flex gap-2 mb-5">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSubject()} style={{ ...inputStyle, flex: 1 }} placeholder="Add a new subject..." />
        <PillButton colorKey="pink" onClick={addSubject}><Plus size={16} /></PillButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.subjects.map((s) => {
          const pct = Math.min(100, Math.round(((s.totalMinutes || 0) / 60 / (s.targetHours || 20)) * 100));
          return (
            <Card key={s.id} style={{ background: theme[s.color] }}>
              <div className="flex items-center justify-between mb-2">
                {editingId === s.id ? (
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && renameSubject(s.id)} style={{ ...inputStyle, flex: 1 }} autoFocus />
                ) : (
                  <p style={{ fontFamily: HEADING_FONT, fontSize: 17, color: theme.text }}>{s.emoji} {s.name}</p>
                )}
                <div className="flex gap-1">
                  {editingId === s.id ? (
                    <IconGhostButton icon={Check} onClick={() => renameSubject(s.id)} />
                  ) : (
                    <IconGhostButton icon={Pencil} onClick={() => { setEditingId(s.id); setEditName(s.name); }} />
                  )}
                  <IconGhostButton icon={Trash2} onClick={() => removeSubject(s.id)} />
                </div>
              </div>
              <div className="w-full h-2.5 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.6)" }}>
                <div className="h-2.5 rounded-full" style={{ width: `${pct}%`, background: theme.text, opacity: 0.55 }} />
              </div>
              <div className="flex items-center justify-between">
                <p style={{ fontFamily: BODY_FONT, fontSize: 13, color: theme.text }}>{fmtMinutes(s.totalMinutes)} studied · {pct}%</p>
                <PillButton small colorKey="yellow" onClick={() => setLogFor(s.id)}>+ Log time</PillButton>
              </div>
              {logFor === s.id && (
                <div className="flex items-center gap-2 mt-3">
                  <input type="number" value={logMin} onChange={(e) => setLogMin(+e.target.value)} style={{ ...inputStyle, width: 90 }} />
                  <span style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.text }}>minutes</span>
                  <PillButton small colorKey="mint" onClick={() => logTime(s.id)}>Save</PillButton>
                  <PillButton small colorKey="lavender" onClick={() => setLogFor(null)}>Cancel</PillButton>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------- TASKS ---------------------------------- */

function TasksPage({ data, updateTasks }) {
  const { theme } = useTheme();
  const [text, setText] = useState("");
  const [subject, setSubject] = useState(data.subjects[0]?.name || "");
  const [priority, setPriority] = useState("medium");
  const tKey = todayKey();

  const todayTasks = data.tasks.filter((t) => t.date === tKey);
  const done = todayTasks.filter((t) => t.completed).length;
  const pct = todayTasks.length ? Math.round((done / todayTasks.length) * 100) : 0;

  function addTask() {
    if (!text.trim()) return;
    updateTasks([...data.tasks, { id: uid(), text: text.trim(), subject, priority, completed: false, date: tKey }]);
    setText("");
  }
  function toggle(id) {
    updateTasks(data.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }
  function remove(id) {
    updateTasks(data.tasks.filter((t) => t.id !== id));
  }

  const priorityMeta = { high: { emoji: "🔴", color: "pink" }, medium: { emoji: "🟡", color: "yellow" }, low: { emoji: "🟢", color: "mint" } };

  const inputStyle = {
    background: theme.cardSoft, border: `1px solid ${theme.border}`, borderRadius: 14,
    padding: "8px 12px", fontFamily: BODY_FONT, color: theme.text, outline: "none",
  };

  const sorted = [...todayTasks].sort((a, b) => a.completed - b.completed);

  return (
    <div>
      <SectionTitle icon={CheckSquare}>Tasks</SectionTitle>

      <Card className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <p style={{ fontFamily: BODY_FONT, fontSize: 13, color: theme.textSoft }}>Today's Progress</p>
          <p style={{ fontFamily: HEADING_FONT, color: theme.text }}>{done} / {todayTasks.length} tasks completed</p>
        </div>
        <div className="w-full h-3 rounded-full" style={{ background: theme.border }}>
          <div className="h-3 rounded-full transition-all" style={{ width: `${pct}%`, background: theme.mintDeep }} />
        </div>
      </Card>

      <Card className="mb-5">
        <div className="flex flex-wrap gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} style={{ ...inputStyle, flex: "1 1 200px" }} placeholder="Add a task..." />
          <select value={subject} onChange={(e) => setSubject(e.target.value)} style={inputStyle}>
            {data.subjects.map((s) => <option key={s.id} value={s.name}>{s.emoji} {s.name}</option>)}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
          <PillButton colorKey="pink" onClick={addTask}><Plus size={16} /></PillButton>
        </div>
      </Card>

      <div className="space-y-2">
        {sorted.length === 0 && (
          <p style={{ fontFamily: BODY_FONT, color: theme.textSoft, fontSize: 14 }}>No tasks yet — add your first study task above. 🌱</p>
        )}
        {sorted.map((t) => (
          <Card key={t.id} className="flex items-center justify-between" style={{ opacity: t.completed ? 0.6 : 1 }}>
            <div className="flex items-center gap-3">
              <button onClick={() => toggle(t.id)} style={{
                width: 22, height: 22, borderRadius: 7, border: `2px solid ${theme.pinkDeep}`,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: t.completed ? theme.pinkDeep : "transparent",
              }}>
                {t.completed && <Check size={14} color="white" />}
              </button>
              <div>
                <p style={{ fontFamily: BODY_FONT, color: theme.text, textDecoration: t.completed ? "line-through" : "none" }}>{t.text}</p>
                <p style={{ fontFamily: BODY_FONT, fontSize: 11, color: theme.textSoft }}>{t.subject}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PillButton small colorKey={priorityMeta[t.priority].color}>{priorityMeta[t.priority].emoji}</PillButton>
              <IconGhostButton icon={Trash2} onClick={() => remove(t.id)} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- STREAK ---------------------------------- */

function StreakPage({ data }) {
  const { theme } = useTheme();
  const goalHours = data.settings.dailyGoalHours;
  const { current, longest } = computeStreaks(data.dailyLogs, goalHours);

  const weeks = 15;
  const totalDays = weeks * 7;
  const start = addDays(new Date(), -(totalDays - 1));
  const startSunday = addDays(start, -start.getDay());
  const grid = [];
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      col.push(addDays(startSunday, w * 7 + d));
    }
    grid.push(col);
  }

  function cellColor(date) {
    if (date > new Date()) return "transparent";
    const k = dateKey(date);
    const log = data.dailyLogs[k];
    if (!log) return theme.cardSoft;
    if (!dayQualifies(log, goalHours)) return theme.border;
    if (log.mood === "excellent") return theme.yellowDeep;
    if (log.mood === "good") return theme.mintDeep;
    return theme.pinkDeep;
  }

  return (
    <div>
      <SectionTitle icon={Flame}>Study Streak</SectionTitle>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card style={{ background: theme.peach }} className="text-center">
          <p style={{ fontSize: 30 }}>🔥</p>
          <p style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft }}>Current Streak</p>
          <p style={{ fontFamily: HEADING_FONT, fontSize: 24, color: theme.text }}>{current} Days</p>
        </Card>
        <Card style={{ background: theme.yellow }} className="text-center">
          <p style={{ fontSize: 30 }}>🏆</p>
          <p style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft }}>Longest Streak</p>
          <p style={{ fontFamily: HEADING_FONT, fontSize: 24, color: theme.text }}>{longest} Days</p>
        </Card>
      </div>

      <Card>
        <p style={{ fontFamily: BODY_FONT, fontSize: 13, color: theme.textSoft, marginBottom: 10 }}>Last {weeks} weeks</p>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {grid.map((col, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {col.map((d, di) => (
                <div
                  key={di}
                  title={dateKey(d)}
                  style={{ width: 13, height: 13, borderRadius: 4, background: cellColor(d) }}
                />
              ))}
            </div>
          ))}
        </div>
        <p style={{ fontFamily: BODY_FONT, fontSize: 11, color: theme.textSoft, marginTop: 8 }}>
          A day counts toward your streak if you hit your study goal or complete at least one Pomodoro.
        </p>
      </Card>
    </div>
  );
}

/* ---------------------------------- SETTINGS ---------------------------------- */

function SettingsPage({ data, updateSettings, resetAll, exportData }) {
  const { theme } = useTheme();
  const s = data.settings;

  const inputStyle = {
    background: theme.cardSoft, border: `1px solid ${theme.border}`, borderRadius: 14,
    padding: "8px 12px", fontFamily: BODY_FONT, color: theme.text, outline: "none", width: 100,
  };

  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="space-y-5">
      <SectionTitle icon={SettingsIcon}>Settings</SectionTitle>

      <Card>
        <p style={{ fontFamily: HEADING_FONT, fontSize: 16, color: theme.text, marginBottom: 10 }}>🎯 Daily Goal</p>
        <div className="flex items-center gap-2">
          <input type="number" min="1" value={s.dailyGoalHours} onChange={(e) => updateSettings({ dailyGoalHours: +e.target.value })} style={inputStyle} />
          <span style={{ fontFamily: BODY_FONT, color: theme.textSoft }}>hours per day</span>
        </div>
      </Card>

      <Card>
        <p style={{ fontFamily: HEADING_FONT, fontSize: 16, color: theme.text, marginBottom: 10 }}>🍅 Pomodoro</p>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft }}>Focus (min)</span>
            <input type="number" value={s.focusMin} onChange={(e) => updateSettings({ focusMin: +e.target.value })} style={inputStyle} />
          </label>
          <label className="flex flex-col gap-1">
            <span style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft }}>Short break (min)</span>
            <input type="number" value={s.shortBreakMin} onChange={(e) => updateSettings({ shortBreakMin: +e.target.value })} style={inputStyle} />
          </label>
          <label className="flex flex-col gap-1">
            <span style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft }}>Long break (min)</span>
            <input type="number" value={s.longBreakMin} onChange={(e) => updateSettings({ longBreakMin: +e.target.value })} style={inputStyle} />
          </label>
          <label className="flex flex-col gap-1">
            <span style={{ fontFamily: BODY_FONT, fontSize: 12, color: theme.textSoft }}>Sessions before long break</span>
            <input type="number" value={s.sessionsBeforeLong} onChange={(e) => updateSettings({ sessionsBeforeLong: +e.target.value })} style={inputStyle} />
          </label>
        </div>
      </Card>

      <Card>
        <p style={{ fontFamily: HEADING_FONT, fontSize: 16, color: theme.text, marginBottom: 10 }}>🎨 Appearance</p>
        <div className="flex gap-2">
          <PillButton colorKey="yellow" active={s.theme === "light"} onClick={() => updateSettings({ theme: "light" })}>
            <span className="flex items-center gap-1"><Sun size={14} /> Light pastel</span>
          </PillButton>
          <PillButton colorKey="lavender" active={s.theme === "dark"} onClick={() => updateSettings({ theme: "dark" })}>
            <span className="flex items-center gap-1"><Moon size={14} /> Dark cozy</span>
          </PillButton>
        </div>
      </Card>

      <Card>
        <p style={{ fontFamily: HEADING_FONT, fontSize: 16, color: theme.text, marginBottom: 10 }}>🔔 Notifications</p>
        <PillButton colorKey={s.notifications ? "mint" : "lavender"} onClick={() => updateSettings({ notifications: !s.notifications })}>
          <span className="flex items-center gap-1">{s.notifications ? <Bell size={14} /> : <BellOff size={14} />} Timer notifications {s.notifications ? "on" : "off"}</span>
        </PillButton>
      </Card>

      <Card>
        <p style={{ fontFamily: HEADING_FONT, fontSize: 16, color: theme.text, marginBottom: 10 }}>💾 Data</p>
        <div className="flex flex-wrap gap-2">
          <PillButton colorKey="blue" onClick={exportData}><span className="flex items-center gap-1"><Download size={14} /> Export study data</span></PillButton>
          {!confirmReset ? (
            <PillButton colorKey="pink" onClick={() => setConfirmReset(true)}>Reset all data</PillButton>
          ) : (
            <>
              <PillButton colorKey="pink" onClick={() => { resetAll(); setConfirmReset(false); }}>Confirm reset — this can't be undone</PillButton>
              <PillButton colorKey="lavender" onClick={() => setConfirmReset(false)}>Cancel</PillButton>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------- APP ---------------------------------- */

export default function App() {
  useGoogleFonts();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const loadedRef = useRef(false);
  const [quote] = useState(() => QUOTES[new Date().getDate() % QUOTES.length]);

  useEffect(() => {
    (async () => {
      const d = await loadData();
      setData(d);
      loadedRef.current = true;
    })();
  }, []);

  useEffect(() => {
    if (!loadedRef.current || !data) return;
    saveData(data);
  }, [data]);

  const saveDayLog = useCallback((key, log) => {
    setData((prev) => ({ ...prev, dailyLogs: { ...prev.dailyLogs, [key]: { ...prev.dailyLogs[key], ...log } } }));
  }, []);
  const updateSubjects = useCallback((subjects) => setData((prev) => ({ ...prev, subjects })), []);
  const updateTasks = useCallback((tasks) => setData((prev) => ({ ...prev, tasks })), []);
  const updateSettings = useCallback((patch) => setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } })), []);

  const resetAll = useCallback(() => setData(defaultData()), []);
  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-tracker-export-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const theme = data ? (data.settings.theme === "dark" ? PALETTE_DARK : PALETTE_LIGHT) : PALETTE_LIGHT;

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: PALETTE_LIGHT.bg, fontFamily: BODY_FONT }}>
        <p style={{ color: PALETTE_LIGHT.textSoft }}>Loading your study nook... 🌷</p>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme }}>
      <div style={{ background: theme.bg, minHeight: "100vh", fontFamily: BODY_FONT }} className="flex">
        <Sidebar tab={tab} setTab={setTab} />
        <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto w-full">
          {tab === "dashboard" && <Dashboard data={data} setTab={setTab} quote={quote} />}
          {tab === "calendar" && <CalendarPage data={data} saveDayLog={saveDayLog} />}
          {tab === "pomodoro" && <PomodoroPage data={data} saveDayLog={saveDayLog} updateSettings={updateSettings} />}
          {tab === "performance" && <PerformancePage data={data} />}
          {tab === "subjects" && <SubjectsPage data={data} updateSubjects={updateSubjects} />}
          {tab === "tasks" && <TasksPage data={data} updateTasks={updateTasks} />}
          {tab === "streak" && <StreakPage data={data} />}
          {tab === "settings" && <SettingsPage data={data} updateSettings={updateSettings} resetAll={resetAll} exportData={exportData} />}
        </div>
        <MobileNav tab={tab} setTab={setTab} />
      </div>
    </ThemeContext.Provider>
  );
}
