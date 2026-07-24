import api from "./api";

export const getParentProfile = async () => {
  const response = await api.get("/parents");
  return response.data;
};