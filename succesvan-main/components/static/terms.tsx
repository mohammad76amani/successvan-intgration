 
"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import {
  FiFileText,
  FiCheck,
  FiAlertCircle,
  FiShield,
  FiClock,
  FiDollarSign,
  FiTruck,
  FiAlertTriangle,
  FiKey,
} from "react-icons/fi";
import { BsCheckCircleFill } from "react-icons/bs";
import Link from "next/link";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface TermSection {
  id: number;
  icon: any;
  title: string;
  subsections: {
    id: string;
    content: string;
  }[];
}

const termsData: TermSection[] = [
  {
    id: 1,
    icon: FiFileText,
    title: "Reservation",
    subsections: [
      {
        id: "1.1",
        content:
          "All the Success van hire reservations are subject to availability.",
      },
      {
        id: "1.2",
        content:
          "A reservation is only confirmed once payment or a deposit has been received and a confirmation email has been issued.",
      },
      {
        id: "1.3",
        content:
          "The hirer must be at least 23 years old to drive our vans, 25 years old for our Minibuses and hold a valid full driving licence for a minimum of 2 years, our maximum age is 80 years old.",
      },
    ],
  },
  {
    id: 2,
    icon: FiDollarSign,
    title: "Payment & Deposit",
    subsections: [
      {
        id: "2.1",
        content:
          "Full payment or a deposit of £50 is required to secure a reservation.",
      },
      {
        id: "2.2",
        content:
          "A security deposit will be held during the rental period and refunded 21 working days after return of the vehicle in acceptable condition.",
      },
      {
        id: "2.3",
        content: "Payment can be made by credit/debit card or bank transfer.",
      },
      {
        id: "2.4",
        content:
          "Security deposit is £250 for the normal panel vans and £350 for Luton, Tipper, Refrigerator and Minibuses.",
      },
    ],
  },
  {
    id: 3,
    icon: FiClock,
    title: "Cancellation Policy",
    subsections: [
      {
        id: "3.1",
        content:
          "Cancellations made more than 48 hours prior to the hire date will receive a full refund.",
      },
      {
        id: "3.2",
        content:
          "Cancellations made within 48 hours of the hire date will incur a £50 charge.",
      },
      {
        id: "3.3",
        content: "No-shows or same-day cancellations will be charged in full.",
      },
    ],
  },
  {
    id: 4,
    icon: FiTruck,
    title: "Vehicle Use",
    subsections: [
      {
        id: "4.1",
        content:
          "The vehicle must not be used for illegal purposes, off-road driving, racing, or towing.",
      },
      {
        id: "4.2",
        content:
          "The hirer is responsible for all fines, penalties, or charges incurred during the hire period.",
      },
      {
        id: "4.3",
        content:
          "Smoking and the transport of pets are not permitted unless agreed in writing.",
      },
      {
        id: "4.4",
        content:
          "Mileage limits (150 miles per day). Excess mileage charges may apply.",
      },
    ],
  },
  {
    id: 5,
    icon: FiCheck,
    title: "Driver Requirements",
    subsections: [
      {
        id: "5.1",
        content:
          "Drivers must provide a valid driving licence, proof of address, DVLA check code and ID at collection.",
      },
      {
        id: "5.2",
        content:
          "Additional drivers must be approved and listed in the hire agreement.",
      },
      {
        id: "5.3",
        content:
          "Points, convictions, or disqualifications must be disclosed at booking.",
      },
    ],
  },
  {
    id: 6,
    icon: FiShield,
    title: "Insurance",
    subsections: [
      {
        id: "6.1",
        content:
          "Comprehensive insurance is included in the hire fee (unless stated otherwise).",
      },
      {
        id: "6.2",
        content:
          "An excess of £1750 applies in the event of damage or theft, reduce excess available on request.",
      },
      {
        id: "6.3",
        content: "Insurance does not cover personal belongings or damage.",
      },
      {
        id: "6.4",
        content:
          "Damage caused to the vehicle by driver due to the driver negligent, will not covered by insurance.",
      },
      {
        id: "6.5",
        content:
          "In case of damage or broken to locks, if the cost to repair is lower than the insurance excess, then repair will be done outside insurance.",
      },
    ],
  },
  {
    id: 7,
    icon: FiAlertTriangle,
    title: "Breakdown & Accidents",
    subsections: [
      {
        id: "7.1",
        content: "The vehicle is covered by roadside assistance.",
      },
      {
        id: "7.2",
        content:
          "In the event of an accident, the hirer must notify the company and complete an accident report form.",
      },
      {
        id: "7.3",
        content: "Any mechanical issues must be reported immediately.",
      },
      {
        id: "7.4",
        content:
          "In an event of breakdown, Success van hire is not responsible for loss of business or holiday purposes.",
      },
    ],
  },
  {
    id: 8,
    icon: FiClock,
    title: "Return of Vehicle",
    subsections: [
      {
        id: "8.1",
        content:
          "The vehicle must be returned on the agreed date and time, in the same condition it was collected.",
      },
      {
        id: "8.2",
        content: "Late returns may incur additional charges.",
      },
      {
        id: "8.3",
        content:
          "Fuel must be replaced to the original level or a refuelling charge will apply.",
      },
    ],
  },
  {
    id: 9,
    icon: FiAlertCircle,
    title: "Liability",
    subsections: [
      {
        id: "9.1",
        content:
          "The hirer is liable for any loss or damage not covered by insurance.",
      },
      {
        id: "9.2",
        content:
          "Success van hire is not responsible for delays or cancellations due to weather, traffic, or breakdowns.",
      },
    ],
  },
  {
    id: 10,
    icon: FiFileText,
    title: "Governing Law",
    subsections: [
      {
        id: "10.1",
        content: "These terms are governed by the laws of England and Wales.",
      },
      {
        id: "10.2",
        content: "Any disputes will be settled in the courts in London.",
      },
    ],
  },
  {
    id: 11,
    icon: FiAlertTriangle,
    title: "Restrictions on International Travel",
    subsections: [
      {
        id: "11.1",
        content:
          "The vehicle must not be taken outside of England and Wales under any circumstances.",
      },
      {
        id: "11.2",
        content:
          "Any attempt to drive or transport the vehicle across international borders will be considered a breach of contract and may result in: Immediate termination of the hire agreement, Forfeiture of any deposit paid, Full liability for any recovery, legal, or transport costs incurred, Loss of insurance coverage.",
      },
      {
        id: "11.3",
        content:
          "GPS tracking may be used to monitor vehicle location for security and contract compliance purposes.",
      },
    ],
  },
  {
    id: 12,
    icon: FiClock,
    title: "Extension of Hire & Payment Failure",
    subsections: [
      {
        id: "12.1",
        content:
          "Requests to extend the hire period must be made at least 12 hours before the original return date and are subject to vehicle availability and approval by the Success van hire.",
      },
      {
        id: "12.2",
        content:
          "Full payment for the extended period must be made in advance. The extension will not be confirmed until payment is received.",
      },
      {
        id: "12.3",
        content:
          "If payment for the extension fails or is not received on time, the following will apply: The extension will be considered void, and the original return date/time will remain in effect. Failure to return the vehicle on time will result in late return charges and may be treated as unauthorised use. Success van hire reserves the right to take legal action or recover the vehicle at the hirer's expense.",
      },
    ],
  },
  {
    id: 13,
    icon: FiAlertCircle,
    title: "Traffic Violations and Administrative Charges",
    subsections: [
      {
        id: "13.1",
        content:
          "The hirer is fully responsible for any traffic, parking, toll, congestion, or other fines or penalties incurred during the hire period.",
      },
      {
        id: "13.2",
        content:
          "If the company receives a fine or penalty notice relating to the hire period, the company will transfer liability to the hirer where possible.",
      },
      {
        id: "13.3",
        content:
          "An administrative fee of £25 will be charged per fine or notice processed to cover the cost of handling and transferring the ticket.",
      },
      {
        id: "13.4",
        content:
          "If the fine cannot be transferred, the amount will be deducted from the security deposit or charged directly to the hirer's payment method on file.",
      },
    ],
  },
  {
    id: 14,
    icon: FiAlertTriangle,
    title: "Misfuelling (Wrong Fuel Use)",
    subsections: [
      {
        id: "14.1",
        content:
          "The hirer is responsible for ensuring the correct fuel type is used in the vehicle.",
      },
      {
        id: "14.2",
        content:
          "If the wrong fuel is put into the vehicle, the hirer will be fully liable for: The cost of draining and cleaning the fuel system, Any mechanical damage caused, Recovery or towing charges, Loss of hire while the vehicle is off the road.",
      },
      {
        id: "14.3",
        content:
          "No refund or compensation will be provided for any disruption or delays caused by misfuelling.",
      },
      {
        id: "14.4",
        content:
          "The correct fuel type is clearly indicated on the fuel cap and/or inside the vehicle documentation. If unsure, the hirer must contact the company before refuelling.",
      },
    ],
  },
  {
    id: 15,
    icon: FiShield,
    title: "Lock Damage, Theft, and Break-Ins",
    subsections: [
      {
        id: "15.1",
        content:
          "The hirer is responsible for ensuring the vehicle is securely locked and parked in a safe location when unattended.",
      },
      {
        id: "15.2",
        content:
          "In the event of a break-in, attempted theft, or damage to locks or windows, the hirer will be liable for: The cost of repairs or replacement of locks, windows, or damaged parts, Any items stolen from the vehicle (unless insured separately by the hirer), Any insurance excess applicable £1750, Loss of use while the vehicle is being repaired.",
      },
      {
        id: "15.3",
        content:
          "Theft or vandalism must be reported immediately to the police, and a crime reference number must be provided to the company.",
      },
      {
        id: "15.4",
        content:
          "Insurance coverage may be void if the vehicle was left unsecured or if negligence is found.",
      },
    ],
  },
  {
    id: 16,
    icon: FiDollarSign,
    title: "Minor Damage Below Insurance Excess",
    subsections: [
      {
        id: "16.1",
        content:
          "The hirer is financially responsible for any damage to the vehicle, regardless of fault, up to the value of the insurance excess.",
      },
      {
        id: "16.2",
        content:
          "If the cost of repairing the damage is less than the insurance excess, the hirer will be charged the actual cost of repair, plus a reasonable administration fee £180 to cover assessment and processing.",
      },
      {
        id: "16.3",
        content:
          "Success van hire will provide an itemised repair invoice or estimate upon request.",
      },
      {
        id: "16.4",
        content:
          "This includes, but is not limited to: Scratches, dents, and scuffs to bodywork, Interior damage, stains, or burns, Damage to wheels, tyres, mirrors, or lights.",
      },
    ],
  },
  {
    id: 17,
    icon: FiKey,
    title: "Lost or Damaged Keys",
    subsections: [
      {
        id: "17.1",
        content:
          "The hirer is responsible for the safekeeping of the vehicle's keys during the hire period.",
      },
      {
        id: "17.2",
        content:
          "In the event of lost, stolen, or damaged keys, the hirer will be liable for: The full cost of key replacement, including programming and re-coding £400, Any associated vehicle recovery or locksmith charges, Loss of use of the vehicle until a replacement key is provided.",
      },
      {
        id: "17.3",
        content: "Spare keys will not be provided unless arranged in advance.",
      },
      {
        id: "17.4",
        content:
          "No refund or reimbursement will be issued for unused hire time due to key loss or delays caused by replacement.",
      },
    ],
  },
  {
    id: 18,
    icon: FiShield,
    title: "Windscreen Chips and Damage",
    subsections: [
      {
        id: "18.1",
        content:
          "The hirer is responsible for any damage to the vehicle's windscreen, including chips, cracks, or impact marks, that occur during the hire period.",
      },
      {
        id: "18.2",
        content:
          "If a chip can be repaired, the hirer will be charged the repair cost (typically £50–£70), plus an administrative fee of £25.",
      },
      {
        id: "18.3",
        content:
          "If the windscreen requires full replacement, the hirer will be liable for the full cost of replacement, up to the insurance excess amount (typically £250–£400, depending on the vehicle model).",
      },
      {
        id: "18.4",
        content:
          "If a chip is not reported and worsens into a crack, requiring full replacement, the hirer may be liable for the full cost regardless of insurance cover.",
      },
      {
        id: "18.5",
        content:
          "The hirer should inspect the windscreen upon collection and report any pre-existing damage immediately.",
      },
      {
        id: "18.6",
        content:
          "Optional Windscreen Protection: The hirer may choose to purchase windscreen protection for £10 per day, which covers repair of chips and reduces the replacement cost liability to £150 excess. This must be added at the time of booking or prior to vehicle collection.",
      },
    ],
  },
];

export default function TermsAndConditions() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [isTocOpen, setIsTocOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Update active section based on scroll position
      const sections = document.querySelectorAll("[data-section]");
      let current = null;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 150 && rect.bottom >= 150) {
          current = parseInt(section.getAttribute("data-section") || "0");
        }
      });

      if (current !== null) {
        setActiveSection(current);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".terms-header",
        { opacity: 0, y: -50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
        }
      );

      gsap.utils.toArray(".term-section").forEach((section: any, index) => {
        gsap.fromTo(
          section,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 90%",
              toggleActions: "play none none reverse",
              once: true,
            },
            delay: index * 0.05,
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const scrollToSection = (id: number) => {
    const element = document.querySelector(`[data-section="${id}"]`);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setIsTocOpen(false);
    }
  };

  return (
    <section ref={sectionRef} className="relative w-full bg-[#0f172b] py-28  ">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#fe9a00]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#fe9a00]/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="terms-header text-center mb-16">
          <h1 className="text-3xl  lg:text-5xl font-black text-white mb-6 leading-tight">
            Terms & Conditions
          </h1>

          <p className="text-gray-300 text-sm sm:text-lg max-w-3xl mx-auto mb-8">
            Success Van Hire Reservation – Terms and Conditions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Table of Contents - Fixed Sidebar */}
          <div
            className={`lg:col-span-1 ${
              isTocOpen ? "block" : "hidden"
            } lg:block`}
          >
            <div className="w-full lg:sticky lg:top-24 lg:h-fit lg:max-w-xs">
              <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                <h3 className="text-white text-lg font-black mb-6 flex items-center gap-2">
                  <FiFileText className="text-[#fe9a00]" />
                  Contents
                </h3>
                <nav className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
                  {termsData.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 text-sm font-semibold ${
                        activeSection === section.id
                          ? "bg-[#fe9a00] text-white shadow-lg"
                          : "text-gray-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="text-xs opacity-70 block mb-1">
                        Section {section.id}
                      </span>
                      {section.title}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {termsData.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.id}
                  data-section={section.id}
                  className="term-section"
                >
                  <div className="relative p-4 lg:p-10 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-[#fe9a00]/30 transition-all duration-300">
                    {/* Section Header */}
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-linear-to-br from-[#fe9a00] to-[#d97900] flex items-center justify-center  shrink-0 shadow-xl">
                        <Icon className="text-2xl text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[#fe9a00] text-xs font-bold mb-1">
                          Section {section.id}
                        </div>
                        <h2 className="text-lg sm:text-3xl font-black text-white">
                          {section.title}
                        </h2>
                      </div>
                    </div>

                    {/* Subsections */}
                    <div className="space-y-4">
                      {section.subsections.map((subsection) => (
                        <div
                          key={subsection.id}
                          className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-300 group"
                        >
                          <div className=" shrink-0 w-8 h-8 rounded-lg bg-[#fe9a00]/20 border border-[#fe9a00]/30 flex items-center justify-center">
                            <BsCheckCircleFill className="text-[#fe9a00] text-sm" />
                          </div>
                          <div className="flex-1">
                            <span className="text-[#fe9a00] text-xs font-bold mr-2">
                              {subsection.id}
                            </span>
                            <span className="text-gray-300 text-sm md:text-base leading-relaxed">
                              {subsection.content}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Footer Note */}
            <div className="p-8 rounded-2xl bg-linear-to-br from-[#fe9a00]/20 to-[#fe9a00]/5 border border-[#fe9a00]/30 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <BsCheckCircleFill className="text-[#fe9a00] text-2xl" />
                <h3 className="text-2xl font-black text-white">Thank You</h3>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">
                Thank you for choosing{" "}
                <span className="text-[#fe9a00] font-bold">
                  Success Van Hire
                </span>
                . By making a reservation with us, you agree to these terms and
                conditions. We look forward to serving you!
              </p>

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-gray-400 text-sm">
                  <strong className="text-white">Last Updated:</strong> January
                  2026
                  <br />
                  <strong className="text-white">Document Version:</strong> 1.0
                </p>
              </div>
            </div>

            {/* Contact CTA */}
            <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-center">
              <h3 className="text-2xl font-black text-white mb-4">
                Questions About Our Terms?
              </h3>
              <p className="text-gray-300 mb-6">
                If you need clarification on any of these terms, please contact
                us
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="tel:+442030111198"
                  className="px-8 py-4 rounded-xl bg-linear-to-r from-[#fe9a00] to-[#d97900] text-white font-bold hover:scale-105 transition-all duration-300 shadow-2xl"
                >
                  Call: +44 20 3011 1198
                </a>
                <Link
                  href="/contact-us"
                  className="px-8 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition-all duration-300"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .term-section,
          .term-section * {
            visibility: visible;
          }
          .term-section {
            position: absolute;
            left: 0;
            top: 0;
          }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #fe9a00;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d97900;
        }
      `}</style>
    </section>
  );
}
 