import api from "./api";

export const getCaregivers = async () => {
  const response = await api.get("/providers");
  return response.data;
};

export const getCaregiverById = async (id) => {
  const response = await api.get(`/providers/${id}`);
  return response.data;
};
