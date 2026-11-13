"use client";
import { useState } from "react";
import { ArrowRight, Play, RotateCcw } from "lucide-react";
const steps = [
  {
    label: "Run synchronous code",
    stack: 'console.log("A")',
    queue: "Promise callback waits",
    output: "A",
    copy: "JavaScript runs the current synchronous work first. The Promise callback is queued as a microtask.",
  },
  {
    label: "Finish the current stack",
    stack: 'console.log("C")',
    queue: "Promise callback waits",
    output: "A → C",
    copy: "Scheduling a Promise callback does not interrupt synchronous code. C is logged before the callback runs.",
  },
  {
    label: "Drain microtasks",
    stack: 'Promise callback → "B"',
    queue: "Microtask queue is empty",
    output: "A → C → B",
    copy: "Once the current stack is empty, the microtask runs. The result is A, C, B—not the order the lines appear in.",
  },
];
export default function Concept() {
  const [step, setStep] = useState(0);
  return (
    <div className="concept">
      <div className="eyebrow">CONCEPT LAB · JAVASCRIPT</div>
      <h3>
        Make the event loop <em>click.</em>
      </h3>
      <p>A tiny experiment. A much clearer mental model.</p>
      <div className="experiment">
        <pre>
          {
            'console.log("A");\nPromise.resolve().then(() => console.log("B"));\nconsole.log("C");'
          }
        </pre>
        <div className="flow">
          <div key={step} className="flow-node">
            <small>CALL STACK</small>
            <strong>{steps[step].stack}</strong>
          </div>
          <ArrowRight size={18} />
          <div className="flow-node">
            <small>OUTPUT</small>
            <strong>{steps[step].output}</strong>
          </div>
        </div>
        <p className="explain" aria-live="polite">
          {steps[step].copy}
        </p>
        <div className="spread">
          <span className="muted">
            0{step + 1} / 03 · {steps[step].label}
          </span>
          <button
            className="button small"
            onClick={() => setStep((step + 1) % 3)}
          >
            {step === 2 ? <RotateCcw size={14} /> : <Play size={14} />}{" "}
            {step === 2 ? "Replay" : "Next step"}
          </button>
        </div>
      </div>
    </div>
  );
}
