/**
 * Comprehensive RAG (Retrieval-Augmented Generation) System
 * 
 * This module fetches ALL relevant data to create a rich context for the AI agent:
 * - Offices: locations, working hours, special days
 * - Categories: vehicle types, specs, fuel, pricing
 * - Vehicles: specific vehicles available at each office
 * - Add-ons: extras like GPS, child seats, insurance
 * - Reservations: for availability checking
 */

import Office from "@/model/office";
import Category from "@/model/category";
import Vehicle from "@/model/vehicle";
import AddOn from "@/model/addOn";
import Reservation from "@/model/reservation";
import connect from "@/lib/data";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface OfficeRAG {
  _id: string;
  name: string;
  address: string;
  phone: string;
  location: { latitude: number; longitude: number };
  workingTime: Array<{
    day: string;
    isOpen: boolean;
    startTime?: string;
    endTime?: string;
  }>;
  specialDays: Array<{
    month: number;
    day: number;
    isOpen: boolean;
    reason?: string;
  }>;
  vehicleInventory: Array<{
    vehicleId: string;
    vehicleTitle: string;
    categoryId: string;
    categoryName: string;
    inventory: number;
  }>;
}

export interface CategoryRAG {
  _id: string;
  name: string;
  description?: string;
  typeName?: string;
  fuel: string;
  gear: string;
  seats: number;
  doors: number;
  image?: string;
  pricingTiers: Array<{
    minHours: number;
    maxHours: number;
    pricePerHour: number;
  }>;
  // Calculated fields for RAG
  minPricePerHour?: number;
  maxLoadCapacity?: string; // For vans - inferred from name
  suitableFor?: string[]; // What this vehicle is good for
}

export interface VehicleRAG {
  _id: string;
  title: string;
  description: string;
  number: string;
  categoryId: string;
  categoryName: string;
  officeId: string;
  officeName: string;
  properties: Array<{ name: string; value: string }>;
  images: string[];
}

export interface AddOnRAG {
  _id: string;
  name: string;
  description?: string;
  pricingType: "flat" | "tiered";
  flatPrice?: number;
  tiers?: Array<{
    minDays: number;
    maxDays: number;
    price: number;
  }>;
}

export interface AvailabilityInfo {
  categoryId: string;
  categoryName: string;
  officeId: string;
  officeName: string;
  totalInventory: number;
  reservedCount: number;
  availableCount: number;
  isAvailable: boolean;
}

export interface ComprehensiveRAGData {
  offices: OfficeRAG[];
  categories: CategoryRAG[];
  vehicles: VehicleRAG[];
  addOns: AddOnRAG[];
  availability?: AvailabilityInfo[];
}

// ============================================================================
// DATA FETCHING FUNCTIONS
// ============================================================================

/**
 * Fetch all offices with full details and vehicle inventory
 */
export async function fetchOfficesRAG(): Promise<OfficeRAG[]> {
  await connect();
  
  const offices = await Office.find({})
    .populate({
      path: "vehicles.vehicle",
      populate: { path: "category" }
    })
    .lean();
  
  return offices.map((office: any) => ({
    _id: office._id.toString(),
    name: office.name,
    address: office.address,
    phone: office.phone,
    location: office.location || { latitude: 0, longitude: 0 },
    workingTime: office.workingTime || [],
    specialDays: office.specialDays || [],
    vehicleInventory: (office.vehicles || []).map((v: any) => ({
      vehicleId: v.vehicle?._id?.toString() || "",
      vehicleTitle: v.vehicle?.title || "",
      categoryId: v.vehicle?.category?._id?.toString() || "",
      categoryName: v.vehicle?.category?.name || "",
      inventory: v.inventory || 0,
    })).filter((v: any) => v.vehicleId),
  }));
}

/**
 * Fetch all categories with full specs and pricing
 */
export async function fetchCategoriesRAG(): Promise<CategoryRAG[]> {
  await connect();
  
  const categories = await Category.find({}).populate("type").lean();
  
  return categories.map((cat: any) => {
    // Calculate min price from tiers
    const minPrice = cat.pricingTiers?.length > 0 
      ? Math.min(...cat.pricingTiers.map((t: any) => t.pricePerHour))
      : undefined;
    
    // Infer what the vehicle is suitable for based on name/description
    const suitableFor = inferSuitability(cat.name, cat.description, cat.seats);
    
    return {
      _id: cat._id.toString(),
      name: cat.name,
      description: cat.description,
      typeName: cat.type?.name,
      fuel: cat.fuel,
      gear: cat.gear,
      seats: cat.seats,
      doors: cat.doors,
      image: cat.image,
      pricingTiers: cat.pricingTiers || [],
      minPricePerHour: minPrice,
      suitableFor,
    };
  });
}

/**
 * Fetch all vehicles with details
 */
export async function fetchVehiclesRAG(): Promise<VehicleRAG[]> {
  await connect();
  
  const vehicles = await Vehicle.find({})
    .populate("category")
    .populate("office")
    .lean();
  
  return vehicles.map((v: any) => ({
    _id: v._id.toString(),
    title: v.title,
    description: v.description,
    number: v.number,
    categoryId: v.category?._id?.toString() || "",
    categoryName: v.category?.name || "",
    officeId: v.office?._id?.toString() || "",
    officeName: v.office?.name || "",
    properties: v.properties || [],
    images: v.images || [],
  }));
}

/**
 * Fetch all add-ons with pricing
 */
export async function fetchAddOnsRAG(): Promise<AddOnRAG[]> {
  await connect();
  
  const addOns = await AddOn.find({}).lean();
  
  return addOns.map((addon: any) => ({
    _id: addon._id.toString(),
    name: addon.name,
    description: addon.description,
    pricingType: addon.pricingType,
    flatPrice: addon.flatPrice,
    tiers: addon.tiers,
  }));
}

/**
 * Check availability for a specific date range and office
 */
export async function checkAvailability(
  officeId: string,
  startDate: Date,
  endDate: Date
): Promise<AvailabilityInfo[]> {
  await connect();
  
  // Get the office with its vehicle inventory
  const office = await Office.findById(officeId)
    .populate({
      path: "vehicles.vehicle",
      populate: { path: "category" }
    })
    .lean();
  
  if (!office) {
    return [];
  }
  
  // Get overlapping reservations
  const reservations = await Reservation.find({
    office: officeId,
    status: { $in: ["pending", "confirmed"] },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
    ],
  }).lean();
  
  // Count reservations by category
  const reservationsByCategory = new Map<string, number>();
  for (const res of reservations) {
    const catId = res.category?.toString() || "";
    reservationsByCategory.set(catId, (reservationsByCategory.get(catId) || 0) + 1);
  }
  
  // Build availability info per category
  const availability: AvailabilityInfo[] = [];
  
  // Group inventory by category
  const inventoryByCategory = new Map<string, { total: number; name: string }>();
  for (const v of (office as any).vehicles || []) {
    if (v.vehicle?.category) {
      const catId = v.vehicle.category._id.toString();
      const existing = inventoryByCategory.get(catId) || { total: 0, name: v.vehicle.category.name };
      inventoryByCategory.set(catId, {
        total: existing.total + v.inventory,
        name: v.vehicle.category.name,
      });
    }
  }
  
  // Calculate availability
  for (const [catId, info] of inventoryByCategory) {
    const reserved = reservationsByCategory.get(catId) || 0;
    const available = Math.max(0, info.total - reserved);
    
    availability.push({
      categoryId: catId,
      categoryName: info.name,
      officeId: officeId,
      officeName: (office as any).name,
      totalInventory: info.total,
      reservedCount: reserved,
      availableCount: available,
      isAvailable: available > 0,
    });
  }
  
  return availability;
}

/**
 * Infer what a vehicle is suitable for based on its characteristics
 */
function inferSuitability(name: string, description: string | undefined, seats: number): string[] {
  const suitable: string[] = [];
  const searchText = `${name} ${description || ""}`.toLowerCase();
  
  // Van types
  if (searchText.includes("large") || searchText.includes("luton") || searchText.includes("box")) {
    suitable.push("moving furniture", "large deliveries", "house moves", "heavy cargo");
  } else if (searchText.includes("medium") || searchText.includes("transit")) {
    suitable.push("medium moves", "furniture delivery", "commercial use", "band equipment");
  } else if (searchText.includes("small") || searchText.includes("caddy") || searchText.includes("compact")) {
    suitable.push("small deliveries", "courier work", "light cargo", "city driving");
  }
  
  // Cars
  if (searchText.includes("car") || searchText.includes("sedan")) {
    suitable.push("personal transport", "business trips", "airport transfers");
  }
  
  // Crew/passenger vans
  if (seats >= 6) {
    suitable.push("group transport", "crew transport", "family trips");
  }
  
  // If nothing matched, add generic
  if (suitable.length === 0) {
    suitable.push("general use", "transport");
  }
  
  return suitable;
}

// ============================================================================
// RAG CONTEXT BUILDER
// ============================================================================

/**
 * Build comprehensive RAG context for the AI agent
 */
export async function buildComprehensiveRAG(
  options?: {
    officeId?: string;
    startDate?: string;
    endDate?: string;
    includeAvailability?: boolean;
  }
): Promise<{ context: string; data: ComprehensiveRAGData }> {
  console.log("🔍 [Comprehensive RAG] Building full context...");
  
  // Fetch all data in parallel
  const [offices, categories, vehicles, addOns] = await Promise.all([
    fetchOfficesRAG(),
    fetchCategoriesRAG(),
    fetchVehiclesRAG(),
    fetchAddOnsRAG(),
  ]);
  
  console.log(`📦 [Comprehensive RAG] Loaded: ${offices.length} offices, ${categories.length} categories, ${vehicles.length} vehicles, ${addOns.length} add-ons`);
  
  // Check availability if requested
  let availability: AvailabilityInfo[] | undefined;
  if (options?.includeAvailability && options.officeId && options.startDate && options.endDate) {
    availability = await checkAvailability(
      options.officeId,
      new Date(options.startDate),
      new Date(options.endDate)
    );
    console.log(`📊 [Comprehensive RAG] Availability checked: ${availability.length} categories`);
  }
  
  const data: ComprehensiveRAGData = { offices, categories, vehicles, addOns, availability };
  
  // Build context string
  let context = buildContextString(data, options);
  
  console.log(`✅ [Comprehensive RAG] Context built: ${context.length} characters`);
  
  return { context, data };
}

/**
 * Build the context string from RAG data
 */
function buildContextString(
  data: ComprehensiveRAGData,
  options?: { officeId?: string; startDate?: string; endDate?: string }
): string {
  const today = new Date().toISOString().split("T")[0];
  
  let context = `# VAN HIRE ASSISTANT - KNOWLEDGE BASE
Current Date: ${today}

You are an expert van hire consultant. Use this information to recommend the BEST vehicle for each customer's needs.

## YOUR ROLE:
1. UNDERSTAND what the customer needs (moving furniture? delivery? passenger transport?)
2. RECOMMEND the best vehicle category based on their specific situation
3. EXPLAIN why this choice is perfect for them
4. GUIDE them through booking after they accept your recommendation

---

## AVAILABLE OFFICES:

`;

  // Offices section
  for (const office of data.offices) {
    context += `### ${office.name.toUpperCase()}\n`;
    context += `- ID: \`${office._id}\`\n`;
    context += `- Address: ${office.address}\n`;
    context += `- Phone: ${office.phone}\n`;
    
    // Working hours
    const openDays = office.workingTime.filter(w => w.isOpen);
    if (openDays.length > 0) {
      context += `- Hours:\n`;
      for (const day of openDays) {
        context += `  * ${day.day}: ${day.startTime} - ${day.endTime}\n`;
      }
    }
    
    // Vehicle inventory summary
    if (office.vehicleInventory.length > 0) {
      context += `- Available Vehicles:\n`;
      const catSummary = new Map<string, number>();
      for (const v of office.vehicleInventory) {
        catSummary.set(v.categoryName, (catSummary.get(v.categoryName) || 0) + v.inventory);
      }
      for (const [cat, count] of catSummary) {
        context += `  * ${cat}: ${count} available\n`;
      }
    }
    
    context += "\n";
  }

  // Categories section with recommendation guidance
  context += `---

## VEHICLE CATEGORIES (Use these to make recommendations):

`;

  for (const cat of data.categories) {
    context += `### ${cat.name.toUpperCase()}\n`;
    context += `- ID: \`${cat._id}\`\n`;
    if (cat.description) {
      context += `- Description: ${cat.description}\n`;
    }
    context += `- Fuel: ${cat.fuel} | Transmission: ${cat.gear}\n`;
    context += `- Seats: ${cat.seats} | Doors: ${cat.doors}\n`;
    
    // Pricing
    if (cat.pricingTiers.length > 0) {
      context += `- Pricing:\n`;
      for (const tier of cat.pricingTiers) {
        const maxStr = tier.maxHours === Infinity || tier.maxHours > 1000 ? "+" : `-${tier.maxHours}`;
        context += `  * ${tier.minHours}${maxStr} hours: £${tier.pricePerHour}/hour\n`;
      }
    }
    if (cat.minPricePerHour) {
      context += `- Starting from: £${cat.minPricePerHour}/hour\n`;
    }
    
    // What it's suitable for
    if (cat.suitableFor && cat.suitableFor.length > 0) {
      context += `- **BEST FOR**: ${cat.suitableFor.join(", ")}\n`;
    }
    
    context += "\n";
  }

  // Add-ons section
  if (data.addOns.length > 0) {
    context += `---

## AVAILABLE ADD-ONS:

`;
    for (const addon of data.addOns) {
      context += `### ${addon.name}\n`;
      context += `- ID: \`${addon._id}\`\n`;
      if (addon.description) {
        context += `- ${addon.description}\n`;
      }
      if (addon.pricingType === "flat" && addon.flatPrice !== undefined) {
        context += `- Price: £${addon.flatPrice}\n`;
      } else if (addon.tiers && addon.tiers.length > 0) {
        context += `- Pricing by days:\n`;
        for (const tier of addon.tiers) {
          context += `  * ${tier.minDays}-${tier.maxDays} days: £${tier.price}\n`;
        }
      }
      context += "\n";
    }
  }

  // Availability section
  if (data.availability && data.availability.length > 0) {
    context += `---

## CURRENT AVAILABILITY (${options?.startDate} to ${options?.endDate}):

`;
    for (const avail of data.availability) {
      const status = avail.isAvailable ? "✅ AVAILABLE" : "❌ FULLY BOOKED";
      context += `- ${avail.categoryName} at ${avail.officeName}: ${status} (${avail.availableCount}/${avail.totalInventory})\n`;
    }
    context += "\n";
  }

  // Recommendation guidelines
  context += `---

## RECOMMENDATION GUIDELINES:

When customer describes their needs, recommend based on:

| Need | Recommended Category | Why |
|------|---------------------|-----|
| Moving furniture/house move | Large Van/Luton | Maximum cargo space |
| Small apartment/few items | Medium Van | Balanced size and cost |
| Small deliveries/parcels | Small Van | Easy to drive, economical |
| Passenger transport (5+) | Crew Van/Minibus | Seats + cargo space |
| Personal/business use | Car | Comfort and fuel economy |

Weight/Load Guidelines:
- Small Van: Up to 500kg
- Medium Van: Up to 1000kg  
- Large Van: Up to 1500kg+

---

`;

  return context;
}

/**
 * Quick function to get simple office/category lists for extraction
 */
export async function getSimpleLists(): Promise<{
  offices: Array<{ _id: string; name: string }>;
  categories: Array<{ _id: string; name: string }>;
}> {
  await connect();
  
  const [offices, categories] = await Promise.all([
    Office.find({}).select("_id name").lean(),
    Category.find({}).select("_id name").lean(),
  ]);
  
  return {
    offices: offices.map((o: any) => ({ _id: o._id.toString(), name: o.name })),
    categories: categories.map((c: any) => ({ _id: c._id.toString(), name: c.name })),
  };
}
