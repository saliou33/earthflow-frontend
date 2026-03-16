import { createAuthClient } from "better-auth/react";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!rawApiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in auth-client! Please check your .env file.");
}

const API_URL = rawApiUrl.endsWith("/") ? rawApiUrl.slice(0, -1) : rawApiUrl;

export const authClient = createAuthClient({
    baseURL: API_URL
});
