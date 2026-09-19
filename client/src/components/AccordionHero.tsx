import { useEffect, useRef, useState } from "react";
import "./AccordionHero.css";

interface HeroStep {
  id: string;
  label: string;
  text: string;
  focusX: number; // 0-100 — % position on the image this step "focuses" on
  focusY: number;
}

// The four states of one click-through cycle:
// idle -> focusing (lens appears, image zooms toward the focus point)
//      -> closing  (shutter iris closes to black, centered on the focus point)
//      -> opening  (text has been swapped underneath; iris opens to reveal it)
//      -> idle
type Phase = "idle" | "focusing" | "closing" | "opening";

interface AccordionHeroProps {
  imageUrl: string;
  steps?: HeroStep[];
}

const DEFAULT_STEPS: HeroStep[] = [
  { id: "capture", label: "Capture", text: "Every photo starts as a moment worth keeping. Snap it, and it's already on its way in.", focusX: 30, focusY: 35 },
  { id: "organize", label: "Organize", text: "Sort into albums, tag what matters, and let your library organize itself around how you actually think.", focusX: 68, focusY: 55 },
  { id: "share", label: "Share", text: "Send a link, not a zip file. The people you choose see exactly what you choose.", focusX: 50, focusY: 22 },
];

// Tune these to taste — they're the only thing controlling how the whole sequence feels.
const FOCUS_MS = 550; // lens + zoom settle before the shutter starts
const CLOSE_MS = 260; // iris closing to black
const OPEN_MS = 380; // iris opening to reveal the new text

export function AccordionHero({ imageUrl, steps = DEFAULT_STEPS }: AccordionHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0); // which step is selected (drives the left list + focus point)
  const [displayedIndex, setDisplayedIndex] = useState(0); // which step's TEXT is on screen (swapped mid-shutter)
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<number[]>([]);

  function clearTimers() {
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
  }

  // Cancel any in-flight sequence if the component unmounts mid-animation.
  useEffect(() => clearTimers, []);

  function selectStep(index: number) {
    if (index === activeIndex || phase !== "idle") return; // no-op on repeat clicks or mid-transition

    clearTimers();
    setActiveIndex(index);
    setPhase("focusing");

    const t1 = window.setTimeout(() => setPhase("closing"), FOCUS_MS);
    const t2 = window.setTimeout(() => {
      setDisplayedIndex(index); // swap the text now — the screen is fully black at this instant
      setPhase("opening");
    }, FOCUS_MS + CLOSE_MS);
    const t3 = window.setTimeout(() => setPhase("idle"), FOCUS_MS + CLOSE_MS + OPEN_MS);

    timers.current = [t1, t2, t3];
  }

  const focusStep = steps[activeIndex];
  const displayedStep = steps[displayedIndex];

  return (
    <section className="acc-hero">
      <ul className="acc-hero-steps">
        {steps.map((step, i) => (
          <li key={step.id} className={`acc-hero-step ${i === activeIndex ? "is-active" : ""}`}>
            <span className="acc-hero-step-line" />
            <button type="button" onClick={() => selectStep(i)} disabled={phase !== "idle"}>
              {step.label}
            </button>
          </li>
        ))}
      </ul>

      <div
        className="acc-hero-visual"
        data-phase={phase}
        // CSS custom properties aren't in React's CSSProperties type, hence the cast —
        // this is how the focus point (a % position) reaches every layer below via var(--focus-x/y).
        style={{ "--focus-x": `${focusStep.focusX}%`, "--focus-y": `${focusStep.focusY}%` } as React.CSSProperties}
      >
        <img className="acc-hero-bg" src={imageUrl} alt="" />
        <div className="acc-hero-vignette" />

        <div className="acc-hero-lens" aria-hidden="true">
          <svg width="100%" height="100%" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="46" stroke="#ffffff" strokeWidth="1.5" opacity="0.85" />
            <circle cx="60" cy="60" r="30" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
            <line x1="60" y1="4" x2="60" y2="18" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="60" y1="102" x2="60" y2="116" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="4" y1="60" x2="18" y2="60" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="102" y1="60" x2="116" y2="60" stroke="#ffffff" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="acc-hero-shutter" />

        {/* key={displayedStep.id} remounts this element whenever the displayed step changes,
            which replays its CSS "enter" animation automatically — no extra state needed. */}
        <div className="acc-hero-text" key={displayedStep.id}>
          <h2>{displayedStep.label}</h2>
          <p>{displayedStep.text}</p>
        </div>
      </div>
    </section>
  );
}
