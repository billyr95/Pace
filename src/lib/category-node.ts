import { prisma } from "@/lib/prisma";
import type { CategoryNode } from "@/components/category-picker";

type RawNode = { id: string; name: string; icon: string; children?: RawNode[] };

function toCategoryNode(raw: RawNode): CategoryNode {
  return { id: raw.id, name: raw.name, icon: raw.icon, children: (raw.children ?? []).map(toCategoryNode) };
}

export async function fetchCategoryTree(userId: string): Promise<CategoryNode[]> {
  const rawCategories = await prisma.category.findMany({
    where: { userId, parentId: null },
    orderBy: { name: "asc" },
    include: {
      children: {
        orderBy: { name: "asc" },
        include: { children: { orderBy: { name: "asc" } } },
      },
    },
  });
  return rawCategories.map(toCategoryNode);
}
