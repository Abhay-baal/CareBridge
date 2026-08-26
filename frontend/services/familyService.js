import api from "./api";

export const getMyFamily = async () => {
  const response = await api.get("/family/me");
  return response.data;
};

export const createFamily = async (position = null) => {
  const response = await api.post("/family/create", {
    ...(position ? { position } : {}),
  });

  return response.data;
};

export const joinFamily = async (familyCode, position = null) => {
  const response = await api.post("/family/join", {
    familyCode,
    ...(position ? { position } : {}),
  });

  return response.data;
};
