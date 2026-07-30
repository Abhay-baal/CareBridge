import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/common/PageHeader";
import EmergencyContactCard from "@/components/emergency/EmergencyContactCard";

export default function EmergencyContactsPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Emergency Contacts"
        subtitle="Quickly reach trusted contacts."
      />

      <div className="space-y-4">
        <EmergencyContactCard
          name="Abhay Singh"
          relation="Son"
          phone="9876543210"
        />

        <EmergencyContactCard
          name="Dr Sharma"
          relation="Doctor"
          phone="9876543211"
        />

        <EmergencyContactCard
          name="Raj Kumar"
          relation="Neighbour"
          phone="9876543212"
        />
      </div>
    </AppLayout>
  );
}
