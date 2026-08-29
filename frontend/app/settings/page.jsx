"use client";
import { getGenderAvatar } from "@/utils/genderAvatar";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  Info,
  Languages,
  LockKeyhole,
  LogOut,
  Moon,
  ShieldCheck,
  Venus,
  Mars,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import BottomNavigation from "@/components/dashboard/BottomNavigation";
import ChildNavigation from "@/components/child/ChildNavigation";

import {
  changePassword,
  getSettings,
  updateAccount,
  updateAppearance,
  updateLanguage,
  updateNotifications,
  updatePrivacy,
  updateProfile,
} from "@/services/settingsService";
import {
  enableAppNotifications,
} from "@/services/notificationService";

const notificationItems = [
  {
    key: "messages",
    title: "New Messages",
    description: "Get notified when someone messages you",
  },
  {
    key: "familySnaps",
    title: "Family Snaps",
    description: "Get notified about new family snaps",
  },
  {
    key: "careTasks",
    title: "Care Tasks",
    description: "Stay updated about your care tasks",
  },
  {
    key: "reminders",
    title: "Reminders",
    description: "Receive helpful reminders",
  },
  {
    key: "appointments",
    title: "Appointments",
    description: "Get appointment notifications",
  },
  {
    key: "emergencyAlerts",
    title: "Emergency Alerts",
    description: "Receive important safety alerts",
  },
  {
    key: "locationUpdates",
    title: "Location Updates",
    description: "Receive location sharing updates",
  },
];

const sections = [
  {
    title: "ACCOUNT",
    items: [
      {
        label: "Profile",
        description: "Name, date of birth, personal details",
        icon: UserRound,
        action: "profile",
      },
      {
        label: "Account & Security",
        description: "Email, phone number, password",
        icon: LockKeyhole,
        action: "account",
      },
    ],
  },
  {
    title: "APP PREFERENCES",
    items: [
      {
        label: "Notifications",
        description: "Messages, care tasks, reminders & alerts",
        icon: Bell,
        action: "notifications",
      },
      {
        label: "Language",
        description: "English",
        icon: Languages,
        action: "language",
      },
    ],
  },
  {
    title: "PRIVACY & SAFETY",
    items: [
      {
        label: "Privacy & Permissions",
        description: "Control your data and app permissions",
        icon: ShieldCheck,
        action: "privacy",
      },
    ],
  },
  {
    title: "SUPPORT",
    items: [
      {
        label: "Help & Support",
        description: "Get help with CareBridge",
        icon: CircleHelp,
        action: "help",
      },
      {
        label: "About CareBridge",
        description: "Version 1.0.0",
        icon: Info,
        action: "about",
      },
    ],
  },
];

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative h-7 w-12 shrink-0 rounded-full transition ${
      checked ? "bg-[#9b72c5]" : "bg-gray-200"
    }`}
    aria-pressed={checked}
  >
    <span
      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
        checked ? "left-6" : "left-1"
      }`}
    />
  </button>
);

const Modal = ({
  title,
  children,
  onClose,
}) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-4">
    <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white px-5 pb-24 pt-5 shadow-2xl sm:max-h-[90vh] sm:rounded-[28px] sm:pb-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {title}
        </h2>

        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 active:scale-95"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {children}
    </div>
  </div>
);

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [profileRequired, setProfileRequired] = useState(false);

  const [user, setUser] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "",
  });

  const [profile, setProfile] = useState({
    dateOfBirth: "",
  });

  const [notifications, setNotifications] = useState({});
  const [appearance, setAppearance] = useState(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    return localStorage.getItem("carebridge_appearance") ===
      "dark"
      ? "dark"
      : "light";
  });
  const [language, setLanguage] = useState("English");
  const [privacy, setPrivacy] = useState({
    analytics: true,
    personalizedExperience: true,
  });

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  });

  const [accountForm, setAccountForm] = useState({
    email: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await getSettings();
        const data = response.data;

        setUser(data.user);
        setProfile({
          dateOfBirth:
            data.parentProfile?.dateOfBirth ||
            data.settings?.profile?.dateOfBirth ||
            "",
        });

        setNotifications(
          data.settings?.notifications || {}
        );

        setAppearance(
          data.settings?.appearance || "light"
        );

        setLanguage(
          data.settings?.language || "English"
        );

        setPrivacy(
          data.settings?.privacy || {
            analytics: true,
            personalizedExperience: true,
          }
        );

        const dateOfBirth =
          data.parentProfile?.dateOfBirth ||
          data.settings?.profile?.dateOfBirth ||
          "";

        const gender = data.user?.gender || "";

        setProfileForm({
          fullName: data.user?.fullName || "",
          phone: data.user?.phone || "",
          dateOfBirth,
          gender,
        });

        setAccountForm({
          email: data.user?.email || "",
          phone: data.user?.phone || "",
        });

        // DOB and gender are mandatory before entering the app.
        // If either is missing, lock the user into the Profile modal.
        const needsProfile =
          (data.user?.role === "parent" ||
            data.user?.role === "child" ||
            data.user?.role === "provider") &&
          (!gender || !dateOfBirth);

        if (needsProfile) {
          setProfileRequired(true);
          setModal("profile");
        }
      } catch (error) {
        toast.error(
          error.message || "Unable to load settings"
        );
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      appearance === "dark"
    );
  }, [appearance]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await updateProfile(
        profileForm
      );

      setUser((current) => ({
        ...current,
        fullName:
          response.data?.fullName ||
          profileForm.fullName,
        phone:
          response.data?.phone || profileForm.phone,
        gender:
          response.data?.gender || profileForm.gender,
      }));

      setProfile({
        dateOfBirth:
          response.data?.dateOfBirth ||
          profileForm.dateOfBirth,
      });

      toast.success("Profile updated");

      // After completing required profile setup,
      // return to the correct dashboard.
      const role =
        user.role ||
        localStorage.getItem("role");

      setProfileRequired(false);
      setModal(null);

      setTimeout(() => {
        if (role === "child") {
          window.location.href = "/child/dashboard";
        } else if (role === "parent") {
          window.location.href = "/dashboard";
        } else if (role === "provider") {
          window.location.href = "/provider/dashboard";
        }
      }, 500);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const saveAccount = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await updateAccount(
        accountForm
      );

      setUser((current) => ({
        ...current,
        email:
          response.data?.email ||
          accountForm.email,
        phone:
          response.data?.phone ||
          accountForm.phone,
      }));

      setModal(null);
      toast.success("Account updated");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await changePassword(passwordForm);

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setModal(null);
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = async (key) => {
    const nextValue = !notifications[key];

    setNotifications((current) => ({
      ...current,
      [key]: nextValue,
    }));

    try {
      await updateNotifications({
        [key]: nextValue,
      });
    } catch (error) {
      setNotifications((current) => ({
        ...current,
        [key]: !nextValue,
      }));

      toast.error(error.message);
    }
  };

  const handleEnablePushNotifications = async () => {
    try {
      setPushLoading(true);
      await enableAppNotifications();
      toast.success("App notifications enabled");
    } catch (error) {
      toast.error(
        error.message || "Unable to enable notifications"
      );
    } finally {
      setPushLoading(false);
    }
  };

  const selectAppearance = async (value) => {
    const previous = appearance;
    setAppearance(value);

    try {
      await updateAppearance(value);
      localStorage.setItem(
        "carebridge_appearance",
        value
      );
      toast.success("Appearance saved");
    } catch (error) {
      setAppearance(previous);
      toast.error(error.message);
    }
  };

  const selectLanguage = async () => {
    try {
      await updateLanguage("English");
      setLanguage("English");
      setModal(null);
      toast.success("Language saved");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const togglePrivacy = async (key) => {
    const nextValue = !privacy[key];

    setPrivacy((current) => ({
      ...current,
      [key]: nextValue,
    }));

    try {
      await updatePrivacy({
        [key]: nextValue,
      });
    } catch (error) {
      setPrivacy((current) => ({
        ...current,
        [key]: !nextValue,
      }));

      toast.error(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  const openModal = (action) => {
    setModal(action);
  };

  const getBackHref = () => {
    if (user.role === "child") {
      return "/child/dashboard";
    }

    return "/dashboard";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf8fc] px-4 pt-5">
        <div className="mx-auto w-full max-w-md">
          <div className="h-10 w-10 animate-pulse rounded-2xl bg-white" />
          <div className="mt-7 h-8 w-36 animate-pulse rounded-lg bg-white" />

          <div className="mt-8 space-y-7">
            {[1, 2, 3, 4].map((section) => (
              <div key={section}>
                <div className="mb-2 h-3 w-28 animate-pulse rounded bg-gray-200" />
                <div className="overflow-hidden rounded-[22px] bg-white">
                  <div className="h-20 border-b border-gray-100" />
                  <div className="h-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8fc] px-4 pb-28 pt-5">
      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <header className="mb-7">
          <div className="flex items-center gap-3">
            <Link
              href={profileRequired ? "#" : getBackHref()}
              aria-label="Go back"
              onClick={(event) => {
                if (profileRequired) {
                  event.preventDefault();
                  toast.error("Please complete your profile first.");
                }
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-700 shadow-sm active:scale-95"
            >
              <ArrowLeft
                className="h-5 w-5"
                strokeWidth={2.2}
              />
            </Link>

            <div>
              <h1 className="text-[27px] font-bold tracking-[-0.5px] text-gray-900">
                Settings
              </h1>

              <p className="mt-0.5 text-sm text-gray-500">
                Manage your account & preferences
              </p>
            </div>
          </div>
        </header>

        {/* Settings Sections */}
        <div className="space-y-7">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-2.5 px-1 text-[11px] font-bold tracking-[0.13em] text-gray-400">
                {section.title}
              </h2>

              <div className="overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_5px_24px_rgba(91,67,116,0.07)]">
                {section.items.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() =>
                        openModal(item.action)
                      }
                      className={`group flex min-h-[72px] w-full items-center gap-3.5 px-4 py-3.5 text-left transition active:bg-purple-50/60 ${
                        index !==
                        section.items.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#f8f1ff] text-[#9b72c5]">
                        <Icon
                          className="h-[19px] w-[19px]"
                          strokeWidth={2}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold leading-5 text-gray-900">
                          {item.label}
                        </p>

                        {item.description && (
                          <p className="mt-0.5 text-[12px] leading-[17px] text-gray-400">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <ChevronRight className="h-[18px] w-[18px] shrink-0 text-gray-300" />
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Logout */}
        <div className="mt-8">
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-[58px] w-full items-center justify-center gap-2.5 rounded-[20px] border border-pink-100 bg-white px-5 text-[15px] font-semibold text-[#e36b91] shadow-[0_5px_20px_rgba(227,107,145,0.06)] transition hover:bg-pink-50 active:scale-[0.99]"
          >
            <LogOut
              className="h-[18px] w-[18px]"
              strokeWidth={2.2}
            />
            Log Out
          </button>
        </div>

        <div className="flex flex-col items-center pb-3 pt-7">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#f8efff]">
            <span className="text-lg">💜</span>
          </div>

          <p className="text-[11px] font-medium text-gray-400">
            Made with care by CareBridge
          </p>
        </div>
      </div>

      {/* Profile */}
      {modal === "profile" && (
        <Modal
          title="Profile"
          onClose={() => {
            if (profileRequired) {
              toast.error("Please complete your profile first.");
              return;
            }

            setModal(null);
          }}
        >
          <form
            onSubmit={saveProfile}
            className="space-y-4"
          >
            {/* Gender Avatar */}
            <div className="flex justify-center pb-1">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#f8f1ff] text-[#9b72c5]">
                <span className="text-5xl leading-none">
                  {getGenderAvatar({
                    role: user?.role,
                    gender: profileForm.gender,
                  })}
                </span>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Name
              </label>

              <input
                value={profileForm.fullName}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-purple-300"
                required
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Date of Birth
              </label>

              <input
                type="date"
                value={profileForm.dateOfBirth}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    dateOfBirth: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-purple-300"
                required
              />
            </div>

            {/* Gender */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Gender
              </label>

              <select
                value={profileForm.gender}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    gender: event.target.value,
                  }))
                }
                className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-purple-300"
                required
              >
                <option value="" disabled>
                  Select gender
                </option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Phone Number */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Phone Number
              </label>

              <input
                value={profileForm.phone}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    phone: event.target.value.replace(
                      /\D/g,
                      ""
                    ),
                  }))
                }
                maxLength={10}
                inputMode="numeric"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-purple-300"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-[#9b72c5] py-3.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </Modal>
      )}

      {/* Account & Security */}
      {modal === "account" && (
        <Modal
          title="Account & Security"
          onClose={() => setModal(null)}
        >
          <div className="space-y-6">
            <form
              onSubmit={saveAccount}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={accountForm.email}
                  onChange={(event) =>
                    setAccountForm(
                      (current) => ({
                        ...current,
                        email:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-purple-300"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  value={accountForm.phone}
                  onChange={(event) =>
                    setAccountForm(
                      (current) => ({
                        ...current,
                        phone:
                          event.target.value.replace(
                            /\D/g,
                            ""
                          ),
                      })
                    )
                  }
                  maxLength={10}
                  inputMode="numeric"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-purple-300"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-[#9b72c5] py-3.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Update Account"}
              </button>
            </form>

            <div className="border-t border-gray-100 pt-5">
              <p className="mb-3 text-sm font-semibold text-gray-900">
                Change Password
              </p>

              <form
                onSubmit={savePassword}
                className="space-y-3"
              >
                <input
                  type="password"
                  placeholder="Current password"
                  value={
                    passwordForm.currentPassword
                  }
                  onChange={(event) =>
                    setPasswordForm(
                      (current) => ({
                        ...current,
                        currentPassword:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-purple-300"
                  required
                />

                <input
                  type="password"
                  placeholder="New password"
                  value={
                    passwordForm.newPassword
                  }
                  onChange={(event) =>
                    setPasswordForm(
                      (current) => ({
                        ...current,
                        newPassword:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-purple-300"
                  required
                />

                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={
                    passwordForm.confirmPassword
                  }
                  onChange={(event) =>
                    setPasswordForm(
                      (current) => ({
                        ...current,
                        confirmPassword:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-purple-300"
                  required
                />

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-2xl border border-purple-200 bg-purple-50 py-3.5 text-sm font-semibold text-[#8d63b9] disabled:opacity-50"
                >
                  {saving
                    ? "Changing..."
                    : "Change Password"}
                </button>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {/* Notifications */}
      {modal === "notifications" && (
        <Modal
          title="Notifications"
          onClose={() => setModal(null)}
        >
          <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-gray-900">
              Push alerts
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Turn on browser push notifications for messages, snaps, reminders, and emergency alerts.
            </p>
            <button
              type="button"
              onClick={handleEnablePushNotifications}
              disabled={pushLoading}
              className="mt-3 w-full rounded-2xl bg-[#9b72c5] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pushLoading
                ? "Enabling..."
                : "Enable App Notifications"}
            </button>
          </div>

          <div className="space-y-1">
            {notificationItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-3 border-b border-gray-100 py-4 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-gray-400">
                    {item.description}
                  </p>
                </div>

                <Toggle
                  checked={
                    notifications[item.key] !== false
                  }
                  onChange={() =>
                    toggleNotification(
                      item.key
                    )
                  }
                />
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Appearance */}
      {modal === "appearance" && (
        <Modal
          title="Appearance"
          onClose={() => setModal(null)}
        >
          <div className="space-y-3">
            {[
              {
                value: "light",
                label: "Light",
                icon: Sun,
              },
              {
                value: "dark",
                label: "Dark",
                icon: Moon,
              },
            ].map((item) => {
              const Icon = item.icon;
              const selected =
                appearance === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    selectAppearance(
                      item.value
                    )
                  }
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left ${
                    selected
                      ? "border-purple-200 bg-purple-50"
                      : "border-gray-100 bg-white"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f8f1ff] text-[#9b72c5]">
                    <Icon className="h-5 w-5" />
                  </div>

                  <span className="flex-1 text-sm font-semibold text-gray-900">
                    {item.label}
                  </span>

                  {selected && (
                    <Check className="h-5 w-5 text-[#9b72c5]" />
                  )}
                </button>
              );
            })}
          </div>
        </Modal>
      )}

      {/* Language */}
      {modal === "language" && (
        <Modal
          title="Language"
          onClose={() => setModal(null)}
        >
          <button
            type="button"
            onClick={selectLanguage}
            className="flex w-full items-center gap-3 rounded-2xl border border-purple-200 bg-purple-50 p-4 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#9b72c5]">
              <Languages className="h-5 w-5" />
            </div>

            <span className="flex-1 text-sm font-semibold text-gray-900">
              English
            </span>

            <Check className="h-5 w-5 text-[#9b72c5]" />
          </button>

          <p className="mt-4 text-xs leading-5 text-gray-400">
            More languages can be added later without
            changing the Settings structure.
          </p>
        </Modal>
      )}

      {/* Privacy */}
      {modal === "privacy" && (
        <Modal
          title="Privacy & Permissions"
          onClose={() => setModal(null)}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3 border-b border-gray-100 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  Analytics
                </p>
                <p className="mt-0.5 text-xs leading-5 text-gray-400">
                  Help improve CareBridge with anonymous
                  usage information.
                </p>
              </div>

              <Toggle
                checked={privacy.analytics}
                onChange={() =>
                  togglePrivacy("analytics")
                }
              />
            </div>

            <div className="flex items-center gap-3 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  Personalized Experience
                </p>
                <p className="mt-0.5 text-xs leading-5 text-gray-400">
                  Allow CareBridge to personalize your
                  experience.
                </p>
              </div>

              <Toggle
                checked={
                  privacy.personalizedExperience
                }
                onChange={() =>
                  togglePrivacy(
                    "personalizedExperience"
                  )
                }
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Help */}
      {modal === "help" && (
        <Modal
          title="Help & Support"
          onClose={() => setModal(null)}
        >
          <div className="rounded-2xl bg-[#faf8fc] p-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8f1ff] text-[#9b72c5]">
              <CircleHelp className="h-6 w-6" />
            </div>

            <p className="text-sm font-semibold text-gray-900">
              Need help with CareBridge?
            </p>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              Support functionality can be connected
              here later without changing the Settings
              layout.
            </p>
          </div>
        </Modal>
      )}

      {/* About */}
      {modal === "about" && (
        <Modal
          title="About CareBridge"
          onClose={() => setModal(null)}
        >
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f8efff]">
              <span className="text-3xl">💜</span>
            </div>

            <h3 className="mt-4 text-lg font-bold text-gray-900">
              CareBridge
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Version 1.0.0
            </p>

            <p className="mt-4 text-xs leading-5 text-gray-400">
              A simple way for families to stay
              connected, cared for, and safe.
            </p>
          </div>
        </Modal>
      )}
      {/* Settings Navigation */}
      {!profileRequired && (
        user.role === "child" ? (
          <ChildNavigation />
        ) : (
          <BottomNavigation />
        )
      )}
    </main>
  );
}
