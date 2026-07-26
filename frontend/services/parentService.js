import api from "./api";

export const getParentProfile = async () => {
  const response = await api.get("/parents/me");
  return response.data;
};

export const updateParentProfile = async (data) => {
  const response = await api.put("/parents/me", data);
  return response.data;
};
