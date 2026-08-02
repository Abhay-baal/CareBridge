import api from "./api";

export const getParents = async () => {
  const response = await api.get("/parent-child");
  return response.data;
};

export const connectParent = async (connectionCode) => {
  const response = await api.post("/parent-child/connect", {
    connectionCode,
  });
  return response.data;
};

export const removeParent = async (relationshipId) => {
  const response = await api.delete(
    `/parent-child/${relationshipId}`
  );
  return response.data;
};

export const switchActiveParent = async (relationshipId) => {
  const response = await api.patch(
    `/parent-child/active/${relationshipId}`
  );
  return response.data;
};
