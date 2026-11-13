"use client";
import { useEffect, useState, useCallback } from "react";
import {
  BookOpen,
  Braces,
  Bookmark,
  BriefcaseBusiness,
  Sparkles,
  Mic,
  ArrowUpRight,
  ArrowRight,
  Search,
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
  Plus,
  Check,
  Copy,
  Layers,
  Code2,
  Network,
  BrainCircuit,
  MessagesSquare,
  Server,
  Hexagon,
  Command,
  PanelLeftClose,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  type Skill,
  type Question,
  type Progress,
  type Interview,
  type AskedQuestion,
  type Prompt,
  statuses,
  difficulties,
} from "@/lib/types";
import AuthPanel from "./auth-panel";
import AdminPanel from "./admin-panel";
import {sectionFromHash} from "@/lib/navigation";
import Editor, { type Field } from "./editor";
import Concept from "./concept";
import QuestionCard from "./question-card";
const nav = [
  ["learn", "Learn", BookOpen],
  ["questions", "Questions", Braces],
  ["saved", "My progress", Bookmark],
  ["interviews", "Interviews", BriefcaseBusiness],
  ["prompts", "Prompt library", Sparkles],
  ["voice", "AI interview", Mic],
] as const;
const icons = [
  Code2,
  Layers,
  Braces,
  Server,
  Hexagon,
  BrainCircuit,
  Network,
  MessagesSquare,
];
type Edit = {
  title: string;
  fields: Field[];
  save: (v: Record<string, string>) => Promise<void>;
};
function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}
export default function Workspace() {
  const [view, setView] = useState("learn");
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState(false);
  const [auth, setAuth] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [dark, setDark] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [asked, setAsked] = useState<AskedQuestion[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<Edit | null>(null);
  const [toast, setToast] = useState("");
  const [promptSkill, setPromptSkill] = useState("React");
  const [concept, setConcept] = useState("state and rendering");
  const [level, setLevel] = useState("Intermediate");
  const load = useCallback(async () => {
    setError("");
    const result = await Promise.all([
      supabase.from("skills").select("*").order("sort_order"),
      supabase.from("questions").select("*").order("created_at"),
      supabase.from("prompts").select("*").order("created_at"),
    ]);
    for (const r of result)
      if (r.error) {
        setError(r.error.message);
        setLoading(false);
        return;
      }
    setSkills(result[0].data ?? []);
    setQuestions(result[1].data ?? []);
    setPrompts(result[2].data ?? []);
    setLoading(false);
  }, []);
  const loadPrivate = useCallback(async (u: User | null) => {
    if (!u) {
      setProgress([]);
      setInterviews([]);
      setAsked([]);
      setAdmin(false);
      return;
    }
    const results = await Promise.all([
      supabase.from("question_progress").select("*").eq("user_id", u.id),
      supabase
        .from("interviews")
        .select("*")
        .eq("user_id", u.id)
        .order("created_at", { ascending: false }),
      supabase.from("interview_questions").select("*").eq("user_id", u.id),
      supabase.from("user_roles").select("role").eq("user_id", u.id),
    ]);
    for (const r of results)
      if (r.error) {
        setError(r.error.message);
        return;
      }
    setProgress(results[0].data ?? []);
    setInterviews(results[1].data ?? []);
    setAsked(results[2].data ?? []);
    setAdmin(!!results[3].data?.length);
  }, []);
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setProgress([]);
        setInterviews([]);
        setAsked([]);
        setPrompts((p) => p.filter((x) => x.visibility === "public"));
        setAdmin(false);
        setEditor(null);
      }
      setUser(session?.user ?? null);
      if (event === "PASSWORD_RECOVERY") {
        setRecovery(true);
        setAuth(true);
      }
    });
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    void load();
    void loadPrivate(user);
  }, [user, load, loadPrivate]);
  useEffect(() => {
    const key = window.localStorage.getItem("ib-theme");
    setDark(key === "dark");
    const syncLocation = () => {setView(sectionFromHash(window.location.hash));setQuery('');setEditor(null);};
    syncLocation();
    window.addEventListener('popstate',syncLocation);
    window.addEventListener('hashchange',syncLocation);
    return () => {window.removeEventListener('popstate',syncLocation);window.removeEventListener('hashchange',syncLocation);};
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  function go(v: string) {
    setView(v);
    setQuery("");
    if(sectionFromHash(window.location.hash)!==v) window.history.pushState(null, "", "#" + v);
    setEditor(null);
    window.scrollTo({top:0,behavior:'instant'});
  }
  function requireUser() {
    if (!user) {
      setAuth(true);
      return false;
    }
    return true;
  }
  async function saveProgress(q: Question, patch: Partial<Progress>) {
    if (!requireUser()) return;
    const old = progress.find((p) => p.question_id === q.id);
    const record = {
      user_id: user!.id,
      question_id: q.id,
      bookmarked: false,
      confidence: "Not started",
      notes: "",
      ...old,
      ...patch,
    };
    const { error } = await supabase.from("question_progress").upsert(record);
    fail(error);
    setProgress((p) => [...p.filter((x) => x.question_id !== q.id), record]);
    setToast("Progress saved");
  }
  function questionEditor(q?: Question) {
    setEditor({
      title: q ? "Edit question" : "New question",
      fields: [
        { name: "title", label: "Question", value: q?.title, required: true },
        {
          name: "skill_id",
          label: "Skill",
          options: skills.map((s) => s.id),
          value: q?.skill_id,
        },
        {
          name: "difficulty",
          label: "Difficulty",
          options: difficulties,
          value: q?.difficulty,
        },
        {
          name: "answer",
          label: "Short answer",
          type: "textarea",
          required: true,
          value: q?.answer,
        },
        {
          name: "explanation",
          label: "Explanation",
          type: "textarea",
          value: q?.explanation,
        },
        {
          name: "example",
          label: "Example",
          type: "textarea",
          value: q?.example,
        },
        {
          name: "status",
          label: "Publication status",
          options: ["draft", "published", "archived"],
          value: q?.status,
        },
      ],
      save: async (v) => {
        const r = q
          ? await supabase.from("questions").update(v).eq("id", q.id)
          : await supabase.from("questions").insert(v);
        fail(r.error);
        await load();
        setToast("Question saved");
      },
    });
  }
  function interviewEditor(item?: Interview) {
    if (!requireUser()) return;
    const localDate = item?.scheduled_at
      ? new Date(
          new Date(item.scheduled_at).getTime() -
            new Date(item.scheduled_at).getTimezoneOffset() * 60000,
        )
          .toISOString()
          .slice(0, 16)
      : "";
    setEditor({
      title: item ? "Edit interview" : "Add an interview",
      fields: [
        {
          name: "company",
          label: "Company",
          required: true,
          value: item?.company,
        },
        {
          name: "role_title",
          label: "Role",
          required: true,
          value: item?.role_title,
        },
        {
          name: "status",
          label: "Status",
          options: statuses,
          value: item?.status,
        },
        { name: "round_name", label: "Current round", value: item?.round_name },
        {
          name: "scheduled_at",
          label: "Next interview (your local time)",
          type: "datetime-local",
          value: localDate,
        },
        {
          name: "notes",
          label: "Private notes",
          type: "textarea",
          value: item?.notes,
        },
      ],
      save: async (v) => {
        const record = {
          ...v,
          user_id: user!.id,
          scheduled_at: v.scheduled_at
            ? new Date(v.scheduled_at).toISOString()
            : null,
        };
        const r = item
          ? await supabase.from("interviews").update(record).eq("id", item.id)
          : await supabase.from("interviews").insert(record);
        fail(r.error);
        await loadPrivate(user);
        setToast("Interview saved");
      },
    });
  }
  function askedEditor(interview: Interview, item?: AskedQuestion) {
    setEditor({
      title: item ? "Edit interview question" : "Record a question asked",
      fields: [
        {
          name: "title",
          label: "Question",
          required: true,
          value: item?.title,
        },
        {
          name: "skill_id",
          label: "Skill",
          options: skills.map((s) => s.id),
          value: item?.skill_id,
        },
        {
          name: "difficulty",
          label: "Difficulty",
          options: difficulties,
          value: item?.difficulty,
        },
        {
          name: "round_name",
          label: "Round",
          value: item?.round_name ?? interview.round_name,
        },
        {
          name: "answer",
          label: "Your answer / notes",
          type: "textarea",
          value: item?.answer,
        },
      ],
      save: async (v) => {
        const record = { ...v, user_id: user!.id, interview_id: interview.id };
        const r = item
          ? await supabase
              .from("interview_questions")
              .update(record)
              .eq("id", item.id)
          : await supabase.from("interview_questions").insert(record);
        fail(r.error);
        await loadPrivate(user);
        setToast("Question saved privately");
      },
    });
  }
  function promptEditor(p?: Prompt, publicPrompt = false) {
    if (!requireUser()) return;
    setEditor({
      title: p
        ? "Edit prompt"
        : publicPrompt
          ? "New public prompt"
          : "New private prompt",
      fields: [
        { name: "title", label: "Title", required: true, value: p?.title },
        {
          name: "category",
          label: "Category",
          required: true,
          value: p?.category,
        },
        {
          name: "template",
          label: "Template — use {{skill}}, {{concept}}, {{level}}",
          type: "textarea",
          required: true,
          value: p?.template,
        },
      ],
      save: async (v) => {
        const r = p
          ? await supabase.from("prompts").update(v).eq("id", p.id)
          : await supabase
              .from("prompts")
              .insert({
                ...v,
                user_id: user!.id,
                visibility: publicPrompt ? "public" : "private",
              });
        fail(r.error);
        await load();
        setToast("Prompt saved");
      },
    });
  }
  const published = questions.filter((q) => q.status === "published");
  const filtered = published.filter(
    (q) =>
      (skill === "all" || q.skill_id === skill) &&
      (difficulty === "all" || q.difficulty === difficulty) &&
      `${q.title} ${q.answer}`.toLowerCase().includes(query.toLowerCase()) &&
      (view !== "saved" ||
        progress.some(
          (p) =>
            p.question_id === q.id &&
            (p.bookmarked || p.confidence !== "Not started" || p.notes),
        )),
  );
  const confident = progress.filter((p) => p.confidence === "Confident").length;
  const visibleSkills = skills.filter((s) =>
    (s.name + " " + s.description).toLowerCase().includes(query.toLowerCase()),
  );
  const titles: Record<string, [string, string]> = {
    learn: [
      "A little practice. A big next step.",
      "Understand the ideas. Find your words. Walk in with confidence.",
    ],
    questions: [
      "Good answers start with understanding.",
      "Explore the questions behind your next opportunity.",
    ],
    saved: [
      "Your progress, one idea at a time.",
      "A quiet place for everything you want to remember.",
    ],
    interviews: [
      "Your next chapter, organized.",
      "Keep the details here. Keep your focus on the conversation.",
    ],
    prompts: [
      "Better prompts. Deeper preparation.",
      "A starting point for your next productive conversation with AI.",
    ],
    voice: [
      "Say it out loud. Find your confidence.",
      "AI voice interview practice is on the roadmap.",
    ],
    admin: [
      "Make every answer count.",
      "Maintain the question library and shared preparation prompts.",
    ],
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          href="#learn"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            go("learn");
          }}
        >
          <span className="brand-icon">
            <MessagesSquare size={23} />
          </span>
          Interview<span>Buddy</span>
        </a>
        <div className="sidebar-label">YOUR PREPARATION SPACE</div>
        <nav>
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={"nav-item " + (view === id ? "active" : "")}
              onClick={() => go(id)}
            >
              <Icon size={19} />
              {label}
              {id === "voice" && <span className="soon">SOON</span>}
            </button>
          ))}
          {admin && (
            <button
              className={"nav-item " + (view === "admin" ? "active" : "")}
              onClick={() => go("admin")}
            >
              <ShieldCheck size={19} />
              Admin
            </button>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="little-note">
            <span>
              Small steps.
              <br />
              <em>Real confidence.</em>
            </span>
            <div className="seedling">✳</div>
            <p>
              You don’t need to know everything. Just keep getting a little
              better.
            </p>
          </div>
          <button
            className="theme-button"
            onClick={() => {
              setDark(!dark);
              localStorage.setItem("ib-theme", !dark ? "dark" : "light");
            }}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}{" "}
            {dark ? "Light appearance" : "Dark appearance"}
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <PanelLeftClose size={17} />
            <span>Workspace</span>
            <span>/</span>
            <strong>
              {view === "admin" ? "Admin" : nav.find((n) => n[0] === view)?.[1]}
            </strong>
          </div>
          <div className="header-actions">
            <button
              className="icon mobile-theme"
              aria-label="Toggle color theme"
              onClick={() => {
                setDark(!dark);
                localStorage.setItem("ib-theme", !dark ? "dark" : "light");
              }}
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <span className="public-label">
              <span /> Open to curious minds
            </span>
            {user ? (
              <>
                <span className="user-name">{user.email?.split("@")[0]}</span>
                <button
                  className="icon"
                  aria-label="Sign out"
                  onClick={async () => {
                    const { error } = await supabase.auth.signOut();
                    if (error) setError(error.message);
                    else go("learn");
                  }}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <button className="button small" onClick={() => setAuth(true)}>
                Sign in <ArrowUpRight size={15} />
              </button>
            )}
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div className="eyebrow">
              {view === "learn"
                ? "A SPACE TO GROW"
                : view === "interviews"
                  ? "YOUR CAREER JOURNEY"
                  : "INTERVIEWBUDDY"}
            </div>
            <h1>{titles[view]?.[0]}</h1>
            <p>{titles[view]?.[1]}</p>
          </div>
          {error && (
            <div className="notice" role="alert">
              {error}{" "}
              <button
                onClick={() => {
                  void load();
                  void loadPrivate(user);
                }}
              >
                Try again
              </button>
            </div>
          )}
          {loading ? (
            <div className="loading">Getting your learning space ready…</div>
          ) : (
            <>
              {view === "learn" && (
                <>
                  <div className="learning-banner">
                    <div>
                      <span className="eyebrow">
                        LEARN IT. EXPLAIN IT. OWN IT.
                      </span>
                      <h2>
                        Prepare for the conversation.
                        <br />
                        <em>Not just the question.</em>
                      </h2>
                      <p>Build real understanding, one concept at a time.</p>
                      <button
                        className="button primary"
                        onClick={() => {
                          setSkill("all");
                          go("questions");
                        }}
                      >
                        Find your first question <ArrowRight size={16} />
                      </button>
                    </div>
                    <div className="hero-diagram" aria-hidden="true">
                      <div className="orbit orbit-one" />
                      <div className="orbit orbit-two" />
                      <div className="diagram-chip chip-understand">
                        <BookOpen size={18} /> understand
                      </div>
                      <div className="diagram-center">
                        <Braces size={36} />
                        <span>aha!</span>
                      </div>
                      <div className="diagram-chip chip-practice">
                        <Command size={17} /> practice
                      </div>
                      <div className="diagram-chip chip-confidence">
                        <Check size={17} /> confidence
                      </div>
                      <span className="spark spark-one">✳</span>
                      <span className="spark spark-two">✦</span>
                    </div>
                  </div>
                  <div className="section-heading">
                    <div>
                      <h2>Find your learning path</h2>
                      <p>{skills.length} skills. Plenty of lightbulb moments.</p>
                    </div>
                    <span className="count-label">
                      {published.length} questions to explore
                    </span>
                  </div>
                  <div className="skill-grid">
                    {visibleSkills.map((s, i) => {
                      const Icon = icons[skills.indexOf(s) % icons.length];
                      const total = published.filter(
                        (q) => q.skill_id === s.id,
                      ).length;
                      return (
                        <button
                          key={s.id}
                          className={"skill-card " + s.color}
                          onClick={() => {
                            setSkill(s.id);
                            go("questions");
                          }}
                        >
                          <div className="card-top">
                            <span className="skill-symbol">
                              <Icon size={27} strokeWidth={1.4} />
                            </span>
                            <span className="module">
                              TRACK {String(i + 1).padStart(2, "0")}
                            </span>
                            <ArrowUpRight size={18} />
                          </div>
                          <h3>{s.name}</h3>
                          <p>{s.description}</p>
                          <div className="card-bottom">
                            <span>{total} questions</span>
                            <span>
                              Explore <ArrowRight size={14} />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="bottom-grid">
                    <Concept />
                    <div className="practice-note">
                      <span className="eyebrow">
                        A LITTLE HELP GOES A LONG WAY
                      </span>
                      <Sparkles size={34} strokeWidth={1.2} />
                      <h3>
                        Don’t start from
                        <br />
                        <em>a blank prompt.</em>
                      </h3>
                      <p>
                        Thoughtful, reusable prompts to explain a tricky idea,
                        simulate an interview, or find the gaps.
                      </p>
                      <button
                        className="text-link"
                        onClick={() => go("prompts")}
                      >
                        Explore the prompt library <ArrowUpRight size={17} />
                      </button>
                    </div>
                  </div>
                </>
              )}
              {(view === "questions" || view === "saved") && (
                <>
                  {view === "saved" && !user ? (
                    <Gate onLogin={() => setAuth(true)} />
                  ) : (
                    <>
                      {view === "saved" && (
                        <div className="stats">
                          <div>
                            <strong>
                              {progress.filter((p) => p.bookmarked).length}
                            </strong>
                            <span>Saved questions</span>
                          </div>
                          <div>
                            <strong>{confident}</strong>
                            <span>Feeling confident</span>
                          </div>
                          <div>
                            <strong>
                              {
                                progress.filter(
                                  (p) => p.confidence === "Needs practice",
                                ).length
                              }
                            </strong>
                            <span>To revisit</span>
                          </div>
                        </div>
                      )}
                      <div className="filters">
                        <div className="search-field">
                          <Search size={18} />
                          <input
                            aria-label="Search questions"
                            placeholder="Search for a question or concept…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                          />
                        </div>
                        <select
                          aria-label="Filter by skill"
                          value={skill}
                          onChange={(e) => setSkill(e.target.value)}
                        >
                          <option value="all">All skills</option>
                          {skills.map((s) => (
                            <option value={s.id} key={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <select
                          aria-label="Filter by difficulty"
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value)}
                        >
                          <option value="all">All levels</option>
                          {difficulties.map((d) => (
                            <option key={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div className="section-heading">
                        <span className="muted">
                          {filtered.length} questions · Take your time. Think
                          before revealing.
                        </span>
                        <button
                          className="text-link"
                          onClick={() => {
                            setSkill("all");
                            setDifficulty("all");
                            setQuery("");
                          }}
                        >
                          Reset filters
                        </button>
                      </div>
                      <div className="question-list">
                        {filtered.map((q) => (
                          <QuestionCard
                            key={q.id + user?.id}
                            question={q}
                            skill={
                              skills.find((s) => s.id === q.skill_id)?.name ??
                              q.skill_id
                            }
                            progress={progress.find(
                              (p) => p.question_id === q.id,
                            )}
                            onSave={(p) => saveProgress(q, p)}
                          />
                        ))}
                      </div>
                      {!filtered.length && (
                        <Empty
                          title={
                            view === "saved"
                              ? "Your collection starts here."
                              : "No questions found."
                          }
                          text={
                            view === "saved"
                              ? "Bookmark a question or record your confidence to see it here."
                              : "Try a broader search or reset your filters."
                          }
                        />
                      )}
                    </>
                  )}
                </>
              )}
              {view === "interviews" &&
                (!user ? (
                  <Gate onLogin={() => setAuth(true)} />
                ) : (
                  <AdminPanel skills={skills} questions={questions} prompts={prompts} onQuestion={questionEditor} onPrompt={promptEditor} onRefresh={load}/>
                ))}
              {view === "prompts" && (
                <>
                  <div className="prompt-settings">
                    <label>
                      Skill
                      <select
                        value={promptSkill}
                        onChange={(e) => setPromptSkill(e.target.value)}
                      >
                        {skills.map((s) => (
                          <option key={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Experience
                      <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                      >
                        {difficulties.map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                    </label>
                    <label className="grow">
                      Concept
                      <input
                        value={concept}
                        onChange={(e) => setConcept(e.target.value)}
                        placeholder="e.g. closures"
                      />
                    </label>
                    <button className="button" onClick={() => promptEditor()}>
                      <Plus size={16} />
                      My prompt
                    </button>
                  </div>
                  <div className="prompt-grid">
                    {prompts.map((p) => {
                      const resolved = p.template
                        .replaceAll("{{skill}}", promptSkill)
                        .replaceAll("{{level}}", level)
                        .replaceAll("{{concept}}", concept || "[your concept]");
                      return (
                        <article className="prompt-card" key={p.id}>
                          <div className="spread">
                            <span className="eyebrow">{p.category}</span>
                            <span className="chip">
                              {p.visibility === "private"
                                ? "Only you"
                                : "Library"}
                            </span>
                          </div>
                          <h3>{p.title}</h3>
                          <p>{resolved}</p>
                          <div className="spread">
                            <button
                              className="text-link"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(resolved);
                                  setToast("Prompt copied");
                                } catch {
                                  setError(
                                    "Clipboard unavailable. Select and copy the prompt text.",
                                  );
                                }
                              }}
                            >
                              <Copy size={15} />
                              Copy prompt
                            </button>
                            {(p.visibility === "private" || admin) && (
                              <button
                                className="text-link"
                                onClick={() => promptEditor(p)}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  <p className="footnote">
                    Customize, copy, and use in your preferred AI tool. Prompts
                    are not executed here.
                  </p>
                </>
              )}
              {view === "voice" && (
                <div className="voice-panel">
                  <span className="chip">ON THE ROADMAP</span>
                  <div className="voice-wave" aria-hidden="true">
                    {[20, 38, 65, 44, 84, 55, 32, 65, 38, 20].map((h, i) => (
                      <span
                        key={i}
                        style={{ height: h, animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                  <h2>
                    Your practice partner.
                    <br />
                    <em>Ready when you are.</em>
                  </h2>
                  <p>
                    We’re planning realistic AI voice conversations with
                    role-specific questions and thoughtful feedback. For now,
                    build your foundation with the question library.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => go("questions")}
                  >
                    Practice with questions <ArrowRight size={16} />
                  </button>
                </div>
              )}
              {view === "admin" &&
                (admin ? (
                  <>
                    <div className="section-heading">
                      <h2>Question library</h2>
                      <button
                        className="button primary"
                        onClick={() => questionEditor()}
                      >
                        <Plus size={16} />
                        New question
                      </button>
                    </div>
                    <div className="admin-list">
                      {questions.map((q) => (
                        <button key={q.id} onClick={() => questionEditor(q)}>
                          <span>
                            <strong>{q.title}</strong>
                            <small>
                              {q.skill_id} · {q.difficulty}
                            </small>
                          </span>
                          <span className="chip">{q.status}</span>
                          <ArrowUpRight size={16} />
                        </button>
                      ))}
                    </div>
                    <div className="section-heading">
                      <h2>Shared prompts</h2>
                      <button
                        className="button"
                        onClick={() => promptEditor(undefined, true)}
                      >
                        <Plus size={16} />
                        New public prompt
                      </button>
                    </div>
                    {prompts
                      .filter((p) => p.visibility === "public")
                      .map((p) => (
                        <button
                          key={p.id}
                          className="admin-prompt"
                          onClick={() => promptEditor(p)}
                        >
                          {p.title}
                          <ArrowUpRight size={16} />
                        </button>
                      ))}
                  </>
                ) : (
                  <Empty
                    title="Admin access required"
                    text="Only an assigned administrator can manage shared content."
                  />
                ))}
            </>
          )}
          <footer>
            <span className="footer-brand">InterviewBuddy</span>
            <span>Built for understanding. Designed for your next step.</span>
            <span>Keep going ↗</span>
          </footer>
        </main>
      </div>
      {auth && (
        <AuthPanel
          recovery={recovery}
          onClose={() => {
            setAuth(false);
            setRecovery(false);
          }}
        />
      )}
      {editor && (
        <Editor
          title={editor.title}
          fields={editor.fields}
          onSave={editor.save}
          onClose={() => setEditor(null)}
        />
      )}{" "}
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
function Gate({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="empty">
      <Bookmark size={32} />
      <h2>A space that remembers you.</h2>
      <p>
        Sign in to save your progress and keep your interview journey private.
      </p>
      <button className="button primary" onClick={onLogin}>
        Sign in to get started <ArrowRight size={16} />
      </button>
    </div>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <BookOpen size={30} />
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
