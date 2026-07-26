import api from "./api";

export const getAppointments = async () => {
  const response = await api.get("/appointments");
  return response.data;
};