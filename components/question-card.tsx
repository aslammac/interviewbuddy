"use client";
import { useState } from "react";
import { Bookmark, ChevronDown, Check } from "lucide-react";
import type { Question, Progress } from "@/lib/types";
export default function QuestionCard({
  question: q,
  progress,
  skill,
  onSave,
}: {
  question: Question;
  progress?: Progress;
  skill: string;
  onSave: (patch: Partial<Progress>) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(progress?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(p: Partial<Progress>) {
    setBusy(true);
    setError("");
    try {
      await onSave(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className={"question " + (open ? "expanded" : "")}>
      <div className="question-top">
        <button
          className="question-title"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className="meta">
            <span>{skill}</span>
            <span className={"level " + q.difficulty.toLowerCase()}>
              {q.difficulty}
            </span>
            {progress?.confidence === "Confident" && <Check size={14} />}
          </span>
          <h3>{q.title}</h3>
        </button>
        <button
          aria-label={
            progress?.bookmarked ? "Remove bookmark" : "Bookmark question"
          }
          className={"icon " + (progress?.bookmarked ? "selected" : "")}
          disabled={busy}
          onClick={() => save({ bookmarked: !progress?.bookmarked })}
        >
          <Bookmark
            size={18}
            fill={progress?.bookmarked ? "currentColor" : "none"}
          />
        </button>
        <button
          aria-label={open ? "Hide answer" : "Reveal answer"}
          className="icon"
          onClick={() => setOpen(!open)}
        >
          <ChevronDown
            size={18}
            style={{ transform: open ? "rotate(180deg)" : undefined }}
          />
        </button>
      </div>
      {open && (
        <div className="answer">
          <span className="eyebrow">THE SHORT ANSWER</span>
          <p>{q.answer}</p>
          {q.explanation && (
            <>
              <h4>Think of it this way</h4>
              <p>{q.explanation}</p>
            </>
          )}
          {q.example && <pre>{q.example}</pre>}
          <div className="review-actions">
            <span>How does this feel?</span>
            {["Needs practice", "Confident"].map((c) => (
              <button
                key={c}
                disabled={busy}
                className={
                  "chip " + (progress?.confidence === c ? "active" : "")
                }
                onClick={() => save({ confidence: c })}
              >
                {c}
              </button>
            ))}
          </div>
          <label>
            Your private notes
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="An example that helped it click…"
            />
          </label>
          <button
            disabled={busy}
            className="button small"
            onClick={() => save({ notes })}
          >
            {busy ? "Saving…" : "Save notes"}
          </button>
        </div>
      )}
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}
