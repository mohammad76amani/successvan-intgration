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

export interface CategoryServicesPeriod {
    tyre?: number;
    oil?: number;
    coolant?: number;
    breakes?: number;
    service?: number;
    adBlue?: number;
}

export interface CategoryDeposit {
    amount?: number;
    depositFee?: number;
    fullPayDiscountPercent?: number;
    securePayPrice?: number;
    officePayPrice?: number;
    handoverDepositPrice?: number;
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
    servicesPeriod?: CategoryServicesPeriod;
    deposit?: CategoryDeposit;
    createdAt?: string;
    updatedAt?: string;
}

export function getCategoryTypeName(category: CategoryDetail) {
    return typeof category.type === "object" ? category.type?.name : undefined;
}

export function getCategoryFromPrice(category: CategoryDetail) {
    const tierPrices = (category.pricingTiers || [])
        .map((tier) => Number(tier.pricePerDay))
        .filter((price) => Number.isFinite(price) && price > 0);
    const showPrice = Number(category.showPrice);
    const prices =
        Number.isFinite(showPrice) && showPrice > 0
            ? [showPrice, ...tierPrices]
            : tierPrices;

    return prices.length ? Math.min(...prices) : 0;
}

export function getCategoryHighestPrice(category: CategoryDetail) {
    const tierPrices = (category.pricingTiers || [])
        .map((tier) => Number(tier.pricePerDay))
        .filter((price) => Number.isFinite(price) && price > 0);
    const showPrice = Number(category.showPrice);
    const prices =
        Number.isFinite(showPrice) && showPrice > 0
            ? [showPrice, ...tierPrices]
            : tierPrices;

    return prices.length ? Math.max(...prices) : 0;
}

export function buildCategoryFromPriceLabel(category: CategoryDetail) {
    const fromPrice = getCategoryFromPrice(category);
    return fromPrice > 0
        ? `from GBP ${fromPrice}/day`
        : "with live online pricing";
}

export function buildCategorySeoDescription(category: CategoryDetail) {
    const typeName = getCategoryTypeName(category) || "vehicle";
    const gearbox = category.gear?.availableTypes?.join(" or ");
    const parts = [
        `${category.name} hire in London ${buildCategoryFromPriceLabel(category)}`,
        `${category.seats} seats`,
        `${category.doors} doors`,
        category.fuel ? `${category.fuel} ${typeName.toLowerCase()}` : typeName,
        gearbox ? `${gearbox} gearbox` : undefined,
        `${category.requiredLicense} licence requirements`,
    ].filter(Boolean);

    return `${parts.join(", ")}. Book self-drive rental with Success Van Hire.`
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 155);
}

export function buildCategoryPricingSummary(category: CategoryDetail) {
    const tiers = [...(category.pricingTiers || [])]
        .filter((tier) => Number.isFinite(Number(tier.pricePerDay)))
        .sort((a, b) => a.minDays - b.minDays);

    if (tiers.length === 0) {
        const fromPrice = getCategoryFromPrice(category);
        if (fromPrice > 0) {
            return `${category.name} hire starts from GBP ${fromPrice} per day. Prices may depend on availability, hire duration and booking conditions.`;
        }

        return `${category.name} hire prices are loaded from the live booking data for this vehicle. Prices may depend on availability, hire duration and booking conditions.`;
    }

    const firstTier = tiers[0];
    const cheapestTier = tiers.reduce((best, tier) =>
        tier.pricePerDay < best.pricePerDay ? tier : best,
    );
    const rentalLength =
        firstTier.minDays === firstTier.maxDays
            ? `${firstTier.minDays} day${firstTier.minDays === 1 ? "" : "s"}`
            : `${firstTier.minDays} to ${firstTier.maxDays} days`;

    const parts = [
        `${category.name} hire starts from GBP ${firstTier.pricePerDay} per day for ${rentalLength}`,
    ];

    if (
        cheapestTier.pricePerDay !== firstTier.pricePerDay ||
        cheapestTier.minDays !== firstTier.minDays
    ) {
        const cheapestLength =
            cheapestTier.minDays === cheapestTier.maxDays
                ? `${cheapestTier.minDays} day${cheapestTier.minDays === 1 ? "" : "s"}`
                : `${cheapestTier.minDays} to ${cheapestTier.maxDays} days`;
        parts.push(
            `with longer hire rates from GBP ${cheapestTier.pricePerDay} per day for ${cheapestLength}`,
        );
    }

    return `${parts.join(", ")}. Prices may depend on availability, hire duration and booking conditions.`;
}

export function buildCategoryKeywords(category: CategoryDetail) {
    const typeName = getCategoryTypeName(category);
    const lowerName = category.name.toLowerCase();
    const typeKeyword = typeName?.toLowerCase();

    return Array.from(
        new Set(
            [
                `${lowerName} hire london`,
                `${lowerName} rental london`,
                `self drive ${lowerName}`,
                `${lowerName} price`,
                typeKeyword && `${typeKeyword} hire london`,
                typeKeyword && `${typeKeyword} rental london`,
                `${category.seats} seater hire london`,
                `${category.seats} seats ${typeKeyword || "vehicle"} hire`,
                "success van hire",
                "van hire london",
                "van rental london",
            ].filter(Boolean) as string[],
        ),
    );
}
