import api from "./api";

export const loginOwner = async (credentials) => {
  const response = await api.post("/owner/login", credentials);
  return response.data;
};

export const verifyOwnerKey = async (accessKey) => {
  const response = await api.post("/owner/verify-key", { accessKey });
  return response.data;
};

export const getOwnerStats = async () => {
  const response = await api.get("/owner/stats", {
    headers: { Authorization: `Bearer ${localStorage.getItem("ownerToken")}` },
  });
  return response.data;
};