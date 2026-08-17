import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  maNguoiDung: number;
  email: string;
  hoTen: string;
  soDienThoai?: string;
  diaChi?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoggedIn: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoggedIn: false,

      login: (token, user) => set({ token, user, isLoggedIn: true }),

      logout: () => set({ token: null, user: null, isLoggedIn: false }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: "laptop-center-auth",
    },
  ),
);

/**
 * Helper: Lấy token hiện tại để đính kèm vào header Authorization.
 * Dùng trong các API call cần xác thực.
 */
export function getAuthHeaders(): Record<string, string> {
  const token = useAuth.getState().token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
