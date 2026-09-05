"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Circle, Search } from "lucide-react";
import { INCOME_ROOT_CATEGORIES } from "@/lib/default-categories";

export type CategoryNode = {
  id: string;
  name: string;
  icon: string;
  children: CategoryNode[];
};

type FlatOption = { id: string; name: string; icon: string; breadcrumb: string };

function findSelected(
  nodes: CategoryNode[],
  categoryId: string | null,
  topIcon?: string,
): { icon: string; name: string } | null {
  if (!categoryId) return null;
  for (const node of nodes) {
    if (node.id === categoryId) return { icon: topIcon ?? node.icon, name: node.name };
    const found = findSelected(node.children, categoryId, topIcon ?? node.icon);
    if (found) return found;
  }
  return null;
}

/** Flattens the whole tree into selectable leaves/mid-nodes, skipping only root group headers. */
function flattenSelectable(nodes: CategoryNode[], ancestors: { name: string; icon: string }[] = []): FlatOption[] {
  return nodes.flatMap((node) => {
    const isRoot = ancestors.length === 0;
    const icon = isRoot ? node.icon : ancestors[0].icon;
    const isHeaderOnly = isRoot && node.children.length > 0;
    const selfEntry: FlatOption[] = isHeaderOnly
      ? []
      : [{ id: node.id, name: node.name, icon, breadcrumb: ancestors.map((a) => a.name).join(" › ") }];
    const childEntries = flattenSelectable(node.children, [...ancestors, { name: node.name, icon: node.icon }]);
    return [...selfEntry, ...childEntries];
  });
}

function findRootContaining(nodes: CategoryNode[], id: string): CategoryNode | null {
  for (const node of nodes) {
    if (containsId(node, id)) return node;
  }
  return null;
}

function containsId(node: CategoryNode, id: string): boolean {
  if (node.id === id) return true;
  return node.children.some((c) => containsId(c, id));
}

function OptionNode({
  node,
  depth,
  value,
  onSelect,
  showIcon = false,
}: {
  node: CategoryNode;
  depth: number;
  value: string | null;
  onSelect: (id: string) => void;
  showIcon?: boolean;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        style={{ paddingLeft: `${0.75 + depth * 0.9}rem` }}
        className={`flex w-full items-center gap-1.5 py-1.5 pr-3 text-left text-sm hover:bg-muted/40 ${
          value === node.id ? "bg-brand-green/10 font-semibold text-ink" : "text-secondary"
        }`}
      >
        {showIcon && node.icon && <span className="text-sm leading-none">{node.icon}</span>}
        {node.name}
      </button>
      {node.children.map((child) => (
        <OptionNode key={child.id} node={child} depth={depth + 1} value={value} onSelect={onSelect} />
      ))}
    </div>
  );
}

function DropdownPanel({
  categories,
  value,
  select,
}: {
  categories: CategoryNode[];
  value: string | null;
  select: (id: string | null) => void;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"spent" | "income">(() => {
    const containingRoot = value ? findRootContaining(categories, value) : null;
    return containingRoot && INCOME_ROOT_CATEGORIES.has(containingRoot.name) ? "income" : "spent";
  });

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const hasIncomeGroups = categories.some((g) => INCOME_ROOT_CATEGORIES.has(g.name));

  const query = search.trim().toLowerCase();
  const searchResults = query
    ? flattenSelectable(categories)
        .filter((o) => o.name.toLowerCase().includes(query))
        .sort((a, b) => a.name.localeCompare(b.name))
    : null;

  const visibleGroups = hasIncomeGroups
    ? categories.filter((g) => INCOME_ROOT_CATEGORIES.has(g.name) === (tab === "income"))
    : categories;

  return (
    <div className="absolute left-0 z-20 mt-1 w-72 overflow-hidden rounded-xl border border-divider bg-surface shadow-lg">
      <div className="flex items-center gap-1.5 border-b border-divider px-2.5 py-2">
        <Search size={14} className="text-secondary/40" />
        <input
          ref={searchRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories…"
          className="w-full text-sm outline-none placeholder:text-secondary/40"
        />
      </div>

      <div className="max-h-72 overflow-y-auto py-1">
        {searchResults ? (
          searchResults.length > 0 ? (
            searchResults.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => select(option.id)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted/40 ${
                  value === option.id ? "bg-brand-green/10 font-semibold text-ink" : "text-secondary"
                }`}
              >
                <span className="text-sm leading-none">{option.icon}</span>
                <span className="flex-1 truncate">{option.name}</span>
                {option.breadcrumb && (
                  <span className="shrink-0 text-[11px] text-secondary/40">{option.breadcrumb}</span>
                )}
              </button>
            ))
          ) : (
            <p className="px-3 py-4 text-center text-sm text-secondary/50">No matching categories</p>
          )
        ) : (
          <>
            <button
              type="button"
              onClick={() => select(null)}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted/40 ${
                !value ? "font-semibold text-ink" : "text-secondary/70"
              }`}
            >
              <Circle size={12} className="text-secondary/40" />
              Uncategorized
            </button>

            {hasIncomeGroups && (
              <div className="mt-1 flex gap-1 border-y border-divider bg-muted/60 px-2 py-1.5">
                {(["spent", "income"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                      tab === t ? "bg-brand-dark text-brand-paper" : "text-secondary/60 hover:bg-muted"
                    }`}
                  >
                    {t === "spent" ? "Spent" : "Money In"}
                  </button>
                ))}
              </div>
            )}

            {visibleGroups.map((group) =>
              group.children.length === 0 ? (
                // Old flat categories (pre-hierarchy) have no children — treat as a directly
                // selectable item rather than an inert group header.
                <OptionNode key={group.id} node={group} depth={0} value={value} showIcon onSelect={select} />
              ) : (
                <div key={group.id} className="mt-1 first:mt-0">
                  <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold tracking-wide text-secondary/50 uppercase">
                    <span className="text-sm leading-none normal-case">{group.icon}</span>
                    {group.name}
                  </div>
                  {group.children.map((child) => (
                    <OptionNode key={child.id} node={child} depth={1} value={value} onSelect={select} />
                  ))}
                </div>
              ),
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: CategoryNode[];
  value: string | null;
  onChange: (categoryId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const selected = findSelected(categories, value);

  function select(id: string | null) {
    onChange(id);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-divider bg-muted px-2.5 py-1 text-xs font-medium text-secondary transition hover:border-brand-green/50"
      >
        {selected ? (
          <>
            <span className="text-sm leading-none">{selected.icon}</span>
            <span className="max-w-[9rem] truncate">{selected.name}</span>
          </>
        ) : (
          <>
            <Circle size={12} className="text-secondary/40" />
            <span>Uncategorized</span>
          </>
        )}
        <ChevronDown size={13} className={`text-secondary/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && <DropdownPanel categories={categories} value={value} select={select} />}
    </div>
  );
}
