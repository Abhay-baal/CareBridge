import api from "./api";

export const getCarePlans = async () => {
  const response = await api.get("/care-plans");
  return response.data;
};

export const updateCarePlan = async (id, data) => {
  const response = await api.put(`/care-plans/${id}`, data);
  return response.data;
};