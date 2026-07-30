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

export const getEmergencyContacts = async () => {
  const response = await api.get("/emergency");
  return response.data;
};

export const createEmergencyContact = async (data) => {
  const response = await api.post("/emergency", data);
  return response.data;
};

export const updateEmergencyContact = async (id, data) => {
  const response = await api.put(`/emergency/${id}`, data);
  return response.data;
};

export const deleteEmergencyContact = async (id) => {
  const response = await api.delete(`/emergency/${id}`);
  return response.data;
};

export const getParentLocation = async () => {
  const response = await api.get("/location");
  return response.data;
};
