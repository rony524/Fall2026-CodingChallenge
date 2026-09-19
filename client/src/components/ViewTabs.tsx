import "./ViewTabs.css";

export type ViewOption = "discover" | "collections" | "friends";

interface ViewTabsProps {
  active: ViewOption;
  onChange: (view: ViewOption) => void;
}

const TABS: { id: ViewOption; label: string }[] = [
  { id: "discover", label: "Discover" },
  { id: "collections", label: "Collections" },
  { id: "friends", label: "Friends" },
];

export function ViewTabs({ active, onChange }: ViewTabsProps) {
  return (
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
