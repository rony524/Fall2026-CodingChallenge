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
          (not conditionally rendering the element) is what lets the slide transition run. */}
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
