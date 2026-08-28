"use client";

import { useState } from "react";
import { ArrowRight, Baby, Building2, KeyRound, LockKeyhole, LogOut, ShieldCheck, Sparkles, Users } from "lucide-react";
import { getOwnerStats, loginOwner, verifyOwnerKey } from "@/services/ownerService";

const stats = [
  { key: "totalUsers", label: "Total Users", note: "All registered accounts", icon: Users, tone: "rose" },
  { key: "parents", label: "Parents", note: "Parent accounts", icon: ShieldCheck, tone: "sage" },
  { key: "children", label: "Children", note: "Child profiles", icon: Baby, tone: "sky" },
  { key: "families", label: "Families", note: "Connected family groups", icon: Building2, tone: "lavender" },
];

function Field({ label, type = "text", value, onChange, placeholder, autoFocus }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input required autoFocus={autoFocus} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-14 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-100" />
    </label>
  );
}

export default function OwnerDashboardPage() {
  const [step, setStep] = useState("key");
  const [key, setKey] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [ownerStats, setOwnerStats] = useState({ totalUsers: 0, parents: 0, children: 0, families: 0 });
  const [loading, setLoading] = useState(false);

  const handleKeySubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      await verifyOwnerKey(key);
      setError("");
      setStep("login");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to verify the access key.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const response = await loginOwner({ accessKey: key, username, password });
      localStorage.setItem("ownerToken", response.token);
      const statsResponse = await getOwnerStats();
      setOwnerStats(statsResponse.data);
      setError("");
      setStep("dashboard");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  };

  const resetPortal = () => {
    setStep("key");
    setKey("");
    setUsername("");
    setPassword("");
    localStorage.removeItem("ownerToken");
    setError("");
  };

  if (step === "dashboard") {
    return (
      <main className="owner-portal motion-page min-h-screen px-5 py-6 text-slate-900 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <header className="mb-10 flex items-start justify-between gap-5">
            <div><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/15"><Sparkles size={21} /></div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-500">CareBridge / Owner</p><h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Good morning, Abhy.</h1><p className="mt-3 max-w-lg text-sm leading-6 text-slate-500 sm:text-base">A calm view of the people and families held by CareBridge.</p></div>
            <button type="button" onClick={resetPortal} aria-label="Sign out" className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white/70 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900"><LogOut size={18} /></button>
          </header>
          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {stats.map(({ key: statKey, label, note, icon: Icon, tone }, index) => <article key={label} className={`owner-stat motion-card owner-stat--${tone} animate-owner-rise`} style={{ animationDelay: `${index * 70}ms` }}><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-slate-600">{label}</p><p className="mt-5 text-5xl font-bold tracking-tight text-slate-900">{ownerStats[statKey]}</p></div><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-slate-700 shadow-sm"><Icon size={22} /></span></div><p className="mt-7 text-xs font-medium text-slate-500">{note}</p></article>)}
          </section>
          <section className="rounded-3xl border border-white/80 bg-white/55 p-5 shadow-sm backdrop-blur sm:p-7"><div className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-300" /><p className="text-sm font-bold text-slate-700">Live overview</p></div><p className="mt-3 text-sm leading-6 text-slate-500">Your dashboard is ready. User totals will appear here as the owner analytics connection is added.</p></section>
        </div>
      </main>
    );
  }

  const isKeyStep = step === "key";
  return (
    <main className="owner-portal motion-page flex min-h-screen items-center px-5 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/65 shadow-[0_25px_80px_rgba(117,76,83,0.15)] backdrop-blur-xl md:grid-cols-[0.85fr_1.15fr]">
        <aside className="owner-welcome flex min-h-56 flex-col justify-between p-7 sm:p-10 md:min-h-[570px]"><div className="motion-press flex h-11 w-11 items-center justify-center rounded-2xl bg-white/75 text-rose-500 shadow-sm"><Sparkles size={21} /></div><div className="mt-10 md:mt-0"><p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-rose-500">CareBridge / Private</p><h1 className="max-w-xs text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">A softer way to see it all.</h1><p className="mt-5 max-w-sm text-sm leading-6 text-slate-600">Owner access to the CareBridge community, in one quiet little corner.</p></div><div className="mt-8 hidden items-center gap-2 text-xs font-semibold text-slate-500 md:flex"><ShieldCheck size={16} className="text-emerald-500" /> Private owner space</div></aside>
        <section className="p-7 sm:p-10 md:flex md:items-center"><div className="w-full max-w-md"><div className="mb-9 flex items-center gap-3 text-xs font-bold text-slate-400"><span className={`owner-step ${isKeyStep ? "owner-step--active" : ""}`}>01</span><span className="h-px w-8 bg-slate-200" /><span className={`owner-step ${!isKeyStep ? "owner-step--active" : ""}`}>02</span></div>
          {isKeyStep ? <form onSubmit={handleKeySubmit} className="motion-fade-up"><KeyRound className="mb-5 text-rose-400" size={25} /><h2 className="text-2xl font-bold tracking-tight">Enter your access key</h2><p className="mt-2 mb-8 text-sm leading-6 text-slate-500">This private door opens before your owner sign-in.</p><Field label="Access key" type="password" value={key} onChange={setKey} placeholder="Your private key" autoFocus />{error && <p role="alert" className="mt-3 text-sm font-semibold text-rose-600">{error}</p>}<button type="submit" disabled={loading} className="motion-press mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70">{loading ? "Checking..." : "Continue"} {!loading && <ArrowRight size={17} />}</button></form> : <form onSubmit={handleLoginSubmit} className="motion-fade-up"><LockKeyhole className="mb-5 text-rose-400" size={25} /><h2 className="text-2xl font-bold tracking-tight">Welcome back, owner</h2><p className="mt-2 mb-8 text-sm leading-6 text-slate-500">Sign in to view your CareBridge overview.</p><div className="space-y-4"><Field label="Username" value={username} onChange={setUsername} placeholder="Enter username" autoFocus /><Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Enter password" /></div>{error && <p role="alert" className="mt-3 text-sm font-semibold text-rose-600">{error}</p>}<button type="submit" disabled={loading} className="motion-press mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70">{loading ? "Checking..." : "Open dashboard"} {!loading && <ArrowRight size={17} />}</button><button type="button" onClick={() => { setStep("key"); setError(""); }} className="motion-press mt-4 w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-900">Back to access key</button></form>}
        </div></section>
      </div>
    </main>
  );
}
