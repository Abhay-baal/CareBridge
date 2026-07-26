import AppLayout from "@/components/layout/AppLayout";
import ParentProfileForm from "@/components/profile/ParentProfileForm";

export default function ProfilePage() {
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Parent Profile
        </h1>

        <p className="mt-1 text-sm text-gray-600">
          View and update your parent's information.
        </p>
      </div>

      <ParentProfileForm />
    </AppLayout>
  );
}
