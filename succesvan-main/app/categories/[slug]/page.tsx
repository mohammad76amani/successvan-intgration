import { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { generateOrganizationSchema } from "@/lib/blog-utils";
import {
  categoryNameToSlug,
  fetchAllCategories,
  fetchCategoryBySlug,
  generateCategoryProductSchema,
  generateCategoryBreadcrumbSchema,
  generateCategoryRentalServiceSchema,
  buildCategoryKeywords,
  buildCategorySeoDescription,
  buildCategoryFromPriceLabel,
  getCategoryTypeName,
} from "@/lib/category-utils";
import { buildVanFaqSchema, getVanDetailFaqs } from "@/lib/vanFaq";
import VanDetailPage from "@/components/global/VanDetailPage";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const categories = await fetchAllCategories();
    return categories.map((category) => ({
      slug: categoryNameToSlug(category.name),
    }));
  } catch {
    return [];
  }
}

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);

  if (!category || category.status !== "active") {
    return {
      title: "Van Not Found",
      description: "The van you are looking for does not exist.",
      robots: { index: false, follow: false },
    };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://successvanhire.co.uk";
  const categorySlug = categoryNameToSlug(category.name);
  const canonicalUrl = `${siteUrl}/categories/${categorySlug}`;
  const description = buildCategorySeoDescription(category);
  const priceLabel = buildCategoryFromPriceLabel(category);
  const typeName = getCategoryTypeName(category) || "Vehicle";
  const title = `${category.name} Hire London ${priceLabel} | Success Van Hire`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    keywords: buildCategoryKeywords(category),
    category: `${typeName} hire`,
    publisher: "Success Van Hire",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonicalUrl,
      siteName: "Success Van Hire",
      locale: "en_GB",
      images: [
        {
          url: category.image,
          width: 1200,
          height: 630,
          alt: `${category.name} hire in London from Success Van Hire`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [category.image],
    },
    metadataBase: new URL(siteUrl),
  };
}

export default async function CategoryDetailPage({ params }: Props) {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);

  if (!category || category.status !== "active") {
    notFound();
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://successvanhire.co.uk";
  const productSchema = generateCategoryProductSchema(category, siteUrl);
  const rentalServiceSchema = generateCategoryRentalServiceSchema(
    category,
    siteUrl,
  );
  const categorySlug = categoryNameToSlug(category.name);
  const breadcrumbSchema = generateCategoryBreadcrumbSchema(
    siteUrl,
    category.name,
    categorySlug,
  );
  const organizationSchema = generateOrganizationSchema(siteUrl);
  const faqs = getVanDetailFaqs(category);
  const faqSchema = faqs && faqs.length > 0 ? buildVanFaqSchema(faqs) : null;

  return (
    <>
      <Script
        id="category-product-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        strategy="afterInteractive"
      />
      <Script
        id="category-rental-service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(rentalServiceSchema),
        }}
        strategy="afterInteractive"
      />
      <Script
        id="category-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        strategy="afterInteractive"
      />
      <Script
        id="category-organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        strategy="afterInteractive"
      />
      {faqSchema && (
        <Script
          id="category-faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
          strategy="afterInteractive"
        />
      )}
      <VanDetailPage category={category} />
    </>
  );
}
