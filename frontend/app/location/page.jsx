import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/common/PageHeader";
import LocationCard from "@/components/location/LocationCard";

export default function LocationPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Parent Location"
        subtitle="Current location information"
      />

      <LocationCard />
    </AppLayout>
  );
}
