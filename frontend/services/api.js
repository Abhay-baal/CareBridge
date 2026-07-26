import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  console.log("========== API DEBUG ==========");
  console.log("Base URL:", config.baseURL);
  console.log("Request URL:", config.url);
  console.log(
    "Full URL:",
    `${config.baseURL}${config.url}`
  );
  console.log("Token exists:", !!token);
  console.log("===============================");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;