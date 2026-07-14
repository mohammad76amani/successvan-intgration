"use client";

import { useState, useEffect } from "react";
import { FiUser, FiMail, FiPhone, FiMapPin, FiCamera, FiSave, FiX } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/lib/toast";
import Image from "next/image";

export default function AdminProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    postalCode: "",
    city: "",
    avatar: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        lastName: user.lastName || "",
        email: user.emailData?.emailAddress || user.emaildata?.emailAddress || "",
        phone: user.phoneData?.phoneNumber?.replace("+44", "") || user.phoneNumber?.replace("+44", "") || "",
        address: user.address || "",
        postalCode: user.postalCode || "",
        city: user.city || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      const uploadData = await uploadRes.json();
      
      if (uploadData.error) throw new Error(uploadData.error);
      
      setFormData((prev) => ({ ...prev, avatar: uploadData.url }));
      showToast.success("Avatar uploaded successfully!");
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/users/${user?._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          lastName: formData.lastName,
          emaildata: { emailAddress: formData.email },
          phoneData: { phoneNumber: `+44${formData.phone}` },
          address: formData.address,
          postalCode: formData.postalCode,
          city: formData.city,
          avatar: formData.avatar,
        }),
      });

      const data = await response.json();
      
      if (!data.success) throw new Error(data.error || "Update failed");
      
      localStorage.setItem("user", JSON.stringify(data.data));
      showToast.success("Profile updated successfully!");
      window.location.reload();
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FiUser className="text-[#fe9a00]" />
            My Profile
          </h2>
          <p className="text-sm text-white/40 mt-1">Manage your account information</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-white/5 border-2 border-white/10 flex items-center justify-center">
                {formData.avatar ? (
                  <Image
                    src={formData.avatar}
                    alt="Avatar"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiUser className="w-12 h-12 text-white/20" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-10 h-10 bg-[#fe9a00] hover:bg-orange-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all">
                {uploadingAvatar ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiCamera className="text-white text-lg" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
            {formData.avatar && (
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, avatar: "" }))}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Remove Avatar
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <FiUser className="text-[#fe9a00] text-xs" />
                First Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <FiUser className="text-[#fe9a00] text-xs" />
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <FiMail className="text-[#fe9a00] text-xs" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <FiPhone className="text-[#fe9a00] text-xs" />
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">
                  +44
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setFormData((prev) => ({ ...prev, phone: digits }));
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-14 pr-4 py-3 text-white focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all"
                  maxLength={10}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <FiMapPin className="text-[#fe9a00] text-xs" />
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-300 mb-2 block">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, postalCode: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-300 mb-2 block">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#fe9a00] focus:ring-1 focus:ring-[#fe9a00]/30 transition-all"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <FiX className="text-sm" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[#fe9a00] hover:bg-orange-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#fe9a00]/20"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="text-sm" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Account Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/40">Role</span>
            <span className="text-white font-semibold capitalize">{user?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Account ID</span>
            <span className="text-white/60 font-mono text-xs">{user?._id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
