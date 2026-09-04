"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Circle } from "lucide-react";

export type CategoryNode = {
  id: string;
  name: string;
  icon: string;
  children: CategoryNode[];
};

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
        className={`flex w-full items-center gap-1.5 py-1.5 pr-3 text-left text-sm hover:bg-brand-mist/40 ${
          value === node.id ? "bg-brand-green/10 font-semibold text-brand-dark" : "text-brand-forest"
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

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-brand-mist bg-brand-paper px-2.5 py-1 text-xs font-medium text-brand-forest transition hover:border-brand-green/50"
      >
        {selected ? (
          <>
            <span className="text-sm leading-none">{selected.icon}</span>
            <span className="max-w-[9rem] truncate">{selected.name}</span>
          </>
        ) : (
          <>
            <Circle size={12} className="text-brand-forest/40" />
            <span>Uncategorized</span>
          </>
        )}
        <ChevronDown size={13} className={`text-brand-forest/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-1 max-h-80 w-64 overflow-y-auto rounded-xl border border-brand-mist bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-brand-mist/40 ${
              !value ? "font-semibold text-brand-dark" : "text-brand-forest/70"
            }`}
          >
            <Circle size={12} className="text-brand-forest/40" />
            Uncategorized
          </button>

          {categories.map((group) =>
            group.children.length === 0 ? (
              // Old flat categories (pre-hierarchy) have no children — treat as a directly
              // selectable item rather than an inert group header.
              <OptionNode
                key={group.id}
                node={group}
                depth={0}
                value={value}
                showIcon
                onSelect={(id) => {
                  onChange(id);
                  setOpen(false);
                }}
              />
            ) : (
              <div key={group.id} className="mt-1 first:mt-0">
                <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold tracking-wide text-brand-forest/50 uppercase">
                  <span className="text-sm leading-none normal-case">{group.icon}</span>
                  {group.name}
                </div>
                {group.children.map((child) => (
                  <OptionNode
                    key={child.id}
                    node={child}
                    depth={1}
                    value={value}
                    onSelect={(id) => {
                      onChange(id);
                      setOpen(false);
                    }}
                  />
                ))}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
