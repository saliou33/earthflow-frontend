import axios from "axios";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!rawApiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined! Please check your .env file.");
}

const API_URL = rawApiUrl.endsWith("/") ? rawApiUrl : `${rawApiUrl}/`;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for handling 401s if needed
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Optional: Handle unauthorized globally (e.g. redirect to login)
    }
    return Promise.reject(error);
  }
);
