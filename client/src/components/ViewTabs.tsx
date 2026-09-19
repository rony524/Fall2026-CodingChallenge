/**
 * The row of tabs that switches between the three views on the home page
 * (Discover, Collections, Friends). It's a controlled component: the parent owns which
 * tab is active and this only reports clicks through `onChange`.
 */
import "./ViewTabs.css";

// The ids double as the values HomePage switches on to decide which view to render
export type ViewOption = "discover" | "collections" | "friends";

interface ViewTabsProps {
  active: ViewOption;
  onChange: (view: ViewOption) => void;
}

// Order here is the order on screen
const TABS: { id: ViewOption; label: string }[] = [
  { id: "discover", label: "Discover" },
  { id: "collections", label: "Collections" },
  { id: "friends", label: "Friends" },
];

export function ViewTabs({ active, onChange }: ViewTabsProps) {
  return (
    // role="tablist" / role="tab" / aria-selected let screen readers announce these as tabs
    <div className="view-tabs" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`view-tab ${active === tab.id ? "is-active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
