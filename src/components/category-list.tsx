"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Circle, Home, Utensils, Car, ShoppingBag, type LucideIcon } from "lucide-react";

export type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  monthlyLimit: number | null;
  spent: number;
};

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  utensils: Utensils,
  car: Car,
  "shopping-bag": ShoppingBag,
};

function iconFor(name: string) {
  return ICONS[name] ?? Circle;
}

export function CategoryList({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(id: string) {
    const value = Number(draft);
    if (!Number.isFinite(value) || value < 0) return;
    setSaving(true);
    await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyLimit: value }),
    });
    setSaving(false);
    setEditingId(null);
    router.refresh();
  }

  return (
    <ul className="space-y-4">
      {categories.map((category) => {
        const Icon = iconFor(category.icon);
        const limit = category.monthlyLimit ?? 0;
        const pct = limit > 0 ? Math.min(100, Math.round((category.spent / limit) * 100)) : 0;
        const over = limit > 0 && category.spent > limit;

        return (
          <li key={category.id}>
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-mist text-brand-forest">
                <Icon size={16} />
              </span>
              <span className="flex-1 text-sm font-semibold">{category.name}</span>
              {editingId === category.id ? (
                <span className="flex items-center gap-1 text-sm">
                  $
                  <input
                    autoFocus
                    type="number"
                    min={0}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="w-16 rounded border border-brand-mist px-1 py-0.5"
                  />
                  <button
                    onClick={() => save(category.id)}
                    disabled={saving}
                    className="ml-1 font-semibold text-brand-green"
                  >
                    Save
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => {
                    setEditingId(category.id);
                    setDraft(String(limit));
                  }}
                  className="text-xs font-medium text-brand-forest/60 underline"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-brand-mist">
              <div
                className={`h-full rounded-full ${over ? "bg-red-400" : "bg-brand-green"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-brand-forest/60">
              ${category.spent.toLocaleString(undefined, { maximumFractionDigits: 0 })} / $
              {limit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
