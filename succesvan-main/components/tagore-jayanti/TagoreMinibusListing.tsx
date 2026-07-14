"use client";

import VanListingHome from "@/components/global/vanListingBackup";
import { VanData } from "@/types/type";

export default function TagoreMinibusListing() {
  const minibuses: VanData[] = [
    {
      _id: "6946803e1f709928d7406da2",
      name: "8 Seater Tourneo",
      description: "8 Seater Tourer - Perfect for group travel and comfortable transportation",
      image: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/1767521281931-Untitled-design-_10_.webp",
      requiredLicense: "License B / 3 **",
      pricePerHour: 150,
      fuel: "diesel",
      gear: "manual,automatic",
      seats: 8,
      doors: 4,
      category: {
        _id: "693e7be5720894f8fdb09ac2",
        name: "Minibus",
        description: "Minibus",
        expert: "Ford Transit Custom or Similar",
        type: "693e7be5720894f8fdb09ac2",
        showPrice: 120,
        status: "active",
        properties: [],
        requiredLicense: "License B / 3 **",
        pricingTiers: [
          { minDays: 1, maxDays: 6, pricePerDay: 150 },
          { minDays: 7, maxDays: 28, pricePerDay: 120 },
          { minDays: 29, maxDays: 30, pricePerDay: 100 }
        ],
        extrahoursRate: 15,
        fuel: "diesel",
        gear: {
          availableTypes: ["manual", "automatic"],
          automaticExtraCost: 25
        },
        seats: 8,
        doors: 4,
        servicesPeriod: {
          tyre: 30,
          oil: 30,
          coolant: 30,
          breakes: 30,
          service: 30,
          adBlue: 30
        }
      }
    },
    {
      _id: "694680a01f709928d7406ebf",
      name: "14 Seater Minibus",
      description: "14 Seater Minibus - The Ultimate Solution for Large Group Transport",
      image: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/1767518350966-Untitled-design-_6_.webp",
      requiredLicense: "License Class D / D1 **",
      pricePerHour: 180,
      fuel: "diesel",
      gear: "manual",
      seats: 14,
      doors: 3,
      category: {
        _id: "693e7be5720894f8fdb09ac2",
        name: "Minibus",
        description: "Minibus",
        expert: "Ford Transit or Similar",
        type: "693e7be5720894f8fdb09ac2",
        showPrice: 150,
        status: "active",
        properties: [],
        requiredLicense: "License Class D / D1 **",
        pricingTiers: [
          { minDays: 1, maxDays: 6, pricePerDay: 180 },
          { minDays: 7, maxDays: 28, pricePerDay: 150 },
          { minDays: 29, maxDays: 30, pricePerDay: 150 }
        ],
        extrahoursRate: 20,
        fuel: "diesel",
        gear: {
          availableTypes: ["manual"],
          automaticExtraCost: 0
        },
        seats: 14,
        doors: 3,
        servicesPeriod: {
          tyre: 30,
          oil: 30,
          coolant: 30,
          breakes: 30,
          service: 30,
          adBlue: 30
        }
      }
    },
    {
      _id: "694681091f709928d7406f7f",
      name: "17 Seater Minibus",
      description: "17 Seater Minibus - The Ideal Choice for Larger Group Transport",
      image: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/1767524485819-894d6c1a-bc48-4a27-9b8b-78d578c0cddd.png",
      requiredLicense: "License Class D/D1",
      pricePerHour: 198,
      fuel: "diesel",
      gear: "manual",
      seats: 17,
      doors: 3,
      category: {
        _id: "693e7be5720894f8fdb09ac2",
        name: "Minibus",
        description: "Minibus",
        expert: "Ford Transit or Similar",
        type: "693e7be5720894f8fdb09ac2",
        showPrice: 180,
        status: "active",
        properties: [],
        requiredLicense: "License Class D/D1",
        pricingTiers: [
          { minDays: 1, maxDays: 6, pricePerDay: 198 },
          { minDays: 7, maxDays: 28, pricePerDay: 180 },
          { minDays: 29, maxDays: 30, pricePerDay: 175 }
        ],
        extrahoursRate: 20,
        fuel: "diesel",
        gear: {
          availableTypes: ["manual"],
          automaticExtraCost: 0
        },
        seats: 17,
        doors: 3,
        servicesPeriod: {
          tyre: 30,
          oil: 30,
          coolant: 30,
          breakes: 30,
          service: 30,
          adBlue: 30
        }
      }
    }
  ];

  return (
    <section className="py-20 bg-[#0f172b]" id="booking">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-4">
          <h2 className="text-3xl lg:text-5xl font-black text-white mb-4">
            Our <span className="text-[#fe9a00]">Minibus Fleet</span>
          </h2>
          <p className="text-gray-200 text-lg">
            Choose the perfect minibus for your Tagore Jayanti Celebration travel
          </p>
        </div>
        <VanListingHome vans={minibuses} showHeader={false} gridCols={3} />
      </div>
    </section>
  );
}
