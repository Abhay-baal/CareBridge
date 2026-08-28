"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { createSOS } from "@/services/emergencyEventService";

export default function FloatingActionButton() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSOS = async () => {
    try {
      setSending(true);
      setConfirmOpen(false);

      let location = {};

      if (typeof navigator !== "undefined" && navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 10000,
              }
            );
          });

          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch {
          // SOS still works if location permission is unavailable.
        }
      }

      const response = await createSOS({
        ...location,
        message: "Emergency SOS triggered from dashboard",
      });

      if (response.data?.success) {
        toast.success("SOS sent successfully!");
      } else {
        throw new Error(
          response.data?.message || "Unable to send SOS"
        );
      }
    } catch (error) {
      console.error("SOS error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to send SOS. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={sending}
        aria-label="Emergency SOS"
        className="motion-press fixed bottom-20 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-xl ring-4 ring-red-100 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="text-sm font-extrabold">
          SOS
        </span>
      </button>

      <ConfirmationDialog
        open={confirmOpen}
        title="Send Emergency SOS?"
        message="This will immediately create an emergency alert for your connected parent or child. Your location will be shared if permission is available."
        confirmText="Send SOS"
        cancelText="Cancel"
        danger
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleSOS}
      />

      <LoadingOverlay
        show={sending}
        message="Sending emergency SOS..."
      />
    </>
  );
}
