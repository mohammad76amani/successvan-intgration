/**
 * Type definitions for ReservationForm component
 * This file contains all interfaces and types used in the reservation form
 */

import { WorkingTime, SpecialDay } from "./type";

export type { WorkingTime, SpecialDay };

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface FormData {
  office: string;
  type: string;
  pickupTime: string;
  returnTime: string;
  driverAge: string;
  message: string;
  name: string;
  email: string;
  phoneNumber: string;
}

export interface RentalDetails {
  office: string;
  type: string;
  pickupDate: string;
  returnDate: string;
  pickupTime: string;
  returnTime: string;
  pickupLocation: string;
  driverAge: string;
  message: string;
  pickupExtensionPrice?: number;
  returnExtensionPrice?: number;
  extensionCost?: number;
  isManualExtension?: boolean;
  startDateDisplay?: string;
  endDateDisplay?: string;
}

// ============================================================================
// SLOT TYPES
// ============================================================================

export interface ReservedSlot {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isSameDay: boolean;
}

export interface TimeSlotInfo {
  start: string;
  end: string;
  info: string;
}

export interface ExtensionTimes {
  start: string;
  end: string;
  normalStart: string;
  normalEnd: string;
  price: number;
}

// ============================================================================
// VOICE & AI TYPES
// ============================================================================

export interface VoiceData {
  office?: string;
  type?: string;
  pickupDate?: string;
  returnDate?: string;
  pickupTime?: string;
  returnTime?: string;
  driverAge?: string;
  message?: string;
}

export interface ExtractedVoiceData {
  transcript: string;
  data: VoiceData;
  missingFields: string[];
}

export interface ConversationData {
  office?: string;
  type?: string;
  pickupDate?: string;
  returnDate?: string;
  pickupTime?: string;
  returnTime?: string;
  driverAge?: string;
  message?: string;
}

// ============================================================================
// USER DATA TYPES
// ============================================================================

export interface EmailData {
  emailAddress: string;
}

export interface PhoneData {
  phoneNumber: string;
}

export interface UserData {
  name: string;
  emaildata?: EmailData;
  phoneData?: PhoneData;
  [key: string]: any;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface ReservationFormProps {
  isModal?: boolean;
  isInline?: boolean;
  onClose?: () => void;
  onBookNow?: () => void;
  isAdminMode?: boolean;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UseVoiceRecordingResult {
  isRecording: boolean;
  isProcessing: boolean;
  toggleRecording: () => void;
}

export interface UseVoiceRecordingOptions {
  onTranscriptionComplete: (result: VoiceData) => void;
  onError: (error: Error) => void;
  autoSubmit?: boolean;
}

// ============================================================================
// HANDLER TYPES
// ============================================================================

export type InputChangeHandler = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
) => void;

export type TimeChangeHandler = (name: string, time: string) => void;

export type SelectChangeHandler = (value: string) => void;
