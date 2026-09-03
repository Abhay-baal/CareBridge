"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  CalendarDays,
  FileHeart,
  ShieldCheck,
  Users,
  MapPin,
  ArrowRight,
  HeartPulse,
  Smartphone,
  CheckCircle2,
  Siren,
} from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Care Plans",
    description:
      "Track daily healthcare tasks and monitor care progress with ease.",
  },
  {
    icon: CalendarDays,
    title: "Appointments",
    description:
      "Keep upcoming healthcare appointments organized in one place.",
  },
  {
    icon: Users,
    title: "Family Connection",
    description:
      "Connect parents and children through a simple role-based experience.",
  },
  {
    icon: Siren,
    title: "Emergency Contacts",
    description:
      "Access important emergency contacts quickly when every second matters.",
  },
  {
    icon: MapPin,
    title: "Location",
    description:
      "Keep essential parent location information available to connected family members.",
  },
];

const problems = [
  "Families can struggle to keep track of care plans and appointments.",
  "Important emergency information may not be immediately accessible.",
  "Caregivers need a simpler way to stay connected with their loved one's healthcare.",
];

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const routeAuthenticatedUser = () => {
      const token = localStorage.getItem("token");

      let user = null;

      try {
        user = JSON.parse(
          localStorage.getItem("user") || "null"
        );
      } catch {
        user = null;
      }

      if (!token || !user?.role) {
        return;
      }

      if (cancelled) {
        return;
      }

      if (user.role === "child") {
        router.replace("/child/dashboard");
      } else if (user.role === "provider") {
        router.replace("/provider/dashboard");
      } else if (user.role === "parent") {
        router.replace("/dashboard");
      }
    };

    routeAuthenticatedUser();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/20">
              <HeartPulse size={22} strokeWidth={2.5} />
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight text-slate-900">
                CareBridge
              </p>
              <p className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500 sm:block">
                Connected Care
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-600/20 transition hover:bg-teal-700"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-teal-100/60 blur-3xl" />
        <div className="absolute -right-32 top-10 h-96 w-96 rounded-full bg-cyan-100/70 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:py-32">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700">
              <ShieldCheck size={17} />
              Healthcare, connected
            </div>

            <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Better care starts with
              <span className="block text-teal-600">better connection.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              CareBridge helps families stay connected, manage care plans, appointments,
              emergency contacts, and more — all in one connected platform.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-7 py-4 text-base font-bold text-white shadow-xl shadow-teal-600/20 transition hover:-translate-y-0.5 hover:bg-teal-700"
              >
                Create Your Account
                <ArrowRight
                  size={19}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-7 py-4 text-base font-bold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50"
              >
                Login
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-teal-600" />
                Mobile-first
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-teal-600" />
                Secure authentication
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-teal-600" />
                Installable PWA
              </span>
            </div>
          </div>

          {/* HERO VISUAL */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-lg">
            <div className="rounded-[2.5rem] border border-slate-200 bg-slate-50 p-3 shadow-2xl shadow-slate-900/10">
              <div className="overflow-hidden rounded-[2rem] bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Good morning
                    </p>
                    <p className="mt-1 font-bold text-slate-900">
                      Your Care Dashboard
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                    <HeartPulse size={20} />
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="rounded-2xl bg-teal-600 p-5 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-teal-100">
                          Today&apos;s progress
                        </p>
                        <p className="mt-2 text-3xl font-bold">80%</p>
                      </div>

                      <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-teal-300/40">
                        <CheckCircle2 size={27} />
                      </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-teal-800/30">
                      <div className="h-full w-4/5 rounded-full bg-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <Activity className="text-teal-600" size={21} />
                      <p className="mt-3 text-2xl font-bold text-slate-900">
                        4
                      </p>
                      <p className="text-xs text-slate-500">Care tasks</p>
                    </div>

                  </div>

                  <div className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                        <CalendarDays size={19} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">
                          Upcoming appointment
                        </p>
                        <p className="font-semibold text-slate-900">
                          Doctor consultation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Connected care</p>
                <p className="text-sm font-bold text-slate-900">
                  Family protected
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="bg-slate-950 py-20 text-white sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-400">
              The problem
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              Healthcare information shouldn&apos;t be difficult to manage.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-300">
              Families often depend on scattered documents, messages, phone
              calls, and disconnected systems to manage the healthcare of
              someone they love.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {problems.map((problem, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-sm font-bold text-teal-300">
                    {index + 1}
                  </span>
                  <p className="leading-7 text-slate-300">{problem}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IDEA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-600">
              The idea behind CareBridge
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              One place for the people who care about you.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              CareBridge was built around a simple idea: make essential
              healthcare information easier for families to organize, access,
              and share with the people who need it.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-slate-900/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 transition group-hover:bg-teal-600 group-hover:text-white">
                    <Icon size={23} />
                  </div>

                  <h3 className="mt-6 text-lg font-bold text-slate-950">
                    {feature.title}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MOBILE FIRST */}
      <section className="overflow-hidden bg-teal-50 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/20">
              <Smartphone size={27} />
            </div>

            <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-teal-700">
              Mobile-first by design
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Healthcare access that fits in your pocket.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              CareBridge is designed from the ground up with a mobile-first
              approach. The experience is optimized for phones while remaining
              responsive across tablets and desktops.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Responsive healthcare dashboard",
                "Touch-friendly navigation",
                "Installable Progressive Web App",
                "Fast access to important information",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 font-medium text-slate-700"
                >
                  <CheckCircle2 size={20} className="text-teal-600" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="rounded-[3rem] border-8 border-slate-900 bg-slate-900 p-2 shadow-2xl">
              <div className="overflow-hidden rounded-[2.3rem] bg-white">
                <div className="h-7 bg-slate-900" />

                <div className="space-y-4 p-5">
                  <div>
                    <p className="text-xs text-slate-400">CareBridge</p>
                    <p className="text-xl font-bold text-slate-900">
                      Your family&apos;s care
                    </p>
                  </div>

                  <div className="rounded-2xl bg-teal-600 p-5 text-white">
                    <HeartPulse size={25} />
                    <p className="mt-4 text-lg font-bold">
                      Everything connected.
                    </p>
                    <p className="mt-1 text-sm text-teal-100">
                      Care information when you need it.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <Siren size={20} className="text-teal-600" />
                      <p className="mt-3 text-xs font-semibold">
                        Emergency
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-center gap-3">
                      <MapPin size={20} className="text-teal-600" />
                      <p className="text-sm font-semibold">
                        Parent location
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PARENT / CHILD */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-600">
              Built for families
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Two experiences. One connected system.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                <HeartPulse size={27} />
              </div>

              <h3 className="mt-6 text-2xl font-bold text-slate-950">
                Parent
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Manage your healthcare information and keep your care organized
                from one central dashboard.
              </p>

              <div className="mt-7 space-y-3">
                {[
                  "Track care plans",
                  "Manage appointments",
                  "Update medical profile",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <CheckCircle2 size={18} className="text-teal-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-8 text-white shadow-sm sm:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-300">
                <Users size={27} />
              </div>

              <h3 className="mt-6 text-2xl font-bold">Child / Caregiver</h3>

              <p className="mt-3 leading-7 text-slate-300">
                Stay connected with your parent&apos;s essential healthcare
                information and provide better support when it matters.
              </p>

              <div className="mt-7 space-y-3">
                {[
                  "Monitor care plans",
                  "View parent details",
                  "Access emergency contacts",
                  "View parent location",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm font-medium text-slate-300">
                    <CheckCircle2 size={18} className="text-teal-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEVELOPER / STORY */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/20">
            <HeartPulse size={30} />
          </div>

          <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-teal-600">
            The story
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Built with a simple question in mind.
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            What if the important healthcare information of a loved one could
            be available to the people who care about them — whenever they
            need it?
          </p>

          <div className="mx-auto mt-10 max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Designed & Developed by
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-950">
              Abhybir Singh
            </p>

            <p className="mt-2 text-slate-600">
              Full-Stack Developer
            </p>

            <p className="mt-6 leading-7 text-slate-600">
              CareBridge is a healthcare technology project focused on
              improving how families organize, access, and stay connected to
              essential healthcare information.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-teal-600 py-20 text-white sm:py-24">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Better healthcare starts with better connection.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-teal-50">
            Bring essential healthcare information together and stay connected
            with the people who matter.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 font-bold text-teal-700 shadow-xl transition hover:bg-teal-50"
            >
              Get Started
              <ArrowRight size={19} />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl border border-white/30 px-7 py-4 font-bold text-white transition hover:bg-white/10"
            >
              Already have an account?
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 py-10 text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
              <HeartPulse size={19} />
            </div>

            <div>
              <p className="font-bold text-white">CareBridge</p>
              <p className="text-xs">Connected healthcare for families</p>
            </div>
          </div>

          <div className="text-sm">
            Built with purpose by{" "}
            <span className="font-semibold text-white">Abhybir Singh</span>
          </div>

          <p className="text-xs">
            © {new Date().getFullYear()} CareBridge. Portfolio Project.
          </p>
        </div>
      </footer>
    </main>
  );
}
