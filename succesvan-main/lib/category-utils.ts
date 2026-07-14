import mongoose from "mongoose";
import connect from "@/lib/data";
import Category from "@/model/category";
import { categoryNameToSlug } from "@/lib/category-slug";

export { categoryNameToSlug };

export interface CategoryProperty {
  key: string;
  value: string;
}

export interface CategoryRule {
  key?: string;
  value?: string;
}

export interface CategoryPricingTier {
  minDays: number;
  maxDays: number;
  pricePerDay: number;
}

export interface CategoryDetail {
  _id: string;
  name: string;
  description?: string;
  purpose?: string;
  expert?: string;
  image: string;
  video?: string;
  type?: { _id?: string; name?: string } | string;
  showPrice: number;
  selloffer?: number;
  status: "active" | "inactive";
  properties?: CategoryProperty[];
  rules?: CategoryRule[];
  requiredLicense: string;
  pricingTiers?: CategoryPricingTier[];
  extrahoursRate: number;
  fuel: "gas" | "diesel" | "electric" | "hybrid";
  gear: {
    availableTypes: string[];
    automaticExtraCost: number;
  };
  seats: number;
  doors: number;
  createdAt?: string;
  updatedAt?: string;
}

type CategoryApiItem = Partial<CategoryDetail> & {
  name?: string;
};

function resolveSlug(category: CategoryApiItem): string {
  return categoryNameToSlug(category.name || "");
}

function toPlainCategories(docs: unknown): unknown {
  return JSON.parse(JSON.stringify(docs));
}

export async function fetchAllCategories(): Promise<CategoryDetail[]> {
  try {
    await connect();
    const categories = await Category.find({ status: "active" })
      .sort({ showPrice: 1 })
      .populate({ path: "type", options: { strictPopulate: false } })
      .lean();

    const plain = toPlainCategories(categories) as CategoryApiItem[];
    return plain.map(
      (c) => ({ ...c, slug: resolveSlug(c) }) as CategoryDetail & { slug: string },
    );
  } catch (error) {
    console.log("Error fetching all categories:", error);
    return [];
  }
}

export async function fetchCategoryBySlug(
  slugOrId: string,
): Promise<CategoryDetail | null> {
  try {
    const cleaned = (slugOrId || "").split(/[?#]/)[0].trim();
    if (!cleaned) return null;

    await connect();

    let category = mongoose.Types.ObjectId.isValid(cleaned)
      ? await Category.findById(cleaned)
          .populate({ path: "type", options: { strictPopulate: false } })
          .lean()
      : null;

    if (!category) {
      const requestedSlug = categoryNameToSlug(cleaned);
      const candidates = await Category.find({})
        .populate({ path: "type", options: { strictPopulate: false } })
        .lean();
      category =
        candidates.find((c) => categoryNameToSlug(c.name) === requestedSlug) ||
        null;
    }

    if (!category) return null;

    const plain = toPlainCategories(category) as CategoryApiItem;
    return { ...plain, slug: resolveSlug(plain) } as CategoryDetail;
  } catch (error) {
    console.log("Error fetching category by slug:", error);
    return null;
  }
}

export function generateCategoryProductSchema(
  category: CategoryDetail,
  siteUrl: string,
) {
  const url = `${siteUrl}/categories/${categoryNameToSlug(category.name)}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: category.name,
    description: category.description || category.purpose || category.name,
    image: category.image ? [category.image] : undefined,
    brand: {
      "@type": "Organization",
      name: "Success Van Hire",
    },
    additionalProperty: (category.properties || []).map((p) => ({
      "@type": "PropertyValue",
      name: p.key,
      value: p.value,
    })),
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      price: category.showPrice,
      availability: "https://schema.org/InStock",
      url,
    },
  };
}

export function generateCategoryBreadcrumbSchema(
  siteUrl: string,
  categoryName: string,
  slug: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Categories",
        item: `${siteUrl}/categories`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryName,
        item: `${siteUrl}/categories/${slug}`,
      },
    ],
  };
}
