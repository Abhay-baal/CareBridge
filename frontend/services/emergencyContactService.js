import api from "./api";

export const getEmergencyContacts = () =>
  api.get("/emergency");

export const createEmergencyContact = (
  data
) =>
  api.post("/emergency", data);

export const updateEmergencyContact = (
  id,
  data
) =>
  api.put(`/emergency/${id}`, data);

export const deleteEmergencyContact = (
  id
) =>
  api.delete(`/emergency/${id}`);
