import type {
  ReservationStatus,
  DepositStatus,
  DepositOption,
  RefundStatus,
} from "@/lib/reservation-status";

// Office ----------------------------------------------------------------------------
export interface WorkingTimeWindow {
  isOpen?: boolean;
  startTime?: string;
  endTime?: string;
}

export interface WorkingTimeExtension {
  startTime?: string;
  endTime?: string;
  hoursBefore?: number;
  hoursAfter?: number;
  flatPrice: number;
}

export interface WorkingTime {
  day:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  isOpen: boolean;
  startTime?: string;
  endTime?: string;
  pickupTime?: WorkingTimeWindow;
  returnTime?: WorkingTimeWindow;
  pickupExtension?: WorkingTimeExtension;
  returnExtension?: WorkingTimeExtension;
}

export interface SpecialDay {
  month: number;
  day: number;
  isOpen: boolean;
  startTime?: string;
  endTime?: string;
  pickupTime?: {
    startTime?: string;
    endTime?: string;
  };
  returnTime?: {
    startTime?: string;
    endTime?: string;
  };
  pickupExtension?: {
    startTime?: string;
    endTime?: string;
  };
  returnExtension?: {
    startTime?: string;
    endTime?: string;
  };
  reason?: string;
  extraPrice?: number;
}

// export interface Vehicle {
//   vehicle: string;
//   inventory: number;
// }

export interface Office {
  _id?: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  categories: string[];
  address: string;
  phone: string;
  workingTime: WorkingTime[];
  specialDays: SpecialDay[];
  vehicles: Vehicle[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Vehicle --------------------------------------------------------------------------------
export interface ServiceHistory {
  tyre: Date;
  oil: Date;
  coolant: Date;
  breakes: Date;
  service: Date;
  adBlue: Date;
}

export interface Property {
  name: string;
  value: string;
}

export interface Vehicle {
  _id?: string;
  title: string;
  make?: string;
  description: string;
  category: string;
  pricePerHour: number;
  fuel: "gas" | "diesel" | "electric" | "hybrid";
  gear: {
    availableTypes: { gearType: "automatic" | "manual" }[];
  };
  seats: number;
  doors: number;
  properties: Property[];
  serviceHistory: ServiceHistory;
  needsService: boolean;
  available: boolean;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
  number: number;
  color?: string;
  keyNumber?: string;
}

// Category -----------------------------------------------------------------------------------
export interface ServicesPeriod {
  tyre: number;
  oil: number;
  coolant: number;
  breakes: number;
  service: number;
  adBlue: number;
}

export interface Category {
  _id?: string;
  name: string;
  description?: string;
  image?: string;
  video?: string;
  purpose?: string;
  expert: string;
  type: string | Type;
  showPrice: number;
  selloffer?: number;
  status: "active" | "inactive";
  properties: {
    key: string;
    value: string;
  }[];
  requiredLicense: string;
  pricingTiers: {
    minDays: number;
    maxDays: number;
    pricePerDay: number;
  }[];
  extrahoursRate: number;
  deposit?: {
    depositFee?: number;
    fullPayDiscountPercent?: number;
    securePayPrice?: number;
    officePayPrice?: number;
    handoverDepositPrice?: number;
  };
  handoverFormFields?: {
    label: string;
    fieldType: "input" | "file";
    inputType?: "text" | "number" | "date" | "textarea";
    requiredBefore?: boolean;
    requiredAfter?: boolean;
    helpText?: string;
  }[];
  fuel: "gas" | "diesel" | "electric" | "hybrid";
  gear: {
    availableTypes: string[];
    automaticExtraCost: number;
  };
  seats: number;
  doors: number;
  servicesPeriod: ServicesPeriod;
  createdAt?: Date;
  updatedAt?: Date;
}

// Type -------------------------------------------------------------------------------------------

export interface Type {
  _id?: string;
  name: string;
  description?: string;
  offices: string[] | Office[];
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

// dashboard
export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export interface Stats {
  vehicles: number;
  offices: number;
  reservations: number;
  categories: number;
}

// AddOn ------------------------------------------------------------------------------------------
export interface AddOn {
  _id?: string;
  status: "active" | "inactive";

  name: string;
  description?: string;
  pricingType: "flat" | "tiered";
  flatPrice?:
    | number
    | {
        amount?: number;
        isPerDay?: boolean;
      };
  tieredPrice?: {
    isPerDay?: boolean;
    tiers?: Array<{
      minDays: number;
      maxDays: number;
      price: number;
    }>;
  };
  // Legacy shape retained for older populated reservations.
  tiers?: Array<{
    minDays: number;
    maxDays: number;
    price: number;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

// Reservation ------------------------------------------------------------------------------------------
export interface Reservation {
  _id?: string;
  reservationCode?: string;
  user?: any;
  office?: any;
  category?: any;
  vehicle?: any;
  vehicleSnapshot?: {
    vehicleId?: string;
    title?: string;
    make?: string;
    number?: string;
    keyNumber?: string;
    color?: string;
    assignedAt?: Date | string;
  };
  startDate: Date;
  endDate: Date;
  startDateDisplay?: string;
  endDateDisplay?: string;
  pickupTime?: string;
  returnTime?: string;
  totalPrice: number;
  status: ReservationStatus;
  statusHistory?: Array<{
    status: ReservationStatus;
    changedAt: Date | string;
    source?: "admin" | "customer" | "system";
    note?: string;
  }>;
  cancelReason?: string;
  driverAge: number;
  messege?: string;
  addOns?: Array<{
    addOn?: AddOn;
    quantity: number;
    selectedTierIndex?: number;
  }>;
  discountCode?: string;
  selectedGear?: "manual" | "automatic";
  pickupExtensionPrice?: number;
  returnExtensionPrice?: number;
  rentalExtensions?: Array<{
    contract?: string;
    contractNumber?: string;
    previousReturnDateTime?: Date | string;
    newReturnDateTime?: Date | string;
    calculatedPrice?: number;
    agreedPrice?: number;
    customPriceApplied?: boolean;
    customPriceReason?: string;
    signedAt?: Date | string;
  }>;
  isManualPrice?: boolean;
  manualPricePerDay?: number;
  manualPriceNote?: string;
  perInvoice?: boolean;
  reservationType?: "Office" | "Website" | "App";
  insuranceArrangement?: {
    provider?: "diba" | "customer";
    otherExcess?: string;
    selectedAt?: Date | string;
    selectedBy?: string;
  };
  deposit?: {
    amount?: number;
    originalAmount?: number;
    discountAmount?: number;
    option?: DepositOption;
    status?: DepositStatus;
    dueAt?: Date | string;
    paidAt?: Date | string;
    method?: string;
    transactionRef?: string;
    receiptUrl?: string;
    receiptUploadedAt?: Date | string;
    verifiedAt?: Date | string;
    verifiedBy?: string;
    failureReason?: string;
    discountPercent?: number;
    priceAdjustment?: {
      previousTotal?: number;
      revisedTotal?: number;
      paidAmount?: number;
      balanceDue?: number;
      creditAmount?: number;
      status?: "balanced" | "payment_due" | "credit_due";
      adjustedAt?: Date | string;
    };
  };
  collectionCode?: string;
  handoverDepositAmount?: number;
  handover?: {
    startedAt?: Date | string;
    startMileage?: number;
    startFuelLevel?: string;
    conditionNotes?: string;
    existingDamages?: string[];
    photos?: string[];
    customerSignature?: string;
    staffSignature?: string;
    staff?: {
      user?: string;
      name?: string;
      role?: "admin" | "owner";
    };
    keyCount?: number;
    equipment?: string[];
    customFields?: {
      templateFieldId?: string;
      label?: string;
      fieldType?: "input" | "file";
      inputType?: string;
      value?: string;
      files?: string[];
      helpText?: string;
    }[];
    completedAt?: Date | string;
  };
  inspection?: {
    receivedAt?: Date | string;
    returnMileage?: number;
    returnFuelLevel?: string;
    newDamages?: string[];
    lateReturn?: boolean;
    lateMinutes?: number;
    cleaningIssue?: boolean;
    missingEquipment?: string[];
    photos?: string[];
    notes?: string;
    staff?: {
      user?: string;
      name?: string;
      role?: "admin" | "owner";
    };
    customFields?: {
      templateFieldId?: string;
      label?: string;
      fieldType?: "input" | "file";
      inputType?: string;
      value?: string;
      files?: string[];
      helpText?: string;
    }[];
    completedAt?: Date | string;
  };
  refund?: {
    depositPaid?: number;
    charges?: {
      fuel?: number;
      late?: number;
      damage?: number;
      cleaning?: number;
      missingEquipment?: number;
      other?: number;
    };
    additionalCharges?: {
      amount: number;
      reason: string;
    }[];
    chargeReason?: string;
    otherChargeReason?: string;
    evidence?: string[];
    deductionsTotal?: number;
    refundAmount?: number;
    status?: RefundStatus;
    reference?: string;
    expectedBy?: Date | string;
    approvedAt?: Date | string;
    processedAt?: Date | string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// Table ------------------------------------------------------------------------------------
export interface DynamicTableViewProps<T> {
  apiEndpoint: string;
  title: string;
  columns: {
    key: keyof T;
    label: string;
    render?: (
      value: any,
      item?: T,
      index?: number,
      pagination?: Pagination,
    ) => React.ReactNode;
    sortable?: boolean; // ✅ اضافه شد - default: true
  }[];
  onEdit?: (item: T) => void;
  /** Optional additional class(es) to apply to the edit button (e.g. "mt-2") */
  editButtonClass?: string;
  onMutate?: (mutate: () => Promise<any>) => void;
  itemsPerPage?: number;
  hideDelete?: boolean;
  onDuplicate?: (item: T) => void;
  onStatusToggle?: (item: T) => void;
  hiddenColumns?: (keyof T)[];
  hideViewBtn?: boolean;
  filters?: Array<{
    key: string;
    label: string;
    type: "text" | "date" | "select" | "range";
    rangeType?: "number" | "text";
    options?: Array<{ _id: string; name: string }>;
  }>;
  defaultFilters?: Record<string, string>;
}

// custom Select -------------------------------------------------------------------
interface Option {
  _id?: string;
  name: string;
}

export interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  isInline?: boolean;
  disabled?: boolean;
  id?: string;
}

// Testimonial -------------------------------------------------------------------------------
export interface Testimonial {
  id: number;
  name: string;
  role?: string;
  company?: string;
  message: string;
  rating: number;
  image?: string;
  date?: string;
  location?: string;
  link?: string;
}

export interface TestimonialsProps {
  testimonials?: Testimonial[];
  layout?: "carousel" | "grid" | "masonry";
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showRating?: boolean;
  accentColor?: string;
}

// User -----------------------------------------------------------------------------------------
export interface User {
  _id: string;
  name: string;
  lastName: string;
  address?: string;
  postalCode?: string;
  city?: string;
  emaildata: {
    emailAddress: string;
    isVerified: boolean;
  };
  phoneData: {
    phoneNumber: string;
    isVerified: boolean;
  };
  role?: string;
  createdAt: Date;
  licenceAttached?: {
    front?: string;
    back?: string;
  };
  licenceDetails?: {
    isFrontSide?: boolean;
    sourceSide?: "front" | "back" | "unknown";
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    dateOfBirth?: string | null;
    address?: string | null;
    postcode?: string | null;
    licenseNumber?: string | null;
    licenceNumber?: string | null;
    issueDate?: string | null;
    expirationDate?: string | null;
    expiryDate?: string | null;
    issuingCountry?: string | null;
    issuingAuthority?: string | null;
    licenceCategories?: string[];
    extractedAt?: string | Date;
  };
  avatar?: string;
}

// van --------------------------------------------------------------------------------------------
// Van data type
export interface VanData {
  _id?: string;
  name: string;
  description?: string;
  image: string;
  requiredLicense: string;
  type?: string;
  servicesPeriod?: {
    tyre: number;
    oil: number;
    coolant: number;
    breakes: number;
    service: number;
    adBlue: number;
  };
  pricePerHour: number;
  fuel: "gas" | "diesel" | "electric" | "hybrid";
  gear: "automatic" | "manual" | "manual,automatic";
  seats: number;
  doors: number;
  id?: number;
  category: Category;
  transmission?: "Manual" | "Automatic";
  cargo?: string;
  features?: string[];
  popular?: boolean;
  available?: boolean;
  deposit?: number;
  mileage?: string;
  priceUnit?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}
