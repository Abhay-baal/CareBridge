const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const getToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
};

const request = async (endpoint, options = {}) => {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/settings${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
        ...(options.headers || {}),
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || "Something went wrong"
    );
  }

  return data;
};

export const getSettings = () =>
  request("");

export const updateProfile = (payload) =>
  request("/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const updateAccount = (payload) =>
  request("/account", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const changePassword = (payload) =>
  request("/password", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const updateNotifications = (payload) =>
  request("/notifications", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const updateAppearance = (appearance) =>
  request("/appearance", {
    method: "PUT",
    body: JSON.stringify({ appearance }),
  });

export const updateLanguage = (language) =>
  request("/language", {
    method: "PUT",
    body: JSON.stringify({ language }),
  });

export const updatePrivacy = (payload) =>
  request("/privacy", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
