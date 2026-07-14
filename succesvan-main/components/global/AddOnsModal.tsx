"use client";

import { useState } from "react";
import { FiX, FiPackage, FiCheckCircle } from "react-icons/fi";

interface AddOn {
  _id: string;
  name: string;
  description?: string;
  pricingType: "flat" | "tiered";
  flatPrice?: {
    amount: number;
    isPerDay: boolean;
  };
  tieredPrice?: {
    isPerDay: boolean;
    tiers: { minDays: number; maxDays: number; price: number }[];
  };
}

interface AddOnsModalProps {
  addOns: AddOn[];
  selectedAddOns: {
    addOn: string;
    quantity: number;
    selectedTierIndex?: number;
  }[];
  onSave: (
    selected: { addOn: string; quantity: number; selectedTierIndex?: number }[],
  ) => void;
  onClose: () => void;
  rentalDays: number;
  selectedCategoryId?: string;
}

export default function AddOnsModal({
  addOns,
  selectedAddOns,
  onSave,
  onClose,
  rentalDays,
  selectedCategoryId,
}: AddOnsModalProps) {
  const [selected, setSelected] =
    useState<{ addOn: string; quantity: number; selectedTierIndex?: number }[]>(
      selectedAddOns,
    );

  const getAddOnPrice = (addon: AddOn, tierIndex?: number) => {
    if (addon.pricingType === "flat") {
      const amount = addon.flatPrice?.amount || 0;
      const isPerDay = addon.flatPrice?.isPerDay || false;
      return isPerDay ? amount * rentalDays : amount;
    }
    if (tierIndex !== undefined && addon.tieredPrice?.tiers?.[tierIndex]) {
      const tier = addon.tieredPrice.tiers[tierIndex];
      if (rentalDays >= tier.minDays && rentalDays <= tier.maxDays) {
        const price = tier.price;
        const isPerDay = addon.tieredPrice.isPerDay || false;
        return isPerDay ? price * rentalDays : price;
      }
    }
    const matchingTier = addon.tieredPrice?.tiers?.find(
      (tier) => rentalDays >= tier.minDays && rentalDays <= tier.maxDays,
    );
    if (matchingTier) {
      const isPerDay = addon.tieredPrice?.isPerDay || false;
      return isPerDay ? matchingTier.price * rentalDays : matchingTier.price;
    }
    return 0;
  };

  const handleToggle = (addonId: string, addon: AddOn) => {
    const hasMatchingTier =
      addon.pricingType === "flat" ||
      addon.tieredPrice?.tiers?.some(
        (tier) => rentalDays >= tier.minDays && rentalDays <= tier.maxDays,
      );
    if (!hasMatchingTier) return;

    const exists = selected.find((s) => s.addOn === addonId);
    if (exists) {
      setSelected(selected.filter((s) => s.addOn !== addonId));
    } else {
      let defaultTierIndex = 0;
      if (addon.pricingType === "tiered" && addon.tieredPrice?.tiers) {
        const matchingTierIndex = addon.tieredPrice.tiers.findIndex(
          (tier) => rentalDays >= tier.minDays && rentalDays <= tier.maxDays,
        );
        defaultTierIndex = matchingTierIndex !== -1 ? matchingTierIndex : 0;
      }
      setSelected([
        ...selected,
        {
          addOn: addonId,
          quantity: 1,
          selectedTierIndex:
            addon.pricingType === "tiered" ? defaultTierIndex : undefined,
        },
      ]);
    }
  };

  const handleTierChange = (addonId: string, tierIndex: number) => {
    setSelected(
      selected.map((s) =>
        s.addOn === addonId ? { ...s, selectedTierIndex: tierIndex } : s,
      ),
    );
  };

  const totalCost = selected.reduce((sum, item) => {
    const addon = addOns.find((a) => a._id === item.addOn);
    return (
      sum +
      (addon ? getAddOnPrice(addon, item.selectedTierIndex) * item.quantity : 0)
    );
  }, 0);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-10001"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-10002 flex items-center justify-center p-0 sm:p-4">
        <div className="bg-linear-to-br from-[#13203a] to-[#1a2847] rounded-none sm:rounded-2xl max-w-5xl w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] overflow-hidden border border-white/10 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 bg-[#16233f]/95 backdrop-blur-sm">
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-white">
                Select Add-ons
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                Rental Duration: {rentalDays} day{rentalDays !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"
            >
              <FiX className="text-white text-lg sm:text-xl" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 ">
              <div className="flex items-center gap-2 mb-4">
                <FiPackage className="text-[#fe9a00] text-base sm:text-lg" />
                <h3 className="text-white font-bold text-sm sm:text-base">
                  Available Add-ons
                </h3>
                {selected.length > 0 && (
                  <span className="ml-auto text-[10px] sm:text-xs font-bold text-[#fe9a00] bg-[#fe9a00]/10 px-2 py-1 rounded-full">
                    {selected.length} selected
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {addOns
                  .filter((addon) => {
                    // Category filter: if addon has a categoryId, only show it when the selected category matches
                    const rawCatId = (addon as any).categoryId;
                    const addonCategoryId = rawCatId?._id
                      ? String(rawCatId._id)
                      : rawCatId && typeof rawCatId === "string" && rawCatId.length > 0
                      ? rawCatId
                      : null;
                    if (addonCategoryId) {
                      if (!selectedCategoryId || addonCategoryId !== String(selectedCategoryId)) return false;
                    }
                    return (
                      addon.pricingType === "flat" ||
                      addon.tieredPrice?.tiers?.some(
                        (tier) =>
                          rentalDays >= tier.minDays &&
                          rentalDays <= tier.maxDays,
                      )
                    );
                  })
                  .sort((a, b) => {
                    const typeA = (a as any).type || "";
                    const typeB = (b as any).type || "";
                    if (typeA === typeB) return 0;
                    if (!typeA) return 1;
                    if (!typeB) return -1;
                    return typeA.localeCompare(typeB);
                  })
                  .map((addon) => {
                    const isSelected = selected.find(
                      (s) => s.addOn === addon._id,
                    );
                    const price = getAddOnPrice(
                      addon,
                      isSelected?.selectedTierIndex,
                    );

                    const addonType = (addon as any).type;
                    const isTypeDisabled =
                      addonType &&
                      selected.some((s) => {
                        const selectedAddon = addOns.find(
                          (a) => a._id === s.addOn,
                        );
                        return (
                          selectedAddon &&
                          (selectedAddon as any).type === addonType &&
                          selectedAddon._id !== addon._id
                        );
                      });

                    return (
                      <div
                        title={addon.name}
                        key={addon._id}
                        className={`relative rounded-2xl border p-2 transition-all ${
                          isSelected
                            ? "border-[#fe9a00] bg-[#fe9a00]/10 shadow-lg shadow-[#fe9a00]/10"
                            : isTypeDisabled
                              ? "border-red-500/20 bg-white/5 opacity-45 cursor-not-allowed"
                              : "border-white/10 bg-white/5 hover:border-[#fe9a00]/30 hover:bg-white/8 cursor-pointer"
                        }`}
                        onClick={() =>
                          !isTypeDisabled && handleToggle(addon._id, addon)
                        }
                      >
                        {/* Top badge */}
                        {isSelected && (
                          <div className="absolute top-3 right-3">
                            <div className="w-6 h-6 rounded-full bg-[#fe9a00] flex items-center justify-center shadow-lg">
                              <FiCheckCircle className="text-white text-sm" />
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col h-full items-center justify-center">
                          {/* Icon */}
                          <div className="mb-3">
                            {(addon as any).icon ? (
                              <div className="w-full h-full rounded-xl overflow-hidden ">
                                <img
                                  src={(addon as any).icon}
                                  alt={addon.name}
                                  className="w-full h-full object-contain"
                                />
                              </div> 

                            ) : (
                              <div className="w-full h-28 sm:h-32 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                                <FiPackage className="text-white/20 text-4xl" />
                              </div>
                            )}
                          </div>

                          {/* Title */}
                          <div className="mb-2 min-w-0 text-center">
                            <h3 className="text-white font-bold text-[11px] sm:text-xs md:truncate ">
                              {addon.name}
                            </h3>
                            {/* {addon.description && (
                              <p className="text-gray-400 text-[10px] mt-1 line-clamp-2 min-h-[32px]">
                                {addon.description}
                              </p>
                            )} */}
                            {isTypeDisabled && (
                              <p className="text-red-400 text-[10px] mt-1">
                                Another option of this type is already selected
                              </p>
                            )}
                          </div>

                          {/* Price */}
                          <div className="mt-auto">
                            {addon.pricingType === "flat" ? (
                              <div className="mb-3">
                                <p className="text-[#fe9a00] font-black text-base sm:text-lg">
                                  £{addon.flatPrice?.amount || 0}
                                </p>
                                {addon.flatPrice?.isPerDay && (
                                  <p className="text-gray-500 text-[11px] mt-0.5">
                                    £{addon.flatPrice?.amount || 0}/day ×{" "}
                                    {rentalDays} day
                                    {rentalDays > 1 ? "s" : ""} = £
                                    {price.toFixed(2)}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="mb-3">
                                <p className="text-gray-400 text-[10px] mb-1 font-medium">
                                  Available tier
                                  {addon.tieredPrice?.isPerDay &&
                                    ` (per day × ${rentalDays}d)`}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {addon.tieredPrice?.tiers
                                    ?.filter(
                                      (tier) =>
                                        rentalDays >= tier.minDays &&
                                        rentalDays <= tier.maxDays,
                                    )
                                    .map((tier) => {
                                      const originalIdx =
                                        addon.tieredPrice?.tiers?.indexOf(
                                          tier,
                                        ) || 0;
                                      const tierPrice = addon.tieredPrice
                                        ?.isPerDay
                                        ? tier.price * rentalDays
                                        : tier.price;

                                      return (
                                        <button
                                          key={originalIdx}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (isSelected) {
                                              handleTierChange(
                                                addon._id,
                                                originalIdx,
                                              );
                                            }
                                          }}
                                          disabled={!isSelected}
                                          className={`px-2.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-semibold transition-colors ${
                                            isSelected?.selectedTierIndex ===
                                            originalIdx
                                              ? "bg-[#fe9a00] text-white"
                                              : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
                                          } disabled:opacity-50`}
                                        >
                                          {tier.minDays}-{tier.maxDays}d: £
                                          {tier.price}
                                          {addon.tieredPrice?.isPerDay && (
                                            <span className="ml-1">
                                              = £{tierPrice.toFixed(2)}
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                </div>
                              </div>
                            )}

                            {/* Select / Unselect button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isTypeDisabled) {
                                  handleToggle(addon._id, addon);
                                }
                              }}
                              disabled={isTypeDisabled}
                              className={`w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                                isTypeDisabled
                                  ? "bg-gray-600/40 text-gray-400 cursor-not-allowed"
                                  : isSelected
                                    ? "bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30"
                                    : "bg-[#fe9a00] hover:bg-orange-600 text-white shadow-lg shadow-[#fe9a00]/20"
                              }`}
                              title={
                                isTypeDisabled
                                  ? "Another option of this type is already selected"
                                  : isSelected
                                    ? "Remove addon"
                                    : "Select addon"
                              }
                            >
                              {isSelected ? "Unselect" : "Select"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-white/10 p-3 sm:p-4 bg-[#16233f]/95 backdrop-blur-sm">
            <div className="bg-white/5 rounded-xl p-3 mb-3 border border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-semibold text-sm">
                  Total Add-ons Cost
                </span>
                <span className="text-[#fe9a00] font-black text-lg sm:text-xl">
                  £{totalCost.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onSave(selected);
                  onClose();
                }}
                className="flex-1 px-4 py-3 bg-[#fe9a00] hover:bg-orange-600 text-white rounded-xl transition-colors font-semibold text-sm shadow-lg"
              >
                Confirm Add-ons ({selected.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
