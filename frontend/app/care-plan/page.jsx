"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";

import {
  getCarePlans,
  createCarePlan,
  updateCarePlan,
  deleteCarePlan,
} from "@/services/carePlanService";

import {
  getParentChildRelationships,
  getFamilyMembers,
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
    emoji: "🙂",
  },
  {
    id: "medium",
    label: "Medium",
    duration: 10,
    display: "10 min",
    emoji: "🚶",
  },
  {
    id: "hard",
    label: "Hard",
    duration: 15,
    display: "15 min",
    emoji: "💪",
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
  /*
   * No specific time.
   */
  if (
    !value ||
    value === "none" ||
    value === "no-time"
  ) {
    return null;
  }

  const now = new Date();

  const [day, time] =
    value.split("|");

  if (!day || !time) {
    return null;
  }

  const [hours, minutes] =
    time
      .split(":")
      .map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return null;
  }

  const dueDate =
    new Date(now);

  if (
    day === "tomorrow"
  ) {
    dueDate.setDate(
      dueDate.getDate() + 1
    );
  }

  dueDate.setHours(
    hours,
    minutes,
    0,
    0
  );

  return dueDate.toISOString();
}


function getUserId(value) {
  if (!value) return null;

  if (typeof value === "string") {
    return value;
  }

  return (
    value._id ||
    value.id ||
    null
  )?.toString();
}

function getUserName(value) {
  if (!value) return "Family";

  if (typeof value === "string") {
    return "Family";
  }

  return (
    value.fullName ||
    value.name ||
    "Family"
  );
}

function normalizeCarePlan(
  plan,
  currentUserId
) {
  const isWalk =
    plan.careType === "walk" ||
    plan.description?.startsWith(
      "Care activity:"
    );

  /*
   * ----------------------------------------------------------
   * UNIVERSAL CARE IDENTITIES
   * ----------------------------------------------------------
   *
   * New CarePlan records contain:
   *
   *   createdBy      = actual sender
   *   recipient      = actual recipient
   *   recipientRole  = recipient role
   *
   * This supports:
   *
   *   Parent -> Parent
   *   Parent -> Child
   *   Child  -> Parent
   *   Child  -> Child
   *
   * Use these fields FIRST.
   */

  const senderUser =
    plan.createdBy || null;

  const recipientUser =
    plan.recipient || null;

  const senderId =
    getUserId(senderUser);

  const recipientId =
    getUserId(recipientUser);

  const senderRole =
    senderUser?.role ||
    (
      senderId ===
      getUserId(plan.child)
        ? "child"
        : "parent"
    );

  const recipientRole =
    plan.recipientRole ||
    recipientUser?.role ||
    (
      recipientId ===
      getUserId(plan.child)
        ? "child"
        : "parent"
    );

  const getRoleLabel = (role) =>
    role === "child"
      ? "Child"
      : "Parent";

  const getRoleEmoji = (role) =>
    role === "child"
      ? "👦"
      : "👨";

  /*
   * New universal sender.
   *
   * If populated, use the actual User.
   */
  const sender = {
    id:
      senderId ||
      null,

    name:
      getUserName(
        senderUser
      ),

    role:
      getRoleLabel(
        senderRole
      ),

    emoji:
      getRoleEmoji(
        senderRole
      ),
  };

  /*
   * New universal recipient.
   */
  const recipient = {
    id:
      recipientId ||
      null,

    name:
      getUserName(
        recipientUser
      ),

    role:
      getRoleLabel(
        recipientRole
      ),

    emoji:
      getRoleEmoji(
        recipientRole
      ),
  };

  /*
   * ----------------------------------------------------------
   * LEGACY FALLBACK
   * ----------------------------------------------------------
   *
   * Existing CarePlans may not have createdBy/recipient
   * populated in the new format.
   *
   * Preserve support for those records.
   */
  const hasUniversalIdentity =
    Boolean(
      senderId &&
      recipientId
    );

  let finalSender =
    sender;

  let finalRecipient =
    recipient;

  if (
    !hasUniversalIdentity
  ) {
    const childId =
      getUserId(plan.child);

    const parentUserId =
      getUserId(
        plan.parent?.user
      );

    if (
      childId ||
      parentUserId
    ) {
      if (
        senderId ===
        childId
      ) {
        finalSender = {
          id:
            childId,

          name:
            getUserName(
              plan.child
            ),

          role:
            "Child",

          emoji:
            "👦",
        };

        finalRecipient = {
          id:
            parentUserId,

          name:
            getUserName(
              plan.parent?.user
            ),

          role:
            "Parent",

          emoji:
            "👨",
        };
      } else {
        finalSender = {
          id:
            parentUserId,

          name:
            getUserName(
              plan.parent?.user
            ),

          role:
            "Parent",

          emoji:
            "👨",
        };

        finalRecipient = {
          id:
            childId,

          name:
            getUserName(
              plan.child
            ),

          role:
            "Child",

          emoji:
            "👦",
        };
      }
    }
  }

  const isGivenByMe =
    senderId ===
    currentUserId;

  return {
    ...plan,

    id:
      plan._id ||
      plan.id,

    type:
      isWalk
        ? "walk"
        : "task",

    duration:
      plan.walkDuration,

    level:
      WALK_LEVELS.find(
        (level) =>
          level.id ===
          plan.walkLevel
      )?.label ||
      plan.walkLevel,

    levelEmoji:
      WALK_LEVELS.find(
        (level) =>
          level.id ===
          plan.walkLevel
      )?.emoji,

    senderId,

    sender:
      finalSender,

    recipient:
      finalRecipient,

    isGivenByMe,

    isGivenToMe:
      finalRecipient.id ===
      currentUserId,

    time:
      plan.dueDate
        ? new Date(
            plan.dueDate
          ).toLocaleString(
            [],
            {
              dateStyle:
                "medium",

              timeStyle:
                "short",
            }
          )
        : "No due date",
  };
}

function formatTime(seconds) {
  const minutes = Math.floor(
    seconds / 60
  )
    .toString()
    .padStart(2, "0");

  const remaining = (
    seconds % 60
  )
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remaining}`;
}

const TWENTY_FOUR_HOURS_MS =
  24 * 60 * 60 * 1000;

function isWithinLast24Hours(value) {
  if (!value) return true;

  const timestamp = new Date(
    value
  ).getTime();

  if (Number.isNaN(timestamp)) {
    return true;
  }

  return (
    Date.now() - timestamp <=
    TWENTY_FOUR_HOURS_MS
  );
}

function getTaskAgeTimestamp(task) {
  if (!task) return null;

  return (
    task.status === "completed"
      ? task.updatedAt ||
        task.createdAt ||
        task.dueDate
      : task.createdAt ||
        task.dueDate
  );
}

export default function CarePlanPage() {
  const pathname = usePathname();

  const isChild =
    pathname?.startsWith(
      "/child"
    );

  const PageLayout = isChild
    ? ChildCareLayout
    : AppLayout;

  const [screen, setScreen] =
    useState("home");

  const [activeTab, setActiveTab] =
    useState("all");

  const [currentUserId] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken");

      if (!token) return null;

      const payload = JSON.parse(
        atob(token.split(".")[1])
      );

      return (
        payload.id ||
        payload.userId ||
        payload._id ||
        payload.sub ||
        ""
      ).toString();
    } catch (error) {
      console.error(
        "Unable to read current user:",
        error
      );

      return null;
    }
  });

  const [givenTasks, setGivenTasks] =
    useState([]);

  const [relationships, setRelationships] =
    useState([]);

  const [
    loadingRelationships,
    setLoadingRelationships,
  ] = useState(true);

  const [taskTitle, setTaskTitle] =
    useState("");

  const [
    selectedRecipients,
    setSelectedRecipients,
  ] = useState([]);

  const [taskTime, setTaskTime] =
    useState("none");

  const [
    selectedWalkLevel,
    setSelectedWalkLevel,
  ] = useState("medium");

  const [
    timerSeconds,
    setTimerSeconds,
  ] = useState(0);

  const [
    timerRunning,
    setTimerRunning,
  ] = useState(false);

  const [
    timerFinished,
    setTimerFinished,
  ] = useState(false);

  const [
    activeWalk,
    setActiveWalk,
  ] = useState(null);

  // ----------------------------------------------------------
  // Load relationships + FAMILY-WIDE care plans.
  // ----------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoadingRelationships(
          true
        );

        const [
          familyMembersResponse,
          carePlanResponse,
        ] = await Promise.all([
          getFamilyMembers(),
          getCarePlans(),
        ]);

        if (cancelled) return;

        const familyMembers =
          familyMembersResponse?.data ||
          [];

        /*
         * Keep the existing relationships state available for
         * legacy UI, but use the universal family member list
         * for Care assignment.
         */
        setRelationships(
          familyMembers
        );

        const rawPlans =
          carePlanResponse?.data ||
          [];

        const normalized =
          rawPlans.map((plan) =>
            normalizeCarePlan(
              plan,
              currentUserId
            )
          );

        setGivenTasks(
          normalized
        );
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Failed to load care data:",
          error
        );

        toast.error(
          error.response?.data
            ?.message ||
            "Unable to load care data."
        );

        setRelationships([]);
        setGivenTasks([]);
      } finally {
        if (!cancelled) {
          setLoadingRelationships(
            false
          );
        }
      }
    };

    if (currentUserId) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [
    currentUserId,
    isChild,
  ]);

  /*
   * UNIVERSAL CARE RECIPIENTS
   *
   * Every member of the current family can receive Care.
   *
   * Parent -> Parent
   * Parent -> Child
   * Child  -> Parent
   * Child  -> Child
   *
   * The current user is excluded by the backend.
   */
  const recipients = useMemo(() => {
    return relationships
      .filter(
        (person) =>
          person?._id &&
          person?._id !== currentUserId
      )
      .map(
        (person) => ({
          id: person._id.toString(),

          name:
            person.fullName ||
            person.name ||
            "Family",

          email:
            person.email ||
            "",

          emoji:
            person.role ===
            "parent"
              ? "👨"
              : "👦",

          role:
            person.role ===
            "parent"
              ? "Parent"
              : "Child",
        })
      );
  }, [
    relationships,
    currentUserId,
  ]);

  const freshTasks = useMemo(() => {
    return givenTasks.filter(
      (task) =>
        isWithinLast24Hours(
          getTaskAgeTimestamp(task)
        )
    );
  }, [givenTasks]);

  const visibleTasks = useMemo(() => {
    if (activeTab === "mine") {
      return freshTasks.filter(
        (task) =>
          task.isGivenToMe
      );
    }

    if (activeTab === "given") {
      return freshTasks.filter(
        (task) =>
          task.isGivenByMe
      );
    }

    return freshTasks;
  }, [
    freshTasks,
    activeTab,
  ]);

  const completedTasksToClear =
    useMemo(() => {
      return visibleTasks.filter(
        (task) =>
          task.isGivenToMe &&
          task.status ===
            "completed"
      );
    }, [visibleTasks]);

  const currentWalkLevel =
    useMemo(
      () =>
        WALK_LEVELS.find(
          (level) =>
            level.id ===
            selectedWalkLevel
        ) ||
        WALK_LEVELS[2],
      [selectedWalkLevel]
    );

  // ----------------------------------------------------------
  // Timer
  // ----------------------------------------------------------
  useEffect(() => {
    if (!timerRunning) {
      return;
    }

    const timer =
      setInterval(() => {
        setTimerSeconds(
          (current) => {
            if (current <= 1) {
              clearInterval(
                timer
              );

              setTimerRunning(
                false
              );

              setTimerFinished(
                true
              );

              return 0;
            }

            return current - 1;
          }
        );
      }, 1000);

    return () =>
      clearInterval(timer);
  }, [timerRunning]);

  const reloadCare = async () => {
    try {
      const response =
        await getCarePlans();

      const normalized =
        (
          response?.data ||
          []
        ).map((plan) =>
          normalizeCarePlan(
            plan,
            currentUserId
          )
        );

      setGivenTasks(
        normalized
      );
    } catch (error) {
      console.error(
        "Reload care error:",
        error
      );
    }
  };

  const clearCompletedTasks = async () => {
    const idsToClear =
      visibleTasks
        .filter(
          (task) =>
            task.isGivenToMe &&
            task.status ===
              "completed"
        )
        .map(
          (task) =>
            task.id ||
            task._id
        )
        .filter(Boolean);

    if (
      idsToClear.length ===
      0
    ) {
      return;
    }

    try {
      await Promise.all(
        idsToClear.map(
          (id) =>
            deleteCarePlan(id)
        )
      );

      await reloadCare();

      toast.success(
        "Completed tasks cleared ✨"
      );
    } catch (error) {
      console.error(
        "Clear completed tasks error:",
        error
      );

      toast.error(
        error.response?.data
          ?.message ||
          "Unable to clear completed tasks."
      );
    }
  };

  const toggleRecipient = (
    id
  ) => {
    setSelectedRecipients(
      (current) =>
        current.includes(id)
          ? current.filter(
              (item) =>
                item !== id
            )
          : [
              ...current,
              id,
            ]
    );
  };

  const resetComposer = () => {
    setTaskTitle("");
    setSelectedRecipients(
      []
    );
    setTaskTime(
      "none"
    );
    setSelectedWalkLevel(
      "medium"
    );
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
    setTimerFinished(false);
    setScreen("home");
  };

  // ----------------------------------------------------------
  // Parent -> Child
  // Child -> Parent
  // ----------------------------------------------------------
  const assignTask = async () => {
    if (
      !taskTitle.trim() ||
      selectedRecipients.length === 0
    ) {
      return;
    }

    try {
      await Promise.all(
        selectedRecipients.map(
          (recipientId) =>
            createCarePlan({
              title:
                taskTitle.trim(),

              description: "",

              /*
               * Universal recipient.
               *
               * Works for:
               * Parent -> Parent
               * Parent -> Child
               * Child  -> Parent
               * Child  -> Child
               */
              recipientId,

              dueDate:
                getDueDate(
                  taskTime
                ),

              careType:
                "task",
            })
        )
      );

      toast.success(
        "Care task assigned ❤️"
      );

      await reloadCare();

      setActiveTab("given");

      setScreen("home");

      resetComposer();
    } catch (error) {
      console.error(
        "Assign care task error:",
        error
      );

      toast.error(
        error.response?.data
          ?.message ||
          "Unable to assign care task."
      );
    }
  };

  const assignWalk = async () => {
    if (
      selectedRecipients.length === 0
    ) {
      return;
    }

    try {
      await Promise.all(
        selectedRecipients.map(
          (recipientId) =>
            createCarePlan({
              title:
                `Walk for ${currentWalkLevel.display}`,

              description:
                `Care activity: ${currentWalkLevel.label} walk`,

              /*
               * Universal recipient.
               */
              recipientId,

              dueDate:
                getDueDate(
                  taskTime
                ),

              careType:
                "walk",

              walkLevel:
                currentWalkLevel.id,

              walkDuration:
                currentWalkLevel.duration,
            })
        )
      );

      toast.success(
        "Walk care assigned ❤️"
      );

      await reloadCare();

      setActiveTab("given");

      setScreen("home");

      resetComposer();
    } catch (error) {
      console.error(
        "Assign walk error:",
        error
      );

      toast.error(
        error.response?.data
          ?.message ||
          "Unable to assign walk."
      );
    }
  };

  // ----------------------------------------------------------
  // Complete
  // ----------------------------------------------------------
  const completeTask = async (
    id
  ) => {
    try {
      await updateCarePlan(
        id,
        {
          status:
            "completed",
        }
      );

      await reloadCare();

      toast.success(
        "Care task completed"
      );
    } catch (error) {
      console.error(
        "Complete care task error:",
        error
      );

      toast.error(
        error.response?.data
          ?.message ||
          "Unable to complete care task."
      );
    }
  };

  const deleteTask = async (id) => {
    try {
      await deleteCarePlan(id);

      await reloadCare();

      toast.success(
        "Task deleted 💫"
      );
    } catch (error) {
      console.error(
        "Delete care task error:",
        error
      );

      toast.error(
        error.response?.data
          ?.message ||
          "Unable to delete care task."
      );
    }
  };

  // ----------------------------------------------------------
  // Walk timer
  // ----------------------------------------------------------
  const startWalk = (
    walk
  ) => {
    const durationSeconds =
      Math.max(
        60,
        (walk.duration ||
          10) * 60
      );

    setActiveWalk(
      walk
    );

    setTimerSeconds(
      durationSeconds
    );

    setTimerFinished(
      false
    );

    setTimerRunning(
      true
    );

    setScreen("timer");
  };

  const startSelectedWalk = (
    level =
      currentWalkLevel
  ) => {
    const walk = {
      type: "walk",

      title: `${level.display} walk`,

      level:
        level.label,

      levelEmoji:
        level.emoji,

      duration:
        level.duration,
    };

    startWalk(walk);
  };

  const restartWalk = () => {
    if (!activeWalk) {
      return;
    }

    setTimerSeconds(
      Math.max(
        60,
        (activeWalk.duration ||
          10) * 60
      )
    );

    setTimerFinished(
      false
    );

    setTimerRunning(
      true
    );
  };

  const progress =
    activeWalk &&
    activeWalk.duration
      ? Math.min(
          100,
          Math.max(
            0,
            (
              (
                activeWalk.duration *
                  60 -
                timerSeconds
              ) /
                (
                  activeWalk.duration *
                  60
                )
            ) *
              100
          )
        )
      : 0;

  // ==========================================================
  // GIVE CARE CHOICE
  // ==========================================================
  if (screen === "give") {
    return (
      <PageLayout>
        <div className="mx-auto w-full max-w-2xl">
          <PageBackButton
            onClick={
              goHome
            }
            label="Care"
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
              onClick={
                openTask
              }
            />

            <ActionChoice
              emoji="🚶"
              title="Walk"
              description="Give someone a walking goal"
              onClick={
                openWalk
              }
            />
          </div>
        </div>
      </PageLayout>
    );
  }

  // ==========================================================
  // TASK COMPOSER
  // ==========================================================
  if (screen === "task") {
    return (
      <PageLayout>
        <div className="mx-auto w-full max-w-2xl">
          <PageBackButton
            onClick={
              goHome
            }
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
              value={
                taskTitle
              }
              onChange={(
                event
              ) =>
                setTaskTitle(
                  event.target
                    .value
                )
              }
              placeholder="e.g. Finish your homework"
              className="mt-2 w-full rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-rose-200 focus:bg-white"
            />

            <label className="mt-6 block text-sm font-semibold text-slate-700">
              Give to
            </label>

            <div className="mt-2 space-y-2">
              {loadingRelationships ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400">
                  Loading family members...
                </p>
              ) : recipients.length ===
                0 ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400">
                  No connected family members found.
                </p>
              ) : (
                recipients.map(
                  (
                    person
                  ) => (
                    <RecipientRow
                      key={
                        person.id
                      }
                      person={
                        person
                      }
                      selected={selectedRecipients.includes(
                        person.id
                      )}
                      onClick={() =>
                        toggleRecipient(
                          person.id
                        )
                      }
                    />
                  )
                )
              )}
            </div>

            <label className="mt-6 block text-sm font-semibold text-slate-700">
              When?
            </label>

            <select
              value={
                taskTime === "none"
                  ? "none"
                  : "specific"
              }
              onChange={(event) => {
                if (
                  event.target.value ===
                  "none"
                ) {
                  setTaskTime("none");
                  return;
                }

                setTaskTime(
                  "today|19:00"
                );
              }}
              className="mt-2 w-full rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3.5 text-sm text-slate-900 outline-none focus:border-rose-200"
            >
              <option value="none">
                No specific time
              </option>

              <option value="specific">
                Specific time
              </option>
            </select>

            {taskTime !== "none" && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500">
                    Hour
                  </label>

                  <select
                    value={
                      taskTime.split("|")[1]?.split(":")[0] ||
                      "19"
                    }
                    onChange={(event) => {
                      const parts =
                        taskTime.split("|");

                      const day =
                        parts[0] ||
                        "today";

                      const currentTime =
                        parts[1] ||
                        "19:00";

                      const minutes =
                        currentTime.split(":")[1] ||
                        "00";

                      setTaskTime(
                        `${day}|${event.target.value}:${minutes}`
                      );
                    }}
                    className="mt-1 w-full rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3.5 text-sm text-slate-900 outline-none focus:border-rose-200"
                  >
                    {Array.from(
                      { length: 24 },
                      (_, hour) => (
                        <option
                          key={hour}
                          value={String(hour).padStart(2, "0")}
                        >
                          {String(hour).padStart(2, "0")}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500">
                    Minute
                  </label>

                  <select
                    value={
                      taskTime.split("|")[1]?.split(":")[1] ||
                      "00"
                    }
                    onChange={(event) => {
                      const parts =
                        taskTime.split("|");

                      const day =
                        parts[0] ||
                        "today";

                      const currentTime =
                        parts[1] ||
                        "19:00";

                      const hour =
                        currentTime.split(":")[0] ||
                        "19";

                      setTaskTime(
                        `${day}|${hour}:${event.target.value}`
                      );
                    }}
                    className="mt-1 w-full rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3.5 text-sm text-slate-900 outline-none focus:border-rose-200"
                  >
                    {Array.from(
                      { length: 60 },
                      (_, minute) => (
                        <option
                          key={minute}
                          value={String(minute).padStart(2, "0")}
                        >
                          {String(minute).padStart(2, "0")}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            )}

            {taskTime !== "none" && (
              <select
                value={
                  taskTime.split("|")[0] ||
                  "today"
                }
                onChange={(event) => {
                  const parts =
                    taskTime.split("|");

                  const time =
                    parts[1] ||
                    "19:00";

                  setTaskTime(
                    `${event.target.value}|${time}`
                  );
                }}
                className="mt-3 w-full rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3.5 text-sm text-slate-900 outline-none focus:border-rose-200"
              >
                <option value="today">
                  Today
                </option>

                <option value="tomorrow">
                  Tomorrow
                </option>
              </select>
            )}
          </div>

          <button
            type="button"
            onClick={
              assignTask
            }
            disabled={
              !taskTitle.trim() ||
              selectedRecipients.length ===
                0
            }
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-lg">
              ❤️
            </span>

            Assign Care
          </button>
        </div>
      </PageLayout>
    );
  }

  // ==========================================================
  // WALK COMPOSER
  // ==========================================================
  if (screen === "walk") {
    return (
      <PageLayout>
        <div className="mx-auto w-full max-w-2xl">
          <PageBackButton
            onClick={
              goHome
            }
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
              ) : recipients.length ===
                0 ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400">
                  No connected family members found.
                </p>
              ) : (
                recipients.map(
                  (
                    person
                  ) => (
                    <RecipientRow
                      key={
                        person.id
                      }
                      person={
                        person
                      }
                      selected={selectedRecipients.includes(
                        person.id
                      )}
                      onClick={() =>
                        toggleRecipient(
                          person.id
                        )
                      }
                    />
                  )
                )
              )}
            </div>

            <label className="mt-6 block text-sm font-semibold text-slate-700">
              When?
            </label>

            <select
              value={
                taskTime === "none"
                  ? "none"
                  : "specific"
              }
              onChange={(event) => {
                if (
                  event.target.value ===
                  "none"
                ) {
                  setTaskTime("none");
                  return;
                }

                setTaskTime(
                  "today|19:00"
                );
              }}
              className="mt-2 w-full rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3.5 text-sm text-slate-900 outline-none focus:border-rose-200"
            >
              <option value="none">
                No specific time
              </option>

              <option value="specific">
                Specific time
              </option>
            </select>

            {taskTime !== "none" && (
              <>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500">
                      Hour
                    </label>

                    <select
                      value={
                        taskTime.split("|")[1]?.split(":")[0] ||
                        "19"
                      }
                      onChange={(event) => {
                        const day =
                          taskTime.split("|")[0] ||
                          "today";

                        const current =
                          taskTime.split("|")[1] ||
                          "19:00";

                        const minute =
                          current.split(":")[1] ||
                          "00";

                        setTaskTime(
                          `${day}|${event.target.value}:${minute}`
                        );
                      }}
                      className="mt-1 w-full rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3.5 text-sm text-slate-900 outline-none"
                    >
                      {Array.from(
                        { length: 24 },
                        (_, hour) => (
                          <option
                            key={hour}
                            value={String(hour).padStart(2, "0")}
                          >
                            {String(hour).padStart(2, "0")}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500">
                      Minute
                    </label>

                    <select
                      value={
                        taskTime.split("|")[1]?.split(":")[1] ||
                        "00"
                      }
                      onChange={(event) => {
                        const day =
                          taskTime.split("|")[0] ||
                          "today";

                        const current =
                          taskTime.split("|")[1] ||
                          "19:00";

                        const hour =
                          current.split(":")[0] ||
                          "19";

                        setTaskTime(
                          `${day}|${hour}:${event.target.value}`
                        );
                      }}
                      className="mt-1 w-full rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3.5 text-sm text-slate-900 outline-none"
                    >
                      {Array.from(
                        { length: 60 },
                        (_, minute) => (
                          <option
                            key={minute}
                            value={String(minute).padStart(2, "0")}
                          >
                            {String(minute).padStart(2, "0")}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <select
                  value={
                    taskTime.split("|")[0] ||
                    "today"
                  }
                  onChange={(event) => {
                    const time =
                      taskTime.split("|")[1] ||
                      "19:00";

                    setTaskTime(
                      `${event.target.value}|${time}`
                    );
                  }}
                  className="mt-3 w-full rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3.5 text-sm text-slate-900 outline-none"
                >
                  <option value="today">
                    Today
                  </option>

                  <option value="tomorrow">
                    Tomorrow
                  </option>
                </select>
              </>
            )}

            <label className="mt-6 block text-sm font-semibold text-slate-700">
              Choose walk level
            </label>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {WALK_LEVELS.map(
                (
                  level
                ) => (
                  <WalkLevelCard
                    key={
                      level.id
                    }
                    level={
                      level
                    }
                    selected={
                      selectedWalkLevel ===
                      level.id
                    }
                    onClick={() =>
                      setSelectedWalkLevel(
                        level.id
                      )
                    }
                  />
                )
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={
              assignWalk
            }
            disabled={
              selectedRecipients.length ===
              0
            }
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-lg">
              ❤️
            </span>

            Assign Walk
          </button>
        </div>
      </PageLayout>
    );
  }

  // ==========================================================
  // WALK TIMER
  // ==========================================================
  if (screen === "timer") {
    return (
      <PageLayout>
        <div className="mx-auto w-full max-w-2xl">
          <PageBackButton
            onClick={
              goHome
            }
            label="Care Walk"
          />

          <div className="rounded-[30px] border border-emerald-100 bg-[#fffdfb] p-6 text-center shadow-[0_18px_40px_rgba(16,185,129,0.08)] sm:p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-3xl">
              {activeWalk?.levelEmoji ||
                "🚶"}
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-900">
              {activeWalk?.title ||
                "Care Walk"}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {timerFinished
                ? "Walk complete ❤️"
                : "Take your time and enjoy the walk."}
            </p>

            <div className="mt-8">
              <div className="text-6xl font-bold tracking-tight text-slate-900">
                {formatTime(
                  timerSeconds
                )}
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {timerFinished ? (
                <button
                  type="button"
                  onClick={
                    restartWalk
                  }
                  className="flex-1 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Restart Walk
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setTimerRunning(
                      (
                        current
                      ) =>
                        !current
                    )
                  }
                  className="flex-1 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white hover:bg-slate-800"
                >
                  {timerRunning
                    ? "Pause"
                    : "Resume"}
                </button>
              )}

              <button
                type="button"
                onClick={
                  goHome
                }
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // ==========================================================
  // CARE HOME
  // ==========================================================
  return (
    <PageLayout>
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6">
          <PageBackButton
            onClick={() =>
              window.history.back()
            }
            label="Back"
          />

          <div className="flex items-start gap-3 rounded-[28px] border border-rose-100 bg-[#fffaf7] p-4 shadow-[0_12px_26px_rgba(15,23,42,0.04)]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-200 to-orange-100 text-2xl shadow-inner">
              ❤️
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Care
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Look after your family
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={
            openGiveCare
          }
          className="flex w-full items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-rose-300 via-pink-300 to-orange-200 px-5 py-4 text-sm font-bold text-rose-950 shadow-[0_12px_30px_rgba(251,146,60,0.18)] transition hover:translate-y-[-1px] hover:shadow-[0_16px_36px_rgba(251,146,60,0.22)] active:scale-[0.99]"
        >
          GIVE CARE
          <span className="text-lg">
            ＋
          </span>
        </button>

        <p className="mt-2 text-center text-xs text-slate-500">
          Assign a task or walk to someone in your family.
        </p>

        {/* ====================================================
            THREE FAMILY CARE TABS
        ==================================================== */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-rose-100 bg-[#fffaf7] p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="grid grid-cols-3 gap-1.5">
            <CareTab
              active={
                activeTab ===
                "all"
              }
              onClick={() =>
                setActiveTab(
                  "all"
                )
              }
            >
              All Tasks
            </CareTab>

            <CareTab
              active={
                activeTab ===
                "mine"
              }
              onClick={() =>
                setActiveTab(
                  "mine"
                )
              }
            >
              Given to Me
            </CareTab>

            <CareTab
              active={
                activeTab ===
                "given"
              }
              onClick={() =>
                setActiveTab(
                  "given"
                )
              }
            >
              Given by Me
            </CareTab>
          </div>
        </div>

        {/* ====================================================
            TASK LIST
        ==================================================== */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
              {activeTab ===
              "all"
                ? "All Tasks"
                : activeTab ===
                  "mine"
                ? "Given to Me"
                : "Given by Me"}
            </h2>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {visibleTasks.length}{" "}
                {visibleTasks.length ===
                1
                  ? "activity"
                  : "activities"}
              </span>

              {activeTab === "mine" &&
                completedTasksToClear.length >
                  0 && (
                  <button
                    type="button"
                    onClick={
                      clearCompletedTasks
                    }
                    className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-100"
                  >
                    Clear completed
                  </button>
                )}
            </div>
          </div>

          <div className="space-y-3">
            {visibleTasks.length ===
            0 ? (
              <div className="rounded-[28px] border border-dashed border-rose-200 bg-[#fffaf8] p-6 text-center shadow-sm">
                <div className="text-3xl">
                  ❤️
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No care activities yet
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {activeTab ===
                  "mine"
                    ? "Nothing has been given to you yet."
                    : activeTab ===
                      "given"
                    ? "You have not given any care activities yet."
                    : "Your family's care activities will appear here."}
                </p>
              </div>
            ) : (
              visibleTasks.map(
                (
                  task
                ) => (
                  <CareCard
                    key={
                      task.id ||
                      task._id
                    }
                    task={
                      task
                    }
                    activeTab={
                      activeTab
                    }
                    onComplete={
                      completeTask
                    }
                    onDelete={
                      deleteTask
                    }
                    onStartWalk={
                      startWalk
                    }
                  />
                )
              )
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// ============================================================
// COMPONENTS
// ============================================================

function CareTab({
  active,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`rounded-2xl px-2 py-3 text-xs font-bold transition sm:text-sm ${
        active
          ? "bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-sm"
          : "text-slate-500 hover:bg-white hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function PageBackButton({
  onClick,
  label,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
    >
      <span className="text-lg">
        ←
      </span>

      {label}
    </button>
  );
}

function ChildCareLayout({
  children,
}) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-4 pb-24 pt-5">
      {children}
    </div>
  );
}

function SectionTitle({
  emoji,
  title,
  subtitle,
}) {
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
      onClick={
        onClick
      }
      className="group rounded-[28px] border border-rose-100 bg-[#fffdfc] p-5 text-left shadow-[0_12px_28px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-[0_18px_32px_rgba(15,23,42,0.06)]"
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
      onClick={
        onClick
      }
      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 transition ${
        selected
          ? "border-rose-200 bg-rose-50 ring-2 ring-rose-100"
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
      onClick={
        onClick
      }
      className={`rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-amber-200 bg-amber-50 ring-2 ring-amber-100"
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
  onDelete,
  onStartWalk,
}) {
  const completed =
    task.status ===
    "completed";

  return (
    <div
      className={`rounded-[26px] border p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition sm:p-5 ${
        completed
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-xl">
          {task.type ===
          "walk"
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
                {
                  task.title
                }
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                From{" "}
                {
                  task.sender
                    ?.emoji
                }{" "}
                {
                  task.sender
                    ?.name ||
                  "Family"
                }{" "}
                <span className="mx-1">
                  →
                </span>
                {
                  task.recipient
                    ?.emoji
                }{" "}
                {
                  task.recipient
                    ?.name ||
                  "Family"
                }
              </p>
            </div>

            {task.type ===
              "walk" && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                {
                  task.levelEmoji
                }{" "}
                {
                  task.level
                }
              </span>
            )}
          </div>

          <p className="mt-3 text-xs text-slate-400">
            {task.time}
          </p>

          {!completed &&
            task.isGivenToMe &&
            task.type ===
              "walk" && (
              <button
                type="button"
                onClick={() =>
                  onStartWalk(
                    task
                  )
                }
                className="mt-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 px-4 py-2.5 text-xs font-bold text-slate-900 shadow-sm hover:translate-y-[-1px]"
              >
                Start Walk
              </button>
            )}

          {!completed &&
            task.isGivenToMe &&
            task.type ===
              "task" && (
              <button
                type="button"
                onClick={() =>
                  onComplete(
                    task.id ||
                      task._id
                  )
                }
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
              >
                Complete
              </button>
            )}

          {completed && (
            <p className="mt-3 text-xs font-bold text-emerald-600">
              ✓ Completed
            </p>
          )}

          {activeTab ===
            "given" &&
            !completed && (
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-500">
                  Given to{" "}
                  {
                    task
                      .recipient
                      ?.name
                  }
                </p>

                {task.isGivenByMe && (
                  <button
                    type="button"
                    onClick={() =>
                      onDelete(
                        task.id ||
                          task._id
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 shadow-[0_8px_18px_rgba(251,113,133,0.12)] transition hover:border-rose-300 hover:bg-rose-100"
                    aria-label={`Delete ${task.title}`}
                  >
                    <span aria-hidden="true">
                      🗑️
                    </span>
                    Delete
                  </button>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
