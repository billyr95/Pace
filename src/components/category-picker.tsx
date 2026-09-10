"use client";

import { useState } from "react";
import { ChevronDown, Circle } from "lucide-react";
import { INCOME_ROOT_CATEGORIES, GOAL_ROOT_CATEGORIES } from "@/lib/default-categories";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

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
  const isSelected = value === node.id;
  const isParent = node.children.length > 0;

  return (
    <>
      <CommandItem
        value={node.id}
        onSelect={() => onSelect(node.id)}
        style={{ paddingLeft: `${0.5 + depth * 0.9}rem` }}
        className={
          isSelected
            ? "bg-brand-green/10 font-semibold text-ink"
            : isParent
              ? "font-medium text-ink/80"
              : "text-secondary"
        }
      >
        {showIcon && node.icon && <span className="text-sm leading-none">{node.icon}</span>}
        {node.name}
      </CommandItem>
      {node.children.map((child) => (
        <OptionNode key={child.id} node={child} depth={depth + 1} value={value} onSelect={onSelect} />
      ))}
    </>
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
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"spent" | "income" | "goals">(() => {
    const containingRoot = value ? findRootContaining(categories, value) : null;
    if (containingRoot && INCOME_ROOT_CATEGORIES.has(containingRoot.name)) return "income";
    if (containingRoot && GOAL_ROOT_CATEGORIES.has(containingRoot.name)) return "goals";
    return "spent";
  });

  const hasIncomeGroups = categories.some((g) => INCOME_ROOT_CATEGORIES.has(g.name));
  const hasGoalGroups = categories.some((g) => GOAL_ROOT_CATEGORIES.has(g.name));
  const hasTabs = hasIncomeGroups || hasGoalGroups;

  const query = search.trim().toLowerCase();
  const searchResults = query
    ? flattenSelectable(categories)
        .filter((o) => o.name.toLowerCase().includes(query))
        .sort((a, b) => a.name.localeCompare(b.name))
    : null;

  function bucketOf(name: string): "income" | "goals" | "spent" {
    if (INCOME_ROOT_CATEGORIES.has(name)) return "income";
    if (GOAL_ROOT_CATEGORIES.has(name)) return "goals";
    return "spent";
  }

  const visibleGroups = hasTabs ? categories.filter((g) => bucketOf(g.name) === tab) : categories;
  const tabs = (["spent", "income", "goals"] as const).filter(
    (t) => t === "spent" || (t === "income" && hasIncomeGroups) || (t === "goals" && hasGoalGroups),
  );
  const tabLabel: Record<"spent" | "income" | "goals", string> = {
    spent: "Spent",
    income: "Money In",
    goals: "Goals",
  };

  return (
    <Command shouldFilter={false} className="h-full min-h-0 w-full flex-1">
      {/* No autoFocus — opening the keyboard immediately eats most of the sheet's height
          before the user has even seen the list; let them tap in to search if they want it. */}
      <CommandInput value={search} onValueChange={setSearch} placeholder="Search categories…" />
      <CommandList className="max-h-none flex-1">
        {searchResults ? (
          searchResults.length > 0 ? (
            searchResults.map((option) => (
              <CommandItem
                key={option.id}
                value={option.id}
                onSelect={() => select(option.id)}
                className={value === option.id ? "bg-brand-green/10 font-semibold text-ink" : "text-secondary"}
              >
                <span className="text-sm leading-none">{option.icon}</span>
                <span className="flex-1 truncate">{option.name}</span>
                {option.breadcrumb && (
                  <span className="shrink-0 text-[11px] text-secondary">{option.breadcrumb}</span>
                )}
              </CommandItem>
            ))
          ) : (
            <CommandEmpty>No matching categories</CommandEmpty>
          )
        ) : (
          <>
            <CommandItem
              value="uncategorized"
              onSelect={() => select(null)}
              className={!value ? "font-semibold text-ink" : "text-secondary"}
            >
              <Circle size={12} className="text-secondary" />
              Uncategorized
            </CommandItem>

            {hasTabs && (
              <div className="mt-1 flex gap-1 border-y border-divider bg-muted/60 px-2 py-1.5">
                {tabs.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                      tab === t ? "bg-brand-dark text-brand-paper" : "text-secondary hover:bg-muted"
                    }`}
                  >
                    {tabLabel[t]}
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
                <CommandGroup
                  key={group.id}
                  heading={
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-secondary uppercase">
                      <span className="text-sm leading-none normal-case">{group.icon}</span>
                      {group.name}
                    </span>
                  }
                >
                  {group.children.map((child) => (
                    <OptionNode key={child.id} node={child} depth={0} value={value} onSelect={select} />
                  ))}
                </CommandGroup>
              ),
            )}
          </>
        )}
      </CommandList>
    </Command>
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
  const selected = findSelected(categories, value);

  function select(id: string | null) {
    onChange(id);
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="flex items-center gap-1.5 rounded-full border border-divider bg-muted px-2.5 py-1 text-xs font-medium text-secondary transition hover:border-brand-green/50">
        {selected ? (
          <>
            <span className="text-sm leading-none">{selected.icon}</span>
            <span className="max-w-[9rem] truncate">{selected.name}</span>
          </>
        ) : (
          <>
            <Circle size={12} className="text-secondary" />
            <span>Uncategorized</span>
          </>
        )}
        <ChevronDown size={13} className={`text-secondary transition-transform ${open ? "rotate-180" : ""}`} />
      </SheetTrigger>
      <SheetContent side="bottom" className="mx-auto flex h-dvh max-w-md flex-col gap-0 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Choose a category</SheetTitle>
        </SheetHeader>
        <DropdownPanel categories={categories} value={value} select={select} />
      </SheetContent>
    </Sheet>
  );
}
