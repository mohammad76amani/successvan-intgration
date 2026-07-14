/**
 * RAG (Retrieval-Augmented Generation) Context Builder
 * Fetches comprehensive data about offices, categories, and availability
 * to provide rich context to the conversational AI
 */

import Office from "@/model/office";
import Category from "@/model/category";
import Reservation from "@/model/reservation";
 
interface OfficeData {
  _id: string;
  name: string;
  address: string;
  phone: string;
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
}

interface CategoryData {
  _id: string;
  name: string;
  description?: string;
  purpose?: string;
  expert?: string;
  fuel: string;
  gear: {
    availableTypes: string[];
    automaticExtraCost?: number;
  };
  seats: number;
  doors: number;
  requiredLicense: string;
  showPrice: number;
  properties?: Array<{
    key: string;
    value: string;
  }>;
  servicesPeriod?: {
    tire?: number;
    oil?: number;
    battery?: number;
    air?: number;
    service?: number;
  };
  pricingTiers: Array<{
    minDays: number;
    maxDays: number;
    pricePerDay: number;
  }>;
  extrahoursRate?: number;
}

/**
 * Build comprehensive RAG context for the AI
 */
export async function buildRAGContext(
  offices: OfficeData[],
  categories: CategoryData[],
  startDate?: string,
  endDate?: string,
  officeId?: string
): Promise<string> {
  console.log("🔍 [RAG] Building context for AI");

  let context = "# COMPREHENSIVE BOOKING INFORMATION\n\n";

  // ==================== OFFICES ====================
  context += "## AVAILABLE OFFICES:\n\n";
  for (const office of offices) {
    context += `### ${office.name.toUpperCase()}\n`;
    context += `- ID: ${office._id}\n`;
    context += `- Address: ${office.address}\n`;
    context += `- Phone: ${office.phone}\n`;
    
    // Working hours
    context += `- Working Hours:\n`;
    const openDays = office.workingTime.filter(wt => wt.isOpen);
    if (openDays.length > 0) {
      for (const day of openDays) {
        context += `  * ${day.day}: ${day.startTime} - ${day.endTime}\n`;
      }
    } else {
      context += `  * Hours not set\n`;
    }
    
    // Special days
    if (office.specialDays && office.specialDays.length > 0) {
      context += `- Special Days:\n`;
      for (const special of office.specialDays) {
        const status = special.isOpen ? "Open" : "Closed";
        context += `  * ${special.month}/${special.day}: ${status}${special.reason ? ` (${special.reason})` : ""}\n`;
      }
    }
    
    context += "\n";
  }

  // ==================== CATEGORIES ====================
  context += "## AVAILABLE VEHICLE CATEGORIES:\n\n";
  for (const category of categories) {
    context += `### ${category.name.toUpperCase()}\n`;
    context += `- ID: ${category._id}\n`;
    
    if (category.description) {
      context += `- Description: ${category.description}\n`;
    }
    
    if (category.purpose) {
      context += `- Best For: ${category.purpose}\n`;
    }
    
    if (category.expert) {
      context += `- Expert Advice: ${category.expert}\n`;
    }
    
    context += `- Fuel Type: ${category.fuel}\n`;
    
    // Gear/Transmission
    if (typeof category.gear === 'object' && category.gear.availableTypes) {
      const gearTypes = category.gear.availableTypes.join(" and ");
      context += `- Transmission: ${gearTypes}`;
      if (category.gear.automaticExtraCost && category.gear.automaticExtraCost > 0) {
        context += ` (automatic +£${category.gear.automaticExtraCost}/day)`;
      }
      context += "\n";
    } else {
      context += `- Transmission: ${category.gear}\n`;
    }
    
    context += `- Seats: ${category.seats}\n`;
    context += `- Doors: ${category.doors}\n`;
    context += `- Required licences: ${category.requiredLicense}\n`;
    context += `- Starting Price: £${category.showPrice}/day\n`;
    
    // Vehicle Properties (cargo space, dimensions, etc.)
    if (category.properties && category.properties.length > 0) {
      context += `- Specifications:\n`;
      for (const prop of category.properties) {
        context += `  * ${prop.key}: ${prop.value}\n`;
      }
    }
    
    // Pricing tiers
    if (category.pricingTiers && category.pricingTiers.length > 0) {
      context += `- Pricing Tiers:\n`;
      for (const tier of category.pricingTiers) {
        const maxDays = tier.maxDays === Infinity ? "∞" : tier.maxDays;
        context += `  * ${tier.minDays}-${maxDays} days: £${tier.pricePerDay}/day\n`;
      }
    }
    
    if (category.extrahoursRate) {
      context += `- Extra Hours Rate: £${category.extrahoursRate}/hour\n`;
    }
    
    // Service periods
    if (category.servicesPeriod) {
      context += `- Maintenance Schedule:\n`;
      if (category.servicesPeriod.tire) context += `  * Tire check: every ${category.servicesPeriod.tire} months\n`;
      if (category.servicesPeriod.oil) context += `  * Oil change: every ${category.servicesPeriod.oil} months\n`;
      if (category.servicesPeriod.battery) context += `  * Battery check: every ${category.servicesPeriod.battery} months\n`;
      if (category.servicesPeriod.service) context += `  * Full service: every ${category.servicesPeriod.service} months\n`;
    }
    
    context += "\n";
  }

  // ==================== AVAILABILITY ====================
  if (startDate && endDate && officeId) {
    context += "## AVAILABILITY INFORMATION:\n\n";
    
    try {
      // Fetch existing reservations for the date range
      const existingReservations = await Reservation.find({
        office: officeId,
        $or: [
          {
            startDate: { $lte: new Date(endDate) },
            endDate: { $gte: new Date(startDate) },
          },
        ],
      }).populate("category");

      if (existingReservations.length > 0) {
        context += `Found ${existingReservations.length} existing reservations in this time period:\n`;
        for (const res of existingReservations) {
          const cat = (res.category as any)?.name || "Unknown";
          context += `- ${cat}: ${new Date(res.startDate).toLocaleDateString()} to ${new Date(res.endDate).toLocaleDateString()}\n`;
        }
      } else {
        context += `No conflicting reservations found for ${startDate} to ${endDate}.\n`;
      }
    } catch (error) {
      console.log("❌ [RAG] Error fetching availability:", error);
      context += "Availability information not available at this time.\n";
    }
    
    context += "\n";
  }

  // ==================== INSTRUCTIONS ====================
  context += "## IMPORTANT INSTRUCTIONS:\n\n";
  context += "- Use the office IDs (like '692c373285e43be43ace5615') when extracting office data, NOT the names\n";
  context += "- Use the category IDs when extracting category data\n";
  context += "- If user asks about hours, tell them from the working hours above\n";
  context += "- If user asks about special days or holidays, reference the special days section\n";
  context += "- When user gives VAGUE requests, ask clarifying questions about weight, size, quantity, or number of people\n";
  context += "- Use the 'Best For' and 'Specifications' fields to match vehicles to user needs\n";
  context += "- Consider payload capacity, cargo space dimensions when suggesting vehicles\n";
  context += "- Mention transmission options (manual/automatic) and any extra costs\n";
  context += "- When listing options, mention key features (fuel, seats, pricing, cargo space)\n";
  context += "- If dates conflict with existing reservations, inform the user\n";
  context += "- Today's date is " + new Date().toISOString().split("T")[0] + "\n";

  console.log("✅ [RAG] Context built, length:", context.length, "characters");
  
  return context;
}

/**
 * Fetch full office data with all details
 */
export async function fetchFullOffices(): Promise<OfficeData[]> {
  const offices = await Office.find({}).lean();
  
  return offices.map((office: any) => ({
    _id: office._id.toString(),
    name: office.name,
    address: office.address,
    phone: office.phone,
    workingTime: office.workingTime || [],
    specialDays: office.specialDays || [],
  }));
}

/**
 * Fetch full category data with all details
 */
export async function fetchFullCategories(): Promise<CategoryData[]> {
  const categories = await Category.find({}).populate("type").lean();
  
  return categories.map((category: any) => ({
    _id: category._id.toString(),
    name: category.name,
    description: category.description,
    purpose: category.purpose,
    expert: category.expert,
    fuel: category.fuel,
    gear: category.gear,
    seats: category.seats,
    doors: category.doors,
    requiredLicense: category.requiredLicense,
    showPrice: category.showPrice,
    properties: category.properties,
    servicesPeriod: category.servicesPeriod,
    pricingTiers: category.pricingTiers || [],
    extrahoursRate: category.extrahoursRate,
  }));
}
