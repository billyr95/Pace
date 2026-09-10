import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchCategoryTree } from "@/lib/category-node";
import { MerchantRuleList, type MerchantRuleData } from "@/components/merchant-rule-list";

export default async function MerchantRulesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [rawRules, categoryGroups] = await Promise.all([
    prisma.merchantRule.findMany({ where: { userId } }),
    fetchCategoryTree(userId),
  ]);

  const rules: MerchantRuleData[] = rawRules.map((r) => {
    const separatorIndex = r.matchKey.lastIndexOf("::");
    return {
      id: r.id,
      merchant: r.matchKey.slice(0, separatorIndex),
      direction: r.matchKey.slice(separatorIndex + 2) === "in" ? "in" : "out",
      categoryId: r.categoryId,
    };
  });

  return (
    <div className="space-y-4 px-5 pt-6">
      <Link href="/profile" className="flex items-center gap-1 text-sm font-medium text-secondary">
        <ChevronLeft size={16} />
        Profile
      </Link>
      <h1 className="text-xl font-black">Auto-categorization rules</h1>
      <MerchantRuleList rules={rules} categories={categoryGroups} />
    </div>
  );
}
