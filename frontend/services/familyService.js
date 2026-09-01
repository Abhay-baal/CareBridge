import api from "./api";

export const getMyFamily = async () => {
  const response = await api.get("/family/me");
  return response.data;
};

export const createFamily = async (familyName) => {
  const response = await api.post("/family/create", {
    familyName,
  });

  return response.data;
};

export const joinFamily = async (familyCode) => {
  const response = await api.post("/family/join", {
    familyCode,
  });

  return response.data;
};

export const leaveFamily = async () => {
  const response = await api.post("/family/leave");
  return response.data;
};
