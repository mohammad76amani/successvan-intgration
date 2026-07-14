/**
 * Report Builders - Barrel Export
 * 
 * These are reusable functions for generating business reports.
 * They can be called directly from server-side code without HTTP overhead.
 */

export { buildAddOnsReport, type AddOnReportResult } from "./buildAddOnsReport";
export { buildCategoriesReport, type CategoryReportResult } from "./buildCategoriesReport";
export { buildCustomersReport, type CustomerReportResult } from "./buildCustomersReport";
export { buildOfficesReport, type OfficeReportResult } from "./buildOfficesReport";
export { buildReservationsReport, type ReservationReportResult } from "./buildReservationsReport";
export { buildVehiclesReport, type VehicleReportResult } from "./buildVehiclesReport";
