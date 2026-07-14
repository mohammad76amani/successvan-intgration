/**
 * REPORT RAG (Retrieval-Augmented Generation) System
 * 
 * This module fetches and structures ALL business intelligence reports for AI analysis:
 * - Add-ons Report: Usage statistics, revenue, customer preferences
 * - Categories Report: Vehicle type performance, booking trends
 * - Customers Report: User behavior, retention, spending patterns
 * - Offices Report: Location performance, revenue distribution
 * - Reservations Report: Booking trends, revenue analysis
 * - Vehicles Report: Individual vehicle utilization, maintenance needs
 * 
 * Purpose: Provide comprehensive business analytics context for AI-powered insights
 */

import connect from "@/lib/data";
import {
  buildAddOnsReport,
  buildCategoriesReport,
  buildCustomersReport,
  buildOfficesReport,
  buildReservationsReport,
  buildVehiclesReport,
} from "@/lib/reports";

// ============================================================================
// SECTION TYPES
// ============================================================================

export type ReportSection = "addons" | "categories" | "customers" | "offices" | "reservations" | "vehicles" | "insights";

export const ALL_SECTIONS: ReportSection[] = ["addons", "categories", "customers", "offices", "reservations", "vehicles", "insights"];

/**
 * Determine which report sections are relevant for a given query
 * This reduces token usage by only fetching/formatting needed sections
 */
export function selectReportSections(query: string): ReportSection[] {
  const queryLower = query.toLowerCase();
  const sections: Set<ReportSection> = new Set();
  
  // Customer-related queries
  if (queryLower.includes("customer") || queryLower.includes("user") || queryLower.includes("client") || 
      queryLower.includes("who") || queryLower.includes("buyer") || queryLower.includes("retention") ||
      queryLower.includes("loyalty") || queryLower.includes("best customer") || queryLower.includes("top customer")) {
    sections.add("customers");
  }
  
  // Add-on related queries
  if (queryLower.includes("add-on") || queryLower.includes("addon") || queryLower.includes("extra") ||
      queryLower.includes("gps") || queryLower.includes("child seat") || queryLower.includes("insurance") ||
      queryLower.includes("upsell") || queryLower.includes("attachment")) {
    sections.add("addons");
  }
  
  // Office/location related queries
  if (queryLower.includes("office") || queryLower.includes("location") || queryLower.includes("branch") ||
      queryLower.includes("hendon") || queryLower.includes("mill hill") || queryLower.includes("site")) {
    sections.add("offices");
  }
  
  // Vehicle utilization queries
  if (queryLower.includes("vehicle") || queryLower.includes("utilization") || queryLower.includes("fleet") ||
      queryLower.includes("car") || queryLower.includes("van") || queryLower.includes("truck") ||
      queryLower.includes("underutilized") || queryLower.includes("idle")) {
    sections.add("vehicles");
  }
  
  // Category/type related queries
  if (queryLower.includes("category") || queryLower.includes("type") || queryLower.includes("size") ||
      queryLower.includes("small") || queryLower.includes("medium") || queryLower.includes("large") ||
      queryLower.includes("popular") || queryLower.includes("best selling")) {
    sections.add("categories");
  }
  
  // Revenue/booking queries - need reservations and categories
  if (queryLower.includes("revenue") || queryLower.includes("booking") || queryLower.includes("reservation") ||
      queryLower.includes("money") || queryLower.includes("income") || queryLower.includes("sales") ||
      queryLower.includes("earning") || queryLower.includes("performance") || queryLower.includes("profit")) {
    sections.add("reservations");
    sections.add("categories");
  }
  
  // Time-based overview queries - need core sections
  if (queryLower.includes("last week") || queryLower.includes("this week") || queryLower.includes("last month") ||
      queryLower.includes("this month") || queryLower.includes("yesterday") || queryLower.includes("today") ||
      queryLower.includes("what happened") || queryLower.includes("overview") || queryLower.includes("summary") ||
      queryLower.includes("report") || queryLower.includes("how are we doing") || queryLower.includes("status")) {
    sections.add("reservations");
    sections.add("categories");
    sections.add("offices");
  }
  
  // Comparison queries need multiple sections
  if (queryLower.includes("compare") || queryLower.includes("vs") || queryLower.includes("versus") ||
      queryLower.includes("better") || queryLower.includes("worse") || queryLower.includes("difference")) {
    sections.add("reservations");
    sections.add("categories");
    sections.add("offices");
  }
  
  // Always include insights for context
  sections.add("insights");
  
  // If no specific sections detected, return core set for general queries
  if (sections.size === 1 && sections.has("insights")) {
    return ["reservations", "categories", "offices", "insights"];
  }
  
  return Array.from(sections);
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AddOnReportData {
  addOns: Array<{
    _id: string;
    name: string;
    usageCount: number;
    totalRevenue: number;
    avgUsagePerReservation: number;
    topCustomer: string;
    topCustomerUsage: number;
  }>;
  customerUsage: Array<{
    customerName: string;
    addOnName: string;
    usageCount: number;
    totalSpent: number;
  }>;
  summary: {
    totalAddOns: number;
    totalAddOnRevenue: number;
    avgAddOnsPerReservation: number;
    reservationsWithAddOns: number;
    totalReservationsForAddOns: number;
    mostUsedAddOn: any;
    leastUsedAddOn: any;
  };
}

export interface CategoryReportData {
  data: Array<{
    _id: string;
    categoryName: string;
    count: number;
    totalPrice: number;
    avgPrice: number;
  }>;
  summary: {
    mostUsed: any;
    leastUsed: any;
    totalRevenue: number;
    totalReservations: number;
    categoriesCount: number;
  };
}

export interface CustomerReportData {
  data: Array<{
    _id: string;
    name: string;
    reservationCount: number;
    totalPrice: number;
    createdAt: Date;
  }>;
  summary: {
    totalCustomers: number;
    totalRevenue: number;
    avgReservationsPerCustomer: number;
    newUsersThisMonth: number;
    usersThisMonth: number;
    mostReserved: any;
    leastReserved: any;
  };
}

export interface OfficeReportData {
  data: Array<{
    _id: string;
    officeName: string;
    count: number;
    totalPrice: number;
    avgPrice: number;
  }>;
  summary: {
    mostUsed: any;
    leastUsed: any;
    totalRevenue: number;
    totalReservations: number;
    officesCount: number;
  };
}

export interface ReservationReportData {
  data: Array<{
    _id: string;
    customerName: string;
    categoryName: string;
    totalPrice: number;
    startDate: Date;
    endDate: Date;
    status: string;
  }>;
  summary: {
    totalRevenue: number;
    totalReservations: number;
    avgPrice: number;
    topReservation: any;
    customerStats: Record<string, { count: number; totalPrice: number }>;
  };
}

export interface VehicleReportData {
  data: Array<{
    _id: string;
    title: string;
    number: string;
    category: { name: string };
    office: { name: string };
    reservationCount: number;
    reservations: Array<{
      _id: string;
      startDate: Date;
      endDate: Date;
      user: any;
      status: string;
    }>;
  }>;
}

export interface ComprehensiveReportRAG {
  addOns: AddOnReportData;
  categories: CategoryReportData;
  customers: CustomerReportData;
  offices: OfficeReportData;
  reservations: ReservationReportData;
  vehicles: VehicleReportData;
  metadata: {
    generatedAt: Date;
    reportPeriod?: { startDate: string; endDate: string };
    sectionsIncluded?: ReportSection[];
  };
}

// ============================================================================
// MAIN RAG BUILDER
// ============================================================================

export interface RAGOptions {
  sections?: ReportSection[];
}

/**
 * Fetch report data and build RAG context
 * Uses direct function calls instead of HTTP to avoid latency and serverless issues
 * @param startDate - Optional start date filter (YYYY-MM-DD)
 * @param endDate - Optional end date filter (YYYY-MM-DD)
 * @param options - Optional settings including which sections to fetch
 * @returns Report analytics context (only requested sections populated)
 */
export async function buildReportRAGContext(
  startDate?: string,
  endDate?: string,
  options?: RAGOptions
): Promise<ComprehensiveReportRAG> {
  const sectionsToFetch = options?.sections || ALL_SECTIONS;
  console.log("📊 [Report RAG] Building context for sections:", sectionsToFetch);
  
  await connect();
  
  // Only fetch sections that are requested - direct function calls, no HTTP
  const fetchPromises: Promise<any>[] = [];
  const sectionOrder: string[] = [];
  
  if (sectionsToFetch.includes("addons")) {
    fetchPromises.push(buildAddOnsReport(startDate, endDate));
    sectionOrder.push("addons");
  }
  if (sectionsToFetch.includes("categories")) {
    fetchPromises.push(buildCategoriesReport(startDate, endDate));
    sectionOrder.push("categories");
  }
  if (sectionsToFetch.includes("customers")) {
    fetchPromises.push(buildCustomersReport());
    sectionOrder.push("customers");
  }
  if (sectionsToFetch.includes("offices")) {
    fetchPromises.push(buildOfficesReport(startDate, endDate));
    sectionOrder.push("offices");
  }
  if (sectionsToFetch.includes("reservations")) {
    fetchPromises.push(buildReservationsReport(startDate, endDate));
    sectionOrder.push("reservations");
  }
  if (sectionsToFetch.includes("vehicles")) {
    fetchPromises.push(buildVehiclesReport());
    sectionOrder.push("vehicles");
  }
  
  const results = await Promise.all(fetchPromises);
  
  // Map results back to section names
  const resultMap: Record<string, any> = {};
  sectionOrder.forEach((section, idx) => {
    resultMap[section] = results[idx];
  });
  
  console.log("✅ [Report RAG] Fetched", sectionOrder.length, "sections");
  
  // Build response with empty defaults for unfetched sections
  return {
    addOns: resultMap.addons || { addOns: [], customerUsage: [], summary: { totalAddOns: 0, totalAddOnRevenue: 0, avgAddOnsPerReservation: 0, reservationsWithAddOns: 0, totalReservationsForAddOns: 0, mostUsedAddOn: null, leastUsedAddOn: null } },
    categories: resultMap.categories || { data: [], summary: { mostUsed: null, leastUsed: null, totalRevenue: 0, totalReservations: 0, categoriesCount: 0 } },
    customers: resultMap.customers || { data: [], summary: { totalCustomers: 0, totalRevenue: 0, avgReservationsPerCustomer: 0, newUsersThisMonth: 0, usersThisMonth: 0, mostReserved: null, leastReserved: null } },
    offices: resultMap.offices || { data: [], summary: { mostUsed: null, leastUsed: null, totalRevenue: 0, totalReservations: 0, officesCount: 0 } },
    reservations: resultMap.reservations || { data: [], summary: { totalRevenue: 0, totalReservations: 0, avgPrice: 0, topReservation: null, customerStats: {} } },
    vehicles: resultMap.vehicles || { data: [] },
    metadata: {
      generatedAt: new Date(),
      reportPeriod: startDate && endDate ? { startDate, endDate } : undefined,
      sectionsIncluded: sectionsToFetch,
    },
  };
}

// ============================================================================
// CONTEXT FORMATTER - Convert to AI-readable text
// ============================================================================

/**
 * Format report RAG data into structured text for AI consumption
 * Only renders sections that are included in the metadata
 * @param rag - The comprehensive report data
 * @param sections - Optional override for which sections to format
 */
export function formatReportRAGForAI(rag: ComprehensiveReportRAG, sections?: ReportSection[]): string {
  const sectionsToRender = sections || rag.metadata.sectionsIncluded || ALL_SECTIONS;
  const output: string[] = [];
  
  // ========== HEADER ==========
  output.push("=".repeat(80));
  output.push("BUSINESS ANALYTICS REPORT");
  output.push("=".repeat(80));
  output.push(`Generated: ${rag.metadata.generatedAt.toISOString()}`);
  if (rag.metadata.reportPeriod) {
    output.push(`Period: ${rag.metadata.reportPeriod.startDate} to ${rag.metadata.reportPeriod.endDate}`);
  }
  output.push(`Sections: ${sectionsToRender.join(", ")}`);
  output.push("");
  
  // ========== 1. ADD-ONS PERFORMANCE ==========
  if (sectionsToRender.includes("addons")) {
    output.push("━".repeat(80));
    output.push("📦 ADD-ONS PERFORMANCE ANALYSIS");
    output.push("━".repeat(80));
    output.push("");
    output.push("SUMMARY:");
    output.push(`  • Total Add-ons Offered: ${rag.addOns.summary.totalAddOns || 0}`);
    output.push(`  • Total Add-on Revenue: £${(rag.addOns.summary.totalAddOnRevenue || 0).toFixed(2)}`);
    output.push(`  • Avg Add-ons per Reservation: ${(rag.addOns.summary.avgAddOnsPerReservation || 0).toFixed(2)}`);
    output.push("");
    
    if (rag.addOns.summary.mostUsedAddOn) {
      output.push("MOST POPULAR ADD-ON:");
      output.push(`  • Name: ${rag.addOns.summary.mostUsedAddOn.name}`);
      output.push(`  • Usage Count: ${rag.addOns.summary.mostUsedAddOn.usageCount || 0}`);
      output.push(`  • Revenue: £${(rag.addOns.summary.mostUsedAddOn.totalRevenue || 0).toFixed(2)}`);
      output.push("");
    }
    
    if (rag.addOns.addOns.length > 0) {
      output.push("TOP 5 ADD-ONS BY USAGE:");
      rag.addOns.addOns.slice(0, 5).forEach((addon, idx) => {
        output.push(`  ${idx + 1}. ${addon.name}`);
        output.push(`     - Used: ${addon.usageCount || 0} times`);
        output.push(`     - Revenue: £${(addon.totalRevenue || 0).toFixed(2)}`);
        output.push(`     - Top Customer: ${addon.topCustomer} (${addon.topCustomerUsage || 0} uses)`);
      });
      output.push("");
    }
  }
  
  // ========== 2. CATEGORY PERFORMANCE ==========
  if (sectionsToRender.includes("categories")) {
    output.push("━".repeat(80));
    output.push("🚐 VEHICLE CATEGORY PERFORMANCE");
    output.push("━".repeat(80));
    output.push("");
    output.push("SUMMARY:");
    output.push(`  • Total Categories: ${rag.categories.summary.categoriesCount || 0}`);
    output.push(`  • Total Reservations: ${rag.categories.summary.totalReservations || 0}`);
    output.push(`  • Total Revenue: £${(rag.categories.summary.totalRevenue || 0).toFixed(2)}`);
    output.push("");
    
    if (rag.categories.summary.mostUsed) {
      output.push("MOST POPULAR CATEGORY:");
      output.push(`  • Name: ${rag.categories.summary.mostUsed.categoryName}`);
      output.push(`  • Bookings: ${rag.categories.summary.mostUsed.count || 0}`);
      output.push(`  • Revenue: £${(rag.categories.summary.mostUsed.totalPrice || 0).toFixed(2)}`);
      output.push(`  • Avg Price: £${(rag.categories.summary.mostUsed.avgPrice || 0).toFixed(2)}`);
      output.push("");
    }
    
    if (rag.categories.data.length > 0) {
      output.push("CATEGORY BREAKDOWN:");
      rag.categories.data.forEach((cat, idx) => {
        output.push(`  ${idx + 1}. ${cat.categoryName}`);
        output.push(`     - Bookings: ${cat.count || 0}`);
        output.push(`     - Revenue: £${(cat.totalPrice || 0).toFixed(2)}`);
        output.push(`     - Avg Price: £${(cat.avgPrice || 0).toFixed(2)}`);
      });
      output.push("");
    }
  }
  
  // ========== 3. CUSTOMER INSIGHTS ==========
  if (sectionsToRender.includes("customers")) {
    output.push("━".repeat(80));
    output.push("👥 CUSTOMER BEHAVIOR & RETENTION");
    output.push("━".repeat(80));
    output.push("");
    output.push("SUMMARY:");
    output.push(`  • Total Customers: ${rag.customers.summary.totalCustomers || 0}`);
    output.push(`  • Total Revenue: £${(rag.customers.summary.totalRevenue || 0).toFixed(2)}`);
    output.push(`  • Avg Reservations per Customer: ${(rag.customers.summary.avgReservationsPerCustomer || 0).toFixed(2)}`);
    output.push(`  • New Users This Month: ${rag.customers.summary.newUsersThisMonth || 0}`);
    output.push(`  • Active Users This Month: ${rag.customers.summary.usersThisMonth || 0}`);
    output.push("");
    
    if (rag.customers.summary.mostReserved) {
      output.push("TOP CUSTOMER:");
      output.push(`  • Name: ${rag.customers.summary.mostReserved.name}`);
      output.push(`  • Reservations: ${rag.customers.summary.mostReserved.reservationCount || 0}`);
      output.push(`  • Total Spent: £${(rag.customers.summary.mostReserved.totalPrice || 0).toFixed(2)}`);
      output.push("");
    }
    
    if (rag.customers.data.length > 0) {
      output.push("TOP 10 CUSTOMERS BY REVENUE:");
      rag.customers.data.slice(0, 10).forEach((customer, idx) => {
        output.push(`  ${idx + 1}. ${customer.name}`);
        output.push(`     - Reservations: ${customer.reservationCount || 0}`);
        output.push(`     - Total Spent: £${(customer.totalPrice || 0).toFixed(2)}`);
      });
      output.push("");
    }
  }
  
  // ========== 4. OFFICE PERFORMANCE ==========
  if (sectionsToRender.includes("offices")) {
    output.push("━".repeat(80));
    output.push("📍 OFFICE LOCATION PERFORMANCE");
    output.push("━".repeat(80));
    output.push("");
    output.push("SUMMARY:");
    output.push(`  • Total Offices: ${rag.offices.summary.officesCount || 0}`);
    output.push(`  • Total Reservations: ${rag.offices.summary.totalReservations || 0}`);
    output.push(`  • Total Revenue: £${(rag.offices.summary.totalRevenue || 0).toFixed(2)}`);
    output.push("");
    
    if (rag.offices.summary.mostUsed) {
      output.push("BEST PERFORMING OFFICE:");
      output.push(`  • Name: ${rag.offices.summary.mostUsed.officeName}`);
      output.push(`  • Bookings: ${rag.offices.summary.mostUsed.count || 0}`);
      output.push(`  • Revenue: £${(rag.offices.summary.mostUsed.totalPrice || 0).toFixed(2)}`);
      output.push(`  • Avg Booking: £${(rag.offices.summary.mostUsed.avgPrice || 0).toFixed(2)}`);
      output.push("");
    }
    
    if (rag.offices.data.length > 0) {
      output.push("OFFICE RANKINGS:");
      rag.offices.data.forEach((office, idx) => {
        output.push(`  ${idx + 1}. ${office.officeName}`);
        output.push(`     - Bookings: ${office.count || 0}`);
        output.push(`     - Revenue: £${(office.totalPrice || 0).toFixed(2)}`);
        output.push(`     - Avg Booking: £${(office.avgPrice || 0).toFixed(2)}`);
      });
      output.push("");
    }
  }
  
  // ========== 5. RESERVATION TRENDS ==========
  if (sectionsToRender.includes("reservations")) {
    output.push("━".repeat(80));
    output.push("📅 RESERVATION & REVENUE TRENDS");
    output.push("━".repeat(80));
    output.push("");
    output.push("SUMMARY:");
    output.push(`  • Total Reservations: ${rag.reservations.summary.totalReservations || 0}`);
    output.push(`  • Total Revenue: £${(rag.reservations.summary.totalRevenue || 0).toFixed(2)}`);
    output.push(`  • Avg Reservation Value: £${(rag.reservations.summary.avgPrice || 0).toFixed(2)}`);
    output.push("");
    
    if (rag.reservations.summary.topReservation) {
      output.push("HIGHEST VALUE BOOKING:");
      output.push(`  • Customer: ${rag.reservations.summary.topReservation.customerName}`);
      output.push(`  • Category: ${rag.reservations.summary.topReservation.categoryName}`);
      output.push(`  • Value: £${(rag.reservations.summary.topReservation.totalPrice || 0).toFixed(2)}`);
      output.push(`  • Status: ${rag.reservations.summary.topReservation.status}`);
      output.push("");
    }
  }
  
  // ========== 6. VEHICLE UTILIZATION ==========
  if (sectionsToRender.includes("vehicles")) {
    output.push("━".repeat(80));
    output.push("🚗 INDIVIDUAL VEHICLE UTILIZATION");
    output.push("━".repeat(80));
    output.push("");
    output.push(`Total Vehicles: ${rag.vehicles.data.length}`);
    output.push("");
    
    if (rag.vehicles.data.length > 0) {
      const sortedVehicles = [...rag.vehicles.data].sort((a, b) => b.reservationCount - a.reservationCount);
      
      output.push("TOP 10 MOST UTILIZED VEHICLES:");
      sortedVehicles.slice(0, 10).forEach((vehicle, idx) => {
        output.push(`  ${idx + 1}. ${vehicle.title} (${vehicle.number})`);
        output.push(`     - Category: ${vehicle.category?.name || 'N/A'}`);
        output.push(`     - Office: ${vehicle.office?.name || 'N/A'}`);
        output.push(`     - Reservations: ${vehicle.reservationCount}`);
      });
      output.push("");
      
      const underutilized = sortedVehicles.filter(v => v.reservationCount === 0);
      if (underutilized.length > 0) {
        output.push(`⚠️  UNDERUTILIZED VEHICLES (${underutilized.length} vehicles with 0 bookings):`);
        underutilized.slice(0, 5).forEach((vehicle) => {
          output.push(`  • ${vehicle.title} (${vehicle.number}) at ${vehicle.office?.name || 'Unknown'}`);
        });
        output.push("");
      }
    }
  }
  
  // ========== KEY INSIGHTS ==========
  if (sectionsToRender.includes("insights")) {
    output.push("━".repeat(80));
    output.push("💡 KEY BUSINESS INSIGHTS");
    output.push("━".repeat(80));
    output.push("");
    
    const customerRetentionRate = rag.customers.summary.avgReservationsPerCustomer || 0;
    const revenuePerCustomer = rag.customers.summary.totalCustomers > 0 
      ? rag.customers.summary.totalRevenue / rag.customers.summary.totalCustomers 
      : 0;
    
    output.push("CLASSIFICATION:");
    if (customerRetentionRate > 2) {
      output.push("  ✅ CUSTOMER LOYALTY: EXCELLENT - Customers book multiple times");
    } else if (customerRetentionRate > 1.5) {
      output.push("  ✔️  CUSTOMER LOYALTY: GOOD - Some repeat customers");
    } else {
      output.push("  ⚠️  CUSTOMER LOYALTY: NEEDS IMPROVEMENT - Mostly one-time bookings");
    }
    
    output.push(`  • Customer Lifetime Value: £${revenuePerCustomer.toFixed(2)}`);
    
    const reservationsWithAddOns = rag.addOns.summary.reservationsWithAddOns || 0;
    const totalReservationsForAddOns = rag.addOns.summary.totalReservationsForAddOns || 1;
    const attachmentRate = (reservationsWithAddOns / totalReservationsForAddOns) * 100;
    output.push(`  • Add-on Attachment Rate: ${attachmentRate.toFixed(1)}% (${reservationsWithAddOns}/${totalReservationsForAddOns} bookings)`);
    output.push(`  • Avg Add-ons per Booking: ${(rag.addOns.summary.avgAddOnsPerReservation || 0).toFixed(2)}`);
    output.push("");
  }
  
  output.push("=".repeat(80));
  output.push("END OF REPORT");
  output.push("=".repeat(80));
  
  return output.join("\n");
}

// ============================================================================
// EXPORT MAIN FUNCTION
// ============================================================================

/**
 * Main entry point: Build RAG context and format for AI
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @param options - Optional settings including which sections to include
 * @returns Formatted text context for AI consumption
 */
export async function getReportRAGContext(
  startDate?: string,
  endDate?: string,
  options?: RAGOptions
): Promise<string> {
  const rag = await buildReportRAGContext(startDate, endDate, options);
  return formatReportRAGForAI(rag, options?.sections);
}
