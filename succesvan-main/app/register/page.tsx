import AuthForm from "@/components/auth/AuthForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register - Success Van Hire | Create Account for Van Rental London",
  description:
    "Create your Success Van Hire account to book vans online. Quick registration for van rental services in London. Sign up today for easy booking.",
  keywords:
    "register success van hire, create account van rental, sign up van hire london, van rental registration, success van hire account",
  openGraph: {
    title: "Register - Success Van Hire London",
    description:
      "Create your account for easy van booking and rental management in London.",
    type: "website",
  },
   
  alternates: {
    canonical: "https://www.successvanhire.co.uk/register",
  },
};
export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#0f172b] flex items-center justify-center p-4">
      <AuthForm />
    </div>
  );
}
