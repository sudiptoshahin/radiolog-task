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

// Decodes a JWT's payload and returns its `exp` claim in milliseconds.
// Returns 0 if the token is malformed so callers can fail safe.
function getTokenExpiry(token: string): number {
    try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(atob(payload));
        return typeof decoded.exp === "number" ? decoded.exp * 1000 : 0;
    } catch {
        return 0;
    }
}

const useUserStore = create<UserStore>()(
    persist(
        (set) => ({
            user: null,
            tokens: null,
            expiresAt: 0,
            isLoggedIn: false,

            setUser: (data: LoginResponse) =>
                set({
                    user: data.user,
                    tokens: data.tokens,
                    expiresAt: getTokenExpiry(data.tokens.access),
                    isLoggedIn: true,
                }),

            clearUser: () =>
                set({
                    user: null,
                    tokens: null,
                    expiresAt: 0,
                    isLoggedIn: false,
                }),
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