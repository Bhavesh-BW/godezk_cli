import axios, { AxiosInstance, AxiosError, AxiosResponse } from "axios";
import { getServer, getToken, getOrgId, clearSession } from "../config/config";

let _client: AxiosInstance | null = null;

function buildClient(): AxiosInstance {
  const serverUrl = getServer();
  if (!serverUrl) {
    throw new Error(
      "Server URL not configured. Run: gdk config set server <url>"
    );
  }

  const instance = axios.create({
    baseURL: serverUrl,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  instance.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const orgId = getOrgId();
    if (orgId) {
      config.headers["x-org-id"] = orgId;
    }

    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        clearSession();
        return Promise.reject(
          new Error("Session expired or invalid. Please log in again.")
        );
      }
      
      if (!error.response) {
        return Promise.reject(new Error("Cannot connect to GoDezk server."));
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

function getClient(): AxiosInstance {
  if (!_client) {
    _client = buildClient();
  }
  return _client;
}

// Lazy wrapper that defers axios creation until first request
const client = {
  get<T = unknown>(url: string, config?: object): Promise<AxiosResponse<T>> {
    return getClient().get<T>(url, config);
  },
  post<T = unknown>(
    url: string,
    data?: object,
    config?: object
  ): Promise<AxiosResponse<T>> {
    return getClient().post<T>(url, data, config);
  },
  put<T = unknown>(
    url: string,
    data?: object,
    config?: object
  ): Promise<AxiosResponse<T>> {
    return getClient().put<T>(url, data, config);
  },
  patch<T = unknown>(
    url: string,
    data?: object,
    config?: object
  ): Promise<AxiosResponse<T>> {
    return getClient().patch<T>(url, data, config);
  },
  delete<T = unknown>(url: string, config?: object): Promise<AxiosResponse<T>> {
    return getClient().delete<T>(url, config);
  },
};

export default client;
