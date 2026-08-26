import api from "./api";

export const getCarePlans = async () => {
  const response = await api.get("/care-plans");

  return response.data;
};

export const createCarePlan = async (data) => {
  const response = await api.post(
    "/care-plans",
    data
  );

  return response.data;
};

export const updateCarePlan = async (
  id,
  data
) => {
  const response = await api.put(
    `/care-plans/${id}`,
    data
  );

  return response.data;
};

export const deleteCarePlan = async (id) => {
  const response = await api.delete(
    `/care-plans/${id}`
  );

  return response.data;
};
