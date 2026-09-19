/**
 * A drawer that slides in from the left or right edge, with a dimmed backdrop.
 * It's a generic container: the caller decides what goes inside (Navbar puts its menu
 * and forms here). It closes on Escape, on the × button, and on a backdrop click.
 */
import { useEffect } from "react";
import "./SidePanel.css";

interface SidePanelProps {
    isOpen: boolean,
    onClose: () => void,
    title?: string,
    children: React.ReactNode;
    side?: "left" | "right"

}

export function SidePanel({
    isOpen,
    onClose,
    title,
    children,
    side = "right"
}: SidePanelProps) {

    // While the panel is open: Escape closes it and the page behind it can't scroll.
    // The cleanup runs when it closes (or the component unmounts) and undoes both.
    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }

        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return() => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";

        };
    }, [isOpen, onClose]);

    return(
        <>
      {/* Backdrop: click it to close. Stays in the DOM, just fades opacity/pointer-events. */}
      <div
        className={`side-panel-backdrop ${isOpen ? "is-open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* The panel itself stays mounted at all times — toggling the "is-open" class
          (not conditionally rendering the element) is what lets the slide transition run.
          aria-hidden keeps the closed panel out of the screen-reader tree. */}
      <aside
        className={`side-panel side-panel-${side} ${isOpen ? "is-open" : ""}`}
        aria-hidden={!isOpen}
      >
        <div className="side-panel-header">
          {title && <h2>{title}</h2>}
          <button type="button" className="side-panel-close" onClick={onClose} aria-label="Close menu">
            ×
          </button>
        </div>
        <div className="side-panel-body">{children}</div>
      </aside>
    </>
    );
}
