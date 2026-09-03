import api from "./api";

const ownerHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem(
      "ownerToken"
    )}`,
  },
});

export const loginOwner = async (credentials) => {
  const response = await api.post(
    "/owner/login",
    credentials
  );

  return response.data;
};

export const verifyOwnerKey = async (accessKey) => {
  const response = await api.post(
    "/owner/verify-key",
    {
      accessKey,
    }
  );

  return response.data;
};

export const getOwnerStats = async () => {
  const response = await api.get(
    "/owner/stats",
    ownerHeaders()
  );

  return response.data;
};

export const getOwnerOverview = async () => {
  const response = await api.get(
    "/owner/overview",
    ownerHeaders()
  );

  return response.data;
};

export const getOwnerUsers = async (
  params = {}
) => {
  const response = await api.get(
    "/owner/users",
    {
      ...ownerHeaders(),
      params,
    }
  );

  return response.data;
};

export const getOwnerAnalytics = async (
  days = 30
) => {
  const response = await api.get(
    "/owner/analytics",
    {
      ...ownerHeaders(),
      params: { days },
    }
  );

  return response.data;
};

export const getOwnerCalendar = async (
  date
) => {
  const response = await api.get(
    "/owner/calendar",
    {
      ...ownerHeaders(),
      params: { date },
    }
  );

  return response.data;
};

export const getOwnerSupport = async (
  params = {}
) => {
  const response = await api.get(
    "/owner/support",
    {
      ...ownerHeaders(),
      params,
    }
  );

  return response.data;
};

export const updateOwnerSupport = async (
  id,
  payload
) => {
  const response = await api.patch(
    `/owner/support/${id}`,
    payload,
    ownerHeaders()
  );

  return response.data;
};

export const replyToOwnerSupport = async (
  id,
  reply
) => {
  const response = await api.post(
    `/owner/support/${id}/reply`,
    { reply },
    ownerHeaders()
  );

  return response.data;
};

export const getOwnerNews = async () => {
  const response = await api.get(
    "/owner/news",
    ownerHeaders()
  );

  return response.data;
};

export const createOwnerNews = async (
  payload
) => {
  const response = await api.post(
    "/owner/news",
    payload,
    ownerHeaders()
  );

  return response.data;
};

export const updateOwnerNews = async (
  id,
  payload
) => {
  const response = await api.patch(
    `/owner/news/${id}`,
    payload,
    ownerHeaders()
  );

  return response.data;
};

export const deleteOwnerNews = async (
  id
) => {
  const response = await api.delete(
    `/owner/news/${id}`,
    ownerHeaders()
  );

  return response.data;
};
