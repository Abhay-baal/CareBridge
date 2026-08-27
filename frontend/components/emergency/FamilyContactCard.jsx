import { Phone } from "lucide-react";

const getRelation = (member, position) => {
  if (position === "father") return "Father";
  if (position === "mother") return "Mother";
  return member?.role === "parent" ? "Parent" : "Child";
};

export default function FamilyContactCard({ member, position }) {
  const phone = member?.phone || "";

  return (
    <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-5 shadow-[0_10px_24px_rgba(251,113,133,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-lg shadow-sm">
              {member?.role === "child" ? "🧒" : "👨‍👩‍👧"}
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-semibold text-gray-900">
                {member?.fullName || "Family member"}
              </h3>
              <p className="text-sm text-gray-500">
                {getRelation(member, position)}
              </p>
            </div>
          </div>

          {phone && (
            <a
              href={`tel:${phone}`}
              className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-700 transition hover:text-green-700"
            >
              <Phone size={16} className="text-green-600" />
              <span>{phone}</span>
            </a>
          )}
        </div>

        {phone && (
          <a
            href={`tel:${phone}`}
            aria-label={`Call ${member?.fullName || "family member"}`}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-200 active:scale-95"
          >
            <Phone size={16} />
            Call
          </a>
        )}
      </div>
    </div>
  );
}
