"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  getCarePlans,
  createCarePlan,
  updateCarePlan,
} from "@/services/carePlanService";

import {
  getParentChildRelationships,
} from "@/services/parentChildService";

const WALK_LEVELS = [
  {
    id: "light",
    label: "Light",
    duration: 4,
    display: "< 5 min",
    emoji: "🌱",
  },
  {
    id: "easy",
    label: "Easy",
    duration: 5,
    display: "5 min",
    emoji: "🟢",
  },
  {
    id: "medium",
    label: "Medium",
    duration: 10,
    display: "10 min",
    emoji: "🔵",
  },
  {
    id: "hard",
    label: "Hard",
    duration: 15,
    display: "15 min",
    emoji: "🟠",
  },
  {
    id: "extreme",
    label: "Extreme",
    duration: 16,
    display: "15+ min",
    emoji: "🔥",
  },
];

function getDueDate(value) {
  const now = new Date();
  const [day, time] = value.split("|");
  const [hours, minutes] = time.split(":").map(Number);
  const dueDate = new Date(now);

  if (day === "tomorrow") {
    dueDate.setDate(dueDate.getDate() + 1);
  }

  dueDate.setHours(hours, minutes, 0, 0);
  return dueDate.toISOString();
}

function normalizeCarePlan(plan) {
  const isWalk =
    plan.careType === "walk" ||
    plan.description?.startsWith("Care activity:");
  const childName = plan.child?.fullName;

  return {
    ...plan,
    id: plan._id || plan.id,
    type: isWalk ? "walk" : "task",
    duration: plan.walkDuration,
    level: plan.walkLevel,
    levelEmoji: WALK_LEVELS.find(
      (level) => level.id === plan.walkLevel
    )?.emoji,
    time: plan.dueDate
      ? new Date(plan.dueDate).toLocaleString([], {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "No due date",
    recipients: childName ? [childName] : [],
    from: "You",
  };
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");

  const remaining = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remaining}`;
}

function Icon({ children, className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center ${className}`}
    >
      {children}
    </span>
  );
}

export default function CarePlanPage() {
  const [profile, setProfile] = useState("parent");
  const [screen, setScreen] = useState("home");

  const [givenTasks, setGivenTasks] = useState([]);

  const [relationships, setRelationships] = useState([]);
  const [loadingRelationships, setLoadingRelationships] =
    useState(true);

  const [taskTitle, setTaskTitle] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [taskTime, setTaskTime] = useState("today|19:00");

  const [selectedWalkLevel, setSelectedWalkLevel] = useState("medium");

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);
  const [activeWalk, setActiveWalk] = useState(null);

  const recipients = useMemo(() => {
    if (profile !== "parent") {
      return [];
    }

    return relationships
      .filter(
        (relationship) =>
          relationship?.parent &&
          relationship?.child
      )
      .map((relationship) => ({
        id: relationship.child._id,
        relationshipId: relationship._id,
        name: relationship.child.fullName,
        email: relationship.child.email,
        emoji: "👦",
        role: "Child",
      }));
  }, [relationships, profile]);

  const loadRealFamily = async () => {
    try {
      setLoadingRelationships(true);

      const response = await getParentChildRelationships();

      const realRelationships = response?.data || [];

      setRelationships(realRelationships);

      return realRelationships;
    } catch (error) {
      console.error(
        "Failed to load family relationships:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to load connected family members."
      );

      setRelationships([]);
      return [];
    } finally {
      setLoadingRelationships(false);
    }
  };

  const loadRealCarePlans = async () => {
    try {
      const response = await getCarePlans();

      const realPlans = response?.data || [];

      const normalizedPlans = realPlans.map(normalizeCarePlan);

      setGivenTasks(normalizedPlans);

      return realPlans;
    } catch (error) {
      console.error(
        "Failed to load care plans:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to load care plans."
      );

      return [];
    }
  };

  useEffect(() => {
    if (profile !== "parent") return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoadingRelationships(true);

        const [familyResponse, carePlanResponse] =
          await Promise.all([
            getParentChildRelationships(),
            getCarePlans(),
          ]);

        if (cancelled) return;

        setRelationships(familyResponse?.data || []);
        const normalizedPlans = (carePlanResponse?.data || []).map(
          normalizeCarePlan
        );

        setGivenTasks(normalizedPlans);
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Failed to load care plan data:",
          error
        );

        toast.error(
          error.response?.data?.message ||
            "Unable to load care plan data."
        );

        setRelationships([]);
        setGivenTasks([]);
      } finally {
        if (!cancelled) {
          setLoadingRelationships(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [profile]);

  const currentWalkLevel = useMemo(
    () =>
      WALK_LEVELS.find(
        (level) => level.id === selectedWalkLevel
      ) || WALK_LEVELS[2],
    [selectedWalkLevel]
  );

  useEffect(() => {
    if (!timerRunning) return;

    const timer = setInterval(() => {
      setTimerSeconds((current) => {
        if (current <= 1) {
          clearInterval(timer);
          setTimerRunning(false);
          setTimerFinished(true);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerRunning]);

  const toggleRecipient = (id) => {
    setSelectedRecipients((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const resetComposer = () => {
    setTaskTitle("");
    setSelectedRecipients([]);
    setTaskTime("today|19:00");
    setSelectedWalkLevel("medium");
  };

  const openGiveCare = () => {
    resetComposer();
    setScreen("give");
  };

  const openTask = () => {
    resetComposer();
    setScreen("task");
  };

  const openWalk = () => {
    resetComposer();
    setScreen("walk");
  };

  const goHome = () => {
    setTimerRunning(false);
    setScreen("home");
  };

  const assignTask = async () => {
    if (
      !taskTitle.trim() ||
      selectedRecipients.length === 0
    ) {
      return;
    }

    if (profile !== "parent") {
      toast.error("Only parents can assign care.");
      return;
    }

    try {
      await Promise.all(
        selectedRecipients.map((childId) =>
          createCarePlan({
            title: taskTitle.trim(),
            description: "",
            dueDate: getDueDate(taskTime),
            childId,
            careType: "task",
          })
        )
      );

      toast.success("Care task assigned ❤️");

      await loadRealCarePlans();

      setScreen("home");
      resetComposer();
    } catch (error) {
      console.error(
        "Assign care task error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to assign care task."
      );
    }
  };

  const assignWalk = async () => {
    if (selectedRecipients.length === 0) {
      return;
    }

    if (profile !== "parent") {
      toast.error("Only parents can assign care.");
      return;
    }

    try {
      await Promise.all(
        selectedRecipients.map((childId) =>
          createCarePlan({
            title: `Walk for ${currentWalkLevel.display}`,
            description: `Care activity: ${currentWalkLevel.label} walk`,
            dueDate: getDueDate(taskTime),
            childId,
            careType: "walk",
            walkLevel: currentWalkLevel.id,
            walkDuration: currentWalkLevel.duration,
          })
        )
      );

      toast.success("Walk care assigned ❤️");

      await loadRealCarePlans();

      setScreen("home");
      resetComposer();
    } catch (error) {
      console.error(
        "Assign walk error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to assign walk."
      );
    }
  };

  const completeTask = async (id) => {
    try {
      await updateCarePlan(id, { status: "completed" });
      await loadRealCarePlans();
      toast.success("Care task completed");
    } catch (error) {
      console.error("Complete care task error:", error);
      toast.error(
        error.response?.data?.message ||
          "Unable to complete care task."
      );
    }
  };

  const startWalk = (walk) => {
    const durationSeconds = Math.max(
      60,
      (walk.duration || 10) * 60
    );

    setActiveWalk(walk);
    setTimerSeconds(durationSeconds);
    setTimerFinished(false);
    setTimerRunning(true);
    setScreen("timer");
  };

  const startSelectedWalk = (level = currentWalkLevel) => {
    const walk = {
      type: "walk",
      title: `${level.display} walk`,
      level: level.label,
      levelEmoji: level.emoji,
      duration: level.duration,
    };

    startWalk(walk);
  };

  const restartWalk = () => {
    if (!activeWalk) return;

    setTimerSeconds(
      Math.max(60, (activeWalk.duration || 10) * 60)
    );
    setTimerFinished(false);
    setTimerRunning(true);
  };

  const progress =
    activeWalk && activeWalk.duration
      ? Math.min(
          100,
          Math.max(
            0,
            ((activeWalk.duration * 60 - timerSeconds) /
              (activeWalk.duration * 60)) *
              100
          )
        )
      : 0;

  const visibleTasks = givenTasks;

  if (screen === "give") {
    return (
      <AppLayout>
        <div className="mx-auto w-full max-w-2xl">
          <PageBackButton
            onClick={goHome}
            label="Give Care"
          />

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              What would you like to give?
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Choose something helpful for your family.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ActionChoice
              emoji="📝"
              title="Task"
              description="Give someone a task"
              onClick={openTask}
            />

            <ActionChoice
              emoji="🚶"
              title="Walk"
              description="Give someone a walking goal"
              onClick={openWalk}
            />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (screen === "task") {
    return (
      <AppLayout>
        <div className="mx-auto w-full max-w-2xl">
          <PageBackButton
            onClick={goHome}
            label="Task"
          />

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <SectionTitle
              emoji="📝"
              title="Give a Task"
              subtitle="Keep it simple and helpful."
            />

            <label className="mt-7 block text-sm font-semibold text-slate-700">
              What needs to be done?
            </label>

            <input
              value={taskTitle}
              onChange={(event) =>
                setTaskTitle(event.target.value)
              }
              placeholder="e.g. Finish your homework"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />

            <label className="mt-6 block text-sm font-semibold text-slate-700">
              Give to
            </label>

            <div className="mt-2 space-y-2">
              {loadingRelationships ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400">
                  Loading family members...
                </p>
              ) : recipients.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400">
                  No connected children found.
                </p>
              ) : (
                recipients.map((person) => (
                  <RecipientRow
                    key={person.id}
                    person={person}
                    selected={selectedRecipients.includes(
                      person.id
                    )}
                    onClick={() =>
                      toggleRecipient(person.id)
                    }
                  />
                ))
              )}
            </div>

            <label className="mt-6 block text-sm font-semibold text-slate-700">
              When?
            </label>

            <select
              value={taskTime}
              onChange={(event) =>
                setTaskTime(event.target.value)
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none focus:border-slate-400"
            >
              <option value="today|17:00">Today · 5:00 PM</option>
              <option value="today|19:00">Today · 7:00 PM</option>
              <option value="tomorrow|09:00">Tomorrow · 9:00 AM</option>
              <option value="tomorrow|18:00">Tomorrow · 6:00 PM</option>
            </select>
          </div>

          <button
            type="button"
            onClick={assignTask}
            disabled={
              !taskTitle.trim() ||
              selectedRecipients.length === 0
            }
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-lg">❤️</span>
            Assign Care
          </button>
        </div>
      </AppLayout>
    );
  }

  if (screen === "walk") {
    return (
      <AppLayout>
        <div className="mx-auto w-full max-w-2xl">
          <PageBackButton
            onClick={goHome}
            label="Walk"
          />

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <SectionTitle
              emoji="🚶"
              title="Give a Walk"
              subtitle="Choose a simple walking goal."
            />

            <label className="mt-7 block text-sm font-semibold text-slate-700">
              Give to
            </label>

            <div className="mt-2 space-y-2">
              {loadingRelationships ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400">
                  Loading family members...
                </p>
              ) : recipients.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400">
                  No connected children found.
                </p>
              ) : (
                recipients.map((person) => (
                  <RecipientRow
                    key={person.id}
                    person={person}
                    selected={selectedRecipients.includes(
                      person.id
                    )}
                    onClick={() =>
                      toggleRecipient(person.id)
                    }
                  />
                ))
              )}
            </div>

            <label className="mt-6 block text-sm font-semibold text-slate-700">
              Choose walk level
            </label>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {WALK_LEVELS.map((level) => (
                <WalkLevelCard
                  key={level.id}
                  level={level}
                  selected={
                    selectedWalkLevel === level.id
                  }
                  onClick={() =>
                    setSelectedWalkLevel(level.id)
                  }
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={assignWalk}
            disabled={
              selectedRecipients.length === 0
            }
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-lg">❤️</span>
            Assign Walk
          </button>
        </div>
      </AppLayout>
    );
  }

  if (screen === "timer") {
    return (
      <AppLayout>
        <div className="mx-auto w-full max-w-2xl">
          <PageBackButton
            onClick={goHome}
            label="Care Walk"
          />

          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-3xl">
              {activeWalk?.levelEmoji || "🚶"}
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-900">
              {activeWalk?.title || "Care Walk"}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {timerFinished
                ? "Walk complete ❤️"
                : "Take your time and enjoy the walk."}
            </p>

            <div className="mt-8">
              <div className="text-6xl font-bold tracking-tight text-slate-900">
                {formatTime(timerSeconds)}
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {timerFinished ? (
                <button
                  type="button"
                  onClick={restartWalk}
                  className="flex-1 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Restart Walk
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setTimerRunning((current) => !current)
                  }
                  className="flex-1 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white hover:bg-slate-800"
                >
                  {timerRunning ? "Pause" : "Resume"}
                </button>
              )}

              <button
                type="button"
                onClick={goHome}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-400">
                Care Plan
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Care for your family ❤️
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Small things that make family life easier.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openGiveCare}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99]"
        >
          <span className="text-lg">＋</span>
          Give Care
          <span className="ml-1 text-xs font-medium text-slate-300">
            Task or Walk
          </span>
        </button>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                Given by Me
              </h2>
            </div>

            <span className="text-xs text-slate-400">
              Things you gave
            </span>
          </div>

          <div className="space-y-3">
            {visibleTasks.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <div className="text-3xl">❤️</div>

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No care activities yet
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Give a task or walk to someone in your family.
                </p>
              </div>
            ) : (
              visibleTasks.map((task) => (
                <CareCard
                  key={task.id || task._id}
                  task={task}
                  activeTab="given"
                  onComplete={completeTask}
                  onStartWalk={startWalk}
                />
              ))
            )}
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-xl">
              🚶
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                Care Walk
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                A simple timed walk. No step counter needed.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {WALK_LEVELS.map((level) => (
              <button
                type="button"
                key={level.id}
                onClick={() => {
                  setSelectedWalkLevel(level.id);
                  startSelectedWalk(level);
                }}
                className={`rounded-2xl bg-slate-50 px-3 py-3 text-center transition hover:bg-slate-100 ${
                  selectedWalkLevel === level.id
                    ? "ring-2 ring-slate-900/10"
                    : ""
                }`}
              >
                <div className="text-lg">
                  {level.emoji}
                </div>

                <p className="mt-1 text-xs font-bold text-slate-800">
                  {level.label}
                </p>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  {level.display}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function PageBackButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
    >
      <span className="text-lg">←</span>
      {label}
    </button>
  );
}

function SectionTitle({ emoji, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-xl">
        {emoji}
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">
          {title}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function ActionChoice({
  emoji,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-2xl">
        {emoji}
      </div>

      <h2 className="mt-5 text-lg font-bold text-slate-900">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>

      <div className="mt-5 text-xs font-bold text-slate-400 group-hover:text-slate-700">
        Choose →
      </div>
    </button>
  );
}

function RecipientRow({
  person,
  selected,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 transition ${
        selected
          ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg">
          {person.emoji}
        </span>

        <span className="text-left">
          <span className="block text-sm font-bold text-slate-900">
            {person.name}
          </span>

          <span className="block text-xs text-slate-400">
            {person.role}
          </span>
        </span>
      </span>

      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold ${
          selected
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-300 text-transparent"
        }`}
      >
        ✓
      </span>
    </button>
  );
}

function WalkLevelCard({
  level,
  selected,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xl">
          {level.emoji}
        </span>

        {selected && (
          <span className="text-xs font-bold text-slate-900">
            ✓
          </span>
        )}
      </div>

      <p className="mt-3 text-sm font-bold text-slate-900">
        {level.display}
      </p>

      <p className="mt-0.5 text-xs text-slate-500">
        {level.label}
      </p>
    </button>
  );
}

function CareCard({
  task,
  activeTab,
  onComplete,
  onStartWalk,
}) {
  const completed =
    task.status === "completed";

  return (
    <div
      className={`rounded-3xl border bg-white p-4 shadow-sm transition sm:p-5 ${
        completed
          ? "border-emerald-100 bg-emerald-50/30"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-xl">
          {task.type === "walk"
            ? "🚶"
            : "📝"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3
                className={`font-bold ${
                  completed
                    ? "text-slate-400 line-through"
                    : "text-slate-900"
                }`}
              >
                {task.title}
              </h3>

              {activeTab === "mine" ? (
                <p className="mt-1 text-xs text-slate-400">
                  From {task.fromEmoji} {task.from}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">
                  →{" "}
                  {task.recipients?.length
                    ? task.recipients.join(" + ")
                    : "Family"}
                </p>
              )}
            </div>

            {task.type === "walk" && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                {task.levelEmoji} {task.level}
              </span>
            )}
          </div>

          <p className="mt-3 text-xs text-slate-400">
            {task.time}
          </p>

          {activeTab === "mine" &&
            task.type === "walk" &&
            !completed && (
              <button
                type="button"
                onClick={() => onStartWalk(task)}
                className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                Start Walk
              </button>
            )}

          {activeTab === "mine" &&
            task.type === "task" &&
            !completed && (
              <button
                type="button"
                onClick={() =>
                  onComplete(
                    task.id || task._id
                  )
                }
                className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Complete
              </button>
            )}

          {completed && (
            <p className="mt-3 text-xs font-bold text-emerald-600">
              ✓ Completed
            </p>
          )}

          {activeTab === "given" &&
            task.progress && (
              <p className="mt-3 text-xs font-semibold text-slate-500">
                {task.progress}
              </p>
            )}

          {activeTab === "given" &&
            task.status &&
            !task.progress && (
              <p className="mt-3 text-xs font-semibold text-slate-500">
                {task.status}
              </p>
            )}
        </div>
      </div>
    </div>
  );
}