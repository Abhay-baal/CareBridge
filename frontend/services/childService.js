import api from "./api";

export const getChildDashboard = async () => {
  const response = await api.get("/child/dashboard");
  return response.data;
};

export const updateChildCarePlan = async (id, status) => {
  const response = await api.put(`/child/care-plans/${id}`, {
    status,
  });

  return response.data;
};

export const getParentLocation = async () => {
  const response = await api.get("/location");
  return response.data;
};
