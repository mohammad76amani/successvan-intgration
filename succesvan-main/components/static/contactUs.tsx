"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiClock,
  FiSend,
  FiUser,
  FiMessageSquare,
  FiCheck,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { BsCheckCircleFill } from "react-icons/bs";
import { showToast } from "@/lib/toast";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const contactInfo = [
  {
    icon: FiPhone,
    title: "Call Us",
    subtitle: "Speak directly with our team",
    details: ["+44 203 01 111 98"],
    action: "tel:+442030111198",
    color: "#fe9a00",
  },
  {
    icon: FaWhatsapp,
    title: "WhatsApp",
    subtitle: "Quick message? Chat with us",
    details: ["07915193000"],
    action: "https://wa.me/447915193000",
    color: "#fe9a00",
  },
  {
    icon: FiMail,
    title: "Email Us",
    subtitle: "We'll respond within 24 hours",
    details: ["info@successvanhire.com"],
    action: "mailto:info@successvanhire.com",
    color: "#fe9a00",
  },
];

const locationInfo = {
  address: ["34 Waterloo Road", "London", "NW2 7UH"],
  parking: "Free customer parking available on-site",
};

const openingHours = [
  { days: "Monday - Friday", hours: "8:00 AM - 5:00 PM" },
  { days: "Saturday", hours: "8:00 AM - 4:00 PM" },
  { days: "Sunday", hours: "By appointment only" },
];

export default function Contact() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    rating: 5,
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, index) => {
        if (!card) return;

        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 60,
            scale: 0.9,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              once: true,
            },
            delay: index * 0.15,
          }
        );
      });

      gsap.to(".bg-orb-contact-1", {
        x: 100,
        y: -100,
        scale: 1.2,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 2,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Failed to send message");

      showToast.success("Message sent successfully!");
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({ name: "", email: "", message: "", rating: 5 });
      }, 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#0f172b] py-28 overflow-hidden"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bg-orb-contact-1 absolute top-1/4 right-1/4 w-150 h-150 rounded-full blur-3xl opacity-20 bg-[#fe9a00]"></div>
        <div className="absolute bottom-1/4 left-1/4 w-150 h-150 rounded-full blur-3xl opacity-20 bg-[#fe9a00]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 lg:mb-20">
          <h2 className="text-2xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
            Contact
             <span
              className="text-[#fe9a00]"
              style={{
                textShadow: "0 0 40px rgba(254, 154, 0, 0.3)",
              }}
            >
              Us Today
            </span>
          </h2>

          <p className="text-gray-300 text-sm sm:text-xl max-w-3xl mx-auto">
            We're here to help! Whether you have a question about our vans, need
            help with your booking, or want to discuss your hire needs in more
            detail — just get in touch.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-16">
          <div className="space-y-8">
            <div className="space-y-6">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <div
                    key={index}
                    ref={(el) => {
                      cardsRef.current[index] = el;
                    }}
                    className="float-card group"
                  >
                    <a
                      href={info.action}
                      className="block relative p-4 md:p-6 rounded-2xl border transition-all duration-500 hover:scale-105"
                      style={{
                        background: "rgba(15, 23, 42, 0.5)",
                        backdropFilter: "blur(30px)",
                        borderColor: "rgba(255,255,255,0.15)",
                      }}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl bg-linear-to-r from-[#fe9a00]/10 to-transparent"></div>

                      <div className="relative flex items-start gap-5">
                        <div
                          className="w-12 md:w-16 h-12 md:h-16 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                          style={{
                            background:
                              "linear-gradient(135deg, #fe9a00, #d97900)",
                            boxShadow: "0 10px 40px rgba(254, 154, 0, 0.3)",
                          }}
                        >
                          <Icon className="text-2xl text-white" />
                        </div>

                        <div className="flex-1">
                          <h3 className="text-base md:text-xl font-black text-white mb-1">
                            {info.title}
                          </h3>
                          <p className="text-gray-400 text-sm mb-3">
                            {info.subtitle}
                          </p>
                          {info.details.map((detail, idx) => (
                            <p
                              key={idx}
                              className="text-[#fe9a00] font-bold text-sm md:text-base"
                            >
                              {detail}
                            </p>
                          ))}
                        </div>
                      </div>
                    </a>
                  </div>
                );
              })}
            </div>

            <div
              ref={(el) => {
                cardsRef.current[3] = el;
              }}
              className="float-card relative p-4 md:p-6 rounded-2xl border"
              style={{
                background: "rgba(15, 23, 42, 0.5)",
                backdropFilter: "blur(30px)",
                borderColor: "rgba(255,255,255,0.15)",
              }}
            >
              <div className="flex items-start gap-5 mb-6">
                <div
                  className="w-12 md:w-16 h-12 md:h-16 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #fe9a00, #d97900)",
                    boxShadow: "0 10px 40px rgba(254, 154, 0, 0.3)",
                  }}
                >
                  <FiMapPin className="text-2xl text-white" />
                </div>

                <div className="flex-1">
                  <h3 className="text-base md:text-xl font-black text-white mb-1">
                    Visit Us
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">
                    View our fleet or pick up your vehicle
                  </p>
                  {locationInfo.address.map((line, idx) => (
                    <p key={idx} className="text-gray-200 font-semibold">
                      {line}
                    </p>
                  ))}
                  <p className="text-[#fe9a00] text-sm font-semibold mt-3 flex items-center gap-2">
                    <FiCheck className="text-base" />
                    {locationInfo.parking}
                  </p>
                </div>
              </div>

              <a
                href="https://maps.google.com/?q=34+Waterloo+Road+London+NW2+7UH"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-6 py-3 rounded-xl text-center font-bold text-white transition-all duration-300 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #fe9a00, #d97900)",
                  boxShadow: "0 10px 30px rgba(254, 154, 0, 0.3)",
                }}
              >
                Get Directions
              </a>
            </div>

            <div
              ref={(el) => {
                cardsRef.current[4] = el;
              }}
              className="float-card relative p-4 md:p-6 rounded-2xl border"
              style={{
                background: "rgba(15, 23, 42, 0.5)",
                backdropFilter: "blur(30px)",
                borderColor: "rgba(255,255,255,0.15)",
              }}
            >
              <div className="flex items-start gap-5 mb-6">
                <div
                  className="w-12 md:w-16 h-12 md:h-16 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #fe9a00, #d97900)",
                    boxShadow: "0 10px 40px rgba(254, 154, 0, 0.3)",
                  }}
                >
                  <FiClock className="text-2xl text-white" />
                </div>

                <div className="flex-1">
                  <h3 className="text-base md:text-xl font-black text-white mb-1">
                    Opening Hours
                  </h3>
                  <div className="space-y-3">
                    {openingHours.map((schedule, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between pb-3 border-b border-white/10 last:border-0"
                      >
                        <span className="text-gray-300 font-semibold">
                          {schedule.days}
                        </span>
                        <span className="text-[#fe9a00] font-bold">
                          {schedule.hours}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            ref={(el) => {
              cardsRef.current[5] = el;
            }}
            className="relative"
          >
            <div
              className="relative p-8 lg:p-10 rounded-3xl border h-full"
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                backdropFilter: "blur(30px)",
                borderColor: "rgba(255,255,255,0.2)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              }}
            >
              <div className="absolute inset-0 bg-linear-to-br from-[#fe9a00]/5 via-transparent to-transparent rounded-3xl"></div>

              <div className="relative">
                <h3 className="text-2xl font-black text-white mb-3">
                  Send us a Message
                </h3>
                <p className="text-gray-400 mb-8">
                  Fill out the form below and we'll get back to you as soon as
                  possible.
                </p>

                {!isSubmitted ? (
                  <form
                    ref={formRef}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <div>
                      <label className="text-white font-semibold mb-2 flex items-center gap-2">
                        <FiUser className="text-[#fe9a00]" />
                        Name <span className="text-[#fe9a00]">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Your full name"
                        className="w-full px-5 py-4 rounded-xl border bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] transition-all duration-300"
                        style={{
                          backdropFilter: "blur(10px)",
                          borderColor: "rgba(255,255,255,0.1)",
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-white font-semibold mb-2 flex items-center gap-2">
                        <FiMail className="text-[#fe9a00]" />
                        Email <span className="text-[#fe9a00]">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="your.email@example.com"
                        className="w-full px-5 py-4 rounded-xl border bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] transition-all duration-300"
                        style={{
                          backdropFilter: "blur(10px)",
                          borderColor: "rgba(255,255,255,0.1)",
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-white font-semibold mb-2 flex items-center gap-2">
                        <FiMessageSquare className="text-[#fe9a00]" />
                        Message <span className="text-[#fe9a00]">*</span>
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        placeholder="Tell us how we can help you..."
                        className="w-full px-5 py-4 rounded-xl border bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] transition-all duration-300 resize-none"
                        style={{
                          backdropFilter: "blur(10px)",
                          borderColor: "rgba(255,255,255,0.1)",
                        }}
                      ></textarea>
                    </div>

                    <div>
                      <label className="text-white font-semibold mb-3 block">
                        Rating <span className="text-[#fe9a00]">*</span>
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, rating: star }))
                            }
                            className="text-3xl transition-all duration-200 hover:scale-110"
                          >
                            <span
                              className={`${
                                star <= formData.rating
                                  ? "text-[#fe9a00]"
                                  : "text-gray-500"
                              }`}
                            >
                              ★
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group w-full px-8 py-5 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                      style={{
                        background: "linear-gradient(135deg, #fe9a00, #d97900)",
                        boxShadow: "0 15px 40px rgba(254, 154, 0, 0.4)",
                      }}
                    >
                      <span className="relative z-10 flex items-center gap-3">
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            Send Message
                            <FiSend className="text-xl group-hover:translate-x-1 transition-transform duration-300" />
                          </>
                        )}
                      </span>
                      <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                    </button>
                  </form>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-bounce"
                      style={{
                        background: "linear-gradient(135deg, #fe9a00, #d97900)",
                        boxShadow: "0 10px 40px rgba(254, 154, 0, 0.4)",
                      }}
                    >
                      <BsCheckCircleFill className="text-4xl text-white" />
                    </div>
                    <h4 className="text-2xl font-black text-white mb-3">
                      Message Sent!
                    </h4>
                    <p className="text-gray-300 text-lg">
                      Thank you for contacting us. We'll get back to you within
                      24 hours.
                    </p>
                  </div>
                )}
              </div>

              <div
                className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{
                  background: "radial-gradient(circle, #fe9a00, transparent)",
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
