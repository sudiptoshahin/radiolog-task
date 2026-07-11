import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LoginUser {
    id: string;
    username: string;
    email: string;
}

interface AuthTokens {
    access: string;
    refresh: string;
}

// Shape of the raw API login/register response
export interface LoginResponse {
    user: LoginUser;
    tokens: AuthTokens;
}

interface UserStore {
    user: LoginUser | null;
    tokens: AuthTokens | null;
    expiresAt: number;
    isLoggedIn: boolean;
    setUser: (data: LoginResponse) => void;
    clearUser: () => void;
}


function getTokenExpiry(token: string): number {
    try {
        const payload = token.split(".")[1];
        // Base64 to string
        const decoded = JSON.parse(atob(payload));
        return typeof decoded.exp === "number" ? decoded.exp * 1000 : 0;
    } catch {
        return 0;
    }
}

// Sets the access_token cookie so middleware (server-side) can read it.
// expiresAtMs is the token's exp claim in milliseconds since epoch.
function setAccessTokenCookie(token: string, expiresAtMs: number) {
    if (typeof document === "undefined") return; // SSR guard

    const expires = expiresAtMs
        ? new Date(expiresAtMs).toUTCString()
        : "";

    document.cookie = `access_token=${token}; path=/; expires=${expires}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

// Clears the access_token cookie.
function clearAccessTokenCookie() {
    if (typeof document === "undefined") return; // SSR guard

    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
}

const useUserStore = create<UserStore>()(
    persist(
        (set) => ({
            user: null,
            tokens: null,
            expiresAt: 0,
            isLoggedIn: false,

            setUser: (data: LoginResponse) => {
                const expiresAt = getTokenExpiry(data.tokens.access);
                setAccessTokenCookie(data.tokens.access, expiresAt);
                set({
                    user: data.user,
                    tokens: data.tokens,
                    expiresAt,
                    isLoggedIn: true,
                });
            },

            clearUser: () => {
                clearAccessTokenCookie();
                set({
                    user: null,
                    tokens: null,
                    expiresAt: 0,
                    isLoggedIn: false,
                });
            },
        }),
        {
            name: "user",
            onRehydrateStorage: () => (state) => {
                if (state?.expiresAt && Date.now() > state.expiresAt) {
                    state.clearUser();
                }
            },
        }
    )
);

export default useUserStore;