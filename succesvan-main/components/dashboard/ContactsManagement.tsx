"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  FiCamera,
  FiCheckCircle,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUploadCloud,
  FiUser,
  FiX,
} from "react-icons/fi";
import DynamicTableView from "./DynamicTableView";
import CustomSelect from "@/components/ui/CustomSelect";
import { User } from "@/types/type";
import { showToast } from "@/lib/toast";

interface EditUserData {
  name: string;
  lastName: string;
  address: string;
  postalCode: string;
  city: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: string;
  avatar: string;
  licenceFront: string;
  licenceBack: string;
}

interface EmailData {
  emailAddress: string;
  isVerified: boolean;
}

interface PhoneData {
  phoneNumber: string;
  isVerified: boolean;
}

interface LicenseData {
  front?: string;
  back?: string;
}

type MutateFn = () => Promise<void>;
type CreateStep = "phone" | "details";
type LicenceSide = "front" | "back";
type LicenceUploadMode = "create" | "edit";
type PhoneLookupStatus = "idle" | "checking" | "found" | "not-found" | "error";
type UsersResponseData = User[] | { data?: User[]; users?: User[] };
type EditUserStringField = Exclude<
  keyof EditUserData,
  "emailVerified" | "phoneVerified"
>;

interface UsersApiResponse {
  data?: UsersResponseData;
}

const roleOptions = [
  { _id: "user", name: "Customer" },
  { _id: "admin", name: "Admin" },
  { _id: "owner", name: "Owner" },
  { _id: "Secretary", name: "Secretary" },
  { _id: "Consultant", name: "Consultant" },
  { _id: "Accountant", name: "Accountant" },
];

const verificationOptions = [
  { _id: "true", name: "Verified" },
  { _id: "false", name: "Not verified" },
];

const createStepLabels = ["Find phone", "User details"];
const modalPanelClass =
  "rounded-xl border border-white/10 bg-white/[0.035] shadow-sm shadow-black/10";
const modalPanelHeaderClass =
  "flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3";
const modalFieldLabelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400";
const modalInputClass =
  "w-full h-11 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-white placeholder-gray-500 transition-all focus:border-[#fe9a00] focus:bg-white/[0.09] focus:outline-none";
const modalValueClass =
  "min-h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white";
const modalActionClass =
  "flex-1 rounded-lg px-4 py-3 text-sm font-bold transition-colors disabled:opacity-50";

const emptyUserData: EditUserData = {
  name: "",
  lastName: "",
  address: "",
  postalCode: "",
  city: "",
  email: "",
  phone: "",
  emailVerified: false,
  phoneVerified: true,
  role: "user",
  avatar: "",
  licenceFront: "",
  licenceBack: "",
};

const normalizePhoneDigits = (value?: string) => (value || "").replace(/\D/g, "");

const formatUkLocalPhoneInput = (value: string) => {
  let digits = normalizePhoneDigits(value);
  if (digits.startsWith("44")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
};

const formatPhoneForLookup = (value: string) => {
  const localPhone = formatUkLocalPhoneInput(value);
  return localPhone ? `+44${localPhone}` : "";
};

const getUsersFromResponse = (response: UsersApiResponse) => {
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.users)) return payload.users;
  }
  return [];
};

const getEditDataFromUser = (item: User): EditUserData => ({
  name: item.name,
  lastName: item.lastName,
  address: item.address || "",
  postalCode: item.postalCode || "",
  city: item.city || "",
  email: item.emaildata.emailAddress,
  phone: item.phoneData.phoneNumber,
  emailVerified: item.emaildata.isVerified,
  phoneVerified: item.phoneData.isVerified,
  role: item.role || "user",
  avatar: item.avatar || "",
  licenceFront: item.licenceAttached?.front || "",
  licenceBack: item.licenceAttached?.back || "",
});

export default function ContactsManagement() {
  const mutateRef = useRef<MutateFn | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>("phone");
  const [phoneLookupStatus, setPhoneLookupStatus] =
    useState<PhoneLookupStatus>("idle");
  const [phoneLookupMessage, setPhoneLookupMessage] = useState("");
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [editData, setEditData] = useState<EditUserData | null>(null);
  const [createData, setCreateData] = useState<EditUserData>({
    ...emptyUserData,
  });
  const [createLicenceUploading, setCreateLicenceUploading] = useState({
    front: false,
    back: false,
  });
  const [editLicenceUploading, setEditLicenceUploading] = useState({
    front: false,
    back: false,
  });
  const [createAvatarUploading, setCreateAvatarUploading] = useState(false);
  const [editAvatarUploading, setEditAvatarUploading] = useState(false);
  const isCreateLicenceUploading =
    createLicenceUploading.front || createLicenceUploading.back;
  const isEditLicenceUploading =
    editLicenceUploading.front || editLicenceUploading.back;
  const isCreateMediaUploading =
    isCreateLicenceUploading || createAvatarUploading;
  const isEditMediaUploading = isEditLicenceUploading || editAvatarUploading;
  const selectedFullName = selectedUser
    ? `${selectedUser.name || ""} ${selectedUser.lastName || ""}`.trim()
    : "";
  const createFullName =
    `${createData.name || ""} ${createData.lastName || ""}`.trim() ||
    "New user";
  const selectedInitials =
    selectedFullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "SV";
  const createHasLicence = Boolean(
    createData.licenceFront || createData.licenceBack,
  );
  const editHasLicence = Boolean(
    editData?.licenceFront || editData?.licenceBack,
  );

  // Helper function to get auth headers
  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : "",
    };
  };

  const handleViewDetails = (item: User) => {
    setSelectedUser(item);
    setEditData(getEditDataFromUser(item));
    setEditLicenceUploading({ front: false, back: false });
    setEditAvatarUploading(false);
    setIsDetailOpen(true);
    setIsEditing(false);
  };

  const handleEditChange = (field: EditUserStringField, value: string) => {
    setEditData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleEditBooleanChange = (
    field: "emailVerified" | "phoneVerified",
    value: boolean,
  ) => {
    setEditData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleCreateChange = (field: EditUserStringField, value: string) => {
    const nextValue = field === "phone" ? formatUkLocalPhoneInput(value) : value;
    setCreateData((prev) => ({ ...prev, [field]: nextValue }));
    if (field === "phone") {
      setCreateStep("phone");
      setMatchedUser(null);
      setPhoneLookupStatus("idle");
      setPhoneLookupMessage("");
    }
  };

  const resetCreateForm = () => {
    setCreateData({ ...emptyUserData });
    setCreateLicenceUploading({ front: false, back: false });
    setCreateAvatarUploading(false);
    setCreateStep("phone");
    setPhoneLookupStatus("idle");
    setPhoneLookupMessage("");
    setMatchedUser(null);
  };

  const openMatchedUserDetails = () => {
    if (!matchedUser) return;
    setIsCreateOpen(false);
    handleViewDetails(matchedUser);
  };

  const handlePhoneLookup = async () => {
    const phoneNumber = formatPhoneForLookup(createData.phone);

    if (!/^[0-9]{10}$/.test(createData.phone)) {
      showToast.error("Please enter a valid 10-digit UK phone number");
      return;
    }

    setPhoneLookupStatus("checking");
    setPhoneLookupMessage("");
    setMatchedUser(null);

    try {
      const params = new URLSearchParams({
        phone: phoneNumber,
        limit: "5",
      });
      const res = await fetch(`/api/users?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Phone lookup failed");

      const expectedPhone = normalizePhoneDigits(phoneNumber);
      const users = getUsersFromResponse(data);
      const existingUser =
        users.find(
          (user: User) =>
            normalizePhoneDigits(user.phoneData?.phoneNumber) === expectedPhone,
        ) || null;

      if (existingUser) {
        setMatchedUser(existingUser);
        setPhoneLookupStatus("found");
        setPhoneLookupMessage("This user already exists. No new user was created.");
        return;
      }

      setCreateData((prev) => ({
        ...prev,
        phone: formatUkLocalPhoneInput(phoneNumber),
      }));
      setCreateStep("details");
      setPhoneLookupStatus("not-found");
      setPhoneLookupMessage("No user found. Complete the details to create one.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Phone lookup failed";
      setPhoneLookupStatus("error");
      setPhoneLookupMessage(message);
      showToast.error(message);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (createStep !== "details") {
      await handlePhoneLookup();
      return;
    }

    if (
      !createData.name.trim() ||
      !createData.lastName.trim() ||
      !/^[0-9]{10}$/.test(createData.phone)
    ) {
      showToast.error("First name, last name, and phone are required");
      return;
    }

    if (isCreateMediaUploading) {
      showToast.error("Please wait for upload to finish");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: createData.name.trim(),
          lastName: createData.lastName.trim(),
          address: createData.address.trim(),
          postalCode: createData.postalCode.trim(),
          city: createData.city.trim(),
          email: createData.email.trim(),
          phone: formatPhoneForLookup(createData.phone),
          role: createData.role,
          avatar: createData.avatar,
          licenceAttached: {
            front: createData.licenceFront,
            back: createData.licenceBack,
          },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Create failed");

      showToast.success("User created successfully!");
      setIsCreateOpen(false);
      resetCreateForm();
      if (mutateRef.current) await mutateRef.current();
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Create failed");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedUser || !editData) return;
    if (isEditMediaUploading) {
      showToast.error("Please wait for upload to finish");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/users/${selectedUser._id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editData.name,
          lastName: editData.lastName,
          address: editData.address,
          postalCode: editData.postalCode,
          city: editData.city,
          email: editData.email,
          phone: editData.phone,
          emailVerified: editData.emailVerified,
          phoneVerified: editData.phoneVerified,
          role: editData.role,
          avatar: editData.avatar,
          licenceAttached: {
            front: editData.licenceFront,
            back: editData.licenceBack,
          },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Update failed");
      showToast.success("User updated successfully!");
      setSelectedUser(data.data);
      setEditData(getEditDataFromUser(data.data));
      setIsEditing(false);
      if (mutateRef.current) mutateRef.current();
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    if (!uploadRes.ok || uploadData.error) {
      throw new Error(uploadData.error || "Upload failed");
    }
    return uploadData.url as string;
  };

  const setLicenceUrl = (
    mode: LicenceUploadMode,
    side: LicenceSide,
    url: string,
  ) => {
    const field = side === "front" ? "licenceFront" : "licenceBack";
    if (mode === "create") {
      setCreateData((prev) => ({ ...prev, [field]: url }));
      return;
    }
    setEditData((prev) => (prev ? { ...prev, [field]: url } : prev));
  };

  const handleLicenceUpload = async (
    file: File,
    side: LicenceSide,
    mode: LicenceUploadMode,
  ) => {
    const setUploading =
      mode === "create" ? setCreateLicenceUploading : setEditLicenceUploading;

    setUploading((prev) => ({ ...prev, [side]: true }));
    try {
      const url = await uploadImage(file);
      setLicenceUrl(mode, side, url);
      showToast.success(
        mode === "edit"
          ? `Licence ${side} uploaded. Save user to keep changes.`
          : `Licence ${side} uploaded`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      showToast.error(message || "Upload failed");
    } finally {
      setUploading((prev) => ({ ...prev, [side]: false }));
    }
  };

  const setAvatarUrl = (mode: LicenceUploadMode, url: string) => {
    if (mode === "create") {
      setCreateData((prev) => ({ ...prev, avatar: url }));
      return;
    }
    setEditData((prev) => (prev ? { ...prev, avatar: url } : prev));
  };

  const handleAvatarUpload = async (
    file: File,
    mode: LicenceUploadMode,
  ) => {
    const setUploading =
      mode === "create" ? setCreateAvatarUploading : setEditAvatarUploading;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      setAvatarUrl(mode, url);
      showToast.success(
        mode === "edit"
          ? "Avatar uploaded. Save user to keep changes."
          : "Avatar uploaded",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      showToast.error(message || "Avatar upload failed");
    } finally {
      setUploading(false);
    }
  };

  const renderAvatarUploadCard = (mode: LicenceUploadMode) => {
    const imageUrl = mode === "create" ? createData.avatar : editData?.avatar || "";
    const isUploading =
      mode === "create" ? createAvatarUploading : editAvatarUploading;

    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white">Avatar</h4>
            <p className="text-xs text-gray-500">
              {imageUrl ? "Uploaded" : "Image, max 15MB"}
            </p>
          </div>
          {imageUrl && (
            <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold text-green-400">
              Ready
            </span>
          )}
        </div>

        {imageUrl ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div
              className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 ${
                isUploading ? "opacity-60" : ""
              }`}
            >
              <Image
                src={imageUrl}
                alt="User avatar"
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 flex-wrap gap-2">
              <label
                className={`inline-flex items-center gap-1.5 rounded-lg bg-[#fe9a00] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#e68a00] ${
                  isUploading ? "pointer-events-none opacity-60" : "cursor-pointer"
                }`}
              >
                <FiCamera />
                {isUploading ? "Uploading" : "Change"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading}
                  onChange={async (event) => {
                    const input = event.currentTarget;
                    const file = input.files?.[0];
                    if (!file) return;
                    await handleAvatarUpload(file, mode);
                    input.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => setAvatarUrl(mode, "")}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                <FiTrash2 />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label
            className={`flex h-32 w-full flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/10 text-center transition-colors hover:border-[#fe9a00]/70 hover:bg-[#fe9a00]/5 ${
              isUploading ? "pointer-events-none opacity-60" : "cursor-pointer"
            }`}
          >
            <FiUploadCloud className="mb-2 text-2xl text-[#fe9a00]" />
            <span className="text-sm font-semibold text-white">
              {isUploading ? "Uploading" : "Upload Avatar"}
            </span>
            <span className="mt-1 text-xs text-gray-500">
              JPG, PNG, or WebP
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploading}
              onChange={async (event) => {
                const input = event.currentTarget;
                const file = input.files?.[0];
                if (!file) return;
                await handleAvatarUpload(file, mode);
                input.value = "";
              }}
            />
          </label>
        )}
      </div>
    );
  };

  const renderStatusPill = (label: string, isActive: boolean) => (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? "border-green-500/25 bg-green-500/15 text-green-300"
          : "border-red-500/25 bg-red-500/15 text-red-300"
      }`}
    >
      <FiCheckCircle className={isActive ? "text-green-300" : "text-red-300"} />
      {label}
    </span>
  );

  const renderReadField = (label: string, value?: string, hint?: string) => (
    <div>
      <label className={modalFieldLabelClass}>{label}</label>
      <div className={modalValueClass}>{value || "-"}</div>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );

  const renderLicenceUploadCard = (
    mode: LicenceUploadMode,
    side: LicenceSide,
    title: string,
  ) => {
    const field = side === "front" ? "licenceFront" : "licenceBack";
    const imageUrl =
      mode === "create" ? createData[field] : editData?.[field] || "";
    const isUploading =
      mode === "create"
        ? createLicenceUploading[side]
        : editLicenceUploading[side];

    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white">{title}</h4>
            <p className="text-xs text-gray-500">
              {imageUrl ? "Uploaded" : "Image, max 15MB"}
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
            <div
              className={`relative h-44 w-full ${isUploading ? "opacity-60" : ""}`}
            >
              <Image
                src={imageUrl}
                alt={`${title} licence`}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap justify-end gap-2 bg-linear-to-t from-black/75 to-transparent p-3">
              <button
                type="button"
                onClick={() => setLicenceUrl(mode, side, "")}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                <FiTrash2 />
                Remove
              </button>
              <label
                className={`inline-flex items-center gap-1.5 rounded-lg bg-[#fe9a00] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#e68a00] ${
                  isUploading ? "pointer-events-none opacity-60" : "cursor-pointer"
                }`}
              >
                <FiCamera />
                {isUploading ? "Uploading" : "Change"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading}
                  onChange={async (event) => {
                    const input = event.currentTarget;
                    const file = input.files?.[0];
                    if (!file) return;
                    await handleLicenceUpload(file, side, mode);
                    input.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        ) : (
          <label
            className={`flex h-44 w-full flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/10 text-center transition-colors hover:border-[#fe9a00]/70 hover:bg-[#fe9a00]/5 ${
              isUploading ? "pointer-events-none opacity-60" : "cursor-pointer"
            }`}
          >
            <FiUploadCloud className="mb-2 text-2xl text-[#fe9a00]" />
            <span className="text-sm font-semibold text-white">
              {isUploading ? "Uploading" : `Upload ${title}`}
            </span>
            <span className="mt-1 text-xs text-gray-500">
              JPG, PNG, or WebP
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploading}
              onChange={async (event) => {
                const input = event.currentTarget;
                const file = input.files?.[0];
                if (!file) return;
                await handleLicenceUpload(file, side, mode);
                input.value = "";
              }}
            />
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => {
            resetCreateForm();
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-[#fe9a00] hover:bg-[#e68a00] text-white font-bold rounded-lg transition-colors"
        >
          <FiPlus /> Add User
        </button>
      </div>

      <DynamicTableView
        hideDelete={true}
        apiEndpoint="/api/users"
        filters={[
          { key: "username", label: "Username", type: "text" },
          { key: "email", label: "Email", type: "text" },
          { key: "phone", label: "Phone", type: "text" },
          { key: "createdAt", label: "Joined Date", type: "date" },
        ]}
        title="User"
        columns={[
          {
            key: "name" as keyof User,
            label: "Username",
          },
          {
            key: "lastName" as keyof User,
            label: "Last Name",
          },
          {
            key: "emaildata" as keyof User,
            label: "Email",
            render: (value: EmailData) => (
              <div className="flex items-center gap-2">
                <span>{value?.emailAddress || "-"}</span>
                <span
                  className={`text-[10px] font-semibold ${
                    value?.isVerified ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {value?.isVerified ? "verify" : "unVerify"}
                </span>
              </div>
            ),
          },
          {
            key: "phoneData" as keyof User,
            label: "Phone",
            render: (value: PhoneData) => (
              <div className="flex items-center gap-2">
                <span>{value?.phoneNumber || "-"}</span>
                <span
                  className={`text-[10px] font-semibold ${
                    value?.isVerified ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {value?.isVerified ? "verify" : "unVerify"}
                </span>
              </div>
            ),
          },
          {
            key: "address" as keyof User,
            label: "Address",
          },
          {
            key: "postalCode" as keyof User,
            label: "Postal Code",
          },
          {
            key: "city" as keyof User,
            label: "City",
          },
          {
            key: "role" as keyof User,
            label: "Role",
            render: (value: string) => (
              <span className="capitalize">{value || "user"}</span>
            ),
          },
          {
            key: "avatar" as keyof User,
            label: "Avatar",
            render: (value: string) =>
              value ? (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-xs underline"
                >
                  Open avatar
                </a>
              ) : (
                "-"
              ),
          },
          {
            key: "createdAt" as keyof User,
            label: "Joined",
            render: (value: Date) =>
              new Date(value).toLocaleDateString("en-GB"),
          },
          {
            key: "licenceAttached" as keyof User,
            label: "Licence",
            render: (value: LicenseData) => (
              <div className="flex items-center gap-2">
                {value?.front || value?.back ? (
                  <div className="flex gap-1">
                    {value?.front && (
                      <a
                        href={value.front}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs underline"
                      >
                        Front
                      </a>
                    )}
                    {value?.back && (
                      <a
                        href={value.back}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs underline"
                      >
                        Back
                      </a>
                    )}
                  </div>
                ) : (
                  <span className="text-red-400 text-xs">No License</span>
                )}
              </div>
            ),
          },
        ]}
        hiddenColumns={["address", "postalCode", "city", "role", "avatar"]}
        onEdit={handleViewDetails}
        onMutate={(mutate) => (mutateRef.current = mutate)}
      />

      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#172540] rounded-2xl max-w-5xl w-full border max-h-[92vh] overflow-y-auto border-white/10 shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between gap-4 p-6 border-b border-white/10 bg-[#172540] z-10">
              <div>
                <h2 className="text-2xl font-black text-white">Create User</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  {createStepLabels[createStep === "phone" ? 0 : 1]} — Step{" "}
                  {createStep === "phone" ? 1 : 2} of 2
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#fe9a00]/15 border border-[#fe9a00]/30 px-3 py-1 text-xs font-semibold text-[#fe9a00]">
                    Admin add
                  </span>
                  <span className="rounded-full bg-green-500/15 border border-green-500/25 px-3 py-1 text-xs font-semibold text-green-300">
                    No SMS verification
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiX className="text-white text-xl" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
              <div aria-hidden="true" className="select-none">
                <div className="flex items-center gap-1.5">
                  {[1, 2].map((s) => {
                    const currentStepNumber = createStep === "phone" ? 1 : 2;
                    return (
                      <div key={s} className="flex-1 flex items-center gap-1.5">
                        <div
                          className={`h-1.5 sm:h-2 rounded-full flex-1 transition-all duration-500 ${
                            s < currentStepNumber
                              ? "bg-green-500"
                              : s === currentStepNumber
                                ? "bg-[#fe9a00]"
                                : "bg-white/10"
                          }`}
                        />
                        {s < 2 && (
                          <div
                            className={`w-1 h-1 rounded-full hidden sm:block ${
                              s < currentStepNumber
                                ? "bg-green-500"
                                : "bg-white/10"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="hidden sm:flex justify-between mt-1.5">
                  {createStepLabels.map((label, index) => {
                    const currentStepNumber = createStep === "phone" ? 1 : 2;
                    return (
                      <span
                        key={label}
                        className={`text-[10px] font-semibold tracking-wider uppercase ${
                          index + 1 <= currentStepNumber
                            ? "text-[#fe9a00]"
                            : "text-gray-600"
                        }`}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>

              {createStep === "phone" ? (
                <>
                  <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-4 border-b border-white/10 pb-3">
                      <h3 className="text-white font-semibold">
                        Search Existing User
                      </h3>
                    </div>

                    <label className="text-gray-400 text-sm mb-2 block">
                      Phone Number
                    </label>
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="relative group flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <FiPhone className="w-5 h-5 text-white/40 group-focus-within:text-[#fe9a00] transition-colors" />
                        </div>
                        <div className="absolute inset-y-0 left-12 flex items-center pointer-events-none">
                          <span className="text-white/60 font-medium text-sm sm:text-base">
                            +44
                          </span>
                        </div>
                        <input
                          type="tel"
                          value={createData.phone}
                          onChange={(e) =>
                            handleCreateChange("phone", e.target.value)
                          }
                          required
                          maxLength={10}
                          autoComplete="tel"
                          className="w-full pl-22 pr-4 py-3 bg-white/5 hover:bg-white/7 focus:bg-white/10 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#fe9a00] transition-all"
                          placeholder="7400123456"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={phoneLookupStatus === "checking"}
                        className="md:w-44 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg transition-colors font-semibold disabled:opacity-50"
                      >
                        {phoneLookupStatus === "checking" ? (
                          "Searching..."
                        ) : (
                          <>
                            <FiSearch /> Search
                          </>
                        )}
                      </button>
                    </div>

                    {phoneLookupMessage && (
                      <p
                        className={`mt-3 text-sm ${
                          phoneLookupStatus === "found"
                            ? "text-green-300"
                            : phoneLookupStatus === "error"
                              ? "text-red-300"
                              : "text-gray-300"
                        }`}
                      >
                        {phoneLookupMessage}
                      </p>
                    )}

                    {matchedUser && (
                      <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="flex gap-3">
                            <div className="h-12 w-12 shrink-0 rounded-full bg-green-500/20 flex items-center justify-center">
                              <FiUser className="text-green-300 text-xl" />
                            </div>
                            <div>
                              <h4 className="text-white font-bold">
                                {matchedUser.name} {matchedUser.lastName}
                              </h4>
                              <p className="text-green-300 text-xs font-semibold mt-1">
                                Existing user
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={openMatchedUserDetails}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-colors"
                          >
                            Open Details
                          </button>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-300">
                            <FiPhone className="text-gray-500" />
                            <span>{matchedUser.phoneData?.phoneNumber || "-"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <FiMail className="text-gray-500" />
                            <span>
                              {matchedUser.emaildata?.emailAddress || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <FiMapPin className="text-gray-500" />
                            <span>{matchedUser.address || "-"}</span>
                          </div>
                          <div className="text-gray-300">
                            <span className="text-gray-500">Role:</span>{" "}
                            <span className="capitalize">
                              {matchedUser.role || "user"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-col sm:flex-row gap-3 border-t border-white/10 bg-[#172540] p-6">
                    <button
                      type="submit"
                      disabled={phoneLookupStatus === "checking"}
                      className="flex-1 px-4 py-3 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg transition-colors font-semibold disabled:opacity-50"
                    >
                      {phoneLookupStatus === "checking"
                        ? "Searching..."
                        : "Search Phone"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreateOpen(false)}
                      className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-green-500/25 bg-green-500/10 px-4 py-3">
                    <p className="text-sm font-semibold text-green-300">
                      No existing user found for +44{createData.phone}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-5">
                      <section className={modalPanelClass}>
                        <div className={modalPanelHeaderClass}>
                          <div>
                            <h3 className="text-sm font-bold text-white">
                              Contact Details
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                              Name and reachable account information
                            </p>
                          </div>
                          <span className="rounded-full bg-[#fe9a00]/15 px-2.5 py-1 text-xs font-semibold text-[#fe9a00]">
                            Required
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                          <div>
                            <label className={modalFieldLabelClass}>
                              First Name
                            </label>
                            <input
                              type="text"
                              value={createData.name}
                              onChange={(e) =>
                                handleCreateChange("name", e.target.value)
                              }
                              required
                              className={modalInputClass}
                              placeholder="First name"
                            />
                          </div>

                          <div>
                            <label className={modalFieldLabelClass}>
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={createData.lastName}
                              onChange={(e) =>
                                handleCreateChange("lastName", e.target.value)
                              }
                              required
                              className={modalInputClass}
                              placeholder="Last name"
                            />
                          </div>

                          <div>
                            <label className={modalFieldLabelClass}>Phone</label>
                            <div className="relative">
                              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <FiPhone className="h-4 w-4 text-white/35" />
                              </div>
                              <div className="pointer-events-none absolute inset-y-0 left-10 flex items-center">
                                <span className="text-sm font-semibold text-white/55">
                                  +44
                                </span>
                              </div>
                              <input
                                type="tel"
                                value={createData.phone}
                                disabled
                                className={`${modalInputClass} pl-20 text-gray-300 disabled:opacity-70`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className={modalFieldLabelClass}>
                              Email{" "}
                              <span className="normal-case tracking-normal text-gray-500">
                                Optional
                              </span>
                            </label>
                            <input
                              type="email"
                              value={createData.email}
                              onChange={(e) =>
                                handleCreateChange("email", e.target.value)
                              }
                              className={modalInputClass}
                              placeholder="john@example.com"
                            />
                          </div>
                        </div>
                      </section>

                      <section className={modalPanelClass}>
                        <div className={modalPanelHeaderClass}>
                          <div>
                            <h3 className="text-sm font-bold text-white">
                              Address
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                              Booking and billing location
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-4">
                          <div className="lg:col-span-2">
                            <label className={modalFieldLabelClass}>
                              Street Address
                            </label>
                            <input
                              type="text"
                              value={createData.address}
                              onChange={(e) =>
                                handleCreateChange("address", e.target.value)
                              }
                              className={modalInputClass}
                              placeholder="Street address"
                            />
                          </div>

                          <div>
                            <label className={modalFieldLabelClass}>
                              Postal Code
                            </label>
                            <input
                              type="text"
                              value={createData.postalCode}
                              onChange={(e) =>
                                handleCreateChange("postalCode", e.target.value)
                              }
                              className={modalInputClass}
                              placeholder="SW1A 1AA"
                            />
                          </div>

                          <div>
                            <label className={modalFieldLabelClass}>City</label>
                            <input
                              type="text"
                              value={createData.city}
                              onChange={(e) =>
                                handleCreateChange("city", e.target.value)
                              }
                              className={modalInputClass}
                              placeholder="London"
                            />
                          </div>
                        </div>
                      </section>

                      <section className={modalPanelClass}>
                        <div className={modalPanelHeaderClass}>
                          <div>
                            <h3 className="text-sm font-bold text-white">
                              Driving Licence
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                              Front and back document images
                            </p>
                          </div>
                          {createHasLicence && (
                            <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold text-green-300">
                              Attached
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                          {renderLicenceUploadCard(
                            "create",
                            "front",
                            "Front Side",
                          )}
                          {renderLicenceUploadCard(
                            "create",
                            "back",
                            "Back Side",
                          )}
                        </div>
                      </section>
                    </div>

                    <aside className="space-y-5">
                      <section className={modalPanelClass}>
                        <div className={modalPanelHeaderClass}>
                          <div>
                            <h3 className="text-sm font-bold text-white">
                              Profile
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                              Avatar and account role
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4 p-4">
                          {renderAvatarUploadCard("create")}
                          <div>
                            <label className={modalFieldLabelClass}>Role</label>
                            <CustomSelect
                              options={roleOptions}
                              value={createData.role}
                              onChange={(value) =>
                                handleCreateChange("role", value)
                              }
                              placeholder="Select role"
                            />
                          </div>
                        </div>
                      </section>

                      <section className={modalPanelClass}>
                        <div className="p-4">
                          <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fe9a00]/15 text-[#fe9a00]">
                              <FiShield />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-white">
                                Account Status
                              </h3>
                              <p className="text-xs text-gray-500">
                                Created directly by admin
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                              <p className="text-xs text-gray-500">User</p>
                              <p className="truncate text-sm font-bold text-white">
                                {createFullName}
                              </p>
                            </div>
                            <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2">
                              <p className="text-xs font-semibold text-green-300">
                                Phone verified without SMS
                              </p>
                            </div>
                          </div>
                        </div>
                      </section>
                    </aside>
                  </div>

                  <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-col sm:flex-row gap-3 border-t border-white/10 bg-[#172540] p-6">
                    <button
                      type="button"
                      onClick={() => {
                        setCreateStep("phone");
                        setPhoneLookupStatus("idle");
                        setPhoneLookupMessage("");
                        setMatchedUser(null);
                      }}
                      disabled={isCreating || isCreateMediaUploading}
                      className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-semibold disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating || isCreateMediaUploading}
                      className="flex-1 px-4 py-3 bg-[#fe9a00] hover:bg-[#e68a00] text-white rounded-lg transition-colors font-semibold disabled:opacity-50"
                    >
                      {isCreating
                        ? "Creating..."
                        : isCreateMediaUploading
                          ? "Uploading image..."
                          : "Create User"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreateOpen(false)}
                      disabled={isCreating || isCreateMediaUploading}
                      className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-semibold disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {isDetailOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[95vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-[#101b31] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#101b31] p-5">
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#fe9a00]/15">
                  {selectedUser.avatar ? (
                    <Image
                      src={selectedUser.avatar}
                      alt={selectedFullName || "User avatar"}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-black text-[#fe9a00]">
                      {selectedInitials}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-xl font-black text-white">
                      {selectedFullName || "User Details"}
                    </h2>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-gray-300 capitalize">
                      {selectedUser.role || "user"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-gray-400">
                    {selectedUser.emaildata.emailAddress}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {renderStatusPill(
                      "Email",
                      selectedUser.emaildata.isVerified,
                    )}
                    {renderStatusPill(
                      "Phone",
                      selectedUser.phoneData.isVerified,
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="rounded-lg p-2 text-white transition-colors hover:bg-white/10"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="max-h-[calc(95vh-96px)] overflow-y-auto">
              <div className="space-y-5 p-5">
                {isEditing ? (
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-5">
                      <section className={modalPanelClass}>
                        <div className={modalPanelHeaderClass}>
                          <div>
                            <h3 className="text-sm font-bold text-white">
                              Contact Details
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                              Identity and contact fields
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                          <div>
                            <label className={modalFieldLabelClass}>
                              First Name
                            </label>
                            <input
                              type="text"
                              value={editData?.name || ""}
                              onChange={(e) =>
                                handleEditChange("name", e.target.value)
                              }
                              className={modalInputClass}
                            />
                          </div>
                          <div>
                            <label className={modalFieldLabelClass}>
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={editData?.lastName || ""}
                              onChange={(e) =>
                                handleEditChange("lastName", e.target.value)
                              }
                              className={modalInputClass}
                            />
                          </div>
                          <div>
                            <label className={modalFieldLabelClass}>Email</label>
                            <input
                              type="email"
                              value={editData?.email || ""}
                              onChange={(e) =>
                                handleEditChange("email", e.target.value)
                              }
                              className={modalInputClass}
                            />
                          </div>
                          <div>
                            <label className={modalFieldLabelClass}>Phone</label>
                            <input
                              type="tel"
                              value={editData?.phone || ""}
                              onChange={(e) =>
                                handleEditChange("phone", e.target.value)
                              }
                              className={modalInputClass}
                            />
                          </div>
                        </div>
                      </section>

                      <section className={modalPanelClass}>
                        <div className={modalPanelHeaderClass}>
                          <div>
                            <h3 className="text-sm font-bold text-white">
                              Address
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                              Saved customer location
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-4">
                          <div className="lg:col-span-2">
                            <label className={modalFieldLabelClass}>
                              Street Address
                            </label>
                            <input
                              type="text"
                              value={editData?.address || ""}
                              onChange={(e) =>
                                handleEditChange("address", e.target.value)
                              }
                              className={modalInputClass}
                            />
                          </div>
                          <div>
                            <label className={modalFieldLabelClass}>
                              Postal Code
                            </label>
                            <input
                              type="text"
                              value={editData?.postalCode || ""}
                              onChange={(e) =>
                                handleEditChange("postalCode", e.target.value)
                              }
                              className={modalInputClass}
                            />
                          </div>
                          <div>
                            <label className={modalFieldLabelClass}>City</label>
                            <input
                              type="text"
                              value={editData?.city || ""}
                              onChange={(e) =>
                                handleEditChange("city", e.target.value)
                              }
                              className={modalInputClass}
                            />
                          </div>
                        </div>
                      </section>

                      <section className={modalPanelClass}>
                        <div className={modalPanelHeaderClass}>
                          <div>
                            <h3 className="text-sm font-bold text-white">
                              Driving Licence
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                              Front and back document images
                            </p>
                          </div>
                          {editHasLicence && (
                            <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold text-green-300">
                              Attached
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                          {renderLicenceUploadCard(
                            "edit",
                            "front",
                            "Front Side",
                          )}
                          {renderLicenceUploadCard("edit", "back", "Back Side")}
                        </div>
                      </section>
                    </div>

                    <aside className="space-y-5">
                      <section className={modalPanelClass}>
                        <div className={modalPanelHeaderClass}>
                          <div>
                            <h3 className="text-sm font-bold text-white">
                              Profile
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                              Avatar and role
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4 p-4">
                          {renderAvatarUploadCard("edit")}
                          <div>
                            <label className={modalFieldLabelClass}>Role</label>
                            <CustomSelect
                              options={roleOptions}
                              value={editData?.role || "user"}
                              onChange={(value) =>
                                handleEditChange("role", value)
                              }
                              placeholder="Select role"
                            />
                          </div>
                        </div>
                      </section>

                      <section className={modalPanelClass}>
                        <div className={modalPanelHeaderClass}>
                          <div>
                            <h3 className="text-sm font-bold text-white">
                              Verification
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                              Account trust flags
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4 p-4">
                          <div>
                            <label className={modalFieldLabelClass}>
                              Email Verification
                            </label>
                            <CustomSelect
                              options={verificationOptions}
                              value={editData?.emailVerified ? "true" : "false"}
                              onChange={(value) =>
                                handleEditBooleanChange(
                                  "emailVerified",
                                  value === "true",
                                )
                              }
                              placeholder="Email verification"
                            />
                          </div>
                          <div>
                            <label className={modalFieldLabelClass}>
                              Phone Verification
                            </label>
                            <CustomSelect
                              options={verificationOptions}
                              value={editData?.phoneVerified ? "true" : "false"}
                              onChange={(value) =>
                                handleEditBooleanChange(
                                  "phoneVerified",
                                  value === "true",
                                )
                              }
                              placeholder="Phone verification"
                            />
                          </div>
                        </div>
                      </section>
                    </aside>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="space-y-5">
                      <section className={modalPanelClass}>
                        <div className={modalPanelHeaderClass}>
                          <div>
                            <h3 className="text-sm font-bold text-white">
                              Contact Information
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                              Current saved user details
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                          {renderReadField("First Name", selectedUser.name)}
                          {renderReadField("Last Name", selectedUser.lastName)}
                          {renderReadField(
                            "Email",
                            selectedUser.emaildata.emailAddress,
                            selectedUser.emaildata.isVerified
                              ? "Verified"
                              : "Not verified",
                          )}
                          {renderReadField(
                            "Phone",
                            selectedUser.phoneData.phoneNumber,
                            selectedUser.phoneData.isVerified
                              ? "Verified"
                              : "Not verified",
                          )}
                        </div>
                      </section>

                      <section className={modalPanelClass}>
                        <div className={modalPanelHeaderClass}>
                          <div>
                            <h3 className="text-sm font-bold text-white">
                              Address
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                              Location information
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
                          <div className="md:col-span-3">
                            {renderReadField("Street Address", selectedUser.address)}
                          </div>
                          {renderReadField("Postal Code", selectedUser.postalCode)}
                          {renderReadField("City", selectedUser.city)}
                          {renderReadField(
                            "Joined",
                            new Date(selectedUser.createdAt).toLocaleDateString(
                              "en-GB",
                            ),
                          )}
                        </div>
                      </section>

                      <section className={modalPanelClass}>
                        <div className={modalPanelHeaderClass}>
                          <div>
                            <h3 className="text-sm font-bold text-white">
                              Driving Licence
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                              Attached document images
                            </p>
                          </div>
                        </div>
                        <div className="p-4">
                          {selectedUser.licenceAttached?.front ||
                          selectedUser.licenceAttached?.back ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              {selectedUser.licenceAttached?.front && (
                                <a
                                  href={selectedUser.licenceAttached.front}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
                                >
                                  <div className="relative h-44 w-full">
                                    <Image
                                      src={selectedUser.licenceAttached.front}
                                      alt="Licence Front"
                                      fill
                                      sizes="(min-width: 1024px) 40vw, 100vw"
                                      className="object-cover transition-transform group-hover:scale-[1.02]"
                                    />
                                  </div>
                                  <div className="px-3 py-2 text-sm font-semibold text-white">
                                    Front Side
                                  </div>
                                </a>
                              )}
                              {selectedUser.licenceAttached?.back && (
                                <a
                                  href={selectedUser.licenceAttached.back}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
                                >
                                  <div className="relative h-44 w-full">
                                    <Image
                                      src={selectedUser.licenceAttached.back}
                                      alt="Licence Back"
                                      fill
                                      sizes="(min-width: 1024px) 40vw, 100vw"
                                      className="object-cover transition-transform group-hover:scale-[1.02]"
                                    />
                                  </div>
                                  <div className="px-3 py-2 text-sm font-semibold text-white">
                                    Back Side
                                  </div>
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-white/15 bg-black/10 px-4 py-8 text-center text-sm font-semibold text-red-300">
                              No licence attached
                            </div>
                          )}
                        </div>
                      </section>
                    </div>

                    <aside className="space-y-5">
                      <section className={modalPanelClass}>
                        <div className="p-4">
                          <div className="relative mx-auto mb-4 h-28 w-28 overflow-hidden rounded-2xl border border-white/10 bg-[#fe9a00]/15">
                            {selectedUser.avatar ? (
                              <Image
                                src={selectedUser.avatar}
                                alt={selectedFullName || "User avatar"}
                                fill
                                sizes="112px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-2xl font-black text-[#fe9a00]">
                                {selectedInitials}
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <h3 className="text-lg font-black text-white">
                              {selectedFullName || "User"}
                            </h3>
                            <p className="mt-1 text-sm text-gray-400 capitalize">
                              {selectedUser.role || "user"}
                            </p>
                          </div>
                          <div className="mt-4 space-y-2">
                            {renderStatusPill(
                              "Email verified",
                              selectedUser.emaildata.isVerified,
                            )}
                            {renderStatusPill(
                              "Phone verified",
                              selectedUser.phoneData.isVerified,
                            )}
                          </div>
                        </div>
                      </section>

                      <section className={modalPanelClass}>
                        <div className="grid grid-cols-2 gap-3 p-4 text-center">
                          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                            <p className="text-xs text-gray-500">Avatar</p>
                            <p className="mt-1 text-sm font-bold text-white">
                              {selectedUser.avatar ? "Added" : "Missing"}
                            </p>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                            <p className="text-xs text-gray-500">Licence</p>
                            <p className="mt-1 text-sm font-bold text-white">
                              {selectedUser.licenceAttached?.front ||
                              selectedUser.licenceAttached?.back
                                ? "Added"
                                : "Missing"}
                            </p>
                          </div>
                        </div>
                      </section>
                    </aside>
                  </div>
                )}
              </div>

              <div className="sticky bottom-2 flex flex-col gap-3 border-t border-white/10 bg-[#101b31]/95 p-10 backdrop-blur sm:flex-row">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className={`${modalActionClass} bg-[#fe9a00] text-white hover:bg-[#e68a00]`}
                    >
                      Edit User
                    </button>
                    <button
                      onClick={() => setIsDetailOpen(false)}
                      className={`${modalActionClass} bg-white/10 text-white hover:bg-white/20`}
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSubmitting || isEditMediaUploading}
                      className={`${modalActionClass} bg-green-600 text-white hover:bg-green-700`}
                    >
                      {isSubmitting
                        ? "Saving..."
                        : isEditMediaUploading
                          ? "Uploading image..."
                          : "Save Changes"}
                    </button>
                    <button
                      onClick={() => {
                        setEditData(getEditDataFromUser(selectedUser));
                        setEditAvatarUploading(false);
                        setEditLicenceUploading({ front: false, back: false });
                        setIsEditing(false);
                      }}
                      disabled={isSubmitting || isEditMediaUploading}
                      className={`${modalActionClass} bg-white/10 text-white hover:bg-white/20`}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
