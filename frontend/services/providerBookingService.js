import api from "./api";

export const getProviderBookings = async () => {
  const response = await api.get("/bookings");
  return response.data;
};

export const updateBookingStatus = async (bookingId, status) => {
  const response = await api.patch(`/bookings/${bookingId}/status`, {
    status,
  });

  return response.data;
};

export const getProviderProfile = async () => {
  const response = await api.get("/providers/me");
  return response.data;
};

export const updateProviderAvailability = async (availability) => {
  const response = await api.patch("/providers/availability", {
    availability,
  });

  return response.data;
};
