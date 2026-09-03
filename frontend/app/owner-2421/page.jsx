"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Baby,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Ticket,
  TrendingUp,
  UserRound,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  loginOwner,
  verifyOwnerKey,
  getOwnerOverview,
  getOwnerUsers,
  getOwnerAnalytics,
  getOwnerCalendar,
  getOwnerSupport,
  updateOwnerSupport,
  replyToOwnerSupport,
  getOwnerNews,
  createOwnerNews,
  updateOwnerNews,
  deleteOwnerNews,
} from "../../services/ownerService";

const stats = [
  {
    key: "totalUsers",
    label: "Total Users",
    note: "All registered accounts",
    icon: Users,
  },
  {
    key: "parents",
    label: "Parents",
    note: "Parent accounts",
    icon: ShieldCheck,
  },
  {
    key: "children",
    label: "Children",
    note: "Child profiles",
    icon: Baby,
  },
  {
    key: "families",
    label: "Families",
    note: "Connected family groups",
    icon: UserRound,
  },
];

const navItems = [
  ["overview", "Overview", LayoutDashboard],
  ["users", "Users", Users],
  ["analytics", "Analytics", BarChart3],
  ["calendar", "Calendar", CalendarDays],
  ["support", "Support", CircleHelp],
  ["news", "News", Megaphone],
];

const emptyOverview = {
  totals: {
    totalUsers: 0,
    parents: 0,
    children: 0,
    families: 0,
  },
  growth: {
    today: {
      users: 0,
      parents: 0,
      children: 0,
      families: 0,
    },
    week: {
      users: 0,
      parents: 0,
      children: 0,
      families: 0,
    },
    month: {
      users: 0,
      parents: 0,
      children: 0,
      families: 0,
    },
  },
  live: {
    onlineUsers: 0,
    locationSharing: 0,
    activeChats: 0,
    snaps: 0,
    bookings: 0,
    sosEvents: 0,
  },
  recentUsers: [],
  support: {
    open: 0,
    inProgress: 0,
    recent: [],
  },
  news: [],
};

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function statusLabel(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-gray-100 ${className}`}
    />
  );
}

function Card({
  children,
  className = "",
}) {
  return (
    <section
      className={`rounded-[24px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(31,24,45,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  note,
  icon: Icon,
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
            {formatNumber(value)}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {note}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8f1ff] text-[#9b72c5]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export default function OwnerPage() {
  const [step, setStep] = useState("key");
  const [key, setKey] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [section, setSection] = useState("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [overview, setOverview] =
    useState(emptyOverview);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [analytics, setAnalytics] =
    useState(null);
  const [analyticsDays, setAnalyticsDays] =
    useState(30);

  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] =
    useState("");
  const [userRole, setUserRole] =
    useState("all");

  const [support, setSupport] =
    useState(null);
  const [supportStatus, setSupportStatus] =
    useState("all");
  const [selectedTicket, setSelectedTicket] =
    useState(null);
  const [reply, setReply] = useState("");
  const [replyLoading, setReplyLoading] =
    useState(false);

  const [news, setNews] = useState([]);
  const [newsForm, setNewsForm] =
    useState({
      title: "",
      content: "",
      type: "announcement",
      status: "draft",
    });
  const [newsLoading, setNewsLoading] =
    useState(false);

  const today = new Date();

  const [calendarDate, setCalendarDate] =
    useState(
      today.toISOString().slice(0, 10)
    );
  const [calendarActivity, setCalendarActivity] =
    useState(null);

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getOwnerOverview();
      const data = response?.data || {};

      const totals = {
        totalUsers:
          data?.totals?.totalUsers ??
          data?.totalUsers ??
          0,
        parents:
          data?.totals?.parents ??
          data?.parents ??
          0,
        children:
          data?.totals?.children ??
          data?.children ??
          0,
        families:
          data?.totals?.families ??
          data?.families ??
          0,
      };

      setOverview({
        ...emptyOverview,
        ...data,
        totals: {
          ...emptyOverview.totals,
          ...totals,
        },
        growth: {
          ...emptyOverview.growth,
          ...(data?.growth || {}),
          today: {
            ...emptyOverview.growth.today,
            ...(data?.growth?.today || {}),
          },
          week: {
            ...emptyOverview.growth.week,
            ...(data?.growth?.week || {}),
          },
          month: {
            ...emptyOverview.growth.month,
            ...(data?.growth?.month || {}),
          },
        },
        live: {
          ...emptyOverview.live,
          ...(data?.live || {}),
        },
        recentUsers: data?.recentUsers || [],
        support: {
          ...emptyOverview.support,
          ...(data?.support || {}),
        },
        news: data?.news || [],
      });
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(
            "ownerToken"
          )
        : null;

    if (token) {
      setStep("dashboard");
      loadOverview();
    }
  }, []);

  const submitKey = async (event) => {
    event.preventDefault();

    try {
      setAuthLoading(true);
      setAuthError("");

      await verifyOwnerKey(key);

      setStep("login");
    } catch (err) {
      setAuthError(
        err?.message ||
          "That access key is not recognized."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const submitLogin = async (event) => {
    event.preventDefault();

    try {
      setAuthLoading(true);
      setAuthError("");

      const response =
        await loginOwner({
          accessKey: key,
          username,
          password,
        });

      localStorage.setItem(
        "ownerToken",
        response.token
      );

      setStep("dashboard");
      await loadOverview();
    } catch (err) {
      setAuthError(
        err?.message ||
          "Unable to sign in."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(
      "ownerToken"
    );

    setStep("key");
    setKey("");
    setUsername("");
    setPassword("");
  };

  const navigate = (value) => {
    setSection(value);
    setDrawerOpen(false);
  };

  useEffect(() => {
    if (
      step !== "dashboard" ||
      section !== "analytics"
    ) {
      return;
    }

    getOwnerAnalytics(analyticsDays)
      .then((response) =>
        setAnalytics(response?.data)
      )
      .catch(() =>
        toast.error(
          "Unable to load analytics."
        )
      );
  }, [step, section, analyticsDays]);

  useEffect(() => {
    if (
      step !== "dashboard" ||
      section !== "users"
    ) {
      return;
    }

    getOwnerUsers({
      search: userSearch,
      role: userRole,
    })
      .then((response) =>
        setUsers(
          response?.data?.users || []
        )
      )
      .catch(() =>
        toast.error(
          "Unable to load users."
        )
      );
  }, [
    step,
    section,
    userSearch,
    userRole,
  ]);

  const loadSupport = async () => {
    try {
      const response =
        await getOwnerSupport({
          status: supportStatus,
        });

      setSupport(response?.data);
    } catch {
      toast.error(
        "Unable to load support inbox."
      );
    }
  };

  useEffect(() => {
    if (
      step === "dashboard" &&
      section === "support"
    ) {
      loadSupport();
    }
  }, [
    step,
    section,
    supportStatus,
  ]);

  const loadNews = async () => {
    try {
      const response =
        await getOwnerNews();

      setNews(
        response?.data || []
      );
    } catch {
      toast.error(
        "Unable to load announcements."
      );
    }
  };

  useEffect(() => {
    if (
      step === "dashboard" &&
      section === "news"
    ) {
      loadNews();
    }
  }, [step, section]);

  const loadCalendar = async () => {
    try {
      const response =
        await getOwnerCalendar(
          calendarDate
        );

      setCalendarActivity(
        response?.data?.activity ||
          null
      );
    } catch {
      toast.error(
        "Unable to load calendar activity."
      );
    }
  };

  useEffect(() => {
    if (
      step === "dashboard" &&
      section === "calendar"
    ) {
      loadCalendar();
    }
  }, [
    step,
    section,
    calendarDate,
  ]);

  const maxAnalytics =
    useMemo(() => {
      if (!analytics?.users?.length) {
        return 1;
      }

      return Math.max(
        ...analytics.users.map(
          (item) =>
            Number(item.count || 0)
        ),
        1
      );
    }, [analytics]);

  const submitReply = async () => {
    if (
      !selectedTicket ||
      !reply.trim()
    ) {
      return;
    }

    try {
      setReplyLoading(true);

      await replyToOwnerSupport(
        selectedTicket._id,
        reply.trim()
      );

      toast.success(
        "Reply sent by email."
      );

      setReply("");
      setSelectedTicket(null);
      await loadSupport();
    } catch (err) {
      toast.error(
        err?.message ||
          "Unable to send reply."
      );
    } finally {
      setReplyLoading(false);
    }
  };

  const changeTicketStatus = async (
    ticket,
    nextStatus
  ) => {
    const previous = support;

    setSupport((current) => {
      if (!current) return current;

      return {
        ...current,
        tickets: current.tickets.map(
          (item) =>
            item._id === ticket._id
              ? {
                  ...item,
                  status: nextStatus,
                }
              : item
        ),
      };
    });

    try {
      await updateOwnerSupport(
        ticket._id,
        {
          status: nextStatus,
        }
      );

      toast.success(
        "Ticket updated."
      );
      await loadSupport();
    } catch (err) {
      setSupport(previous);

      toast.error(
        err?.message ||
          "Unable to update ticket."
      );
    }
  };

  const submitNews = async (
    event
  ) => {
    event.preventDefault();

    if (
      !newsForm.title.trim() ||
      !newsForm.content.trim()
    ) {
      toast.error(
        "Title and content are required."
      );
      return;
    }

    try {
      setNewsLoading(true);

      await createOwnerNews(
        newsForm
      );

      setNewsForm({
        title: "",
        content: "",
        type: "announcement",
        status: "draft",
      });

      toast.success(
        "Announcement created."
      );

      await loadNews();
    } catch (err) {
      toast.error(
        err?.message ||
          "Unable to create announcement."
      );
    } finally {
      setNewsLoading(false);
    }
  };

  if (step !== "dashboard") {
    return (
      <main className="min-h-screen bg-[#faf9fc] px-5 py-10 text-gray-900">
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
          <Card className="w-full p-7">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8f1ff] text-[#9b72c5]">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <div className="mt-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b72c5]">
                CareBridge Owner
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight">
                Secure Dashboard
              </h1>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Private owner access. This
                dashboard is not part of the
                regular user navigation.
              </p>
            </div>

            {step === "key" ? (
              <form
                onSubmit={submitKey}
                className="mt-7 space-y-4"
              >
                <input
                  type="password"
                  value={key}
                  onChange={(event) =>
                    setKey(event.target.value)
                  }
                  placeholder="Owner access key"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-[#9b72c5]"
                  autoFocus
                />

                {authError && (
                  <p className="rounded-xl bg-red-50 px-3 py-3 text-xs text-red-600">
                    {authError}
                  </p>
                )}

                <button
                  disabled={
                    authLoading ||
                    !key.trim()
                  }
                  className="w-full rounded-2xl bg-gray-950 px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {authLoading
                    ? "Checking..."
                    : "Continue"}
                </button>
              </form>
            ) : (
              <form
                onSubmit={submitLogin}
                className="mt-7 space-y-4"
              >
                <input
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value
                    )
                  }
                  placeholder="Username"
                  autoComplete="username"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-[#9b72c5]"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Password"
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-[#9b72c5]"
                />

                {authError && (
                  <p className="rounded-xl bg-red-50 px-3 py-3 text-xs text-red-600">
                    {authError}
                  </p>
                )}

                <button
                  disabled={
                    authLoading ||
                    !username.trim() ||
                    !password
                  }
                  className="w-full rounded-2xl bg-gray-950 px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {authLoading
                    ? "Signing in..."
                    : "Open Dashboard"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("key");
                    setAuthError("");
                  }}
                  className="w-full py-2 text-xs font-semibold text-gray-500"
                >
                  Use another access key
                </button>
              </form>
            )}
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9fc] text-gray-900">
      <div className="flex min-h-screen">
        {drawerOpen && (
          <button
            aria-label="Close menu"
            onClick={() =>
              setDrawerOpen(false)
            }
            className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[260px] border-r border-gray-100 bg-white p-5 transition-transform lg:static lg:translate-x-0 ${
            drawerOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b72c5]">
                CareBridge
              </p>

              <p className="mt-1 text-lg font-bold">
                Owner Console
              </p>
            </div>

            <button
              onClick={() =>
                setDrawerOpen(false)
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="mt-8 space-y-1">
            {navItems.map(
              ([
                id,
                label,
                Icon,
              ]) => (
                <button
                  key={id}
                  onClick={() =>
                    navigate(id)
                  }
                  className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition ${
                    section === id
                      ? "bg-[#f8f1ff] text-[#815ba3]"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {label}

                  {id === "support" &&
                    overview.support
                      .open > 0 && (
                      <span className="ml-auto rounded-full bg-[#9b72c5] px-2 py-0.5 text-[10px] text-white">
                        {overview.support.open}
                      </span>
                    )}
                </button>
              )
            )}
          </nav>

          <div className="absolute bottom-5 left-5 right-5">
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-gray-100 bg-[#faf9fc]/90 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setDrawerOpen(true)
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div>
                  <p className="text-xs font-semibold text-gray-400">
                    Owner Dashboard
                  </p>

                  <h1 className="text-lg font-bold sm:text-xl">
                    {navItems.find(
                      ([id]) =>
                        id === section
                    )?.[1] ||
                      "Overview"}
                  </h1>
                </div>
              </div>

              <button
                onClick={loadOverview}
                className="flex h-10 items-center gap-2 rounded-xl bg-white px-3 text-xs font-semibold text-gray-600 shadow-sm"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">
                  Refresh
                </span>
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {error && (
              <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
                <span>{error}</span>

                <button
                  onClick={loadOverview}
                  className="font-semibold"
                >
                  Retry
                </button>
              </div>
            )}

            {section === "overview" && (
              <Overview
                overview={overview}
                loading={loading}
                stats={stats}
                onNavigate={navigate}
              />
            )}

            {section === "users" && (
              <UsersSection
                users={users}
                search={userSearch}
                setSearch={setUserSearch}
                role={userRole}
                setRole={setUserRole}
              />
            )}

            {section === "analytics" && (
              <AnalyticsSection
                analytics={analytics}
                days={analyticsDays}
                setDays={setAnalyticsDays}
                maxValue={maxAnalytics}
              />
            )}

            {section === "calendar" && (
              <CalendarSection
                date={calendarDate}
                setDate={setCalendarDate}
                activity={calendarActivity}
              />
            )}

            {section === "support" && (
              <SupportSection
                support={support}
                status={supportStatus}
                setStatus={setSupportStatus}
                selectedTicket={selectedTicket}
                setSelectedTicket={
                  setSelectedTicket
                }
                reply={reply}
                setReply={setReply}
                replyLoading={
                  replyLoading
                }
                submitReply={
                  submitReply
                }
                changeStatus={
                  changeTicketStatus
                }
              />
            )}

            {section === "news" && (
              <NewsSection
                news={news}
                form={newsForm}
                setForm={setNewsForm}
                loading={newsLoading}
                submit={submitNews}
                refresh={loadNews}
                update={
                  updateOwnerNews
                }
                remove={
                  deleteOwnerNews
                }
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Overview({
  overview,
  loading,
  stats,
  onNavigate,
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-[#9b72c5]">
          Good to see you
        </p>

        <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          CareBridge at a glance
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          Monitor users, family activity,
          support requests and product
          communication from one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ key, ...stat }) => (
          <StatCard
            key={key}
            {...stat}
            value={
              loading
                ? 0
                : overview.totals?.[key] ?? 0
            }
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">
                Growth
              </p>
              <p className="mt-1 text-xs text-gray-400">
                New accounts over recent periods
              </p>
            </div>

            <TrendingUp className="h-5 w-5 text-[#9b72c5]" />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              ["Today", overview.growth.today],
              ["7 days", overview.growth.week],
              ["30 days", overview.growth.month],
            ].map(
              ([label, data]) => (
                <div
                  key={label}
                  className="rounded-2xl bg-gray-50 p-4"
                >
                  <p className="text-xs font-semibold text-gray-500">
                    {label}
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {formatNumber(
                      data.users
                    )}
                  </p>

                  <p className="mt-1 text-[11px] text-gray-400">
                    new users
                  </p>

                  <div className="mt-3 flex gap-2 text-[10px] text-gray-500">
                    <span>
                      P {data.parents}
                    </span>
                    <span>
                      C {data.children}
                    </span>
                    <span>
                      F {data.families}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">
                Live overview
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Current product activity
              </p>
            </div>

            <Activity className="h-5 w-5 text-[#9b72c5]" />
          </div>

          <div className="mt-5 space-y-2">
            {[
              [
                "Online users",
                overview.live.onlineUsers,
              ],
              [
                "Location sharing",
                overview.live.locationSharing,
              ],
              [
                "Recent chats",
                overview.live.activeChats,
              ],
              [
                "Bookings · 24h",
                overview.live.bookings,
              ],
              [
                "SOS events · 24h",
                overview.live.sosEvents,
              ],
            ].map(
              ([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-3"
                >
                  <span className="text-xs font-medium text-gray-500">
                    {label}
                  </span>

                  <span className="text-sm font-bold">
                    {formatNumber(value)}
                  </span>
                </div>
              )
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">
                Recent users
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Latest registered accounts
              </p>
            </div>

            <button
              onClick={() =>
                onNavigate("users")
              }
              className="text-xs font-semibold text-[#9b72c5]"
            >
              View all
            </button>
          </div>

          <div className="mt-4 divide-y divide-gray-100">
            {overview.recentUsers.length ===
            0 ? (
              <p className="py-6 text-center text-xs text-gray-400">
                No users yet.
              </p>
            ) : (
              overview.recentUsers.map(
                (user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {user.fullName ||
                          "Unnamed user"}
                      </p>

                      <p className="truncate text-xs text-gray-400">
                        {user.email}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold capitalize text-gray-500">
                      {user.role}
                    </span>
                  </div>
                )
              )
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">
                Support inbox
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Requests needing attention
              </p>
            </div>

            <button
              onClick={() =>
                onNavigate("support")
              }
              className="text-xs font-semibold text-[#9b72c5]"
            >
              Open inbox
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Open
              </p>

              <p className="mt-2 text-2xl font-bold">
                {overview.support.open}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                In progress
              </p>

              <p className="mt-2 text-2xl font-bold">
                {overview.support.inProgress}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {overview.support.recent
              .slice(0, 3)
              .map((ticket) => (
                <div
                  key={ticket._id}
                  className="rounded-xl border border-gray-100 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-[#9b72c5]">
                      {ticket.ticketId}
                    </span>

                    <span className="text-[10px] capitalize text-gray-400">
                      {statusLabel(
                        ticket.status
                      )}
                    </span>
                  </div>

                  <p className="mt-1 truncate text-xs font-semibold">
                    {ticket.subject}
                  </p>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold">
              Announcements
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Recent product communication
            </p>
          </div>

          <button
            onClick={() =>
              onNavigate("news")
            }
            className="text-xs font-semibold text-[#9b72c5]"
          >
            Manage
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {overview.news
            .slice(0, 3)
            .map((item) => (
              <div
                key={item._id}
                className="rounded-2xl bg-gray-50 p-4"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9b72c5]">
                  {item.type}
                </span>

                <p className="mt-2 text-sm font-bold">
                  {item.title}
                </p>

                <p className="mt-2 text-[11px] text-gray-400">
                  {item.status ===
                  "published"
                    ? "Published"
                    : "Draft"}
                </p>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}

function UsersSection({
  users,
  search,
  setSearch,
  role,
  setRole,
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">
          Users
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Search and monitor registered
          CareBridge accounts.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search name or email..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-[#9b72c5]"
            />
          </div>

          <select
            value={role}
            onChange={(event) =>
              setRole(event.target.value)
            }
            className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none"
          >
            <option value="all">
              All roles
            </option>
            <option value="parent">
              Parents
            </option>
            <option value="child">
              Children
            </option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="hidden border-b border-gray-100 px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-400 sm:grid sm:grid-cols-[1.5fr_1.5fr_.6fr_.8fr]">
          <span>User</span>
          <span>Email</span>
          <span>Role</span>
          <span>Joined</span>
        </div>

        <div className="divide-y divide-gray-100">
          {users.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-3 text-sm font-semibold">
                No users found
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Try another search or role.
              </p>
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user._id}
                className="grid gap-2 px-5 py-4 sm:grid-cols-[1.5fr_1.5fr_.6fr_.8fr] sm:items-center"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {user.fullName ||
                      "Unnamed user"}
                  </p>
                  <p className="text-xs text-gray-400 sm:hidden">
                    {user.email}
                  </p>
                </div>

                <p className="hidden truncate text-xs text-gray-500 sm:block">
                  {user.email}
                </p>

                <span className="w-fit rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold capitalize text-gray-600">
                  {user.role}
                </span>

                <p className="text-xs text-gray-400">
                  {formatDate(
                    user.createdAt
                  )}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function AnalyticsSection({
  analytics,
  days,
  setDays,
  maxValue,
}) {
  const rows = analytics?.users || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold">
            Analytics
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Registration growth from real
            account creation data.
          </p>
        </div>

        <div className="flex rounded-xl bg-white p-1 shadow-sm">
          {[7, 30, 90].map(
            (value) => (
              <button
                key={value}
                onClick={() =>
                  setDays(value)
                }
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  days === value
                    ? "bg-[#f8f1ff] text-[#815ba3]"
                    : "text-gray-400"
                }`}
              >
                {value}D
              </button>
            )
          )}
        </div>
      </div>

      <Card className="p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#9b72c5]" />
          <p className="text-sm font-bold">
            New users
          </p>
        </div>

        <div className="mt-8 flex h-64 items-end gap-1 overflow-hidden">
          {rows.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
              No registration data in this
              period.
            </div>
          ) : (
            rows.map((item) => {
              const height =
                Math.max(
                  (Number(
                    item.count || 0
                  ) /
                    maxValue) *
                    100,
                  3
                );

              return (
                <div
                  key={item._id}
                  className="group flex h-full min-w-0 flex-1 flex-col justify-end"
                  title={`${item._id}: ${item.count}`}
                >
                  <div
                    className="mx-auto w-full max-w-8 rounded-t-lg bg-[#d9c5ea] transition group-hover:bg-[#9b72c5]"
                    style={{
                      height: `${height}%`,
                    }}
                  />
                </div>
              );
            })
          )}
        </div>

        <div className="mt-3 flex justify-between text-[9px] text-gray-400">
          <span>
            {rows[0]?._id || ""}
          </span>
          <span>
            {rows[rows.length - 1]?._id ||
              ""}
          </span>
        </div>
      </Card>
    </div>
  );
}

function CalendarSection({
  date,
  setDate,
  activity,
}) {
  const activityItems = [
    ["Parents joined", activity?.parentsJoined],
    ["Children joined", activity?.childrenJoined],
    ["Families created", activity?.familiesCreated],
    ["Messages", activity?.messages],
    ["Snaps", activity?.snaps],
    ["Bookings", activity?.bookings],
    [
      "Location sessions",
      activity?.locationSessions,
    ],
    ["SOS events", activity?.sosEvents],
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">
          Calendar
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Historical daily activity from
          CareBridge data.
        </p>
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const current =
                  new Date(`${date}T00:00:00`);
                current.setDate(
                  current.getDate() - 1
                );
                setDate(
                  current
                    .toISOString()
                    .slice(0, 10)
                );
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />

            <button
              type="button"
              onClick={() => {
                const current =
                  new Date(`${date}T00:00:00`);
                current.setDate(
                  current.getDate() + 1
                );
                setDate(
                  current
                    .toISOString()
                    .slice(0, 10)
                );
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs font-semibold text-gray-400">
            {date}
          </p>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {activityItems.map(
          ([label, value]) => (
            <Card
              key={label}
              className="p-4"
            >
              <p className="text-xs text-gray-500">
                {label}
              </p>

              <p className="mt-2 text-2xl font-bold">
                {formatNumber(value)}
              </p>
            </Card>
          )
        )}
      </div>
    </div>
  );
}

function SupportSection({
  support,
  status,
  setStatus,
  selectedTicket,
  setSelectedTicket,
  reply,
  setReply,
  replyLoading,
  submitReply,
  changeStatus,
}) {
  const tickets =
    support?.tickets || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold">
            Support Inbox
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Investigate user reports and reply
            directly by email.
          </p>
        </div>

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold"
        >
          <option value="all">
            All tickets
          </option>
          <option value="open">
            Open
          </option>
          <option value="in_progress">
            In progress
          </option>
          <option value="resolved">
            Resolved
          </option>
          <option value="reopened">
            Reopened
          </option>
        </select>
      </div>

      <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <Card className="overflow-hidden">
          <div className="grid grid-cols-3 border-b border-gray-100">
            {[
              [
                "Open",
                support?.summary
                  ?.open || 0,
              ],
              [
                "Progress",
                support?.summary
                  ?.inProgress || 0,
              ],
              [
                "Resolved",
                support?.summary
                  ?.resolved || 0,
              ],
            ].map(
              ([label, value]) => (
                <div
                  key={label}
                  className="p-4 text-center"
                >
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">
                    {label}
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {value}
                  </p>
                </div>
              )
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {tickets.length === 0 ? (
              <div className="p-10 text-center">
                <Ticket className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-3 text-sm font-semibold">
                  Inbox is clear
                </p>
              </div>
            ) : (
              tickets.map(
                (ticket) => (
                  <button
                    key={ticket._id}
                    onClick={() =>
                      setSelectedTicket(
                        ticket
                      )
                    }
                    className={`w-full px-4 py-4 text-left transition hover:bg-gray-50 ${
                      selectedTicket?._id ===
                      ticket._id
                        ? "bg-[#faf8fc]"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold text-[#9b72c5]">
                        {ticket.ticketId}
                      </span>

                      <span className="rounded-full bg-gray-100 px-2 py-1 text-[9px] font-semibold capitalize text-gray-500">
                        {statusLabel(
                          ticket.status
                        )}
                      </span>
                    </div>

                    <p className="mt-2 truncate text-sm font-bold">
                      {ticket.subject}
                    </p>

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="truncate text-[11px] text-gray-400">
                        {ticket.email}
                      </p>

                      <p className="shrink-0 text-[10px] text-gray-400">
                        {formatDate(
                          ticket.createdAt
                        )}
                      </p>
                    </div>
                  </button>
                )
              )
            )}
          </div>
        </Card>

        <Card className="p-5">
          {!selectedTicket ? (
            <div className="flex min-h-[420px] items-center justify-center text-center">
              <div>
                <MessageCircle className="mx-auto h-9 w-9 text-gray-300" />
                <p className="mt-3 text-sm font-semibold">
                  Select a support request
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Review the report and respond
                  when you are ready.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#9b72c5]">
                    {selectedTicket.ticketId}
                  </p>

                  <h3 className="mt-1 text-lg font-bold">
                    {selectedTicket.subject}
                  </h3>

                  <p className="mt-1 text-xs text-gray-400">
                    {selectedTicket.email} ·{" "}
                    {statusLabel(
                      selectedTicket.userType
                    )}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setSelectedTicket(
                      null
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold capitalize text-gray-500">
                    {selectedTicket.category}
                  </span>

                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold capitalize text-gray-500">
                    {selectedTicket.priority}
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                  {selectedTicket.description}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  ["open", "Open"],
                  [
                    "in_progress",
                    "In progress",
                  ],
                  [
                    "resolved",
                    "Resolved",
                  ],
                ].map(
                  ([value, label]) => (
                    <button
                      key={value}
                      onClick={() =>
                        changeStatus(
                          selectedTicket,
                          value
                        )
                      }
                      className={`rounded-xl border px-3 py-2 text-[10px] font-semibold ${
                        selectedTicket.status ===
                        value
                          ? "border-[#9b72c5] bg-[#f8f1ff] text-[#815ba3]"
                          : "border-gray-200 text-gray-500"
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-xs font-semibold text-gray-700">
                  Reply by email
                </label>

                <textarea
                  rows={6}
                  value={reply}
                  onChange={(event) =>
                    setReply(
                      event.target.value
                    )
                  }
                  placeholder="Write your response..."
                  className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#9b72c5]"
                />

                <button
                  onClick={submitReply}
                  disabled={
                    replyLoading ||
                    !reply.trim()
                  }
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />

                  {replyLoading
                    ? "Sending..."
                    : "Send Reply"}
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function NewsSection({
  news,
  form,
  setForm,
  loading,
  submit,
  refresh,
  update,
  remove,
}) {
  const publish = async (item) => {
    try {
      await update(item._id, {
        status:
          item.status === "published"
            ? "draft"
            : "published",
      });

      toast.success(
        item.status === "published"
          ? "Moved to draft."
          : "Announcement published."
      );

      await refresh();
    } catch (err) {
      toast.error(
        err?.message ||
          "Unable to update announcement."
      );
    }
  };

  const removeItem = async (item) => {
    const confirmed =
      window.confirm(
        `Delete "${item.title}"?`
      );

    if (!confirmed) return;

    try {
      await remove(item._id);

      toast.success(
        "Announcement deleted."
      );

      await refresh();
    } catch (err) {
      toast.error(
        err?.message ||
          "Unable to delete announcement."
      );
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">
          News & Announcements
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Publish important CareBridge updates
          without creating a blog.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-[#9b72c5]" />

            <p className="text-sm font-bold">
              Create announcement
            </p>
          </div>

          <form
            onSubmit={submit}
            className="mt-5 space-y-3"
          >
            <input
              value={form.title}
              onChange={(event) =>
                setForm({
                  ...form,
                  title:
                    event.target.value,
                })
              }
              placeholder="Announcement title"
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#9b72c5]"
            />

            <select
              value={form.type}
              onChange={(event) =>
                setForm({
                  ...form,
                  type:
                    event.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm"
            >
              <option value="announcement">
                Announcement
              </option>
              <option value="update">
                Product update
              </option>
              <option value="maintenance">
                Maintenance
              </option>
              <option value="important">
                Important
              </option>
            </select>

            <textarea
              rows={7}
              value={form.content}
              onChange={(event) =>
                setForm({
                  ...form,
                  content:
                    event.target.value,
                })
              }
              placeholder="Write the announcement..."
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#9b72c5]"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    status: "draft",
                  })
                }
                className={`rounded-xl border px-3 py-3 text-xs font-semibold ${
                  form.status === "draft"
                    ? "border-[#9b72c5] bg-[#f8f1ff] text-[#815ba3]"
                    : "border-gray-200 text-gray-500"
                }`}
              >
                Save draft
              </button>

              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    status: "published",
                  })
                }
                className={`rounded-xl border px-3 py-3 text-xs font-semibold ${
                  form.status === "published"
                    ? "border-[#9b72c5] bg-[#f8f1ff] text-[#815ba3]"
                    : "border-gray-200 text-gray-500"
                }`}
              >
                Publish
              </button>
            </div>

            <button
              disabled={loading}
              className="w-full rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : form.status ===
                  "published"
                ? "Publish Announcement"
                : "Save Draft"}
            </button>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <p className="text-sm font-bold">
                Published & drafts
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Manage existing communication.
              </p>
            </div>

            <button
              onClick={refresh}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {news.length === 0 ? (
              <div className="p-10 text-center">
                <FileText className="mx-auto h-8 w-8 text-gray-300" />

                <p className="mt-3 text-sm font-semibold">
                  No announcements yet
                </p>
              </div>
            ) : (
              news.map((item) => (
                <div
                  key={item._id}
                  className="p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#f8f1ff] px-2.5 py-1 text-[10px] font-semibold capitalize text-[#815ba3]">
                          {item.type}
                        </span>

                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold capitalize text-gray-500">
                          {item.status}
                        </span>
                      </div>

                      <h3 className="mt-2 text-sm font-bold">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-xs text-gray-400">
                        {formatDate(
                          item.createdAt
                        )}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          publish(item)
                        }
                        className="rounded-xl px-3 py-2 text-[10px] font-semibold text-[#815ba3] hover:bg-[#f8f1ff]"
                      >
                        {item.status ===
                        "published"
                          ? "Draft"
                          : "Publish"}
                      </button>

                      <button
                        onClick={() =>
                          removeItem(item)
                        }
                        className="rounded-xl px-3 py-2 text-[10px] font-semibold text-red-500 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
