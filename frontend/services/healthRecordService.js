import api from "./api";

export const getHealthRecords = async () => {
  const response = await api.get("/health-records");
  return response.data;
};

export const uploadHealthRecord = async (formData) => {
  const response = await api.post(
    "/health-records",
    formData
  );

  return response.data;
};

export const deleteHealthRecord = async (id) => {
  const response = await api.delete(
    `/health-records/${id}`
  );

  return response.data;
};
