import { UserCircle } from "lucide-react";
import type { SpendingPersonality } from "@/lib/spending-personality";
import { Card, CardContent } from "@/components/ui/card";

export function SpendingPersonalityCard({ personality }: { personality: SpendingPersonality }) {
  const { biggestCategory, mostConsistent, mostVariable } = personality;
  if (!biggestCategory && !mostConsistent && !mostVariable) return null;

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-1.5">
          <UserCircle size={15} className="text-brand-green" />
          <h2 className="text-sm font-semibold text-secondary/70">Spending personality</h2>
        </div>
        <ul className="mt-2 space-y-2 text-sm">
          {biggestCategory && (
            <li className="flex items-center justify-between">
              <span className="text-secondary/70">Your biggest spending category</span>
              <span className="font-semibold">{biggestCategory.name}</span>
            </li>
          )}
          {mostConsistent && (
            <li className="flex items-center justify-between">
              <span className="text-secondary/70">Your most consistent expense</span>
              <span className="font-semibold">{mostConsistent.name}</span>
            </li>
          )}
          {mostVariable && (
            <li className="flex items-center justify-between">
              <span className="text-secondary/70">Your biggest month-to-month variance</span>
              <span className="font-semibold">{mostVariable.name}</span>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
