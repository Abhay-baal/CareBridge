import AppLayout from "@/components/layout/AppLayout";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import DashboardCard from "@/components/dashboard/DashboardCard";

export default function DashboardPage() {
  return (
    <AppLayout>
      <WelcomeHeader name="Abhybir" />

      <div className="space-y-4">
        <DashboardCard
          title="Today's Tasks"
          value="4 Tasks"
          icon="✅"
        />

        <DashboardCard
          title="Appointments"
          value="Today 3:30 PM"
          icon="📅"
        />

        <DashboardCard
          title="Health Records"
          value="View Records"
          icon="📋"
        />
      </div>
    </AppLayout>
  );
}