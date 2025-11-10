import { create } from 'zustand';

export const useAppStore = create((set) => ({
  user: null,
  contract: null,

  // Cập nhật user
  setUser: (user) => set({ user }),

  // Cập nhật contract
  setContract: (contract) => set({ contract }),

  // Đăng xuất hoặc reset toàn bộ
  reset: () => set({ user: null, contract: null }),
}));
