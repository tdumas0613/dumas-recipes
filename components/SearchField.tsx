"use client";

import { useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { INGREDIENT_CATEGORIES } from "@/content/taxonomy";
import type { IngredientSearchEntry } from "@/content/recipes";

/**
 * One search field. Typing filters recipes by title and by ingredient.
 * The panel only appears once there's something typed that matches an
 * ingredient name — it's a spelling aid, not a browse surface. Picking a
 * suggestion just puts its name in the box.
 */
export function SearchField({
  query,
  setQuery,
  ingredientIndex,
}: {
  query: string;
  setQuery: (q: string) => void;
  ingredientIndex: IngredientSearchEntry[];
}) {
  const [dismissed, setDismissed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const q = query.trim().toLowerCase();

  const groups = useMemo(() => {
    if (!q) return [];
    const hits = ingredientIndex.filter((i) => i.item.includes(q) && i.item !== q);
    return INGREDIENT_CATEGORIES.map(({ key, label }) => ({
      key,
      label,
      items: hits.filter((i) => i.category === key),
    })).filter((g) => g.items.length);
  }, [q, ingredientIndex]);

  const flat = groups.flatMap((g) => g.items);
  const showPanel = !dismissed && flat.length > 0;

  const pick = (item: string) => {
    setQuery(item);
    setDismissed(true);
    inputRef.current?.blur();
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (flat.length === 1) pick(flat[0].item);
      else setDismissed(true);
    }
    if (e.key === "Escape") {
      setDismissed(true);
      inputRef.current?.blur();
    }
  };

  return (
    <>
      {showPanel && <div className="scrim" onClick={() => setDismissed(true)} />}
      <div className="combo">
        <div className="box" data-open={showPanel} onClick={() => inputRef.current?.focus()}>
          <Search size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setDismissed(false);
            }}
            onKeyDown={onKey}
            placeholder="Search by name, or by an ingredient"
            aria-label="Search recipes"
          />
          {query && (
            <button
              className="boxclear"
              onClick={(e) => {
                e.stopPropagation();
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {showPanel && (
          <div className="panel">
            <div className="list">
              {groups.map((g) => (
                <div className="group" key={g.key}>
                  <h4>{g.label}</h4>
                  {g.items.map((entry) => (
                    <button key={entry.item} className="opt" onClick={() => pick(entry.item)}>
                      <span>{entry.item}</span>
                      <span className="n">{entry.count}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
