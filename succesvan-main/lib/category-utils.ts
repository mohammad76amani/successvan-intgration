import mongoose from "mongoose";
import connect from "@/lib/data";
import Category from "@/model/category";
import { categoryNameToSlug } from "@/lib/category-slug";
import {
  buildCategorySeoDescription,
  getCategoryFromPrice,
  getCategoryHighestPrice,
  getCategoryTypeName,
  type CategoryDetail,
} from "@/lib/category-detail";

export { categoryNameToSlug };
export {
  buildCategoryFromPriceLabel,
  buildCategoryKeywords,
  buildCategoryPricingSummary,
  buildCategorySeoDescription,
  getCategoryFromPrice,
  getCategoryHighestPrice,
  getCategoryTypeName,
} from "@/lib/category-detail";
export type {
  CategoryDeposit,
  CategoryDetail,
  CategoryPricingTier,
  CategoryProperty,
  CategoryRule,
  CategoryServicesPeriod,
} from "@/lib/category-detail";

type CategoryApiItem = Partial<CategoryDetail> & {
  name?: string;
};

function resolveSlug(category: CategoryApiItem): string {
  return categoryNameToSlug(category.name || "");
}

function toPlainCategories(docs: unknown): unknown {
  return JSON.parse(JSON.stringify(docs));
}

function categoryAdditionalProperties(category: CategoryDetail) {
  const propertyRows = (category.properties || []).map((p) => ({
    "@type": "PropertyValue",
    name: p.key,
    value: p.value,
  }));

  const coreRows = [
    { name: "Seats", value: category.seats },
    { name: "Doors", value: category.doors },
    { name: "Fuel", value: category.fuel },
    {
      name: "Gearbox",
      value: category.gear?.availableTypes?.join(" / "),
    },
    {
      name: "Required licence",
      value: category.requiredLicense,
    },
    {
      name: "Extra hours rate",
      value: category.extrahoursRate
        ? `GBP ${category.extrahoursRate}`
        : undefined,
    },
    {
      name: "Automatic gearbox upgrade",
      value: category.gear?.automaticExtraCost
        ? `GBP ${category.gear.automaticExtraCost} per day`
        : undefined,
    },
  ]
    .filter((item) => item.value !== undefined && item.value !== "")
    .map((item) => ({
      "@type": "PropertyValue",
      name: item.name,
      value: String(item.value),
    }));

  return [...coreRows, ...propertyRows];
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
  const fromPrice = getCategoryFromPrice(category);
  const highPrice = getCategoryHighestPrice(category) || fromPrice;
  const typeName = getCategoryTypeName(category);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: category.name,
    description: buildCategorySeoDescription(category),
    image: category.image ? [category.image] : undefined,
    video: category.video
      ? {
        "@type": "VideoObject",
        name: `${category.name} video tour`,
        description: buildCategorySeoDescription(category),
        thumbnailUrl: category.image,
        contentUrl: category.video,
        uploadDate: category.updatedAt || category.createdAt,
      }
      : undefined,
    category: typeName || "Vehicle rental",
    brand: {
      "@type": "Organization",
      name: "Success Van Hire",
    },
    additionalProperty: categoryAdditionalProperties(category),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "GBP",
      lowPrice: fromPrice,
      highPrice,
      offerCount: Math.max(1, category.pricingTiers?.length || 1),
      availability: "https://schema.org/InStock",
      url,
      seller: {
        "@type": "Organization",
        name: "Success Van Hire",
      },
    },
  };
}

export function generateCategoryRentalServiceSchema(
  category: CategoryDetail,
  siteUrl: string,
) {
  const url = `${siteUrl}/categories/${categoryNameToSlug(category.name)}`;
  const fromPrice = getCategoryFromPrice(category);
  const typeName = getCategoryTypeName(category) || "Vehicle";

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${category.name} Hire London`,
    serviceType: `${typeName} Hire`,
    category: "Vehicle rental",
    url,
    image: category.image,
    description: buildCategorySeoDescription(category),
    provider: {
      "@type": "LocalBusiness",
      name: "Success Van Hire",
      url: siteUrl,
      telephone: "+442030111198",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Strata House, Waterloo Road",
        addressLocality: "London",
        postalCode: "NW2 7UH",
        addressCountry: "GB",
      },
    },
    areaServed: {
      "@type": "City",
      name: "London",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      price: fromPrice,
      url,
      availability: "https://schema.org/InStock",
    },
    additionalProperty: categoryAdditionalProperties(category),
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
