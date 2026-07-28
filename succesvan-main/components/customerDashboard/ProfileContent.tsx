"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import {
  FiCamera,
  FiCheckCircle,
  FiEdit3,
  FiHash,
  FiHome,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSave,
  FiShield,
  FiTrash2,
  FiUploadCloud,
  FiUser,
  FiX,
} from "react-icons/fi";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import LicenceDetailsReviewModal, {
  type LicenceDetailsReview,
} from "./LicenceDetailsReviewModal";

interface UserData {
  _id: string;
  name: string;
  lastName: string;
  address?: string;
  postalCode?: string;
  city?: string;
  avatar?: string;
  emaildata?: {
    emailAddress: string;
    isVerified: boolean;
  };
  phoneData?: {
    phoneNumber: string;
    isVerified: boolean;
  };
  licenceAttached?: {
    front?: string;
    back?: string;
  };
  licenceDetails?: LicenceDetailsReview;
}

type LicenceSide = "front" | "back";
type PendingLicenceReview = {
  file: File;
  previewUrl: string;
  details: LicenceDetailsReview;
};
type DeleteTarget =
  | { type: "avatar" }
  | { type: "licence"; side: LicenceSide };

function profileFieldsFromLicence(details: LicenceDetailsReview) {
  return {
    ...(details.address?.trim() ? { address: details.address.trim() } : {}),
    ...(details.postcode?.trim()
      ? { postalCode: details.postcode.trim() }
      : {}),
  };
}

const emptyFormData = {
  name: "",
  lastName: "",
  address: "",
  postalCode: "",
  city: "",
  emailAddress: "",
  phoneNumber: "",
};

const getInitials = (user: UserData | null) => {
  const fullName = `${user?.name || ""} ${user?.lastName || ""}`.trim();
  if (!fullName) return "SV";
  return fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function ProfileContent({
  onLicenseUpdate,
  scrollToSection,
}: {
  onLicenseUpdate?: () => void;
  scrollToSection?: "license" | "address" | null;
}) {
  const { setUser: setAuthUser } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(emptyFormData);
  const [uploading, setUploading] = useState({ front: false, back: false });
  const [deleting, setDeleting] = useState({ front: false, back: false });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarDeleting, setAvatarDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [pendingLicenceReview, setPendingLicenceReview] =
    useState<PendingLicenceReview | null>(null);
  const [licenceReviewSaving, setLicenceReviewSaving] = useState(false);

  const fullName = `${user?.name || ""} ${user?.lastName || ""}`.trim();
  const completedAddressFields = [
    user?.address,
    user?.city,
    user?.postalCode,
  ].filter(Boolean).length;
  const hasCompleteLicence = Boolean(
    user?.licenceAttached?.front && user?.licenceAttached?.back,
  );

  const profileProgress = useMemo(() => {
    const checks = [
      Boolean(user?.name),
      Boolean(user?.lastName),
      Boolean(user?.emaildata?.emailAddress),
      Boolean(user?.phoneData?.phoneNumber),
      completedAddressFields === 3,
      hasCompleteLicence,
      Boolean(user?.avatar),
    ];
    const complete = checks.filter(Boolean).length;
    return Math.round((complete / checks.length) * 100);
  }, [completedAddressFields, hasCompleteLicence, user]);

  const syncUser = useCallback((nextUser: UserData) => {
    setUser(nextUser);
    setAuthUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
  }, [setAuthUser]);

  const resetForm = useCallback((nextUser: UserData | null) => {
    setFormData({
      name: nextUser?.name || "",
      lastName: nextUser?.lastName || "",
      address: nextUser?.address || "",
      postalCode: nextUser?.postalCode || "",
      city: nextUser?.city || "",
      emailAddress: nextUser?.emaildata?.emailAddress || "",
      phoneNumber: nextUser?.phoneData?.phoneNumber || "",
    });
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast.error("No authentication token found");
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/auth", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch user");

      syncUser(data.data);
      resetForm(data.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [resetForm, syncUser]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (scrollToSection) {
      setIsEditing(true);
      setTimeout(() => {
        const element = document.getElementById(`section-${scrollToSection}`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [scrollToSection]);

  const uploadImage = async (file: File) => {
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error("File size must be less than 15MB");
    }
    if (!file.type.startsWith("image/")) {
      throw new Error("Please upload an image file");
    }

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formDataUpload,
    });
    const uploadData = await uploadRes.json();
    if (uploadData.error) throw new Error(uploadData.error);
    return uploadData.url as string;
  };

  const extractLicenceDetails = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch("/api/extract-license", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      throw new Error(
        payload?.error || "Could not scan the front licence image",
      );
    }
    return (await res.json()) as UserData["licenceDetails"];
  };

  const deleteUploadedImage = async (url: string) => {
    const deleteRes = await fetch(
      `/api/upload/delete?url=${encodeURIComponent(url)}`,
      { method: "DELETE" },
    );
    const deleteData = await deleteRes.json();
    if (!deleteRes.ok || deleteData.error) {
      throw new Error(deleteData.error || "Failed to delete file");
    }
  };

  const updateUser = async (payload: Record<string, unknown>) => {
    if (!user) throw new Error("User not loaded");
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/users/${user._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Update failed");
    syncUser(data.data);
    resetForm(data.data);
    return data.data as UserData;
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;

    const previousAvatar = user.avatar;
    setAvatarUploading(true);
    try {
      const avatar = await uploadImage(file);
      const updatedUser = await updateUser({ avatar });
      syncUser({ ...updatedUser, avatar });
      if (previousAvatar && previousAvatar !== avatar) {
        deleteUploadedImage(previousAvatar).catch((error) =>
          console.log("Previous avatar delete failed:", error),
        );
      }
      showToast.success("Avatar updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Avatar upload failed");
    } finally {
      setAvatarUploading(false);
    }
  };

  const requestAvatarDelete = () => {
    if (!user?.avatar) return;
    setDeleteTarget({ type: "avatar" });
  };

  const handleAvatarDelete = async () => {
    if (!user?.avatar) return;
    const avatarUrl = user.avatar;
    setAvatarDeleting(true);
    try {
      await deleteUploadedImage(avatarUrl);
      await updateUser({ deleteAvatar: true });
      showToast.success("Avatar deleted");
      setDeleteTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Avatar delete failed");
    } finally {
      setAvatarDeleting(false);
    }
  };

  const handleFileUpload = async (file: File, side: LicenceSide) => {
    if (!user) return;

    setUploading((prev) => ({ ...prev, [side]: true }));
    try {
      if (side === "front") {
        const licenceDetails = await extractLicenceDetails(file);
        setPendingLicenceReview({
          file,
          previewUrl: URL.createObjectURL(file),
          details: {
            ...licenceDetails,
            isFrontSide: true,
            sourceSide: "front",
          },
        });
        showToast.success("Licence scanned. Please confirm the details.");
        return;
      }

      const url = await uploadImage(file);
      const data = await updateUser({
        licenceAttached: {
          ...user.licenceAttached,
          [side]: url,
        },
      });
      showToast.success(`Licence ${side} uploaded`);
      syncUser(data);
      onLicenseUpdate?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Upload failed");
    } finally {
      setUploading((prev) => ({ ...prev, [side]: false }));
    }
  };

  const closeLicenceReview = () => {
    if (pendingLicenceReview?.previewUrl) {
      URL.revokeObjectURL(pendingLicenceReview.previewUrl);
    }
    setPendingLicenceReview(null);
  };

  const confirmLicenceDetails = async (licenceDetails: LicenceDetailsReview) => {
    if (!user || !pendingLicenceReview) return;
    setLicenceReviewSaving(true);
    setUploading((prev) => ({ ...prev, front: true }));
    try {
      const url = await uploadImage(pendingLicenceReview.file);
      const data = await updateUser({
        ...profileFieldsFromLicence(licenceDetails),
        licenceAttached: {
          ...user.licenceAttached,
          front: url,
        },
        licenceDetails: {
          ...licenceDetails,
          isFrontSide: true,
          sourceSide: "front",
        },
      });
      showToast.success("Licence front and details saved");
      syncUser(data);
      onLicenseUpdate?.();
      closeLicenceReview();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Could not save licence details");
    } finally {
      setLicenceReviewSaving(false);
      setUploading((prev) => ({ ...prev, front: false }));
    }
  };

  const requestLicenseDelete = (side: LicenceSide) => {
    if (!user?.licenceAttached?.[side]) return;
    setDeleteTarget({ type: "licence", side });
  };

  const handleLicenseDelete = async (side: LicenceSide) => {
    const licenseUrl = user?.licenceAttached?.[side];
    if (!user || !licenseUrl) return;

    setDeleting((prev) => ({ ...prev, [side]: true }));
    try {
      await deleteUploadedImage(licenseUrl);
      const data = await updateUser({ deleteLicenceSide: side });
      showToast.success(`Licence ${side} deleted`);
      syncUser(data);
      onLicenseUpdate?.();
      setDeleteTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Delete failed");
    } finally {
      setDeleting((prev) => ({ ...prev, [side]: false }));
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "avatar") {
      handleAvatarDelete();
      return;
    }
    handleLicenseDelete(deleteTarget.side);
  };

  const handleSave = async () => {
    const requiredFields = [
      formData.name,
      formData.lastName,
      formData.emailAddress,
      formData.phoneNumber,
      formData.address,
      formData.city,
      formData.postalCode,
    ];

    if (requiredFields.some((value) => !value.trim())) {
      showToast.error("Please complete all profile and address fields");
      return;
    }

    setIsSaving(true);
    try {
      await updateUser({
        name: formData.name.trim(),
        lastName: formData.lastName.trim(),
        address: formData.address.trim(),
        postalCode: formData.postalCode.trim(),
        city: formData.city.trim(),
        emaildata: { emailAddress: formData.emailAddress.trim() },
        phoneData: { phoneNumber: formData.phoneNumber.trim() },
      });

      showToast.success("Profile updated successfully");
      setIsEditing(false);
      onLicenseUpdate?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    resetForm(user);
    setIsEditing(false);
  };

  const updateField = (field: keyof typeof emptyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const inputClass =
    "w-full h-11 px-3 bg-white/10 border border-white/15 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] transition-colors text-sm";

  const renderTextField = (
    label: string,
    field: keyof typeof emptyFormData,
    icon: ReactNode,
    type = "text",
    placeholder = "",
  ) => (
    <label className="block min-w-0">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-gray-400">
        {icon}
        {label}
      </span>
      {isEditing ? (
        <input
          type={type}
          value={formData[field]}
          onChange={(event) => updateField(field, event.target.value)}
          className={inputClass}
          placeholder={placeholder}
        />
      ) : (
        <div className="min-h-11 rounded-lg border border-white/10 bg-white/4 px-3 py-2.5 text-sm font-semibold text-white">
          {formData[field] || "-"}
        </div>
      )}
    </label>
  );

  const renderLicenceCard = (side: LicenceSide, title: string) => {
    const imageUrl = user?.licenceAttached?.[side];
    const isBusy = uploading[side] || deleting[side];

    return (
      <div className="rounded-xl border border-white/10 bg-white/4 p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white">{title}</h4>
            <p className="text-xs text-gray-500">
              {imageUrl ? "Uploaded" : "Required for booking confirmation"}
            </p>
          </div>
          {imageUrl && (
            <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold text-green-400">
              Ready
            </span>
          )}
        </div>

        {imageUrl ? (
          <div className="relative overflow-hidden rounded-lg border border-white/10">
            <div className={`relative h-48 w-full ${isBusy ? "opacity-60" : ""}`}>
              <Image
                src={imageUrl}
                alt={`${title} licence`}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-linear-to-t from-black/70 to-transparent p-3">
              <button
                type="button"
                onClick={() => requestLicenseDelete(side)}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                <FiTrash2 />
                {deleting[side] ? "Deleting" : "Delete"}
              </button>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#fe9a00] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#e68a00]">
                <FiCamera />
                {uploading[side] ? "Uploading" : "Change"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    event.target.files?.[0] &&
                    handleFileUpload(event.target.files[0], side)
                  }
                  disabled={isBusy}
                />
              </label>
            </div>
          </div>
        ) : (
          <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/10 text-center transition-colors hover:border-[#fe9a00]/70 hover:bg-[#fe9a00]/5">
            <FiUploadCloud className="mb-2 text-2xl text-[#fe9a00]" />
            <span className="text-sm font-semibold text-white">
              {uploading[side] ? "Uploading" : `Upload ${title}`}
            </span>
            <span className="mt-1 text-xs text-gray-500">Image, max 15MB</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) =>
                event.target.files?.[0] &&
                handleFileUpload(event.target.files[0], side)
              }
              disabled={uploading[side]}
            />
          </label>
        )}
      </div>
    );
  };

  const renderLicenceDetails = () => {
    const details = user?.licenceDetails;
    if (!details?.isFrontSide) return null;

    const rows = [
      ["Full name", details.fullName],
      ["Licence number", details.licenceNumber || details.licenseNumber],
      ["Date of birth", details.dateOfBirth],
      ["Expiry date", details.expiryDate || details.expirationDate],
      ["Issue date", details.issueDate],
      ["Postcode", details.postcode],
      ["Address", details.address],
      ["Authority", details.issuingAuthority],
      ["Categories", details.licenceCategories?.join(", ")],
    ].filter(([, value]) => Boolean(value));

    if (rows.length === 0) return null;

    return (
      <div className="mt-4 rounded-xl border border-[#fe9a00]/20 bg-[#fe9a00]/8 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black text-white">
              Saved licence details
            </h4>
            <p className="text-xs text-gray-400">
              These confirmed details will be used on your rental agreement.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-bold text-green-400">
            <FiCheckCircle />
            Confirmed
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-black/20 px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
                {label}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-white">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-gray-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-xl border border-white/10 bg-white/4">
        <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative h-24 w-24 shrink-0">
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={fullName || "Profile avatar"}
                  fill
                  sizes="96px"
                  className={`rounded-xl border border-white/10 object-cover ${
                    avatarUploading || avatarDeleting ? "opacity-60" : ""
                  }`}
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-linear-to-br from-[#fe9a00] to-amber-600 text-2xl font-black text-slate-950 shadow-lg shadow-[#fe9a00]/20">
                  {getInitials(user)}
                </div>
              )}

              <label className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-[#fe9a00] text-white shadow-lg shadow-black/30 transition-colors hover:bg-[#e68a00]">
                <FiCamera />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    event.target.files?.[0] &&
                    handleAvatarUpload(event.target.files[0])
                  }
                  disabled={avatarUploading || avatarDeleting}
                />
              </label>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#fe9a00]">
                Customer profile
              </p>
              <h2 className="truncate text-2xl font-black text-white sm:text-3xl">
                {fullName || "Profile Settings"}
              </h2>
              <p className="mt-1 truncate text-sm text-gray-400">
                {user?.emaildata?.emailAddress || "No email saved"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gray-300">
                  <FiCheckCircle className="text-green-400" />
                  {profileProgress}% complete
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    hasCompleteLicence
                      ? "bg-green-500/15 text-green-400"
                      : "bg-yellow-500/15 text-yellow-400"
                  }`}
                >
                  <FiShield />
                  {hasCompleteLicence ? "Licence ready" : "Licence needed"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            {user?.avatar && (
              <button
                type="button"
                onClick={requestAvatarDelete}
                disabled={avatarDeleting || avatarUploading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
              >
                <FiTrash2 />
                {avatarDeleting ? "Deleting" : "Delete Avatar"}
              </button>
            )}
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-600 disabled:opacity-50 sm:flex-none"
                >
                  <FiSave />
                  {isSaving ? "Saving" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/20 sm:flex-none"
                >
                  <FiX />
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#fe9a00] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#e68a00] sm:flex-none"
              >
                <FiEdit3 />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </section>

      <section
        id="section-address"
        className="rounded-xl border border-white/10 bg-white/4 p-4 sm:p-5"
      >
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-black text-white">
              Profile Information
            </h3>
            <p className="text-sm text-gray-500">
              Keep your contact and booking address details up to date.
            </p>
          </div>
          {isEditing && (
            <span className="text-xs font-semibold text-[#fe9a00]">
              All fields are editable
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {renderTextField("First Name", "name", <FiUser />, "text", "Ali")}
          {renderTextField("Last Name", "lastName", <FiUser />, "text", "Rezaei")}
          {renderTextField(
            "Email",
            "emailAddress",
            <FiMail />,
            "email",
            "name@example.com",
          )}
          {renderTextField(
            "Phone",
            "phoneNumber",
            <FiPhone />,
            "tel",
            "+44...",
          )}
          <div className="md:col-span-2">
            {renderTextField(
              "Street Address",
              "address",
              <FiHome />,
              "text",
              "House number and street",
            )}
          </div>
          {renderTextField("City", "city", <FiMapPin />, "text", "London")}
          {renderTextField(
            "Postal Code",
            "postalCode",
            <FiHash />,
            "text",
            "NW2 7UH",
          )}
        </div>
      </section>

      <section
        id="section-license"
        className="rounded-xl border border-white/10 bg-white/4 p-4 sm:p-5"
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-black text-white">
              Licence Attachments
            </h3>
            <p className="text-sm text-gray-500">
              Upload clear photos of both sides so bookings can be confirmed
              quickly.
            </p>
          </div>
          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              hasCompleteLicence
                ? "bg-green-500/15 text-green-400"
                : "bg-yellow-500/15 text-yellow-400"
            }`}
          >
            <FiShield />
            {hasCompleteLicence ? "Complete" : "Incomplete"}
          </span>
        </div>

        <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3">
          <p className="text-sm leading-relaxed text-green-300">
            Your licence images are used only for booking checks and are removed
            after the reservation process no longer requires them.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {renderLicenceCard("front", "Front Side")}
          {renderLicenceCard("back", "Back Side")}
        </div>

        {renderLicenceDetails()}
      </section>

      {deleteTarget && (
        <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#1a2847] p-5 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
                <FiTrash2 />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {deleteTarget.type === "avatar"
                    ? "Delete Avatar"
                    : "Delete Licence Image"}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-400">
                  {deleteTarget.type === "avatar"
                    ? "Your profile avatar will be removed from your account."
                    : `The ${deleteTarget.side} side of your licence will be removed from your account.`}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={
                  avatarDeleting ||
                  (deleteTarget.type === "licence" && deleting[deleteTarget.side])
                }
                className="flex-1 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/20 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={
                  avatarDeleting ||
                  (deleteTarget.type === "licence" && deleting[deleteTarget.side])
                }
                className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {avatarDeleting ||
                (deleteTarget.type === "licence" && deleting[deleteTarget.side])
                  ? "Deleting"
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <LicenceDetailsReviewModal
        open={Boolean(pendingLicenceReview)}
        imagePreview={pendingLicenceReview?.previewUrl}
        details={pendingLicenceReview?.details ?? null}
        saving={licenceReviewSaving}
        onCancel={closeLicenceReview}
        onConfirm={confirmLicenceDetails}
      />
    </div>
  );
}
