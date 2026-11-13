"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
export type Field = {
  name: string;
  label: string;
  type?: string;
  options?: string[];
  required?: boolean;
  value?: string;
};
export default function Editor({
  title,
  fields,
  onSave,
  onClose,
}: {
  title: string;
  fields: Field[];
  onSave: (data: Record<string, string>) => Promise<void>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog className="modal" ref={ref} onCancel={onClose}>
      <button
        className="icon close"
        onClick={onClose}
        aria-label="Close editor"
      >
        <X />
      </button>
      <h2>{title}</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const values = Object.fromEntries(
            new FormData(e.currentTarget),
          ) as Record<string, string>;
          setBusy(true);
          try {
            await onSave(values);
            onClose();
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Could not save. Please try again.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {fields.map((f) => (
          <label key={f.name}>
            {f.label}
            {f.options ? (
              <select name={f.name} defaultValue={f.value ?? f.options[0]}>
                {f.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                name={f.name}
                defaultValue={f.value}
                required={f.required}
                rows={5}
              />
            ) : (
              <input
                name={f.name}
                type={f.type ?? "text"}
                defaultValue={f.value}
                required={f.required}
                maxLength={500}
              />
            )}
          </label>
        ))}
        {error && (
          <p role="alert" className="notice">
            {error}
          </p>
        )}
        <button className="button primary" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>
    </dialog>
  );
}
