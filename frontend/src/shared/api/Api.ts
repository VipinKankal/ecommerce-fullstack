import axios from "axios";

const BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8080"
).replace(/\/+$/, "");

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-CSRF-Token",
  headers: {
    "Content-Type": "application/json",
  },
});

export const publicApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-CSRF-Token",
  headers: {
    "Content-Type": "application/json",
  },
});

export const getAuthRole = () => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("auth_role");
};

export const setAuthToken = (
  token?: string | null,
  role?: "seller" | "customer" | "admin" | "courier" | null,
) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("auth_jwt", token);
      if (role) {
        sessionStorage.setItem("auth_role", role);
      }
    }
    return;
  }

  delete api.defaults.headers.common.Authorization;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("auth_jwt");
    sessionStorage.removeItem("auth_role");
  }
};

if (typeof window !== "undefined") {
  const existingToken = sessionStorage.getItem("auth_jwt");
  if (existingToken) {
    setAuthToken(existingToken);
  }
}

