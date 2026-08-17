import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getProductById, variantPrice, type Product } from "./products";
import {
  addToCartApi,
  getCartApi,
  fetchProductById,
  fetchPhuKienById,
  removeFromCartApi,
} from "./laptop-api";
import { useAuth } from "./auth-store";
import { toast } from "sonner";

export const MOCK_USER_ID = 1;

export interface CartItem {
  productId: string;
  variantIndex: number;
  quantity: number;
  cartDetailId?: number;
}

interface CartState {
  items: CartItem[];
  compareIds: string[];
  add: (productId: string, variantIndex: number, quantity?: number) => void;
  remove: (productId: string, variantIndex: number) => void;
  updateQty: (productId: string, variantIndex: number, quantity: number) => void;
  clear: () => void;
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;
  syncFromBackend: (userId?: number) => Promise<void>;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      compareIds: [],
      add: (productId, variantIndex, quantity = 1) => {
        const { isLoggedIn, user } = useAuth.getState();
        const isAccessory = productId.startsWith("acc_");
        const rawId = isAccessory ? Number(productId.replace("acc_", "")) : Number(productId);

        if (!isNaN(rawId)) {
          const existing = useCart
            .getState()
            .items.find((i) => i.productId === productId && i.variantIndex === variantIndex);
          const currentQty = existing ? existing.quantity : 0;
          const newAbsoluteQty = currentQty + quantity;

          // Optimistic update
          set((s) => {
            if (existing) {
              return {
                items: s.items.map((i) =>
                  i === existing ? { ...i, quantity: newAbsoluteQty } : i,
                ),
              };
            }
            return { items: [...s.items, { productId, variantIndex, quantity }] };
          });

          if (isLoggedIn && user) {
            const maSanPham = isAccessory ? null : rawId;
            const maPhuKien = isAccessory ? rawId : null;

            // Truyền đúng số lượng delta (quantity) để backend cộng dồn chính xác
            addToCartApi(user.maNguoiDung, maSanPham, maPhuKien, quantity)
              .then(() => {
                useCart.getState().syncFromBackend();
              })
              .catch((err) => {
                console.error("Lỗi đồng bộ thêm giỏ hàng lên backend:", err);
              });
          }
        }
      },
      remove: (productId, variantIndex) => {
        const item = useCart
          .getState()
          .items.find((i) => i.productId === productId && i.variantIndex === variantIndex);

        // Optimistic update: xóa khỏi local state ngay lập tức
        set((s) => ({
          items: s.items.filter(
            (i) => !(i.productId === productId && i.variantIndex === variantIndex),
          ),
        }));

        const { isLoggedIn, user } = useAuth.getState();
        if (!isLoggedIn || !user) return;

        if (item && item.cartDetailId !== undefined) {
          removeFromCartApi(item.cartDetailId)
            .then(() => {
              useCart.getState().syncFromBackend();
            })
            .catch((err) => {
              console.error("Lỗi đồng bộ xóa giỏ hàng lên backend:", err);
            });
        }
      },
      updateQty: (productId, variantIndex, quantity) => {
        const item = useCart
          .getState()
          .items.find((i) => i.productId === productId && i.variantIndex === variantIndex);

        if (!item) return;

        if (quantity <= 0) {
          useCart.getState().remove(productId, variantIndex);
          return;
        }

        const oldQty = item.quantity;
        const newQty = quantity;
        const deltaQty = newQty - oldQty;

        if (deltaQty === 0) return;

        // Optimistic update local Zustand store
        set((s) => ({
          items: s.items.map((i) =>
            i.productId === productId && i.variantIndex === variantIndex
              ? { ...i, quantity: newQty }
              : i,
          ),
        }));

        const { isLoggedIn, user } = useAuth.getState();
        if (!isLoggedIn || !user) return;

        const isAccessory = productId.startsWith("acc_");
        const rawId = isAccessory ? Number(productId.replace("acc_", "")) : Number(productId);

        if (!isNaN(rawId)) {
          const maSanPham = isAccessory ? null : rawId;
          const maPhuKien = isAccessory ? rawId : null;

          if (deltaQty > 0) {
            // Tăng số lượng: gọi API thêm deltaQty
            addToCartApi(user.maNguoiDung, maSanPham, maPhuKien, deltaQty)
              .then(() => {
                useCart.getState().syncFromBackend();
              })
              .catch((err) => {
                console.error("Lỗi đồng bộ cập nhật tăng giỏ hàng lên backend:", err);
              });
          } else if (deltaQty < 0) {
            // Giảm số lượng: backend /api/GioHang/them không hỗ trợ số lượng <= 0,
            // nên xóa dòng cũ đi và thêm lại dòng mới với số lượng newQty!
            const cartDetailId = item.cartDetailId;
            const updateBackend = async () => {
              if (cartDetailId !== undefined) {
                await removeFromCartApi(cartDetailId);
              }
              await addToCartApi(user.maNguoiDung, maSanPham, maPhuKien, newQty);
              await useCart.getState().syncFromBackend();
            };
            updateBackend().catch((err) => {
              console.error("Lỗi đồng bộ cập nhật giảm giỏ hàng lên backend:", err);
            });
          }
        }
      },
      clear: () => set({ items: [] }),
      toggleCompare: (productId) =>
        set((s) => {
          if (s.compareIds.includes(productId)) {
            return { compareIds: s.compareIds.filter((id) => id !== productId) };
          }
          if (s.compareIds.length >= 3) return s;
          return { compareIds: [...s.compareIds, productId] };
        }),
      clearCompare: () => set({ compareIds: [] }),
      syncFromBackend: async (userId?: number) => {
        const { isLoggedIn, user } = useAuth.getState();
        if (!isLoggedIn || !user) {
          set({ items: [] });
          return;
        }

        const resolvedUserId = userId ?? user.maNguoiDung;
        try {
          const backendItems = await getCartApi(resolvedUserId);
          if (Array.isArray(backendItems)) {
            // Đồng bộ fetch chi tiết sản phẩm chưa được tải ở client
            await Promise.all(
              backendItems.map(async (bi) => {
                const isAccessory = bi.maPhuKien != null;
                const idStr = isAccessory ? `acc_${bi.maPhuKien}` : String(bi.maSanPham);
                const existing = getProductById(idStr);
                if (!existing) {
                  try {
                    if (isAccessory) {
                      await fetchPhuKienById(bi.maPhuKien!);
                    } else {
                      await fetchProductById(bi.maSanPham!);
                    }
                  } catch (err) {
                    console.error(`Không thể tải thông tin ${idStr}:`, err);
                  }
                }
              }),
            );

            const localItems = useCart.getState().items;
            const updatedItems: CartItem[] = [];

            // Group local items by productId
            const localByProduct: Record<string, CartItem[]> = {};
            localItems.forEach((item) => {
              if (!localByProduct[item.productId]) {
                localByProduct[item.productId] = [];
              }
              localByProduct[item.productId].push(item);
            });

            // Duyệt qua từng item từ backend để đồng bộ
            backendItems.forEach((bi) => {
              const isAccessory = bi.maPhuKien != null;
              const productIdStr = isAccessory ? `acc_${bi.maPhuKien}` : String(bi.maSanPham);
              const locals = localByProduct[productIdStr] || [];

              if (locals.length === 0) {
                // Không có local item nào trùng productId -> thêm mới với variantIndex = 0
                updatedItems.push({
                  productId: productIdStr,
                  variantIndex: 0,
                  quantity: bi.soLuong,
                  cartDetailId: bi.maChiTiet,
                });
              } else if (locals.length === 1) {
                // Có đúng 1 local item -> cập nhật quantity và giữ nguyên variantIndex
                updatedItems.push({
                  ...locals[0],
                  quantity: bi.soLuong,
                  cartDetailId: bi.maChiTiet,
                });
              } else {
                // Có nhiều cấu hình khác nhau của cùng sản phẩm
                // Phân bổ bi.soLuong cho các local item này
                const localTotal = locals.reduce((sum, item) => sum + item.quantity, 0);
                if (localTotal === bi.soLuong) {
                  // Tổng số lượng khớp -> giữ nguyên các local item, gán cartDetailId
                  locals.forEach((item) => {
                    updatedItems.push({
                      ...item,
                      cartDetailId: bi.maChiTiet,
                    });
                  });
                } else {
                  // Nếu tổng số lượng lệch (ví dụ do thay đổi từ nơi khác), phân bổ lại
                  let remainingQty = bi.soLuong;
                  locals.forEach((item, idx) => {
                    if (idx === locals.length - 1) {
                      if (remainingQty > 0) {
                        updatedItems.push({
                          ...item,
                          quantity: remainingQty,
                          cartDetailId: bi.maChiTiet,
                        });
                      }
                    } else {
                      const allocated = Math.min(item.quantity, remainingQty);
                      if (allocated > 0) {
                        updatedItems.push({
                          ...item,
                          quantity: allocated,
                          cartDetailId: bi.maChiTiet,
                        });
                        remainingQty -= allocated;
                      }
                    }
                  });
                }
              }
            });

            set({ items: updatedItems });
          }
        } catch (err) {
          console.error("Lỗi đồng bộ giỏ hàng từ backend:", err);
        }
      },
    }),
    { name: "laptop-center-cart" },
  ),
);

export type DetailedCartItem = {
  item: CartItem;
  product: Product;
  unitPrice: number;
  lineTotal: number;
};

export function computeDetailed(items: CartItem[]): DetailedCartItem[] {
  return items
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product) return null;
      const unitPrice = variantPrice(product, item.variantIndex);
      return { item, product, unitPrice, lineTotal: unitPrice * item.quantity };
    })
    .filter((d): d is DetailedCartItem => d !== null);
}

export function computeTotalItems(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.quantity, 0);
}

export function computeTotalPrice(items: CartItem[]): number {
  return computeDetailed(items).reduce((sum, d) => sum + d.lineTotal, 0);
}

// Lắng nghe sự thay đổi giỏ hàng từ các tab khác
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === "laptop-center-cart") {
      useCart.persist.rehydrate();
    }
  });
}
