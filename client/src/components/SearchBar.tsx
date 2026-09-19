/**
 * The search box with an expandable "Filters" panel, shown under the hero.
 *
 * It keeps the typed query and the chosen filters in its own state and reports them to
 * the parent with `onSearch` only when the form is submitted (Search button or Enter).
 * HomePage does the actual filtering. Currently it matches captions and uses `sortBy`;
 * `orientation` is collected here but not applied yet, since photos carry no size data.
 */
import { useState } from "react";
import "./SearchBar.css";

export interface SearchFilters {
  sortBy: "recent" | "popular";
  orientation: "any" | "portrait" | "landscape";
}

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
}

const DEFAULT_FILTERS: SearchFilters = { sortBy: "recent", orientation: "any" };

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // stop the browser's default full-page form submit
    onSearch(query, filters);
  }

  // A small typed helper so updating one filter field doesn't need a switch
  // statement — `K extends keyof SearchFilters` keeps `value` typed to
  // whichever field `key` actually names.
  function updateFilter<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search photos..."
        className="search-bar-input"
      />

      <div className="search-bar-filters-wrap">
        <button
          type="button"
          className={`search-bar-filters-btn ${filtersOpen ? "is-open" : ""}`}
          onClick={() => setFiltersOpen((prev) => !prev)}
        >
          Filters
        </button>

        {/* Simple show/hide here. If you want it to also close on an outside
            click, reuse the containerRef + mousedown-listener pattern from
            NotificationBell — same problem, same fix. */}
        {filtersOpen && (
          <div className="search-bar-filters-panel">
            <label>
              Sort by
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter("sortBy", e.target.value as SearchFilters["sortBy"])}
              >
                <option value="recent">Most recent</option>
                <option value="popular">Most saved</option>
              </select>
            </label>

            <label>
              Orientation
              <select
                value={filters.orientation}
                onChange={(e) => updateFilter("orientation", e.target.value as SearchFilters["orientation"])}
              >
                <option value="any">Any</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </label>
          </div>
        )}
      </div>

      <button type="submit" className="search-bar-submit">
        Search
      </button>
    </form>
  );
}
