import api from "./api";

export const createSOS = (data = {}) =>
  api.post(
    "/emergency-events/sos",
    data
  );

export const getEmergencyHistory = () =>
  api.get(
    "/emergency-events/history"
  );

export const acknowledgeEmergency = (
  id
) =>
  api.patch(
    `/emergency-events/${id}/acknowledge`
  );

export const resolveEmergency = (
  id
) =>
  api.patch(
    `/emergency-events/${id}/resolve`
  );
