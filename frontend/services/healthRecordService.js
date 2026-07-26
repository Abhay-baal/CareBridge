import api from "./api";

export const getHealthRecords = async () => {
  const response = await api.get("/health-records");
  return response.data;
};
