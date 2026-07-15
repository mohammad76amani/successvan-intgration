"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiMapPin, FiSearch, FiLoader, FiInfo, FiCheckCircle, FiChevronDown } from "react-icons/fi";
import {
  normalizePostcode,
  looksLikeValidPostcode,
  type RegistrationAddress,
  type AddressOption,
} from "@/lib/address";

export type AddressLookupStatus =
  | "idle"
  | "validating_postcode"
  | "addresses_found"
  | "address_selected"
  | "error";

interface AddressFieldsProps {
  value: RegistrationAddress;
  onChange: (next: RegistrationAddress) => void;
  errors: { [key: string]: string };
  onClearError: (field: string) => void;
}

const fieldClass = (hasError: boolean) => `
  w-full pl-12 pr-4 py-3.5
  bg-white/5 hover:bg-white/[0.07] focus:bg-white/10
  border-2 rounded-xl text-white placeholder-white/30
  focus:outline-none transition-all duration-300
  ${hasError ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-[#fe9a00]"}
`;

export default function AddressFields({
  value,
  onChange,
  errors,
  onClearError,
}: AddressFieldsProps) {
  const [postcodeInput, setPostcodeInput] = useState(value.postcode || "");
  const [status, setStatus] = useState<AddressLookupStatus>("idle");
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [showFields, setShowFields] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "info"; text: string } | null>(null);

  const lookupAbortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      lookupAbortRef.current?.abort();
    };
  }, []);

  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  });
  const patch = useCallback(
    (next: Partial<RegistrationAddress>) => {
      onChange({ ...valueRef.current, ...next });
    },
    [onChange],
  );

  const runPostcodeLookup = useCallback(
    async (rawPostcode: string) => {
      const normalized = normalizePostcode(rawPostcode);
      if (!normalized) return;

      lookupAbortRef.current?.abort();
      const controller = new AbortController();
      lookupAbortRef.current = controller;

      setMessage(null);
      setStatus("validating_postcode");
      setAddresses([]);
      setSelectedId("");
      // A new postcode invalidates any previously selected address.
      patch({
        addressLine1: "",
        addressLine2: "",
        townCity: "",
        county: "",
        latitude: undefined,
        longitude: undefined,
        udprn: undefined,
        addressSource: "manual",
        postcodeValidated: false,
      });

      try {
        const res = await fetch(
          `/api/address/lookup?postcode=${encodeURIComponent(normalized)}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        if (!mountedRef.current || controller.signal.aborted) return;

        if (!data.success) {
          setStatus("error");
          setMessage({ type: "error", text: data.error || "We could not find that postcode." });
          return;
        }

        const found: AddressOption[] = data.data.addresses || [];
        setPostcodeInput(data.data.postcode);
        patch({ postcode: data.data.postcode, country: "United Kingdom", postcodeValidated: true });

        if (found.length === 0) {
          setStatus("error");
          setShowFields(true);
          setMessage({ type: "info", text: "No addresses found for this postcode. Please enter your address manually." });
          return;
        }

        setAddresses(found);
        setStatus("addresses_found");
        setMessage({
          type: "info",
          text: `${found.length} ${found.length === 1 ? "address" : "addresses"} found — select yours below.`,
        });
      } catch {
        if (controller.signal.aborted) return;
        setStatus("error");
        setShowFields(true);
        setMessage({ type: "error", text: "Address lookup is unavailable right now. You can enter your address manually." });
      }
    },
    [patch],
  );

  const selectAddress = (id: string) => {
    setSelectedId(id);
    const chosen = addresses.find((a) => a.id === id);
    if (!chosen) return;
    patch({
      addressLine1: chosen.addressLine1,
      addressLine2: chosen.addressLine2 || "",
      townCity: chosen.townCity,
      county: chosen.county || "",
      postcode: chosen.postcode || valueRef.current.postcode,
      country: chosen.country || "United Kingdom",
      latitude: chosen.latitude,
      longitude: chosen.longitude,
      udprn: chosen.udprn,
      addressSource: "ideal_postcodes",
      postcodeValidated: true,
    });
    setShowFields(true);
    setStatus("address_selected");
    onClearError("addressLine1");
    onClearError("townCity");
  };

  const editField = (field: keyof RegistrationAddress, val: string) => {
    onClearError(field as string);
    patch({
      [field]: val,
      // Hand edits to a selected address make it user-entered.
      addressSource: valueRef.current.addressSource === "ideal_postcodes" ? "manual" : valueRef.current.addressSource,
    } as Partial<RegistrationAddress>);
  };

  const isBusy = status === "validating_postcode";

  return (
    <div className="space-y-4">
      {/* Postcode input + Find address */}
      <div className="relative group">
        <label htmlFor="postcode" className="block text-sm font-medium text-white/80 mb-2">
          Postcode
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-[#fe9a00] transition-colors" />
            <input
              type="text"
              id="postcode"
              name="postcode"
              value={postcodeInput}
              onChange={(e) => {
                setPostcodeInput(e.target.value.toUpperCase());
                onClearError("postcode");
              }}
              onBlur={() => {
                if (
                  postcodeInput &&
                  looksLikeValidPostcode(postcodeInput) &&
                  normalizePostcode(postcodeInput) !== normalizePostcode(value.postcode || "")
                ) {
                  runPostcodeLookup(postcodeInput);
                }
              }}
              placeholder="NW2 7UH"
              autoComplete="postal-code"
              aria-invalid={!!errors.postcode}
              className={fieldClass(!!errors.postcode)}
            />
          </div>
          <button
            type="button"
            onClick={() => runPostcodeLookup(postcodeInput)}
            disabled={isBusy || !postcodeInput.trim()}
            className="shrink-0 px-4 py-3.5 rounded-xl bg-[#fe9a00]/90 hover:bg-[#fe9a00] text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isBusy ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSearch className="w-4 h-4" />}
            Find address
          </button>
        </div>
        {errors.postcode && <p className="mt-1.5 text-red-400 text-xs" role="alert">{errors.postcode}</p>}
      </div>

      {/* Status / validation message */}
      {message && (
        <div
          className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${
            message.type === "error" ? "bg-red-500/10 text-red-300" : "bg-green-500/10 text-green-200"
          }`}
          role={message.type === "error" ? "alert" : "status"}
        >
          {message.type === "error" ? (
            <FiInfo className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          ) : (
            <FiCheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Address picker dropdown */}
      {addresses.length > 0 && (
        <div className="relative group">
          <label htmlFor="addressSelect" className="block text-sm font-medium text-white/80 mb-2">
            Select your address
          </label>
          <div className="relative">
            <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-[#fe9a00] transition-colors" />
            <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
            <select
              id="addressSelect"
              value={selectedId}
              onChange={(e) => selectAddress(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 appearance-none bg-white/5 hover:bg-white/[0.07] focus:bg-white/10 border-2 border-white/10 focus:border-[#fe9a00] rounded-xl text-white focus:outline-none transition-all duration-300"
            >
              <option value="" disabled className="bg-[#1a1a1a]">
                {addresses.length} {addresses.length === 1 ? "address" : "addresses"} found…
              </option>
              {addresses.map((a) => (
                <option key={a.id} value={a.id} className="bg-[#1a1a1a]">
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          {!showFields && (
            <button
              type="button"
              onClick={() => setShowFields(true)}
              className="mt-2 text-[#fe9a00] hover:text-orange-300 text-xs font-medium transition-colors"
            >
              My address isn&apos;t listed — enter manually
            </button>
          )}
        </div>
      )}

      {/* Individual address fields — editable once a postcode is validated */}
      {showFields && (
        <div className="space-y-4 pt-1">
          <div className="relative group">
            <label htmlFor="addressLine1" className="block text-sm font-medium text-white/80 mb-2">Address line 1</label>
            <div className="relative">
              <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-[#fe9a00] transition-colors" />
              <input id="addressLine1" type="text" value={value.addressLine1}
                onChange={(e) => editField("addressLine1", e.target.value)}
                placeholder="14 Example Road" autoComplete="address-line1"
                aria-invalid={!!errors.addressLine1} className={fieldClass(!!errors.addressLine1)} />
            </div>
            {errors.addressLine1 && <p className="mt-1.5 text-red-400 text-xs" role="alert">{errors.addressLine1}</p>}
          </div>

          <div className="relative group">
            <label htmlFor="addressLine2" className="block text-sm font-medium text-white/80 mb-2">
              Address line 2 <span className="text-white/30">(optional)</span>
            </label>
            <div className="relative">
              <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-[#fe9a00] transition-colors" />
              <input id="addressLine2" type="text" value={value.addressLine2 || ""}
                onChange={(e) => editField("addressLine2", e.target.value)}
                placeholder="Flat 2" autoComplete="address-line2" className={fieldClass(false)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative group">
              <label htmlFor="townCity" className="block text-sm font-medium text-white/80 mb-2">Town / City</label>
              <div className="relative">
                <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-[#fe9a00] transition-colors" />
                <input id="townCity" type="text" value={value.townCity}
                  onChange={(e) => editField("townCity", e.target.value)}
                  placeholder="London" autoComplete="address-level2"
                  aria-invalid={!!errors.townCity} className={fieldClass(!!errors.townCity)} />
              </div>
              {errors.townCity && <p className="mt-1.5 text-red-400 text-xs" role="alert">{errors.townCity}</p>}
            </div>

            <div className="relative group">
              <label htmlFor="county" className="block text-sm font-medium text-white/80 mb-2">County <span className="text-white/30">(optional)</span></label>
              <div className="relative">
                <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-[#fe9a00] transition-colors" />
                <input id="county" type="text" value={value.county || ""}
                  onChange={(e) => editField("county", e.target.value)}
                  placeholder="Greater London" className={fieldClass(false)} />
              </div>
            </div>
          </div>

          <div className="relative group">
            <label htmlFor="country" className="block text-sm font-medium text-white/80 mb-2">Country</label>
            <div className="relative">
              <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-[#fe9a00] transition-colors" />
              <input id="country" type="text" value={value.country || "United Kingdom"}
                onChange={(e) => editField("country", e.target.value)}
                autoComplete="country-name" className={fieldClass(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
