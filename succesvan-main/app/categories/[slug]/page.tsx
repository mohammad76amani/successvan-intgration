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
} from "@/lib/category-utils";
import { VAN_DETAIL_FAQS, buildVanFaqSchema } from "@/lib/vanFaq";
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
  const description = (
    category.description ||
    category.purpose ||
    `Hire the ${category.name} from Success Van Hire in London. Competitive daily, weekly and monthly rates.`
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 155);

  return {
    title: `${category.name} Hire London | Success Van Hire`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    keywords: [
      "van hire london",
      `${category.name} hire`,
      `${category.name} rental`,
      "van rental london",
    ],
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
      title: `${category.name} Hire London | Success Van Hire`,
      description,
      url: canonicalUrl,
      siteName: "Success Van Hire",
      images: [
        {
          url: category.image,
          width: 1200,
          height: 630,
          alt: category.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} Hire London | Success Van Hire`,
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
  const categorySlug = categoryNameToSlug(category.name);
  const breadcrumbSchema = generateCategoryBreadcrumbSchema(
    siteUrl,
    category.name,
    categorySlug,
  );
  const organizationSchema = generateOrganizationSchema(siteUrl);
  const faqs = VAN_DETAIL_FAQS[category.name];
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
