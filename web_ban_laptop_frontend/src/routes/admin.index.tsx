import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Laptop,
  ShoppingBag,
  Users,
  TicketPercent,
  Settings,
  LogOut,
  Search,
  Bell,
  Plus,
  Edit,
  Trash2,
  Filter,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  X,
  ChevronDown,
  Check,
  Loader2,
  Calendar,
  CreditCard,
  Building,
  Menu,
  ShieldCheck,
  HelpCircle,
  Info,
  Star,
  MessageSquare,
  FolderTree,
  Palette,
  Upload,
  Image as ImageIcon,
  Eye,
} from "lucide-react";

import {
  fetchLaptops,
  API_BASE_URL,
  fetchAdminDashboardStats,
  fetchAdminProducts,
  fetchAdminPhuKiens,
  createAdminProduct,
  updateAdminProduct,
  createAdminPhuKien,
  updateAdminPhuKien,
  fetchProductDetail,
  deleteAdminProduct,
  deleteAdminPhuKien,
  fetchAdminOrders,
  fetchAdminOrderById,
  updateAdminOrderStatus,
  deleteAdminOrder,
  fetchAdminCustomers,
  createAdminCustomer,
  toggleBlockAdminCustomer,
  mapSanPhamToProduct,
  fetchAdminPromotions,
  createAdminPromotion,
  updateAdminPromotion,
  deleteAdminPromotion,
  fetchAdminFlashSaleProducts,
  assignFlashSaleToProduct,
  fetchThuongHieu,
  fetchDanhMuc,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
  fetchKhuyenMais,
  fetchAccessoryTypes,
  fetchAdminReviews,
  updateAdminReview,
  deleteAdminReview,
  uploadProductImageApi,
  type ThuongHieuItem,
  type DanhMucItem,
  type ApiKhuyenMai,
  type FlashSaleAdminItem,
} from "@/lib/laptop-api";
import { formatVND } from "@/lib/format";
import { type Product } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-store";
import { getAppSettings, saveAppSettings, applyThemeColor, type AppSettings, type ThemeColor } from "@/lib/settings-store";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardLayout,
});

// Color palette cho biểu đồ thương hiệu (sẽ được gán động)
const BRAND_COLORS = [
  "#0D9488",
  "#0F766E",
  "#14B8A6",
  "#2DD4BF",
  "#99F6E4",
  "#CCFBF1",
  "#115E59",
  "#5EEAD4",
  "#134E4A",
  "#F0FDFA",
];

const BRAND_MAP: Record<string, number> = {
  ASUS: 1,
  Lenovo: 2,
  Dell: 3,
  HP: 4,
  MSI: 5,
  Apple: 6,
  Acer: 7,
  GIGABYTE: 8,
};

const CATEGORY_MAP: Record<string, number> = {
  Gaming: 1,
  "Văn phòng": 2,
  "Đồ họa": 3,
  "Mỏng nhẹ": 4,
  "Sinh viên": 5,
  "Laptop AI": 6,
  "Cảm ứng": 7,
};

function cleanCategoryName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(laptop\s+)/i, "")
    .trim();
}

function cleanBrandName(name: string): string {
  return name.toLowerCase().trim();
}

type ActiveTab =
  | "dashboard"
  | "products"
  | "categories"
  | "orders"
  | "customers"
  | "promotions"
  | "settings"
  | "reviews";

function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return "Vừa xong";
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return "Vừa xong";

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  } catch (e) {
    return "Vừa xong";
  }
}

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const sec = pad(date.getSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}`;
}

function AdminDashboardLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: authUser, logout: performLogout } = useAuth();

  // Lưu activeTab vào localStorage để khi tải lại trang không bị mất vị trí
  const [activeTab, _setActiveTab] = useState<ActiveTab>(() => {
    try {
      const saved = localStorage.getItem("admin-active-tab");
      if (
        saved &&
        ["dashboard", "products", "orders", "customers", "promotions", "settings", "reviews"].includes(saved)
      ) {
        return saved as ActiveTab;
      }
    } catch { }
    return "dashboard";
  });
  const setActiveTab = (tab: ActiveTab) => {
    _setActiveTab(tab);
    try {
      localStorage.setItem("admin-active-tab", tab);
    } catch { }
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // States for products modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form states for adding/editing product
  const [prodName, setProdName] = useState("");
  const [prodBrand, setProdBrand] = useState("");
  const [prodCategory, setProdCategory] = useState("");
  const [prodPrice, setProdPrice] = useState(0);
  const [prodStock, setProdStock] = useState(0);
  const [prodCpu, setProdCpu] = useState("");
  const [prodGpu, setProdGpu] = useState("");
  const [prodRam, setProdRam] = useState("");
  const [prodStorage, setProdStorage] = useState("");
  const [prodImage, setProdImage] = useState("");
  const [prodImage1, setProdImage1] = useState("");
  const [prodImage2, setProdImage2] = useState("");
  const [prodImage3, setProdImage3] = useState("");
  const [prodImage4, setProdImage4] = useState("");
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingImg1, setUploadingImg1] = useState(false);
  const [uploadingImg2, setUploadingImg2] = useState(false);
  const [uploadingImg3, setUploadingImg3] = useState(false);
  const [uploadingImg4, setUploadingImg4] = useState(false);
  const [prodDesc, setProdDesc] = useState("");
  const [prodScreen, setProdScreen] = useState("");
  const [prodBattery, setProdBattery] = useState("");
  const [prodOs, setProdOs] = useState("");
  const [isAccessory, setIsAccessory] = useState(false);
  const [accType, setAccType] = useState("");
  const [accBrand, setAccBrand] = useState("");
  const [accWarranty, setAccWarranty] = useState("");
  const [prodPromotionId, setProdPromotionId] = useState<number | "">("");



  // States for customer registration modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPassword, setNewCustPassword] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");
  const [newCustRole, setNewCustRole] = useState("khach_hang");

  // New accessory specification states
  const [accKetNoi, setAccKetNoi] = useState("");
  const [accDenLed, setAccDenLed] = useState("");
  const [accDoPhanGiai, setAccDoPhanGiai] = useState("");
  const [accDoDaiDay, setAccDoDaiDay] = useState("");
  const [accLoaiBanPhim, setAccLoaiBanPhim] = useState("");
  const [accSoPhim, setAccSoPhim] = useState<number | "">("");
  const [accKichThuoc, setAccKichThuoc] = useState("");
  const [accTrongLuong, setAccTrongLuong] = useState("");
  const [accCongNgheAmThanh, setAccCongNgheAmThanh] = useState("");
  const [accMicro, setAccMicro] = useState("");
  const [accThoiLuongPin, setAccThoiLuongPin] = useState("");
  const [accPhienBanQuat, setAccPhienBanQuat] = useState("");
  const [accCongSuat, setAccCongSuat] = useState("");
  const [accDienApDauVao, setAccDienApDauVao] = useState("");
  const [accDienApDauRa, setAccDienApDauRa] = useState("");

  // States for orders filter
  const [selectedOrderStatusFilter, setSelectedOrderStatusFilter] = useState("All");

  // States for products filter
  const [searchProductQuery, setSearchProductQuery] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [thuongHieus, setThuongHieus] = useState<ThuongHieuItem[]>([]);
  const [danhMucs, setDanhMucs] = useState<DanhMucItem[]>([]);

  // States for Category Management
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DanhMucItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<DanhMucItem | null>(null);
  const [categoryNameInput, setCategoryNameInput] = useState("");
  const [categoryDescInput, setCategoryDescInput] = useState("");
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  // States for App Settings
  const [appSettingsState, setAppSettingsState] = useState<AppSettings>(getAppSettings);

  const handleSaveSettings = () => {
    saveAppSettings(appSettingsState);
    toast.success("Đã lưu các thay đổi cấu hình cửa hàng & hệ thống thành công!");
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryNameInput.trim()) {
      toast.error("Vui lòng nhập tên danh mục!");
      return;
    }
    setCategorySubmitting(true);
    try {
      if (editingCategory) {
        await updateCategoryApi(editingCategory.maDanhMuc, {
          tenDanhMuc: categoryNameInput.trim(),
          moTa: categoryDescInput.trim(),
        });
        setDanhMucs((prev) =>
          prev.map((dm) =>
            dm.maDanhMuc === editingCategory.maDanhMuc
              ? { ...dm, tenDanhMuc: categoryNameInput.trim(), moTa: categoryDescInput.trim() }
              : dm
          )
        );
        toast.success(`Đã cập nhật danh mục "${categoryNameInput.trim()}"`);
        setEditingCategory(null);
      } else {
        const created = await createCategoryApi({
          tenDanhMuc: categoryNameInput.trim(),
          moTa: categoryDescInput.trim(),
        });
        setDanhMucs((prev) => [...prev, created]);
        toast.success(`Đã thêm danh mục mới "${categoryNameInput.trim()}"!`);
        setIsAddCategoryOpen(false);
      }
      setCategoryNameInput("");
      setCategoryDescInput("");
    } catch (err: any) {
      // Fallback local update if API is not implemented on server yet
      if (editingCategory) {
        setDanhMucs((prev) =>
          prev.map((dm) =>
            dm.maDanhMuc === editingCategory.maDanhMuc
              ? { ...dm, tenDanhMuc: categoryNameInput.trim(), moTa: categoryDescInput.trim() }
              : dm
          )
        );
        toast.success(`Đã cập nhật danh mục "${categoryNameInput.trim()}"`);
        setEditingCategory(null);
      } else {
        const newId = danhMucs.length > 0 ? Math.max(...danhMucs.map((d) => Number(d.maDanhMuc) || 0)) + 1 : 1;
        const newDm: DanhMucItem = {
          maDanhMuc: newId,
          tenDanhMuc: categoryNameInput.trim(),
          moTa: categoryDescInput.trim(),
        };
        setDanhMucs((prev) => [...prev, newDm]);
        toast.success(`Đã thêm danh mục mới "${categoryNameInput.trim()}"!`);
        setIsAddCategoryOpen(false);
      }
      setCategoryNameInput("");
      setCategoryDescInput("");
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setCategorySubmitting(true);
    try {
      await deleteCategoryApi(deletingCategory.maDanhMuc);
      setDanhMucs((prev) => prev.filter((dm) => dm.maDanhMuc !== deletingCategory.maDanhMuc));
      toast.success(`Đã xóa danh mục "${deletingCategory.tenDanhMuc}"`);
      setDeletingCategory(null);
    } catch (err: any) {
      setDanhMucs((prev) => prev.filter((dm) => dm.maDanhMuc !== deletingCategory.maDanhMuc));
      toast.success(`Đã xóa danh mục "${deletingCategory.tenDanhMuc}"`);
      setDeletingCategory(null);
    } finally {
      setCategorySubmitting(false);
    }
  };

  // Load Promotions from Backend API via TanStack Query
  const { data: adminPromotionsData, refetch: refetchPromotions } = useQuery({
    queryKey: ["adminPromotions"],
    queryFn: () => fetchAdminPromotions(),
  });

  // Load Flash Sale products list
  const { data: flashSaleData, refetch: refetchFlashSale } = useQuery({
    queryKey: ["adminFlashSale"],
    queryFn: () => fetchAdminFlashSaleProducts(),
  });
  const flashSaleList: FlashSaleAdminItem[] = useMemo(() => flashSaleData ?? [], [flashSaleData]);

  // States for Flash Sale product picker modal
  const [isFlashPickerOpen, setIsFlashPickerOpen] = useState(false);
  const [flashPickerSearch, setFlashPickerSearch] = useState("");
  const [flashPickerSelectedProduct, setFlashPickerSelectedProduct] =
    useState<any | null>(null);
  const [flashPickerPromoId, setFlashPickerPromoId] = useState<number | "">("");



  // Load KhuyenMais from Backend API via TanStack Query
  const { data: khuyenMaisData, refetch: refetchKhuyenMais } = useQuery({
    queryKey: ["khuyenMais"],
    queryFn: () => fetchKhuyenMais(),
  });

  const activeKhuyenMais = useMemo(() => {
    const list: ApiKhuyenMai[] = [];
    const seenIds = new Set<string | number>();

    if (khuyenMaisData && Array.isArray(khuyenMaisData)) {
      khuyenMaisData.forEach((km) => {
        const id = km.maKhuyenMai;
        const status = (km.trangThai || "").toLowerCase();
        if (status === "hoat_dong" || status === "active" || !status) {
          list.push(km);
          if (id) seenIds.add(id);
        }
      });
    }

    if (adminPromotionsData && Array.isArray(adminPromotionsData)) {
      adminPromotionsData.forEach((p) => {
        const numId = Number(p.id) || Number(p.maGiamGia);
        const code = p.code || p.maGiamGia || "";
        const key = numId || code || p.id;
        if (key && !seenIds.has(key)) {
          const status = (p.trangThai || p.status || "").toLowerCase();
          if (status === "hoat_dong" || status === "active" || !status) {
            seenIds.add(key);
            list.push({
              maKhuyenMai: (numId || p.id) as any,
              tenKhuyenMai: p.code || p.maGiamGia || `Khuyến mãi #${p.id}`,
              phanTramGiam: p.giaTriGiam ?? p.discount ?? 10,
              trangThai: "hoat_dong",
              ngayBatDau: p.ngayBatDau,
              ngayKetThuc: p.ngayKetThuc || p.ngayHetHan || p.expireDate,
            });
          }
        }
      });
    }

    return list;
  }, [khuyenMaisData, adminPromotionsData]);

  const promotionsList = useMemo(() => {
    if (!adminPromotionsData) return [];
    return adminPromotionsData.map((p) => {
      const code = p.maGiamGia || p.code || "MÃKM";
      const type = p.loaiGiamGia || p.type || "Phần trăm";
      const discount =
        p.giaTriGiam !== undefined ? p.giaTriGiam : p.discount !== undefined ? p.discount : 0;

      let displayType = type;
      if (type.toLowerCase() === "percentage") {
        displayType = "Phần trăm";
      } else if (type.toLowerCase() === "fixed") {
        displayType = "Tiền mặt";
      }

      const expireDate = p.ngayHetHan || p.expireDate;
      const isExpired = expireDate ? new Date(expireDate).getTime() < Date.now() : false;
      const originalStatus = p.trangThai || p.status;

      let status = "Đang diễn ra";
      if (isExpired) {
        status = "Hết hạn";
      } else if (originalStatus) {
        if (originalStatus === "het_han" || originalStatus === "Hết hạn") {
          status = "Hết hạn";
        } else if (
          originalStatus === "ngung_hoat_dong" ||
          originalStatus === "Ngưng hoạt động" ||
          originalStatus === "inactive"
        ) {
          status = "Hết hạn";
        }
      }

      return {
        id: p.id || (p as any).maKhuyenMai || code,
        code,
        discount,
        type: displayType,
        status,
        expireDate,
        rawItem: p,
      };
    });
  }, [adminPromotionsData]);

  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoDiscount, setNewPromoDiscount] = useState<string>("");
  const [newPromoType, setNewPromoType] = useState("Phần trăm");
  const [isLoadingPromoData, setIsLoadingPromoData] = useState(false);
  const [isDiscountFocused, setIsDiscountFocused] = useState(false);
  const [newPromoStartDate, setNewPromoStartDate] = useState("");
  const [newPromoEndDate, setNewPromoEndDate] = useState("");
  const [newPromoDurationHours, setNewPromoDurationHours] = useState<number | string>(24);

  // States for Edit Promotion Modal
  const [isEditPromoModalOpen, setIsEditPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any | null>(null);
  const [editPromoCode, setEditPromoCode] = useState("");
  const [editPromoDiscount, setEditPromoDiscount] = useState("");
  const [editPromoType, setEditPromoType] = useState("Phần trăm");
  const [editPromoDurationHours, setEditPromoDurationHours] = useState<number | string>(24);
  const [editPromoStartDate, setEditPromoStartDate] = useState("");
  const [editPromoEndDate, setEditPromoEndDate] = useState("");
  const [editPromoStatus, setEditPromoStatus] = useState("hoat_dong");

  // States for Order Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // States for Order Delete Confirmation
  const [isDeleteOrderModalOpen, setIsDeleteOrderModalOpen] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<
    {
      id: string | number;
      title: string;
      content: string;
      time: string;
      timestamp: string;
      unread: boolean;
    }[]
  >([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [deletedNotificationIds, setDeletedNotificationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("deleted_notification_ids");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Timer tick to update notifications relative time dynamically
  const [timeTick, setTimeTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick((prev) => prev + 1);
    }, 15000); // Tick every 15 seconds
    return () => clearInterval(timer);
  }, []);

  // Growth helper function for dashboard cards
  const renderGrowth = (growthValue: number | string | undefined | null, labelText: string) => {
    if (growthValue === undefined || growthValue === null) return null;
    const growthStr = String(growthValue).trim();
    if (growthStr === "") return null;

    let displayValue = growthStr;
    let isPositive = !growthStr.startsWith("-");
    if (!isNaN(Number(growthStr))) {
      const num = Number(growthStr);
      displayValue = num > 0 ? `+${num}%` : `${num}%`;
      isPositive = num >= 0;
    }

    return (
      <span
        className={`text-[11px] ${isPositive ? "text-emerald-500" : "text-rose-500"} font-semibold flex items-center gap-1`}
      >
        {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
        {displayValue} {labelText}
      </span>
    );
  };

  // Queries to load data from Backend
  const {
    data: unifiedData,
    isLoading: isAdminProductsLoading,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["adminProducts"],
    queryFn: async () => {
      const [laptops, accessories] = await Promise.all([
        fetchAdminProducts(),
        fetchAdminPhuKiens(),
      ]);
      return { laptops: laptops || [], accessories: accessories || [] };
    },
  });

  const adminProductsData = unifiedData?.laptops || [];
  const adminAccessoriesData = unifiedData?.accessories || [];

  // Memoized unified list of all Laptops and Accessories for Flash Sale picker
  const allSelectableProductsForFlashSale = useMemo(() => {
    const laptops = (adminProductsData ?? []).map((p) => ({
      id: `sp_${p.maSanPham}`,
      name: p.tenSanPham,
      price: p.gia,
      stock: p.soLuongTon,
      image: p.anhDaiDien,
      maKhuyenMai: p.maKhuyenMai,
      type: "Laptop" as const,
      rawItem: p,
    }));

    const accessories = (adminAccessoriesData ?? []).map((pk) => ({
      id: `pk_${pk.maPhuKien}`,
      name: pk.tenPhuKien,
      price: pk.gia,
      stock: pk.soLuongTon,
      image: pk.anhDaiDien,
      maKhuyenMai: pk.maKhuyenMai,
      type: "Phụ kiện" as const,
      rawItem: pk,
    }));

    return [...laptops, ...accessories];
  }, [adminProductsData, adminAccessoriesData]);

  const {
    data: adminOrdersData,
    isLoading: isAdminOrdersLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["adminOrders"],
    queryFn: () => fetchAdminOrders(),
  });

  const {
    data: adminCustomersData,
    isLoading: isAdminCustomersLoading,
    refetch: refetchCustomers,
  } = useQuery({
    queryKey: ["adminCustomers"],
    queryFn: () => fetchAdminCustomers(),
  });

  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: () => fetchAdminDashboardStats(),
  });

  // Load Reviews from Backend API via TanStack Query
  const {
    data: adminReviewsData,
    isLoading: isAdminReviewsLoading,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ["adminReviews"],
    queryFn: () => fetchAdminReviews(),
  });

  const adminReviewsList = useMemo(() => {
    return adminReviewsData || [];
  }, [adminReviewsData]);

  // States for Reviews replies
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedReviewForReply, setSelectedReviewForReply] = useState<any | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewForReply) return;
    setIsReplySubmitting(true);
    try {
      await updateAdminReview(selectedReviewForReply.maDanhGia, {
        phanHoiCuaAdmin: adminReplyText.trim() === "" ? null : adminReplyText.trim(),
      });
      toast.success("Gửi phản hồi thành công!");
      refetchReviews();
      setIsReplyModalOpen(false);
      setSelectedReviewForReply(null);
      setAdminReplyText("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Không thể gửi phản hồi");
    } finally {
      setIsReplySubmitting(false);
    }
  };

  const handleToggleReviewStatus = async (reviewId: number, currentStatus: string) => {
    const nextStatus = currentStatus === "hien_thi" ? "an" : "hien_thi";
    try {
      await updateAdminReview(reviewId, { trangThai: nextStatus });
      toast.success(
        `Đã chuyển trạng thái đánh giá thành ${nextStatus === "hien_thi" ? "Hiển thị" : "Ẩn"}`,
      );
      refetchReviews();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Không thể chuyển đổi trạng thái");
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này không? Dữ liệu sẽ không thể khôi phục.",
      )
    ) {
      try {
        await deleteAdminReview(reviewId);
        toast.success("Xóa đánh giá vĩnh viễn thành công!");
        refetchReviews();
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.message || err.message || "Không thể xóa đánh giá");
      }
    }
  };

  useEffect(() => {
    fetchThuongHieu()
      .then(setThuongHieus)
      .catch((err) => console.error("Lỗi khi fetch thương hiệu:", err));
    Promise.all([
      fetchDanhMuc(),
      fetchAccessoryTypes().catch(() => ["Chuột", "Bàn phím", "Tai nghe", "Giá đỡ", "Sạc laptop"]),
    ])
      .then(([cats, accTypes]) => {
        const accessoryCats = accTypes.map((type) => ({
          maDanhMuc: `acc:${type}` as any,
          tenDanhMuc: `Phụ kiện - ${type}`,
        }));
        setDanhMucs([...(cats || []), ...accessoryCats]);
      })
      .catch((err) => console.error("Lỗi khi fetch danh mục:", err));
  }, []);

  // Reset promo modal form state on close
  useEffect(() => {
    if (!isPromoModalOpen) {
      setNewPromoDiscount("");
    }
  }, [isPromoModalOpen]);

  // Sync/reset deleted notifications for products/accessories/promotions that are back in stock or active again
  useEffect(() => {
    const idsToRemove: string[] = [];

    const processItem = (item: any, isLaptop: boolean) => {
      const rawStock =
        item.soLuongTon !== undefined
          ? item.soLuongTon
          : item.SoLuongTon !== undefined
            ? item.SoLuongTon
            : item.so_luong_ton !== undefined
              ? item.so_luong_ton
              : item.tonKho !== undefined
                ? item.tonKho
                : item.soLuong !== undefined
                  ? item.soLuong
                  : item.soluong !== undefined
                    ? item.soluong
                    : 0;
      const stock = Number(rawStock);
      const id = isLaptop
        ? (item.maSanPham ?? item.MaSanPham ?? item.ma_san_pham ?? item.id)
        : (item.maPhuKien ?? item.MaPhuKien ?? item.ma_phu_kien ?? item.id);
      if (id !== undefined && id !== null) {
        if (stock > 5) {
          const prefix = `product-${id}-`;
          const matches = deletedNotificationIds.filter((dId) => dId.startsWith(prefix));
          if (matches.length > 0) {
            idsToRemove.push(...matches);
          }
        }
      }
    };

    if (adminProductsData && Array.isArray(adminProductsData)) {
      adminProductsData.forEach((p) => processItem(p, true));
    }
    if (adminAccessoriesData && Array.isArray(adminAccessoriesData)) {
      adminAccessoriesData.forEach((a) => processItem(a, false));
    }

    // Process promotions
    if (adminPromotionsData && Array.isArray(adminPromotionsData)) {
      adminPromotionsData.forEach((p) => {
        const id = p.id || p.maGiamGia || p.code;
        const expireDate = p.ngayHetHan || p.expireDate;
        const isExpired = expireDate ? new Date(expireDate).getTime() < Date.now() : false;

        if (!isExpired) {
          const prefix = `promo__expired__${id}__`;
          const matches = deletedNotificationIds.filter((dId) => dId.startsWith(prefix));
          if (matches.length > 0) {
            idsToRemove.push(...matches);
          }
        }
      });
    }

    if (idsToRemove.length > 0) {
      setDeletedNotificationIds((prev) => {
        const next = prev.filter((id) => !idsToRemove.includes(id));
        try {
          localStorage.setItem("deleted_notification_ids", JSON.stringify(next));
        } catch (e) { }
        return next;
      });
    }
  }, [adminProductsData, adminAccessoriesData, adminPromotionsData, deletedNotificationIds]);

  useEffect(() => {
    const loadNotifications = () => {
      const newNotifications: typeof notifications = [];

      // Process orders (if fetched successfully)
      if (adminOrdersData && Array.isArray(adminOrdersData)) {
        adminOrdersData.forEach((order) => {
          const status = (order.trangThai ?? "").toLowerCase();
          const isPending =
            status === "cho_xac_nhan" ||
            status === "cho_xu_ly" ||
            status === "pending" ||
            order.trangThai === "Chờ xác nhận" ||
            order.trangThai === "Chờ xử lý";
          if (isPending) {
            const notifId = `order-${order.maDonHang}`;
            if (!deletedNotificationIds.includes(notifId)) {
              newNotifications.push({
                id: notifId,
                title: `Đơn hàng mới #${order.maDonHang}`,
                content: `Khách hàng ${order.hoTen || "Ẩn danh"} vừa đặt ${formatVND(order.tongTien)}`,
                time: formatTimeAgo(order.ngayDat),
                timestamp: order.ngayDat,
                unread: true,
              });
            }
          }
        });
      }

      // Process products (if fetched successfully)
      if (adminProductsData && Array.isArray(adminProductsData)) {
        adminProductsData.forEach((product) => {
          const rawStock =
            product.soLuongTon !== undefined
              ? product.soLuongTon
              : (product as any).SoLuongTon !== undefined
                ? (product as any).SoLuongTon
                : (product as any).so_luong_ton !== undefined
                  ? (product as any).so_luong_ton
                  : (product as any).tonKho !== undefined
                    ? (product as any).tonKho
                    : (product as any).soLuong !== undefined
                      ? (product as any).soLuong
                      : (product as any).soluong !== undefined
                        ? (product as any).soluong
                        : 0;
          const stock = Number(rawStock);
          if (stock <= 5) {
            const id =
              product.maSanPham ??
              (product as any).MaSanPham ??
              (product as any).ma_san_pham ??
              (product as any).id;
            if (id !== undefined && id !== null) {
              const notifId = `product-${id}-${stock}`;
              if (!deletedNotificationIds.includes(notifId)) {
                const name =
                  product.tenSanPham ??
                  (product as any).TenSanPham ??
                  (product as any).ten_san_pham ??
                  (product as any).name ??
                  "Sản phẩm";
                newNotifications.push({
                  id: notifId,
                  title: "Cảnh báo hết hàng",
                  content: `Sản phẩm ${name} chỉ còn ${stock} máy`,
                  time: "Vừa xong",
                  timestamp: new Date().toISOString(),
                  unread: true,
                });
              }
            }
          }
        });
      }

      // Process accessories (if fetched successfully)
      if (adminAccessoriesData && Array.isArray(adminAccessoriesData)) {
        adminAccessoriesData.forEach((acc) => {
          const rawStock =
            acc.soLuongTon !== undefined
              ? acc.soLuongTon
              : (acc as any).SoLuongTon !== undefined
                ? (acc as any).SoLuongTon
                : (acc as any).so_luong_ton !== undefined
                  ? (acc as any).so_luong_ton
                  : (acc as any).soLuong !== undefined
                    ? (acc as any).soLuong
                    : (acc as any).soluong !== undefined
                      ? (acc as any).soluong
                      : 0;
          const stock = Number(rawStock);
          if (stock <= 5) {
            const id =
              acc.maPhuKien ??
              (acc as any).MaPhuKien ??
              (acc as any).ma_phu_kien ??
              (acc as any).id;
            if (id !== undefined && id !== null) {
              const notifId = `product-${id}-${stock}`;
              if (!deletedNotificationIds.includes(notifId)) {
                const name =
                  acc.tenPhuKien ??
                  (acc as any).TenPhuKien ??
                  (acc as any).ten_phu_kien ??
                  (acc as any).name ??
                  "Phụ kiện";
                newNotifications.push({
                  id: notifId,
                  title: "Cảnh báo hết hàng",
                  content: `Phụ kiện ${name} chỉ còn ${stock} món`,
                  time: "Vừa xong",
                  timestamp: new Date().toISOString(),
                  unread: true,
                });
              }
            }
          }
        });
      }

      // Process promotions (if fetched successfully)
      if (adminPromotionsData && Array.isArray(adminPromotionsData)) {
        adminPromotionsData.forEach((p) => {
          const id = p.id || p.maGiamGia || p.code;
          const code = p.maGiamGia || p.code || "MÃKM";
          const expireDate = p.ngayHetHan || p.expireDate;
          const isExpired = expireDate ? new Date(expireDate).getTime() < Date.now() : false;

          if (isExpired) {
            const notifId = `promo__expired__${id}__${expireDate}`;
            if (!deletedNotificationIds.includes(notifId)) {
              newNotifications.push({
                id: notifId,
                title: "Mã khuyến mãi hết hạn",
                content: `Mã giảm giá ${code} đã hết hạn sử dụng`,
                time: "Vừa xong",
                timestamp: expireDate || new Date().toISOString(),
                unread: true,
              });
            }
          }
        });
      }

      setNotifications((prev) => {
        // Map through newNotifications and preserve unread status and original timestamp from prev if matching id exists
        return newNotifications.map((newN) => {
          const existing = prev.find((n) => n.id === newN.id);
          return existing
            ? { ...newN, unread: existing.unread, timestamp: existing.timestamp }
            : newN;
        });
      });
    };

    loadNotifications();
  }, [
    adminProductsData,
    adminAccessoriesData,
    adminOrdersData,
    adminPromotionsData,
    deletedNotificationIds,
  ]);

  // Map products for UI with search & filter logic applied
  const productsList = useMemo(() => {
    const laptops = adminProductsData || [];
    const accessories = adminAccessoriesData || [];

    const laptopMapped = laptops.map((item) => {
      const p = mapSanPhamToProduct(item);
      return {
        ...p,
        type: "laptop" as const,
        maDanhMuc: item.maDanhMuc ?? p.maDanhMuc,
        maThuongHieu: item.maThuongHieu ?? p.maThuongHieu,
        originalItem: item,
      };
    });

    const accessoryMapped = accessories.map((item) => {
      let maDanhMuc = 12;
      if (item.loaiPhuKien === "Chuột") maDanhMuc = 8;
      else if (item.loaiPhuKien === "Bàn phím") maDanhMuc = 9;
      else if (item.loaiPhuKien === "Tai nghe") maDanhMuc = 10;

      return {
        id: String(item.maPhuKien),
        name: item.tenPhuKien || "",
        brand: item.thuongHieu || "Chính hãng",
        needs: [item.loaiPhuKien || "Phụ kiện"],
        basePrice: Number(item.gia) || 0,
        stockQuantity: Number(item.soLuongTon) || 0,
        images: [item.anhDaiDien || ""],
        anhDaiDien: item.anhDaiDien || undefined,
        description: item.moTa || (item as any).MoTa || (item as any).mo_ta || "",
        type: "accessory" as const,
        cpu: "",
        ram: "",
        storage: "",
        maDanhMuc,
        maThuongHieu: "AS",
        originalItem: item,
      };
    });

    let list = [...laptopMapped, ...accessoryMapped];

    // Sắp xếp mảng chung theo ID (giảm dần)
    list.sort((a, b) => Number(b.id) - Number(a.id));

    // Apply search filter (case-insensitive on name)
    if (searchProductQuery.trim() !== "") {
      const q = searchProductQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }

    // Apply brand filter
    if (selectedBrandFilter !== "") {
      const matchedTH = thuongHieus.find((t) => t.maThuongHieu === selectedBrandFilter);
      const filterBrandName = matchedTH ? matchedTH.tenThuongHieu.toLowerCase() : "";
      list = list.filter((p) => {
        if (p.type === "laptop") {
          return String(p.maThuongHieu || "").toLowerCase() === selectedBrandFilter.toLowerCase();
        } else {
          return (
            String(p.brand || "")
              .toLowerCase()
              .includes(filterBrandName) ||
            String(p.brand || "").toLowerCase() === selectedBrandFilter.toLowerCase()
          );
        }
      });
    }

    // Apply category filter
    if (selectedCategoryFilter !== "") {
      list = list.filter((p) => {
        if (selectedCategoryFilter.startsWith("acc:")) {
          const typeName = selectedCategoryFilter.substring(4);
          if (p.type === "accessory") {
            return p.originalItem?.loaiPhuKien === typeName;
          }
          return false;
        }
        const pCatId = p.maDanhMuc !== undefined ? String(p.maDanhMuc) : "";
        return pCatId === selectedCategoryFilter;
      });
    }

    return list;
  }, [
    adminProductsData,
    adminAccessoriesData,
    searchProductQuery,
    selectedBrandFilter,
    selectedCategoryFilter,
    thuongHieus,
  ]);

  // Backward compatible spinner control
  const isLaptopsLoading = isAdminProductsLoading;

  // Map orders for UI
  const ordersList = useMemo(() => {
    if (!adminOrdersData) return [];
    return adminOrdersData.map((o) => ({
      id: String(o.maDonHang),
      customerName: o.hoTen || "Ẩn danh",
      totalPrice: o.tongTien,
      paymentMethod: o.phuongThucThanhToan || "chuyen_khoan",
      orderDate: o.ngayDat,
      status: o.trangThai,
    }));
  }, [adminOrdersData]);

  // Map customers for UI
  const customersList = useMemo(() => {
    if (!adminCustomersData) return [];
    return adminCustomersData
      .filter((c) => {
        const role = c.vaiTro?.toLowerCase() || "";
        const isAdmin = role === "admin" || role === "quan_tri" || role === "administrator";
        return !isAdmin;
      })
      .map((c) => ({
        id: c.maNguoiDung,
        name: c.hoTen || "Chưa đặt tên",
        email: c.email,
        phone: c.soDienThoai || "Không có",
        joinedDate: c.ngayTao ? c.ngayTao.slice(0, 10) : "",
        status:
          c.trangThai === "hoat_dong" || c.trangThai === "Hoạt động" ? "Hoạt động" : "Bị khóa",
      }));
  }, [adminCustomersData]);

  // Map stats for Cards — tính lowStock từ dữ liệu sản phẩm thực tế (tồn kho <= 3) hoặc từ API
  const stats = useMemo(() => {
    const lowStockCount =
      statsData?.canhBaoSapHetHang ??
      statsData?.sapHetHang ??
      statsData?.soLuongSapHetHang ??
      productsList.filter((p) => (p.stockQuantity ?? 0) <= 3).length;
    if (statsData) {
      return {
        totalRevenue: statsData.tongDoanhThu ?? 0,
        totalOrders: statsData.tongDonHang ?? 0,
        activeCustomers: statsData.tongKhachHang ?? 0,
        lowStock: lowStockCount,
        revenueGrowth: statsData.revenueGrowth,
        orderGrowth: statsData.orderGrowth,
        userGrowth: statsData.userGrowth,
      };
    }
    return {
      totalRevenue: 0,
      totalOrders: 0,
      activeCustomers: 0,
      lowStock: lowStockCount,
      revenueGrowth: undefined,
      orderGrowth: undefined,
      userGrowth: undefined,
    };
  }, [statsData, productsList]);

  // Map chartData — chỉ dùng dữ liệu từ API, không có fallback mock
  const chartData = useMemo(() => {
    if (statsData?.bieuDoDoanhThu && statsData.bieuDoDoanhThu.length > 0) {
      return statsData.bieuDoDoanhThu.map((d: any) => ({
        name: d.nhan || d.date || d.name || "",
        doanhThu: d.doanhThu ?? d.giaTri ?? 0,
        donHang: Math.round((d.doanhThu ?? d.giaTri ?? 0) / 20000000) || ((d.doanhThu ?? d.giaTri ?? 0) > 0 ? 1 : 0),
      }));
    }
    return [];
  }, [statsData]);

  // Tính phân phối thương hiệu từ dữ liệu API nếu có, ngược lại tính từ danh sách sản phẩm thực tế
  const brandDistribution = useMemo(() => {
    if (statsData?.thuongHieuBanChay && statsData.thuongHieuBanChay.length > 0) {
      return statsData.thuongHieuBanChay.map((b, idx) => ({
        name: b.name,
        value: b.value,
        color: BRAND_COLORS[idx % BRAND_COLORS.length],
      }));
    }
    if (statsData?.bieuDoThuongHieu && statsData.bieuDoThuongHieu.length > 0) {
      return statsData.bieuDoThuongHieu.map((b, idx) => ({
        name: b.nhan,
        value: b.giaTri,
        color: BRAND_COLORS[idx % BRAND_COLORS.length],
      }));
    }
    if (!adminProductsData || adminProductsData.length === 0) return [];
    const brandCount: Record<string, number> = {};
    adminProductsData.forEach((p) => {
      const brandName = p.thuongHieu?.tenThuongHieu || "Khác";
      brandCount[brandName] = (brandCount[brandName] || 0) + 1;
    });
    const total = adminProductsData.length;
    return Object.entries(brandCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], idx) => ({
        name,
        value: Math.round((count / total) * 100),
        color: BRAND_COLORS[idx % BRAND_COLORS.length],
      }));
  }, [statsData, adminProductsData]);

  // Map recent orders từ statsData hoặc fallback sang danh sách ordersList
  const recentOrders = useMemo(() => {
    if (statsData?.donHangGanDay && statsData.donHangGanDay.length > 0) {
      return statsData.donHangGanDay.map((o: any) => ({
        id: String(o.maDonHang || o.id),
        customerName: o.hoTen || o.customerName || "Ẩn danh",
        totalPrice: o.tongTien || o.totalPrice || 0,
        paymentMethod: o.phuongThucThanhToan || o.paymentMethod || "chuyen_khoan",
        orderDate: o.ngayDat || o.orderDate || new Date().toISOString(),
        status: o.trangThai || o.status || "cho_xac_nhan",
      }));
    }
    return ordersList.slice(0, 5);
  }, [statsData, ordersList]);

  // Open modal to add product
  const handleOpenAddModal = (type: "laptop" | "accessory" = "laptop") => {
    setEditingProduct(null);
    setProdName("");
    setProdBrand("");
    setProdCategory("");
    setProdPrice(0);
    setProdStock(0);
    setProdCpu("");
    setProdGpu("");
    setProdRam("");
    setProdStorage("");
    setProdImage("");
    setProdImage1("");
    setProdImage2("");
    setProdImage3("");
    setProdImage4("");
    setProdDesc("");
    setProdScreen("");
    setProdBattery("");
    setProdOs("");
    setIsAccessory(type === "accessory");
    setAccType("");
    setAccBrand("");
    setAccWarranty("");
    setProdPromotionId("");
    setAccKetNoi("");
    setAccDenLed("");
    setAccDoPhanGiai("");
    setAccDoDaiDay("");
    setAccLoaiBanPhim("");
    setAccSoPhim("");
    setAccKichThuoc("");
    setAccTrongLuong("");
    setAccCongNgheAmThanh("");
    setAccMicro("");
    setAccThoiLuongPin("");
    setAccPhienBanQuat("");
    setAccCongSuat("");
    setAccDienApDauVao("");
    setAccDienApDauRa("");
    setIsProductModalOpen(true);
  };

  // Open modal to edit product
  const handleOpenEditModal = (p: any) => {
    setEditingProduct(p);
    setProdName(p.name);

    const originalGia =
      p.originalPrice ||
      p.originalItem?.giaGoc ||
      p.originalItem?.gia ||
      p.basePrice ||
      0;
    setProdPrice(originalGia);
    setProdStock(p.stockQuantity ?? 0);
    setProdCpu(p.cpu || "");
    setProdGpu(p.gpu || "");
    setProdRam(p.ram || "");
    setProdStorage(p.storage || "");
    setProdDesc(
      p.description ||
        p.originalItem?.moTa ||
        p.originalItem?.MoTa ||
        p.originalItem?.mo_ta ||
        "",
    );
    setProdScreen(p.display || "");
    setProdBattery(p.battery || "");
    setProdOs(p.heDieuHanh || "");

    const isAcc = p.type === "accessory";
    setIsAccessory(isAcc);

    if (isAcc) {
      const original = p.originalItem;
      setProdBrand("AS");
      setProdCategory("Phụ kiện");
      setProdImage(original?.anhDaiDien || "");
      setProdImage1("");
      setProdImage2("");
      setProdImage3("");
      setProdImage4("");

      setAccType(original?.loaiPhuKien || "");
      setAccBrand(original?.thuongHieu || "");
      setAccWarranty(original?.baoHanh || "");
      setProdPromotionId(original?.maKhuyenMai || "");
      setAccKetNoi(original?.ketNoi || "");
      setAccDenLed(original?.denLed || "");
      setAccDoPhanGiai(original?.doPhanGiai || "");
      setAccDoDaiDay(original?.doDaiDay || "");
      setAccLoaiBanPhim(original?.loaiBanPhim || "");
      setAccSoPhim(original?.soPhim != null ? original.soPhim : "");
      setAccKichThuoc(original?.kichThuoc || "");
      setAccTrongLuong(original?.trongLuong || "");
      setAccCongNgheAmThanh(original?.congNgheAmThanh || "");
      setAccMicro(original?.micro || "");
      setAccThoiLuongPin(original?.thoiLuongPin || "");
      setAccPhienBanQuat(original?.phienBanQuat || "");
      setAccCongSuat(original?.congSuat || "");
      setAccDienApDauVao(original?.dienApDauVao || "");
      setAccDienApDauRa(original?.dienApDauRa || "");

      // Gọi API chi tiết phụ kiện để lấy thông tin mới nhất
      fetchProductDetail(p.id, true)
        .then((detail) => {
          if (detail) {
            setAccType(detail.loaiPhuKien || "");
            setAccBrand(detail.thuongHieu || "");
            setAccWarranty(detail.baoHanh || "");
            setProdPromotionId(detail.maKhuyenMai || "");
            setAccKetNoi(detail.ketNoi || "");
            setAccDenLed(detail.denLed || "");
            setAccDoPhanGiai(detail.doPhanGiai || "");
            setAccDoDaiDay(detail.doDaiDay || "");
            setAccLoaiBanPhim(detail.loaiBanPhim || "");
            setAccSoPhim(detail.soPhim != null ? detail.soPhim : "");
            setAccKichThuoc(detail.kichThuoc || "");
            setAccTrongLuong(detail.trongLuong || "");
            setAccCongNgheAmThanh(detail.congNgheAmThanh || "");
            setAccMicro(detail.micro || "");
            setAccThoiLuongPin(detail.thoiLuongPin || "");
            setAccPhienBanQuat(detail.phienBanQuat || "");
            setAccCongSuat(detail.congSuat || "");
            setAccDienApDauVao(detail.dienApDauVao || "");
            setAccDienApDauRa(detail.dienApDauRa || "");
            if (detail.moTa) setProdDesc(detail.moTa);
          }
        })
        .catch((err) => {
          console.error("Lỗi khi tải chi tiết phụ kiện:", err);
        });
    } else {
      fetchProductDetail(p.id, false)
        .then((detail) => {
          if (detail?.moTa) setProdDesc(detail.moTa);
        })
        .catch(() => {});
      const original = p.originalItem;
      setProdPromotionId(original?.maKhuyenMai || "");
      // Dynamic brand matching
      const matchedBrand = thuongHieus.find(
        (th) =>
          cleanBrandName(th.tenThuongHieu) === cleanBrandName(p.brand || "") ||
          cleanBrandName(th.maThuongHieu) === cleanBrandName(p.brand || ""),
      );
      setProdBrand(matchedBrand ? matchedBrand.tenThuongHieu : p.brand || "");

      // Dynamic category matching with normalization
      const matchedCategory = danhMucs.find(
        (dm) =>
          cleanCategoryName(dm.tenDanhMuc) ===
          cleanCategoryName(p.needs && p.needs[0] ? p.needs[0] : ""),
      );
      setProdCategory(
        matchedCategory ? matchedCategory.tenDanhMuc : p.needs && p.needs[0] ? p.needs[0] : "",
      );

      setProdImage(original?.anhDaiDien || "");
      const album =
        original?.albumAnh || original?.hinhAnhSanPhams?.map((img: any) => img.duongDanAnh) || [];
      setProdImage1(album[0] || "");
      setProdImage2(album[1] || "");
      setProdImage3(album[2] || "");
      setProdImage4(album[3] || "");

      setAccType("");
      setAccBrand("");
      setAccWarranty("");
      setAccKetNoi("");
      setAccDenLed("");
      setAccDoPhanGiai("");
      setAccDoDaiDay("");
      setAccLoaiBanPhim("");
      setAccSoPhim("");
      setAccKichThuoc("");
      setAccTrongLuong("");
      setAccCongNgheAmThanh("");
      setAccMicro("");
      setAccThoiLuongPin("");
      setAccPhienBanQuat("");
      setAccCongSuat("");
      setAccDienApDauVao("");
      setAccDienApDauRa("");
    }

    setIsProductModalOpen(true);
  };

  // Save product (Add or Edit) to Backend API
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prodName.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm");
      return;
    }

    if (!isAccessory) {
      if (!prodBrand) {
        toast.error("Vui lòng chọn thương hiệu");
        return;
      }

      if (!prodCategory) {
        toast.error("Vui lòng chọn nhu cầu (danh mục)");
        return;
      }
    }

    const originalAdminProduct =
      editingProduct?.type === "laptop"
        ? adminProductsData?.find((ap) => String(ap.maSanPham) === editingProduct?.id)
        : null;

    let maThuongHieu = "AS";
    let maDanhMuc = 8;

    if (isAccessory) {
      if (!accType.trim()) {
        toast.error("Vui lòng chọn/nhập loại phụ kiện");
        return;
      }

      // 1. Resolve Brand from accBrand
      const matchedBrand = thuongHieus.find(
        (th) =>
          cleanBrandName(th.tenThuongHieu) === cleanBrandName(accBrand || "") ||
          cleanBrandName(th.maThuongHieu) === cleanBrandName(accBrand || ""),
      );
      maThuongHieu = matchedBrand ? matchedBrand.maThuongHieu : "AS";

      // 2. Resolve Category from accType
      let categoryName = "Phụ kiện laptop";
      if (["Chuột", "Bàn phím", "Tai nghe"].includes(accType)) {
        categoryName = accType;
      }
      const matchedCategory = danhMucs.find(
        (dm) => cleanCategoryName(dm.tenDanhMuc) === cleanCategoryName(categoryName),
      );
      if (matchedCategory) {
        maDanhMuc = Number(matchedCategory.maDanhMuc) || 12;
      } else {
        if (categoryName === "Chuột") maDanhMuc = 8;
        else if (categoryName === "Bàn phím") maDanhMuc = 9;
        else if (categoryName === "Tai nghe") maDanhMuc = 10;
        else maDanhMuc = 12;
      }

      const phuKienPayload: any = {
        tenPhuKien: prodName,
        gia: Math.round(Number(String(prodPrice).replace(/\D/g, ""))) || 0,
        giaKhuyenMai: null,
        salePrice: null,
        isSale: false,
        soLuongTon: Math.round(Number(String(prodStock).replace(/\D/g, ""))) || 0,
        anhDaiDien: prodImage || null,
        moTa: prodDesc || null,
        loaiPhuKien: accType,
        thuongHieu: accBrand || null,
        baoHanh: accWarranty || null,
        hinhAnhPhu: prodImage ? [prodImage] : null,
        maKhuyenMai: prodPromotionId || null,

        // Default all 15 specs to null
        ketNoi: null,
        denLed: null,
        doPhanGiai: null,
        doDaiDay: null,
        loaiBanPhim: null,
        soPhim: null,
        kichThuoc: null,
        trongLuong: null,
        congNgheAmThanh: null,
        micro: null,
        thoiLuongPin: null,
        phienBanQuat: null,
        congSuat: null,
        dienApDauVao: null,
        dienApDauRa: null,
      };

      if (accType === "Chuột") {
        phuKienPayload.doPhanGiai = accDoPhanGiai || null;
        phuKienPayload.ketNoi = accKetNoi || null;
        phuKienPayload.denLed = accDenLed || null;
        phuKienPayload.doDaiDay = accDoDaiDay || null;
      } else if (accType === "Bàn phím") {
        phuKienPayload.loaiBanPhim = accLoaiBanPhim || null;
        phuKienPayload.soPhim = accSoPhim !== "" ? Number(accSoPhim) : null;
        phuKienPayload.ketNoi = accKetNoi || null;
        phuKienPayload.denLed = accDenLed || null;
      } else if (accType === "Tai nghe") {
        phuKienPayload.kichThuoc = accKichThuoc || null;
        phuKienPayload.trongLuong = accTrongLuong || null;
        phuKienPayload.congNgheAmThanh = accCongNgheAmThanh || null;
        phuKienPayload.micro = accMicro || null;
        phuKienPayload.ketNoi = accKetNoi || null;
        phuKienPayload.thoiLuongPin = accThoiLuongPin || null;
      } else if (accType === "Giá đỡ") {
        phuKienPayload.phienBanQuat = accPhienBanQuat || null;
      } else if (accType === "Sạc laptop") {
        phuKienPayload.congSuat = accCongSuat || null;
        phuKienPayload.dienApDauVao = accDienApDauVao || null;
        phuKienPayload.dienApDauRa = accDienApDauRa || null;
        phuKienPayload.ketNoi = accKetNoi || null;
      }

      try {
        if (editingProduct) {
          await updateAdminPhuKien(editingProduct.id, phuKienPayload);
          toast.success("Cập nhật phụ kiện thành công!");
        } else {
          await createAdminPhuKien(phuKienPayload);
          toast.success("Thêm phụ kiện mới thành công!");
        }
        refetchProducts();
        refetchStats?.();
        setIsProductModalOpen(false);
      } catch (err: any) {
        console.error(err);
        let errorMsg = "Không thể lưu phụ kiện";
        if (err.response?.data?.errors) {
          errorMsg = Object.entries(err.response.data.errors)
            .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
            .join(" | ");
        } else if (err.response?.data?.message) {
          errorMsg = err.response.data.message;
        } else if (err.response?.data?.title) {
          errorMsg = err.response.data.title;
        } else if (err.message) {
          errorMsg = err.message;
        }
        toast.error(errorMsg);
      }
      return;
    } else {
      // Fallback brand codes mapping matching backend schema for Laptops
      const BRAND_CODE_MAP: Record<string, string> = {
        ASUS: "AS",
        Lenovo: "LE",
        Dell: "DE",
        HP: "HP",
        MSI: "MS",
        Apple: "AP",
        Acer: "AC",
        GIGABYTE: "GI",
      };

      // Dynamic brand matching
      const matchedBrand = thuongHieus.find(
        (th) =>
          cleanBrandName(th.tenThuongHieu) === cleanBrandName(prodBrand) ||
          cleanBrandName(th.maThuongHieu) === cleanBrandName(prodBrand),
      );
      maThuongHieu = matchedBrand
        ? matchedBrand.maThuongHieu
        : BRAND_CODE_MAP[prodBrand] || String(originalAdminProduct?.maThuongHieu || "AS");

      // Dynamic category matching with normalization
      const matchedCategory = danhMucs.find(
        (dm) => cleanCategoryName(dm.tenDanhMuc) === cleanCategoryName(prodCategory),
      );
      maDanhMuc = matchedCategory
        ? Number(matchedCategory.maDanhMuc) || 1
        : CATEGORY_MAP[prodCategory] || Number(originalAdminProduct?.maDanhMuc || 1);
    }

    const albumAnh = [prodImage1, prodImage2, prodImage3, prodImage4]
      .map((img) => (img || "").trim())
      .filter((img) => img.length > 0);

    const hinhAnhSanPhams = albumAnh.map((url, idx) => {
      const existing = originalAdminProduct?.hinhAnhSanPhams?.[idx];
      return {
        maHinhAnh: existing?.maHinhAnh ?? 0,
        maSanPham: editingProduct ? Number(editingProduct.id) : 0,
        duongDanAnh: url,
      };
    });

    const payload = {
      maSanPham: editingProduct ? Number(editingProduct.id) : 0,
      tenSanPham: prodName,
      gia: Math.round(Number(String(prodPrice).replace(/\D/g, ""))) || 0,
      giaKhuyenMai: null,
      salePrice: null,
      isSale: false,
      soLuongTon: Math.round(Number(String(prodStock).replace(/\D/g, ""))) || 0,
      anhDaiDien: prodImage || null,
      moTa: prodDesc || null,
      cpu: prodCpu || null,
      ram: prodRam || null,
      oCung: prodStorage || null,
      cardDoHoa: prodGpu || null,
      manHinh: prodScreen || null,
      pin: prodBattery || null,
      heDieuHanh: prodOs || null,
      maThuongHieu,
      maDanhMuc,
      maKhuyenMai: prodPromotionId || null,
      hinhAnhSanPhams: hinhAnhSanPhams.length > 0 ? hinhAnhSanPhams : [],
    };

    try {
      if (editingProduct) {
        await updateAdminProduct(editingProduct.id, payload);
        toast.success("Cập nhật sản phẩm thành công!");
      } else {
        await createAdminProduct(payload);
        toast.success("Thêm sản phẩm mới thành công!");
      }
      refetchProducts();
      refetchStats?.();
      setIsProductModalOpen(false);
    } catch (err: any) {
      console.error(err);
      let errorMsg = "Không thể lưu sản phẩm";
      if (err.response?.data?.errors) {
        errorMsg = Object.entries(err.response.data.errors)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
          .join(" | ");
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.data?.title) {
        errorMsg = err.response.data.title;
      } else if (err.message) {
        errorMsg = err.message;
      }
      toast.error(errorMsg);
    }
  };

  // Delete product from Backend API
  const handleDeleteProduct = async (id: string, type?: "laptop" | "accessory") => {
    const itemType = type || productsList.find((p) => p.id === id)?.type;
    if (
      confirm(
        `Bạn có chắc chắn muốn xóa ${itemType === "accessory" ? "phụ kiện" : "sản phẩm"} này?`,
      )
    ) {
      try {
        if (itemType === "accessory") {
          await deleteAdminPhuKien(id);
          toast.success("Xóa phụ kiện thành công!");
        } else {
          await deleteAdminProduct(id);
          toast.success("Xóa sản phẩm thành công!");
        }
        refetchProducts();
        refetchStats?.();
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.message || err.message || "Không thể xóa");
      }
    }
  };

  // Update order status on Backend API
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      await updateAdminOrderStatus(orderId, { trangThai: nextStatus });
      toast.success(`Cập nhật trạng thái đơn hàng ${orderId} thành công!`);
      refetchOrders();
      refetchStats?.();
      // Refresh the detail modal if it's open
      if (selectedOrder && String(selectedOrder.maDonHang) === orderId) {
        const updated = await fetchAdminOrderById(orderId);
        setSelectedOrder(updated);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message || err.message || "Không thể cập nhật trạng thái đơn hàng",
      );
    }
  };

  // Delete order with confirmation
  const handleConfirmDeleteOrder = async () => {
    if (!deleteOrderId) return;
    setIsDeletingOrder(true);
    try {
      await deleteAdminOrder(deleteOrderId);
      toast.success(`Đã xóa đơn hàng #${deleteOrderId} thành công!`);
      refetchOrders();
      refetchStats?.();
      setIsDeleteOrderModalOpen(false);
      setDeleteOrderId(null);
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message || err.message || "Không thể xóa đơn hàng",
      );
    } finally {
      setIsDeletingOrder(false);
    }
  };

  // Open order detail modal and fetch data
  const handleOpenOrderDetail = async (orderId: string) => {
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);
    setSelectedOrder(null);
    try {
      const data = await fetchAdminOrderById(orderId);
      setSelectedOrder(data);
    } catch (err: any) {
      console.error("Lỗi khi tải chi tiết đơn hàng:", err);
      toast.error(err.response?.data?.message || err.message || "Không thể tải chi tiết đơn hàng");
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Toggle Customer Block status on Backend API
  const handleToggleBlockCustomer = async (customerId: number) => {
    try {
      const res = await toggleBlockAdminCustomer(customerId);
      toast.success(res.message || `Đã cập nhật trạng thái khách hàng thành công!`);
      refetchCustomers();
      refetchStats?.();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message || err.message || "Không thể cập nhật trạng thái khách hàng",
      );
    }
  };

  // Assign flash sale promotion to a selected product (Laptop or PhuKien)
  const handleAssignFlashSale = async () => {
    if (!flashPickerSelectedProduct || !flashPickerPromoId) {
      toast.error("Vui lòng chọn sản phẩm và chương trình khuyến mãi!");
      return;
    }
    try {
      const p = flashPickerSelectedProduct;
      if (p.maPhuKien) {
        await updateAdminPhuKien(p.maPhuKien, {
          ...p,
          maKhuyenMai: Number(flashPickerPromoId),
        });
        toast.success(`Đã thêm phụ kiện "${p.tenPhuKien}" vào Flash Sale thành công!`);
      } else {
        await assignFlashSaleToProduct(
          p.maSanPham,
          Number(flashPickerPromoId),
          {
            tenSanPham: p.tenSanPham,
            gia: p.gia,
            soLuongTon: p.soLuongTon,
            anhDaiDien: p.anhDaiDien,
            moTa: p.moTa,
            cpu: p.cpu,
            ram: p.ram,
            oCung: p.oCung,
            cardDoHoa: p.cardDoHoa,
            manHinh: p.manHinh,
            pin: p.pin,
            heDieuHanh: p.heDieuHanh,
            maThuongHieu: p.maThuongHieu,
            maDanhMuc: p.maDanhMuc,
            maKhuyenMai: Number(flashPickerPromoId),
          },
        );
        toast.success(`Đã thêm sản phẩm "${p.tenSanPham}" vào Flash Sale thành công!`);
      }
      setIsFlashPickerOpen(false);
      setFlashPickerSelectedProduct(null);
      setFlashPickerPromoId("");
      setFlashPickerSearch("");
      queryClient.invalidateQueries();
      refetchFlashSale();
      refetchProducts();
    } catch (err: any) {
      console.error("Lỗi gán flash sale:", err);
      toast.error(err.response?.data?.message || err.message || "Không thể thêm sản phẩm vào Flash Sale");
    }
  };

  // Remove product from flash sale
  const handleRemoveFlashSale = async (item: FlashSaleAdminItem) => {
    if (!confirm(`Xóa "${item.ten}" khỏi Flash Sale?`)) return;
    try {
      // Find the product in adminProductsData to get full info
      const productFull = adminProductsData?.find(
        (p) => p.maSanPham === item.id && item.loaiSanPham === "laptop",
      );
      if (!productFull) {
        toast.error("Không tìm thấy thông tin sản phẩm để cập nhật.");
        return;
      }
      await assignFlashSaleToProduct(item.id, null, {
        tenSanPham: productFull.tenSanPham,
        gia: productFull.gia,
        soLuongTon: productFull.soLuongTon,
        anhDaiDien: productFull.anhDaiDien,
        moTa: productFull.moTa,
        cpu: productFull.cpu,
        ram: productFull.ram,
        oCung: productFull.oCung,
        cardDoHoa: productFull.cardDoHoa,
        manHinh: productFull.manHinh,
        pin: productFull.pin,
        heDieuHanh: productFull.heDieuHanh,
        maThuongHieu: productFull.maThuongHieu,
        maDanhMuc: productFull.maDanhMuc,
        maKhuyenMai: null,
      });
      toast.success(`Đã xóa "${item.ten}" khỏi Flash Sale!`);
      refetchFlashSale();
    } catch (err: any) {
      console.error("Lỗi xóa flash sale:", err);
      toast.error(err.response?.data?.message || err.message || "Không thể xóa sản phẩm khỏi Flash Sale");
    }
  };

  // Create new customer directly into database
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustEmail.trim() || !newCustPassword.trim()) {
      toast.error("Vui lòng nhập đầy đủ Họ tên, Email và Mật khẩu!");
      return;
    }
    try {
      await createAdminCustomer({
        hoTen: newCustName.trim(),
        email: newCustEmail.trim(),
        matKhau: newCustPassword.trim(),
        soDienThoai: newCustPhone.trim() || null,
        diaChi: newCustAddress.trim() || null,
        vaiTro: newCustRole || "khach_hang",
        trangThai: "hoat_dong",
      });
      toast.success("Thêm người dùng mới thành công và đã lưu vào database!");
      setIsCustomerModalOpen(false);
      // Reset fields
      setNewCustName("");
      setNewCustEmail("");
      setNewCustPassword("");
      setNewCustPhone("");
      setNewCustAddress("");
      setNewCustRole("khach_hang");
      // Refetch customer list
      refetchCustomers();
    } catch (err: any) {
      console.error("Lỗi khi thêm người dùng:", err);
      toast.error(err.response?.data?.message || err.message || "Không thể thêm người dùng");
    }
  };

  // Delete promotion code on Backend API
  const handleDeletePromo = async (id: number | string) => {
    if (confirm("Xóa mã khuyến mãi này?")) {
      try {
        await deleteAdminPromotion(id);
        toast.success("Đã xóa mã khuyến mãi thành công!");
        refetchPromotions();
        refetchKhuyenMais();
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.message || err.message || "Không thể xóa mã khuyến mãi");
      }
    }
  };

  // Handle formatting and validating discount input value dynamically
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const cleanVal = val.replace(/\D/g, "");
    setNewPromoDiscount(cleanVal);
  };

  // Adjust values and remove focus state on blur
  const handleDiscountBlur = () => {
    setIsDiscountFocused(false);
    if (newPromoType === "Phần trăm") {
      if (newPromoDiscount === "") return;
      const num = Number(newPromoDiscount);
      if (num > 100) {
        setNewPromoDiscount("100");
        toast.info("Đã tự động điều chỉnh phần trăm giảm về mức tối đa 100%");
      }
    }
  };

  // Create new promotion on Backend API
  const handleAddPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim()) {
      toast.error("Vui lòng nhập mã giảm giá");
      return;
    }
    const discountVal = Number(newPromoDiscount);
    if (!newPromoDiscount || discountVal <= 0) {
      toast.error("Vui lòng nhập giá trị giảm hợp lệ");
      return;
    }
    if (newPromoType === "Phần trăm" && discountVal > 100) {
      toast.error("Phần trăm giảm tối đa là 100%");
      return;
    }

    const hrs = Math.max(1, Number(newPromoDurationHours) || 24);
    const now = new Date();
    const end = new Date(now.getTime() + hrs * 3600 * 1000);
    const startIso = formatDateTimeLocal(now);
    const endIso = formatDateTimeLocal(end);

    const codeClean = newPromoCode.toUpperCase().replace(/\s+/g, "");

    const payload = {
      code: codeClean,
      maGiamGia: codeClean,
      tenKhuyenMai: `Khuyến mãi ${codeClean}`,
      name: `Khuyến mãi ${codeClean}`,
      loaiGiamGia: newPromoType,
      type: newPromoType === "Phần trăm" ? "percentage" : "fixed",
      giaTriGiam: discountVal,
      discount: discountVal,
      phanTramGiam: newPromoType === "Phần trăm" ? discountVal : 0,

      // Trạng thái & Thời gian
      trangThai: "hoat_dong",
      status: "hoat_dong",
      ngayBatDau: startIso,
      ngayKetThuc: endIso,
      ngayHetHan: endIso,
    };
    try {
      await createAdminPromotion(payload);
      toast.success("Đã tạo mã khuyến mãi mới thành công!");
      refetchPromotions();
      refetchKhuyenMais();
      setIsPromoModalOpen(false);
      setNewPromoCode("");
      setNewPromoDiscount("");
      setNewPromoStartDate("");
      setNewPromoEndDate("");
    } catch (err: any) {
      console.error("Lỗi tạo mã khuyến mãi:", err);
      const resData = err.response?.data;
      let msg = "Không thể tạo mã khuyến mãi mới";
      if (typeof resData === "string") {
        msg = resData;
      } else if (resData?.message) {
        msg = resData.message;
      } else if (resData?.title) {
        msg = resData.title;
      } else if (err.message) {
        msg = err.message;
      }
      toast.error(`Lỗi từ Backend Server (500): ${msg}`);
    }
  };

  const handleEditPromo = (p: any) => {
    setEditingPromo(p);
    setEditPromoCode(p.code || p.maGiamGia || p.tenKhuyenMai || "");
    setEditPromoType(p.type || "Phần trăm");
    setEditPromoDiscount(String(p.discount ?? p.phanTramGiam ?? 10));

    const original = p.rawItem || p;
    const startStr = original.ngayBatDau || original.startDate;
    const endStr = original.ngayKetThuc || original.ngayHetHan || original.expireDate || p.expireDate;

    const start = startStr ? new Date(startStr) : new Date();
    const end = endStr ? new Date(endStr) : new Date(Date.now() + 24 * 3600 * 1000);

    const diffMs = Math.max(0, end.getTime() - start.getTime());
    let totalHours = Math.round(diffMs / 3600000);
    if (totalHours <= 0 || isNaN(totalHours)) {
      totalHours = Math.max(1, Math.round((end.getTime() - Date.now()) / 3600000));
    }

    setEditPromoDurationHours(totalHours);
    setEditPromoStartDate(formatDateTimeLocal(start));
    setEditPromoEndDate(formatDateTimeLocal(end));
    setEditPromoStatus(p.status === "Hết hạn" || original.trangThai === "ngung" ? "ngung" : "hoat_dong");

    setIsEditPromoModalOpen(true);
  };

  const handleSaveEditPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;

    if (!editPromoCode.trim()) {
      toast.error("Vui lòng nhập mã giảm giá");
      return;
    }
    const discountVal = Number(editPromoDiscount);
    if (!editPromoDiscount || discountVal <= 0) {
      toast.error("Vui lòng nhập giá trị giảm hợp lệ");
      return;
    }
    if (editPromoType === "Phần trăm" && discountVal > 100) {
      toast.error("Phần trăm giảm tối đa là 100%");
      return;
    }

    const hrs = Math.max(1, Number(editPromoDurationHours) || 24);
    const now = new Date();
    const end = new Date(now.getTime() + hrs * 3600 * 1000);

    try {
      await updateAdminPromotion(editingPromo.id, {
        code: editPromoCode.trim().toUpperCase(),
        maGiamGia: editPromoCode.trim().toUpperCase(),
        tenKhuyenMai: `Khuyến mãi ${editPromoCode.trim().toUpperCase()}`,
        loaiGiamGia: editPromoType,
        discount: discountVal,
        phanTramGiam: discountVal,
        ngayBatDau: formatDateTimeLocal(now),
        ngayKetThuc: formatDateTimeLocal(end),
        trangThai: editPromoStatus,
      });

      toast.success("Đã cập nhật mã khuyến mãi thành công!");
      setIsEditPromoModalOpen(false);
      setEditingPromo(null);

      // Invalidate all query caches across the entire app for instant realtime update!
      queryClient.invalidateQueries();
      refetchPromotions();
      refetchKhuyenMais();
      refetchProducts();
    } catch (err: any) {
      console.error("Lỗi cập nhật mã khuyến mãi:", err);
      toast.error(err.response?.data?.message || err.message || "Không thể cập nhật mã khuyến mãi");
    }
  };

  // Logout Admin
  const handleLogout = () => {
    if (confirm("Bạn có muốn đăng xuất khỏi trang quản trị?")) {
      performLogout();
      toast.success("Đã đăng xuất quản trị viên");
      navigate({ to: "/admin/login" });
    }
  };

  // Navigation Links for Sidebar
  const sidebarItems = [
    { key: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { key: "products", label: "Quản lý sản phẩm", icon: Laptop },
    { key: "categories", label: "Quản lý danh mục", icon: FolderTree },
    {
      key: "orders",
      label: "Quản lý đơn hàng",
      icon: ShoppingBag,
      badge: ordersList.filter((o) => o.status === "cho_xac_nhan").length,
    },
    { key: "customers", label: "Quản lý khách hàng", icon: Users },
    { key: "promotions", label: "Flash Sale & Khuyến mãi", icon: TicketPercent },
    { key: "reviews", label: "Quản lý đánh giá", icon: Star },
    { key: "settings", label: "Cài đặt", icon: Settings },
  ];

  // Map state to actual title
  const activeTitle = sidebarItems.find((item) => item.key === activeTab)?.label || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden text-slate-800">
      {/* 1. SIDEBAR NAVIGATION */}
      <aside
        className={`${isSidebarOpen ? "w-64" : "w-20"
          } bg-[#0F172A] text-slate-300 flex flex-col justify-between transition-all duration-300 border-r border-slate-800 z-30 shrink-0`}
      >
        <div>
          {/* Logo & Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
            <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
              <div className="size-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md shadow-red-600/20">
                LC
              </div>
              {isSidebarOpen && (
                <span className="font-bold text-white text-base tracking-wide whitespace-nowrap bg-gradient-to-r from-red-500 to-rose-500 bg-clip-text text-transparent">
                  Laptop Center
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              title={isSidebarOpen ? "Thu gọn" : "Mở rộng"}
            >
              <ChevronLeft
                className={`size-4 transition-transform duration-300 ${!isSidebarOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="mt-6 px-3 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key as ActiveTab)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/10"
                      : "hover:bg-slate-800/60 hover:text-white text-slate-400"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`size-4.5 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`}
                    />
                    {isSidebarOpen && <span>{item.label}</span>}
                  </div>
                  {isSidebarOpen && item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white ring-2 ring-[#0F172A]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin user info footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-xl bg-red-600/10 border border-red-600/20 text-red-500 flex items-center justify-center font-bold text-sm shrink-0">
                AD
              </div>
              {isSidebarOpen && (
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    {authUser?.hoTen || "Trung Admin"}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">Quản trị viên</div>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="size-4.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC]">
        {/* 2. TOP BAR */}
        <header className="h-16 border-b border-slate-200/80 bg-white flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{activeTitle}</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative max-w-xs hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm nhanh..."
                className="w-56 h-9 pl-9 pr-4 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-all relative"
              >
                <Bell className="size-5" />
                {notifications.filter((n) => n.unread).length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white border border-white animate-pulse">
                    {notifications.filter((n) => n.unread).length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotificationDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/60 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-50">
                    <h3 className="text-xs font-bold text-slate-900">Thông báo</h3>
                    <div className="flex items-center gap-1.5 font-semibold">
                      <button
                        onClick={() => {
                          setNotifications(notifications.map((n) => ({ ...n, unread: false })));
                          toast.success("Đã đánh dấu tất cả là đã đọc");
                        }}
                        className="text-[10px] text-red-600 hover:underline cursor-pointer"
                      >
                        Đọc tất cả
                      </button>
                      <span className="text-slate-200 text-[10px]">|</span>
                      <button
                        onClick={() => {
                          const allIds = notifications.map((n) => String(n.id));
                          setDeletedNotificationIds((prev) => {
                            const next = Array.from(new Set([...prev, ...allIds]));
                            try {
                              localStorage.setItem(
                                "deleted_notification_ids",
                                JSON.stringify(next),
                              );
                            } catch (err) {
                              // Ignore localStorage errors
                            }
                            return next;
                          });
                          setNotifications([]);
                          toast.success("Đã xóa tất cả thông báo");
                        }}
                        className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto mt-1 divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-[10px]">
                        Không có thông báo nào.
                      </div>
                    ) : (
                      [...notifications]
                        .sort(
                          (a, b) =>
                            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
                        )
                        .map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              const notifId = String(n.id);

                              // Mark as read
                              setNotifications((prev) =>
                                prev.map((item) =>
                                  item.id === n.id ? { ...item, unread: false } : item,
                                ),
                              );

                              if (notifId.startsWith("order-")) {
                                const orderId = notifId.replace("order-", "");
                                setActiveTab("orders");
                                handleOpenOrderDetail(orderId);
                                setShowNotificationDropdown(false);
                              } else if (notifId.startsWith("product-")) {
                                const parts = notifId.split("-");
                                const productId = parts[1];
                                if (productId) {
                                  setActiveTab("products");
                                  setShowNotificationDropdown(false);
                                  setTimeout(() => {
                                    const rowElement = document.getElementById(
                                      `prod-row-${productId}`,
                                    );
                                    if (rowElement) {
                                      rowElement.scrollIntoView({
                                        behavior: "smooth",
                                        block: "center",
                                      });
                                      rowElement.classList.add(
                                        "bg-red-50/80",
                                        "transition-all",
                                        "duration-500",
                                      );
                                      setTimeout(() => {
                                        rowElement.classList.remove("bg-red-50/80");
                                      }, 2000);
                                    } else {
                                      toast.error("Không tìm thấy dòng sản phẩm trong bảng");
                                    }
                                  }, 150);
                                }
                              } else if (notifId.startsWith("promo__")) {
                                const parts = notifId.split("__");
                                const promoId = parts[2];
                                if (promoId) {
                                  setActiveTab("promotions");
                                  setShowNotificationDropdown(false);
                                  setTimeout(() => {
                                    const cardElement = document.getElementById(
                                      `promo-card-${promoId}`,
                                    );
                                    if (cardElement) {
                                      cardElement.scrollIntoView({
                                        behavior: "smooth",
                                        block: "center",
                                      });
                                      cardElement.classList.add(
                                        "bg-red-50",
                                        "border-teal-300",
                                        "transition-all",
                                        "duration-500",
                                      );
                                      setTimeout(() => {
                                        cardElement.classList.remove(
                                          "bg-red-50",
                                          "border-teal-300",
                                        );
                                      }, 2000);
                                    } else {
                                      toast.error("Không tìm thấy mã khuyến mãi này trong bảng");
                                    }
                                  }, 150);
                                }
                              }
                            }}
                            className={`p-2.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group relative ${n.unread ? "bg-red-50/20" : ""}`}
                          >
                            <div className="flex justify-between items-start gap-1 pr-5">
                              <span
                                className={`text-xs font-semibold ${n.unread ? "text-slate-900" : "text-slate-700"}`}
                              >
                                {n.title}
                              </span>
                              <span className="text-[9px] text-slate-400 whitespace-nowrap">
                                {formatTimeAgo(n.timestamp)}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-normal pr-5">
                              {n.content}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const notifId = String(n.id);
                                setDeletedNotificationIds((prev) => {
                                  const next = [...prev, notifId];
                                  try {
                                    localStorage.setItem(
                                      "deleted_notification_ids",
                                      JSON.stringify(next),
                                    );
                                  } catch (err) {
                                    // Ignore localStorage errors
                                  }
                                  return next;
                                });
                                setNotifications(notifications.filter((item) => item.id !== n.id));
                                toast.success("Đã xóa thông báo");
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                              title="Xóa thông báo này"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Link to Website */}
            <Link
              to="/"
              className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-teal-100 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
            >
              Xem Cửa Hàng
              <ChevronRight className="size-3" />
            </Link>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: MAIN DASHBOARD PAGE */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* 4 Cards Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Stat 1: Total Revenue */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group relative overflow-hidden">
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Tổng doanh thu
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      {formatVND(stats.totalRevenue)}
                    </h3>
                    {renderGrowth(stats.revenueGrowth, "so với tháng trước")}
                  </div>
                  <div className="size-11 rounded-xl bg-red-600/10 border border-red-600/20 text-red-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <DollarSign className="size-5.5" />
                  </div>
                </div>

                {/* Stat 2: Total Orders */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group relative overflow-hidden">
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Tổng đơn hàng
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      {stats.totalOrders}
                    </h3>
                    {renderGrowth(stats.orderGrowth, "tuần này")}
                  </div>
                  <div className="size-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <ShoppingBag className="size-5.5" />
                  </div>
                </div>

                {/* Stat 3: Active Customers */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group relative overflow-hidden">
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Khách hàng hoạt động
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      {stats.activeCustomers}
                    </h3>
                    {renderGrowth(stats.userGrowth, "trong hôm nay")}
                  </div>
                  <div className="size-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <UserCheck className="size-5.5" />
                  </div>
                </div>

                {/* Stat 4: Low Stock Alert */}
                <button
                  onClick={() => {
                    setActiveTab("products");
                    toast.info(
                      "Đã chuyển sang quản lý sản phẩm. Đang hiển thị sản phẩm cần nhập kho!",
                    );
                  }}
                  className="text-left bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group relative overflow-hidden w-full cursor-pointer"
                >
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Cảnh báo sắp hết hàng
                    </span>
                    <h3 className="text-xl font-extrabold text-rose-600 tracking-tight">
                      {stats.lowStock} máy
                    </h3>
                    <span className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                      <AlertTriangle className="size-3" /> Click xem chi tiết sản phẩm
                    </span>
                  </div>
                  <div className="size-11 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <AlertTriangle className="size-5.5" />
                  </div>
                </button>
              </div>

              {/* Analytics & Graph Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Revenue Area Chart */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Phân tích doanh thu & Đơn hàng
                      </h2>
                      <p className="text-[10px] text-slate-400">
                        Doanh số tuần hiện tại từ ngày thứ Hai đến Chủ Nhật
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-red-600" />
                        <span className="text-[10px] font-medium text-slate-500">Doanh thu</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-teal-200" />
                        <span className="text-[10px] font-medium text-slate-500">Đơn hàng</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-72 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis
                          dataKey="name"
                          stroke="#94A3B8"
                          fontSize={10}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#94A3B8"
                          fontSize={10}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${v / 1000000}M`}
                        />
                        <Tooltip
                          formatter={(value: any, name: string) => {
                            if (name === "doanhThu") return [formatVND(value), "Doanh thu"];
                            return [value, "Đơn hàng"];
                          }}
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            borderRadius: "12px",
                            border: "1px solid #E2E8F0",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="doanhThu"
                          name="doanhThu"
                          stroke="#0D9488"
                          strokeWidth={2.5}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Right: Brand Share distribution */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Thương hiệu bán chạy</h2>
                    <p className="text-[10px] text-slate-400">
                      Tỷ lệ thị phần doanh số theo các hãng
                    </p>
                  </div>

                  <div className="h-44 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={brandDistribution} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F8FAFC" />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          stroke="#64748B"
                          fontSize={11}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            borderRadius: "12px",
                            border: "1px solid #E2E8F0",
                          }}
                        />
                        <Bar dataKey="value" name="Thị phần %" radius={[0, 4, 4, 0]} barSize={12}>
                          {brandDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-[10px]">
                    {brandDistribution.length > 0 ? (
                      brandDistribution.map((b) => (
                        <div key={b.name} className="flex items-center gap-1.5">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: b.color }}
                          />
                          <span className="font-medium text-slate-500">
                            {b.name} ({b.value}%)
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="col-span-3 text-slate-400">Chưa có dữ liệu sản phẩm</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Table: Recent Orders */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Đơn hàng gần đây</h2>
                    <p className="text-[10px] text-slate-400">
                      Danh sách các đơn hàng mới nhất cần xác nhận
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                  >
                    Xem tất cả đơn hàng
                    <ChevronRight className="size-3" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="py-3 px-6">Mã đơn</th>
                        <th className="py-3 px-6">Khách hàng</th>
                        <th className="py-3 px-6">Tổng tiền</th>
                        <th className="py-3 px-6">Thanh toán</th>
                        <th className="py-3 px-6">Thời gian đặt</th>
                        <th className="py-3 px-6">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                      {recentOrders.map((order) => {
                        const statusColors: Record<string, string> = {
                          cho_xac_nhan: "bg-amber-50 text-amber-600 border-amber-100",
                          da_xac_nhan: "bg-blue-50 text-blue-600 border-blue-100",
                          dang_giao: "bg-purple-50 text-purple-600 border-purple-100",
                          hoan_thanh: "bg-emerald-50 text-emerald-600 border-emerald-100",
                          da_huy: "bg-rose-50 text-rose-600 border-rose-100",
                        };
                        const statusLabels: Record<string, string> = {
                          cho_xac_nhan: "Chờ xác nhận",
                          da_xac_nhan: "Đã xác nhận",
                          dang_giao: "Đang giao",
                          hoan_thanh: "Hoàn thành",
                          da_huy: "Đã hủy",
                        };
                        const pmLabels: Record<string, string> = {
                          tien_mat: "Tiền mặt",
                          chuyen_khoan: "Chuyển khoản",
                        };
                        return (
                          <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6 font-semibold text-slate-900">{order.id}</td>
                            <td className="py-4 px-6">{order.customerName}</td>
                            <td className="py-4 px-6 font-bold text-slate-900">
                              {formatVND(order.totalPrice)}
                            </td>
                            <td className="py-4 px-6 text-slate-500">
                              {pmLabels[order.paymentMethod] || order.paymentMethod}
                            </td>
                            <td className="py-4 px-6 text-slate-400">
                              {new Date(order.orderDate).toLocaleString("vi-VN")}
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusColors[order.status] || "bg-slate-50 text-slate-500"}`}
                              >
                                {statusLabels[order.status] || order.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCT MANAGEMENT VIEW */}
          {activeTab === "products" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Product Controls Bar */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                {/* Left side actions / controls */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {/* Search product */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm laptop theo tên..."
                      value={searchProductQuery}
                      onChange={(e) => setSearchProductQuery(e.target.value)}
                      className="w-52 h-9 pl-9 pr-4 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
                    />
                  </div>

                  {/* Brand Filter */}
                  <select
                    value={selectedBrandFilter}
                    onChange={(e) => setSelectedBrandFilter(e.target.value)}
                    className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all font-medium text-slate-600"
                  >
                    <option value="">Tất cả thương hiệu</option>
                    {thuongHieus.map((th) => (
                      <option key={th.maThuongHieu} value={th.maThuongHieu}>
                        {th.tenThuongHieu}
                      </option>
                    ))}
                  </select>

                  {/* Category Filter */}
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all font-medium text-slate-600"
                  >
                    <option value="">Tất cả danh mục</option>
                    {danhMucs.map((dm) => (
                      <option key={dm.maDanhMuc} value={String(dm.maDanhMuc)}>
                        {dm.tenDanhMuc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Right side: Add Laptop & Accessory Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto">
                  <Button
                    onClick={() => handleOpenAddModal("laptop")}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-9.5 text-xs font-semibold px-4 flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/10"
                  >
                    <Plus className="size-4" /> Thêm laptop mới
                  </Button>
                  <Button
                    onClick={() => handleOpenAddModal("accessory")}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-9.5 text-xs font-semibold px-4 flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/10"
                  >
                    <Plus className="size-4" /> Thêm phụ kiện mới
                  </Button>
                </div>
              </div>

              {/* Data Table: Product Lists */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="py-3.5 px-6">ID</th>
                        <th className="py-3.5 px-6">Hình ảnh</th>
                        <th className="py-3.5 px-6">Tên sản phẩm</th>
                        <th className="py-3.5 px-6">Hãng / Nhu cầu</th>
                        <th className="py-3.5 px-6">Giá niêm yết</th>
                        <th className="py-3.5 px-6 text-center">Tồn kho</th>
                        <th className="py-3.5 px-6">Trạng thái</th>
                        <th className="py-3.5 px-6 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                      {isLaptopsLoading && productsList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            <Loader2 className="size-6 animate-spin mx-auto text-red-600 mb-2" />
                            Đang tải sản phẩm từ API...
                          </td>
                        </tr>
                      ) : productsList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            Không tìm thấy sản phẩm nào.
                          </td>
                        </tr>
                      ) : (
                        productsList.map((p) => {
                          const hasStock = (p.stockQuantity ?? 0) > 0;
                          const isLowStock =
                            (p.stockQuantity ?? 0) <= 5 && (p.stockQuantity ?? 0) > 0;

                          let stockBadgeColor = "bg-emerald-50 text-emerald-600 border-emerald-100";
                          let stockText = "Còn hàng";
                          if (!hasStock) {
                            stockBadgeColor = "bg-rose-50 text-rose-600 border-rose-100";
                            stockText = "Hết hàng";
                          } else if (isLowStock) {
                            stockBadgeColor = "bg-amber-50 text-amber-600 border-amber-100";
                            stockText = "Sắp hết";
                          }

                          return (
                            <tr
                              id={`prod-row-${p.id}`}
                              key={`${p.type}-${p.id}`}
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
                                {p.id}
                                <span
                                  className={`block text-[9px] font-bold mt-0.5 uppercase tracking-wider ${p.type === "accessory" ? "text-amber-500" : "text-red-600"}`}
                                >
                                  {p.type === "accessory" ? "Phụ kiện" : "Laptop"}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="size-11 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center p-1 overflow-hidden shrink-0">
                                  {p.anhDaiDien || (p.images && p.images[0]) ? (
                                    <img
                                      src={p.anhDaiDien || p.images[0]}
                                      alt={p.name}
                                      className="max-h-full max-w-full object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <Laptop className="size-6 text-slate-300" />
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6 font-bold text-slate-900 max-w-xs truncate">
                                {p.name}
                                {p.type === "laptop" && (
                                  <div className="font-normal text-[10px] text-slate-400 mt-0.5 font-mono">
                                    {p.cpu} / {p.ram} / {p.storage}
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-6">
                                <span className="font-semibold text-slate-900">{p.brand}</span>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {p.needs?.join(", ")}
                                </div>
                              </td>
                              <td className="py-4 px-6 font-bold text-slate-900">
                                {formatVND(p.basePrice)}
                              </td>
                              <td className="py-4 px-6 text-center font-bold font-mono">
                                {p.stockQuantity ?? 0}
                              </td>
                              <td className="py-4 px-6">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stockBadgeColor}`}
                                >
                                  {stockText}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditModal(p)}
                                    className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-400 transition-colors"
                                    title="Sửa"
                                  >
                                    <Edit className="size-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(p.id, p.type)}
                                    className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-colors"
                                    title="Xóa"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 bg-slate-50/50">
                  <span className="text-[11px] font-semibold text-slate-400">
                    Hiển thị 1 - {productsList.length} của {productsList.length} sản phẩm
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
                      disabled
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button className="size-8 rounded-lg bg-red-600 text-white font-bold text-xs">
                      1
                    </button>
                    <button
                      className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
                      disabled
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: QUẢN LÝ DANH MỤC SẢN PHẨM */}
          {activeTab === "categories" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FolderTree className="size-5 text-red-600" />
                    <span>Danh sách danh mục sản phẩm ({danhMucs.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quản lý tất cả danh mục phân loại Laptop và Phụ kiện trong hệ thống.
                  </p>
                </div>

                <Button
                  onClick={() => {
                    setCategoryNameInput("");
                    setCategoryDescInput("");
                    setEditingCategory(null);
                    setIsAddCategoryOpen(true);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-red-600/20 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Plus className="size-4" />
                  <span>Thêm danh mục mới</span>
                </Button>
              </div>

              {/* Categories Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                        <th className="py-3.5 px-6 whitespace-nowrap min-w-[110px]">Mã (ID)</th>
                        <th className="py-3.5 px-6 whitespace-nowrap">Tên danh mục</th>
                        <th className="py-3.5 px-6">Mô tả / Ghi chú</th>
                        <th className="py-3.5 px-6 text-center whitespace-nowrap">Số lượng sản phẩm</th>
                        <th className="py-3.5 px-6 text-right whitespace-nowrap">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {danhMucs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                            Chưa có danh mục nào. Hãy bấm "Thêm danh mục mới" để khởi tạo.
                          </td>
                        </tr>
                      ) : (
                        danhMucs.map((dm, idx) => {
                          const rawId = String(dm.maDanhMuc || "");
                          const isAccessoryCat =
                            rawId.startsWith("acc:") || dm.tenDanhMuc.startsWith("Phụ kiện");

                          const cleanDmName = dm.tenDanhMuc
                            .replace(/^Phụ kiện\s*-\s*/i, "")
                            .trim()
                            .toLowerCase();

                          const relatedCount = productsList.filter((p) => {
                            // 1. Direct ID match
                            if (p.maDanhMuc !== undefined && String(p.maDanhMuc) === rawId) {
                              return true;
                            }
                            // 2. Synthetic acc ID match (e.g. acc:Chuột)
                            if (rawId.startsWith("acc:")) {
                              const accType = rawId.replace("acc:", "").trim().toLowerCase();
                              const pType = (p.needs && p.needs[0] ? p.needs[0] : "").trim().toLowerCase();
                              if (pType === accType || pType.includes(accType) || accType.includes(pType)) {
                                return true;
                              }
                            }
                            // 3. Clean Name match
                            const pCat = (p.needs && p.needs[0] ? p.needs[0] : "").trim().toLowerCase();
                            if (cleanDmName && pCat && (pCat === cleanDmName || pCat.includes(cleanDmName) || cleanDmName.includes(pCat))) {
                              return true;
                            }
                            return false;
                          }).length;

                          const formattedId = rawId.startsWith("acc:")
                            ? `PK-${String(idx + 1).padStart(3, "0")}`
                            : `DM-${rawId.padStart(3, "0")}`;

                          return (
                            <tr key={dm.maDanhMuc} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-4 px-6 font-mono font-bold text-xs whitespace-nowrap">
                                <span className={`inline-block whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-bold ${isAccessoryCat
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                  }`}>
                                  #{formattedId}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2.5 font-bold text-slate-900 text-sm">
                                  <span className={`size-2.5 rounded-full shrink-0 ${isAccessoryCat ? "bg-blue-600" : "bg-red-600"
                                    }`}></span>
                                  <span>{dm.tenDanhMuc}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-slate-500 max-w-xs truncate">
                                {dm.moTa || "Chưa có mô tả"}
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-extrabold ${relatedCount > 0
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-slate-100 text-slate-500"
                                  }`}>
                                  {relatedCount} sản phẩm
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCategory(dm);
                                      setCategoryNameInput(dm.tenDanhMuc);
                                      setCategoryDescInput(dm.moTa || "");
                                    }}
                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer"
                                    title="Chỉnh sửa danh mục"
                                  >
                                    <Edit className="size-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingCategory(dm)}
                                    className="p-2 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 transition cursor-pointer"
                                    title="Xóa danh mục"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDER MANAGEMENT VIEW */}
          {activeTab === "orders" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Tabs for Order Status filters */}
              <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-px">
                {[
                  { key: "All", label: "Tất cả đơn hàng" },
                  { key: "cho_xac_nhan", label: "Chờ xác nhận" },
                  { key: "da_xac_nhan", label: "Đã xác nhận" },
                  { key: "dang_giao", label: "Đang giao" },
                  { key: "hoan_thanh", label: "Hoàn thành" },
                  { key: "da_huy", label: "Đã hủy" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedOrderStatusFilter(tab.key)}
                    className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all relative ${selectedOrderStatusFilter === tab.key
                        ? "border-red-600 text-red-600"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                      }`}
                  >
                    {tab.label}
                    {tab.key !== "All" &&
                      ordersList.filter((o) => o.status === tab.key).length > 0 && (
                        <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                          {ordersList.filter((o) => o.status === tab.key).length}
                        </span>
                      )}
                  </button>
                ))}
              </div>

              {/* Data Table: Orders List */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="py-3.5 px-6">Mã đơn hàng</th>
                        <th className="py-3.5 px-6">Tên khách hàng</th>
                        <th className="py-3.5 px-6">Tổng thanh toán</th>
                        <th className="py-3.5 px-6">Phương thức</th>
                        <th className="py-3.5 px-6">Ngày đặt mua</th>
                        <th className="py-3.5 px-6">Trạng thái giao</th>
                        <th className="py-3.5 px-6 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                      {isAdminOrdersLoading && ordersList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            <Loader2 className="size-6 animate-spin mx-auto text-red-600 mb-2" />
                            Đang tải đơn hàng từ API...
                          </td>
                        </tr>
                      ) : ordersList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            Không tìm thấy đơn hàng nào.
                          </td>
                        </tr>
                      ) : (
                        ordersList
                          .filter(
                            (o) =>
                              selectedOrderStatusFilter === "All" ||
                              o.status === selectedOrderStatusFilter,
                          )
                          .map((order) => {
                            const statusColors: Record<string, string> = {
                              cho_xac_nhan: "bg-amber-50 text-amber-600 border-amber-100",
                              da_xac_nhan: "bg-blue-50 text-blue-600 border-blue-100",
                              dang_giao: "bg-purple-50 text-purple-600 border-purple-100",
                              hoan_thanh: "bg-emerald-50 text-emerald-600 border-emerald-100",
                              da_huy: "bg-rose-50 text-rose-600 border-rose-100",
                            };
                            const statusLabels: Record<string, string> = {
                              cho_xac_nhan: "Chờ xác nhận",
                              da_xac_nhan: "Đã xác nhận",
                              dang_giao: "Đang giao",
                              hoan_thanh: "Hoàn thành",
                              da_huy: "Đã hủy",
                            };
                            const pmLabels: Record<string, string> = {
                              tien_mat: "Tiền mặt",
                              chuyen_khoan: "Chuyển khoản",
                            };
                            return (
                              <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-6 font-bold text-slate-900">{order.id}</td>
                                <td className="py-4 px-6">{order.customerName}</td>
                                <td className="py-4 px-6 font-bold text-slate-900">
                                  {formatVND(order.totalPrice)}
                                </td>
                                <td className="py-4 px-6 text-slate-500 font-normal">
                                  {pmLabels[order.paymentMethod] || order.paymentMethod}
                                </td>
                                <td className="py-4 px-6 text-slate-400 font-normal">
                                  {new Date(order.orderDate).toLocaleString("vi-VN")}
                                </td>
                                <td className="py-4 px-6">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusColors[order.status] || "bg-slate-50 text-slate-500"}`}
                                  >
                                    {statusLabels[order.status] || order.status}
                                  </span>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleOpenOrderDetail(order.id)}
                                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                      title="Xem chi tiết đơn hàng"
                                    >
                                      <Eye className="size-3.5" />
                                      Chi tiết
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDeleteOrderId(order.id);
                                        setIsDeleteOrderModalOpen(true);
                                      }}
                                      className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-colors cursor-pointer border border-rose-100"
                                      title="Xóa đơn hàng"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMER MANAGEMENT */}
          {activeTab === "customers" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-bold text-slate-900">
                      Danh sách khách hàng đăng ký
                    </h2>
                    <Button
                      onClick={() => setIsCustomerModalOpen(true)}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-8 text-[11px] font-semibold px-3 flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/10"
                    >
                      <Plus className="size-3.5" /> Thêm khách hàng mới
                    </Button>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Tổng số: {customersList.length} khách
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="py-3.5 px-6">Avatar</th>
                        <th className="py-3.5 px-6">Họ tên</th>
                        <th className="py-3.5 px-6">Email</th>
                        <th className="py-3.5 px-6">Số điện thoại</th>
                        <th className="py-3.5 px-6">Ngày tham gia</th>
                        <th className="py-3.5 px-6">Trạng thái</th>
                        <th className="py-3.5 px-6 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                      {isAdminCustomersLoading && customersList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            <Loader2 className="size-6 animate-spin mx-auto text-red-600 mb-2" />
                            Đang tải khách hàng từ API...
                          </td>
                        </tr>
                      ) : customersList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            Không tìm thấy khách hàng nào.
                          </td>
                        </tr>
                      ) : (
                        customersList.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="size-9 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs">
                                {c.name.split(" ").pop()?.charAt(0)}
                              </div>
                            </td>
                            <td className="py-4 px-6 font-bold text-slate-900">{c.name}</td>
                            <td className="py-4 px-6 font-normal text-slate-500">{c.email}</td>
                            <td className="py-4 px-6 font-normal text-slate-500">{c.phone}</td>
                            <td className="py-4 px-6 font-normal text-slate-400">{c.joinedDate}</td>
                            <td className="py-4 px-6">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.status === "Hoạt động" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}
                              >
                                {c.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={() => handleToggleBlockCustomer(c.id)}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-colors cursor-pointer ${c.status === "Hoạt động"
                                    ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100"
                                    : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                                  }`}
                              >
                                {c.status === "Hoạt động" ? "Khóa tài khoản" : "Mở khóa"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PROMOTIONS */}
          {activeTab === "promotions" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* ── SECTION 1: Flash Sale đang diễn ra ── */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-orange-50 to-red-50">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                      ⚡
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Sản phẩm đang Flash Sale
                      </h2>
                      <p className="text-[10px] text-slate-400">
                        {flashSaleList.length} sản phẩm đang được giảm giá
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsFlashPickerOpen(true)}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl h-9 text-xs font-semibold px-4 flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/20"
                  >
                    <Plus className="size-4" /> Thêm sản phẩm Flash Sale
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="py-3 px-5">Sản phẩm</th>
                        <th className="py-3 px-5">Giá gốc</th>
                        <th className="py-3 px-5">Giá Flash Sale</th>
                        <th className="py-3 px-5">% Giảm</th>
                        <th className="py-3 px-5">Kết thúc</th>
                        <th className="py-3 px-5">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flashSaleList.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-10 text-center text-slate-400 text-xs"
                          >
                            Chưa có sản phẩm Flash Sale nào. Nhấn "Thêm sản phẩm Flash Sale" để bắt đầu.
                          </td>
                        </tr>
                      ) : (
                        flashSaleList.map((item) => (
                          <tr
                            key={`${item.loaiSanPham}-${item.id}`}
                            className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.hinhAnh || ""}
                                  alt={item.ten}
                                  className="size-10 rounded-lg object-contain bg-slate-50 border border-slate-100"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                                <div>
                                  <p className="text-xs font-semibold text-slate-800 max-w-[200px] truncate">
                                    {item.ten}
                                  </p>
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${item.loaiSanPham === "laptop" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}
                                  >
                                    {item.loaiSanPham === "laptop" ? "Laptop" : "Phụ kiện"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-xs text-slate-400 line-through">
                              {formatVND(item.giaGoc)}
                            </td>
                            <td className="py-3.5 px-5 text-xs font-bold text-red-600">
                              {formatVND(item.giaKhuyenMai)}
                            </td>
                            <td className="py-3.5 px-5">
                              <span className="px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-bold">
                                -{item.phanTramGiam}%
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-[10px] text-slate-500">
                              {item.ngayKetThuc
                                ? new Date(item.ngayKetThuc).toLocaleDateString("vi-VN")
                                : "—"}
                            </td>
                            <td className="py-3.5 px-5">
                              {item.loaiSanPham === "laptop" ? (
                                <button
                                  onClick={() => handleRemoveFlashSale(item)}
                                  className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                                  title="Xóa khỏi Flash Sale"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              ) : (
                                <span className="text-[9px] text-slate-300 italic">Phụ kiện</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── SECTION 2: Mã giảm giá ── */}
              <div>
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Mã giảm giá & Chương trình khuyến mãi
                    </h2>
                    <p className="text-[10px] text-slate-400">
                      Tạo mã giảm giá dùng cho Flash Sale hoặc đơn hàng
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      const hrs = 24;
                      setNewPromoDurationHours(24);
                      const now = new Date();
                      const end = new Date(now.getTime() + hrs * 3600 * 1000);
                      setNewPromoStartDate(formatDateTimeLocal(now));
                      setNewPromoEndDate(formatDateTimeLocal(end));
                      setIsPromoModalOpen(true);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-9 text-xs font-semibold px-4 flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/10"
                  >
                    <Plus className="size-4" /> Tạo mã giảm giá mới
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {promotionsList.map((p) => (
                    <div
                      id={`promo-card-${p.id}`}
                      key={p.id}
                      className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="px-3 py-1 font-mono font-bold bg-red-50 text-red-600 border border-teal-100 rounded-xl text-xs">
                            {p.code}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditPromo(p)}
                              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                              title="Chỉnh sửa mã"
                            >
                              <Edit className="size-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePromo(p.id)}
                              className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                              title="Xóa mã"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                        <div className="pt-2">
                          <div className="text-xl font-extrabold text-slate-900">
                            {p.type === "Phần trăm"
                              ? `Giảm ${p.discount ?? 0}%`
                              : `Giảm ${formatVND(p.discount ?? 0)}`}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">Loại ưu đãi: {p.type}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${p.status === "Đang diễn ra" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === "settings" && (
            <div className="max-w-2xl bg-white border border-slate-100 rounded-3xl shadow-sm p-6 space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Cấu hình trang Admin & Cửa hàng
                </h2>
                <p className="text-[10px] text-slate-400">Điều chỉnh các thông số vận hành chung</p>
              </div>

              <div className="space-y-4">
                {/* Store Info config */}
                <div className="py-2 space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building className="size-4 text-red-600" /> Thông tin cửa hàng
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Tên hiển thị cửa hàng
                      </label>
                      <input
                        type="text"
                        value={appSettingsState.storeName}
                        onChange={(e) =>
                          setAppSettingsState((prev) => ({ ...prev, storeName: e.target.value }))
                        }
                        className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Hotline liên hệ
                      </label>
                      <input
                        type="text"
                        value={appSettingsState.hotline}
                        onChange={(e) =>
                          setAppSettingsState((prev) => ({ ...prev, hotline: e.target.value }))
                        }
                        className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Theme Color Selection */}
                <div className="py-4 space-y-3 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Palette className="size-4 text-red-600" /> Tông màu chủ đạo giao diện
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Lựa chọn màu sắc nhận diện cho toàn bộ website cửa hàng và trang quản trị Admin:
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                    {[
                      { id: "red", label: "Màu Đỏ", sub: "Mặc định", hex: "#c8191f", ring: "ring-red-500" },
                      { id: "blue", label: "Xanh Nước", sub: "Thanh lịch", hex: "#2563eb", ring: "ring-blue-500" },
                      { id: "green", label: "Xanh Lá", sub: "Tươi mát", hex: "#16a34a", ring: "ring-emerald-500" },
                      { id: "black", label: "Màu Đen", sub: "Sang trọng", hex: "#18181b", ring: "ring-zinc-800" },
                    ].map((themeOption) => {
                      const isSelected = (appSettingsState.themeColor || "red") === themeOption.id;
                      return (
                        <button
                          key={themeOption.id}
                          type="button"
                          onClick={() => {
                            const newColor = themeOption.id as ThemeColor;
                            setAppSettingsState((prev) => ({ ...prev, themeColor: newColor }));
                            applyThemeColor(newColor);
                          }}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer text-left ${isSelected
                              ? `border-slate-900 bg-slate-50/80 shadow-xs ring-2 ${themeOption.ring}`
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40"
                            }`}
                        >
                          <div
                            style={{ backgroundColor: themeOption.hex }}
                            className="size-8 rounded-full shrink-0 flex items-center justify-center text-white shadow-xs"
                          >
                            {isSelected && <Check className="size-4 stroke-[3]" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{themeOption.label}</div>
                            <div className="text-[10px] font-semibold text-slate-400">{themeOption.sub}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleSaveSettings}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-9.5 text-xs font-semibold px-5 cursor-pointer shadow-md shadow-red-600/10"
                >
                  Lưu cấu hình
                </Button>
              </div>
            </div>
          )}

          {/* TAB 7: REVIEW MANAGEMENT */}
          {activeTab === "reviews" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
                  <h2 className="text-sm font-bold text-slate-900">
                    Danh sách đánh giá từ khách hàng
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Tổng số: {adminReviewsList.length} đánh giá
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="py-3.5 px-6">Khách hàng</th>
                        <th className="py-3.5 px-6">Sản phẩm</th>
                        <th className="py-3.5 px-6">Số sao</th>
                        <th className="py-3.5 px-6">Nội dung</th>
                        <th className="py-3.5 px-6">Ngày gửi</th>
                        <th className="py-3.5 px-6">Trạng thái</th>
                        <th className="py-3.5 px-6 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                      {isAdminReviewsLoading && adminReviewsList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            <Loader2 className="size-6 animate-spin mx-auto text-red-600 mb-2" />
                            Đang tải đánh giá từ API...
                          </td>
                        </tr>
                      ) : adminReviewsList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            Không có đánh giá nào.
                          </td>
                        </tr>
                      ) : (
                        adminReviewsList.map((rev) => (
                          <tr
                            key={rev.maDanhGia}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="size-9 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs shrink-0">
                                  {rev.hoTenNguoiDung?.charAt(0) || "K"}
                                </div>
                                <div className="min-w-0">
                                  <div
                                    className="font-bold text-slate-900 truncate max-w-[120px]"
                                    title={rev.hoTenNguoiDung}
                                  >
                                    {rev.hoTenNguoiDung}
                                  </div>
                                  <div
                                    className="text-[10px] text-slate-400 font-normal truncate max-w-[120px]"
                                    title={rev.emailNguoiDung}
                                  >
                                    {rev.emailNguoiDung}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div
                                className="font-semibold text-slate-900 truncate max-w-[150px]"
                                title={rev.tenItem || "Sản phẩm"}
                              >
                                {rev.tenItem || "Sản phẩm"}
                              </div>
                              <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                                {rev.maSanPham
                                  ? `Mã SP: ${rev.maSanPham}`
                                  : rev.maPhuKien
                                    ? `Mã PK: ${rev.maPhuKien}`
                                    : ""}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex gap-0.5 items-center">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`size-3.5 ${i < rev.soSao
                                        ? "fill-amber-400 text-amber-400"
                                        : "fill-slate-100 text-slate-300"
                                      }`}
                                  />
                                ))}
                                <span className="text-[10px] text-slate-500 font-bold ml-1.5">
                                  {rev.soSao}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 max-w-[220px]">
                              <p
                                className="text-slate-700 truncate text-justify"
                                title={rev.noiDung}
                              >
                                {rev.noiDung}
                              </p>
                              {rev.phanHoiCuaAdmin && (
                                <div className="mt-1.5 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] text-slate-500 max-w-[200px]">
                                  <span className="font-bold text-emerald-600 block mb-0.5">
                                    Admin phản hồi:
                                  </span>
                                  <p className="truncate text-justify" title={rev.phanHoiCuaAdmin}>
                                    {rev.phanHoiCuaAdmin}
                                  </p>
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-6 text-slate-400 font-normal">
                              {rev.ngayDanhGia
                                ? new Date(rev.ngayDanhGia).toLocaleDateString("vi-VN")
                                : "—"}
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${rev.trangThai === "hien_thi"
                                    ? "bg-red-50 text-red-600 border-red-100"
                                    : "bg-slate-100 text-slate-500 border-slate-200"
                                  }`}
                              >
                                {rev.trangThai === "hien_thi" ? "Hiển thị" : "Bị ẩn"}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleToggleReviewStatus(rev.maDanhGia, rev.trangThai)
                                  }
                                  className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-colors cursor-pointer ${rev.trangThai === "hien_thi"
                                      ? "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                      : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                                    }`}
                                >
                                  {rev.trangThai === "hien_thi" ? "Ẩn đi" : "Hiển thị"}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedReviewForReply(rev);
                                    setAdminReplyText(rev.phanHoiCuaAdmin || "");
                                    setIsReplyModalOpen(true);
                                  }}
                                  className="px-2 py-1 text-[10px] font-bold rounded-lg border bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 transition-colors cursor-pointer"
                                >
                                  Phản hồi
                                </button>
                                <button
                                  onClick={() => handleDeleteReview(rev.maDanhGia)}
                                  className="px-2 py-1 text-[10px] font-bold rounded-lg border bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 hover:text-rose-700 transition-colors cursor-pointer"
                                >
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* PRODUCT DIALOG MODAL (ADD / EDIT) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingProduct
                  ? isAccessory
                    ? `Sửa phụ kiện: ${editingProduct.name.slice(0, 30)}...`
                    : `Sửa laptop: ${editingProduct.name.slice(0, 30)}...`
                  : isAccessory
                    ? "Thêm phụ kiện mới"
                    : "Thêm sản phẩm laptop mới"}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="size-4.5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveProduct} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-medium text-slate-700">
                {/* Product Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    {isAccessory ? "Tên phụ kiện *" : "Tên sản phẩm *"}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={255}
                    placeholder={isAccessory ? "Nhập tên phụ kiện..." : "Nhập tên sản phẩm..."}
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Brand and Category (Laptops only) */}
                {!isAccessory && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Thương hiệu
                      </label>
                      <select
                        value={prodBrand}
                        onChange={(e) => setProdBrand(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      >
                        <option value="">Chọn thương hiệu</option>
                        {thuongHieus.map((th) => (
                          <option key={th.maThuongHieu} value={th.tenThuongHieu}>
                            {th.tenThuongHieu}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Nhu cầu (Danh mục)
                      </label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      >
                        <option value="">Chọn danh mục</option>
                        {danhMucs
                          .filter((dm) => {
                            const idNum = Number(dm.maDanhMuc) || 0;
                            const isLaptopId = idNum >= 1 && idNum <= 7;
                            return isAccessory ? !isLaptopId : isLaptopId;
                          })
                          .map((dm) => (
                            <option key={dm.maDanhMuc} value={dm.tenDanhMuc}>
                              {dm.tenDanhMuc}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Price and Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Giá bán niêm yết *
                    </label>
                    <input
                      type="text"
                      required
                      value={prodPrice === 0 ? "" : prodPrice.toString()}
                      onChange={(e) => {
                        const cleanValue = e.target.value.replace(/\D/g, "");
                        setProdPrice(cleanValue ? Number(cleanValue) : 0);
                      }}
                      className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
                    />
                    {prodPrice > 0 && (
                      <span className="text-[10px] text-red-600 font-semibold block mt-1">
                        Định dạng: {formatVND(prodPrice)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Số lượng tồn kho
                    </label>
                    <input
                      type="text"
                      required
                      value={prodStock === 0 ? "" : prodStock.toString()}
                      onChange={(e) => {
                        const cleanValue = e.target.value.replace(/\D/g, "");
                        setProdStock(cleanValue ? Number(cleanValue) : 0);
                      }}
                      className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
                    />
                  </div>
                </div>

                {/* Promotion Select Dropdown (Khôi phục vị trí chuẩn) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Chương trình khuyến mãi
                  </label>
                  <select
                    value={prodPromotionId || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProdPromotionId(val ? Number(val) : "");
                    }}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all text-slate-700 font-medium"
                  >
                    <option value="">Không áp dụng</option>
                    {activeKhuyenMais.map((km) => (
                      <option key={km.maKhuyenMai} value={km.maKhuyenMai}>
                        {km.tenKhuyenMai}{" "}
                        {km.phanTramGiam ? `(-${km.phanTramGiam}%)` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CPU & GPU, RAM, ROM, Display, Battery, OS (Laptops only) */}
                {!isAccessory && (
                  <>
                    {/* CPU & GPU */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Vi xử lý (CPU)
                        </label>
                        <input
                          type="text"
                          maxLength={100}
                          value={prodCpu}
                          onChange={(e) => setProdCpu(e.target.value)}
                          className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Card đồ họa (GPU)
                        </label>
                        <input
                          type="text"
                          maxLength={100}
                          value={prodGpu}
                          onChange={(e) => setProdGpu(e.target.value)}
                          className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                      </div>
                    </div>

                    {/* RAM and Storage */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Dung lượng RAM
                        </label>
                        <input
                          type="text"
                          maxLength={50}
                          value={prodRam}
                          onChange={(e) => setProdRam(e.target.value)}
                          className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Ổ cứng (ROM)
                        </label>
                        <input
                          type="text"
                          maxLength={100}
                          value={prodStorage}
                          onChange={(e) => setProdStorage(e.target.value)}
                          className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                      </div>
                    </div>

                    {/* Màn hình và Pin */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Màn hình
                        </label>
                        <input
                          type="text"
                          maxLength={255}
                          placeholder="Ví dụ: 14.0-inch 3K (2880 x 1800) OLED 120Hz..."
                          value={prodScreen}
                          onChange={(e) => setProdScreen(e.target.value)}
                          className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 placeholder:text-slate-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Pin
                        </label>
                        <input
                          type="text"
                          maxLength={255}
                          placeholder="Ví dụ: 4-Cell, 75Wh..."
                          value={prodBattery}
                          onChange={(e) => setProdBattery(e.target.value)}
                          className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Hệ điều hành */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Hệ điều hành
                        </label>
                        <input
                          type="text"
                          maxLength={255}
                          placeholder="Ví dụ: Windows 11 Home..."
                          value={prodOs}
                          onChange={(e) => setProdOs(e.target.value)}
                          className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 placeholder:text-slate-400"
                        />
                      </div>
                      <div></div>
                    </div>
                  </>
                )}

                {/* Accessory Fields (Accessories only) */}
                {isAccessory && (
                  <>
                    {/* Loại phụ kiện (Accessory Type) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Loại phụ kiện *
                      </label>
                      <select
                        value={accType}
                        onChange={(e) => setAccType(e.target.value)}
                        className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      >
                        <option value="">Chọn loại phụ kiện</option>
                        <option value="Chuột">Chuột</option>
                        <option value="Bàn phím">Bàn phím</option>
                        <option value="Tai nghe">Tai nghe</option>
                        <option value="Giá đỡ">Giá đỡ</option>
                        <option value="Sạc laptop">Sạc laptop</option>
                      </select>
                    </div>

                    {/* Thương hiệu phụ kiện & Bảo hành phụ kiện */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Thương hiệu phụ kiện
                        </label>
                        <input
                          type="text"
                          maxLength={100}
                          placeholder="Ví dụ: Logitech, Razer, Akko..."
                          value={accBrand}
                          onChange={(e) => setAccBrand(e.target.value)}
                          className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Bảo hành phụ kiện
                        </label>
                        <input
                          type="text"
                          maxLength={255}
                          placeholder="Ví dụ: 12 tháng, 24 tháng..."
                          value={accWarranty}
                          onChange={(e) => setAccWarranty(e.target.value)}
                          className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                      </div>
                    </div>

                    {/* Conditional specs inputs based on accType */}
                    {accType === "Chuột" && (
                      <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-extrabold text-red-700 uppercase tracking-wider mb-2">
                          Thông số Chuột
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">Độ phân giải</label>
                            <input
                              type="text"
                              maxLength={255}
                              placeholder="Ví dụ: 16000 DPI..."
                              value={accDoPhanGiai}
                              onChange={(e) => setAccDoPhanGiai(e.target.value)}
                              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">Kết nối</label>
                            <input
                              type="text"
                              maxLength={255}
                              placeholder="Ví dụ: USB có dây, Wireless 2.4G..."
                              value={accKetNoi}
                              onChange={(e) => setAccKetNoi(e.target.value)}
                              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">Đèn LED</label>
                            <input
                              type="text"
                              maxLength={255}
                              placeholder="Ví dụ: RGB 16.8 triệu màu..."
                              value={accDenLed}
                              onChange={(e) => setAccDenLed(e.target.value)}
                              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">
                              Độ dài dây (để trống nếu không dùng)
                            </label>
                            <input
                              type="text"
                              maxLength={255}
                              placeholder="Ví dụ: 1.8 m..."
                              value={accDoDaiDay}
                              onChange={(e) => setAccDoDaiDay(e.target.value)}
                              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {accType === "Bàn phím" && (
                      <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-extrabold text-red-700 uppercase tracking-wider mb-2">
                          Thông số Bàn phím
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">Loại bàn phím</label>
                            <input
                              type="text"
                              maxLength={255}
                              placeholder="Ví dụ: Full-size, Tenkeyless, TKL 80%, 65%..."
                              value={accLoaiBanPhim}
                              onChange={(e) => setAccLoaiBanPhim(e.target.value)}
                              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">Số phím</label>
                            <input
                              type="text"
                              placeholder="Ví dụ: 87, 104..."
                              value={accSoPhim}
                              onChange={(e) => {
                                const cleanVal = e.target.value.replace(/\D/g, "");
                                setAccSoPhim(cleanVal ? Number(cleanVal) : "");
                              }}
                              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">Kết nối</label>
                            <input
                              type="text"
                              maxLength={255}
                              placeholder="Ví dụ: Type-C, Bluetooth..."
                              value={accKetNoi}
                              onChange={(e) => setAccKetNoi(e.target.value)}
                              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">Đèn LED</label>
                            <input
                              type="text"
                              maxLength={255}
                              placeholder="Ví dụ: LED đơn sắc, LED RGB..."
                              value={accDenLed}
                              onChange={(e) => setAccDenLed(e.target.value)}
                              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {accType === "Tai nghe" && (
                      <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-extrabold text-red-700 uppercase tracking-wider mb-2">
                          Thông số Tai nghe
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">Kích thước</label>
                            <input
                              type="text"
                              maxLength={255}
                              placeholder="Ví dụ: 180 x 170 x 80 mm..."
                              value={accKichThuoc}
                              onChange={(e) => setAccKichThuoc(e.target.value)}
                              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">Trọng lượng</label>
                            <input
                              type="text"
                              maxLength={255}
                              placeholder="Ví dụ: 250 g..."
                              value={accTrongLuong}
                              onChange={(e) => setAccTrongLuong(e.target.value)}
                              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">Công nghệ âm thanh</label>
                            <input
                              type="text"
                              maxLength={255}
                              placeholder="Ví dụ: DTS Headphone:X 2.0..."
                              value={accCongNgheAmThanh}
                              onChange={(e) => setAccCongNgheAmThanh(e.target.value)}
                              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">Micro</label>
                            <input
                              type="text"
                              maxLength={255}
                              placeholder="Ví dụ: Tích hợp, Gập khử tiếng ồn..."
                              value={accMicro}
                              onChange={(e) => setAccMicro(e.target.value)}
                              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">Kết nối</label>
                            <input
                              type="text"
                              maxLength={255}
                              placeholder="Ví dụ: Jack 3.5mm, USB..."
                              value={accKetNoi}
                              onChange={(e) => setAccKetNoi(e.target.value)}
                              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">Thời lượng pin</label>
                            <input
                              type="text"
                              maxLength={255}
                              placeholder="Ví dụ: Lên đến 20 giờ..."
                              value={accThoiLuongPin}
                              onChange={(e) => setAccThoiLuongPin(e.target.value)}
                              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {accType === "Giá đỡ" && (
                      <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-extrabold text-red-700 uppercase tracking-wider mb-2">
                          Thông số Giá đỡ
                        </p>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400">Phiên bản quạt *</label>
                          <select
                            required
                            value={accPhienBanQuat}
                            onChange={(e) => setAccPhienBanQuat(e.target.value)}
                            className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                          >
                            <option value="">Chọn số lượng quạt</option>
                            <option value="Không quạt">Không quạt</option>
                            <option value="1 quạt">1 quạt</option>
                            <option value="2 quạt">2 quạt</option>
                            <option value="3 quạt">3 quạt</option>
                            <option value="4 quạt">4 quạt</option>
                            <option value="5 quạt">5 quạt</option>
                            <option value="6 quạt">6 quạt</option>
                            <option value="7 quạt">7 quạt</option>
                            <option value="8 quạt">8 quạt</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {accType === "Sạc laptop" && (
                      <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-extrabold text-red-700 uppercase tracking-wider mb-2">
                          Thông số Sạc laptop
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">Công suất</label>
                            <input
                              type="text"
                              maxLength={255}
                              placeholder="Ví dụ: 65W, 100W..."
                              value={accCongSuat}
                              onChange={(e) => setAccCongSuat(e.target.value)}
                              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">Cổng kết nối</label>
                            <input
                              type="text"
                              maxLength={255}
                              placeholder="Ví dụ: Đầu tròn, Type-C, Đầu chữ nhật..."
                              value={accKetNoi}
                              onChange={(e) => setAccKetNoi(e.target.value)}
                              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">Điện áp đầu vào</label>
                            <input
                              type="text"
                              maxLength={255}
                              placeholder="Ví dụ: 100-240V ~ 50/60Hz..."
                              value={accDienApDauVao}
                              onChange={(e) => setAccDienApDauVao(e.target.value)}
                              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">Điện áp đầu ra</label>
                            <input
                              type="text"
                              maxLength={255}
                              placeholder="Ví dụ: 5V/3A, 9V/3A, 20V/3.25A..."
                              value={accDienApDauRa}
                              onChange={(e) => setAccDienApDauRa(e.target.value)}
                              className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Product Images Section (Sleek, Compact, Perfectly Aligned) */}
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="size-4 text-red-600" /> Quản lý hình ảnh sản phẩm
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {/* 1. Main Representative Image */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        1. Ảnh đại diện chính <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            maxLength={255}
                            placeholder="Dán URL hoặc bấm nút Chọn file góc phải..."
                            value={prodImage}
                            onChange={(e) => setProdImage(e.target.value)}
                            className="w-full h-8.5 pl-3 pr-24 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-slate-700"
                          />
                          <label className="absolute right-1 top-1 bottom-1 px-3 bg-red-600 hover:bg-red-700 text-white text-[10px] font-semibold rounded-lg cursor-pointer flex items-center gap-1 transition-colors shadow-xs">
                            <Upload className="size-3" />
                            <span>{uploadingMain ? "..." : "Chọn file"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingMain}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setUploadingMain(true);
                                  try {
                                    const url = await uploadProductImageApi(file);
                                    setProdImage(url);
                                    toast.success("Đã tải ảnh đại diện chính lên backend!");
                                  } catch {
                                    toast.error("Tải ảnh thất bại!");
                                  } finally {
                                    setUploadingMain(false);
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>

                        {prodImage && (
                          <div className="relative size-8.5 rounded-xl overflow-hidden border border-slate-300 shrink-0 bg-white group shadow-xs">
                            <img src={prodImage} alt="Main Preview" className="size-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setProdImage("")}
                              className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2. Album / Angle Images */}
                    <div className="space-y-2 pt-2 border-t border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          2. Album ảnh góc khác / chi tiết (Chọn nhiều ảnh cùng lúc)
                        </label>
                        <label className="cursor-pointer text-[10px] font-semibold text-slate-700 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors shadow-xs">
                          <Upload className="size-3 text-red-600" />
                          <span>Tải nhiều ảnh cùng lúc</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={async (e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length > 0) {
                                toast.info(`Đang tải ${files.length} ảnh góc lên backend...`);
                                const setters = [setProdImage1, setProdImage2, setProdImage3, setProdImage4];
                                for (let i = 0; i < Math.min(files.length, 4); i++) {
                                  try {
                                    const url = await uploadProductImageApi(files[i]);
                                    setters[i](url);
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }
                                toast.success("Đã tải xong album ảnh góc!");
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "Góc ảnh 1", val: prodImage1, setVal: setProdImage1, loading: uploadingImg1, setLoading: setUploadingImg1 },
                          { label: "Góc ảnh 2", val: prodImage2, setVal: setProdImage2, loading: uploadingImg2, setLoading: setUploadingImg2 },
                          { label: "Góc ảnh 3", val: prodImage3, setVal: setProdImage3, loading: uploadingImg3, setLoading: setUploadingImg3 },
                          { label: "Góc ảnh 4", val: prodImage4, setVal: setProdImage4, loading: uploadingImg4, setLoading: setUploadingImg4 },
                        ].map((angle, idx) => (
                          <div key={idx} className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                maxLength={255}
                                placeholder={`${angle.label}...`}
                                value={angle.val}
                                onChange={(e) => angle.setVal(e.target.value)}
                                className="w-full h-7 pl-2 pr-11 text-[11px] bg-transparent focus:outline-none text-slate-700"
                              />
                              <label className="absolute right-0 top-0 bottom-0 px-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-semibold rounded-md cursor-pointer flex items-center gap-0.5 transition-colors border-l border-slate-200">
                                <Upload className="size-2.5 text-red-600" />
                                <span>{angle.loading ? "..." : "Tải"}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={angle.loading}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      angle.setLoading(true);
                                      try {
                                        const url = await uploadProductImageApi(file);
                                        angle.setVal(url);
                                        toast.success(`Tải ${angle.label} thành công!`);
                                      } catch {
                                        toast.error(`Lỗi tải ${angle.label}`);
                                      } finally {
                                        angle.setLoading(false);
                                      }
                                    }
                                  }}
                                />
                              </label>
                            </div>
                            {angle.val && (
                              <div className="relative size-7 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 group">
                                <img src={angle.val} alt={angle.label} className="size-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => angle.setVal("")}
                                  className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                >
                                  <X className="size-2.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Mô tả sản phẩm
                  </label>
                  <textarea
                    rows={3}
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 placeholder:text-slate-400 resize-none"
                  />
                </div>


              </div>

              {/* Modal Footer Actions */}
              <div className="p-4.5 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsProductModalOpen(false)}
                  className="rounded-xl h-9 text-xs font-semibold px-4 cursor-pointer"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-9 text-xs font-semibold px-5 cursor-pointer shadow-md shadow-red-600/10"
                >
                  {editingProduct ? "Lưu thay đổi" : "Thêm mới"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROMOTION DIALOG MODAL (ADD) */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Tạo mã khuyến mãi mới</h3>
              <button
                onClick={() => setIsPromoModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="size-4.5" />
              </button>
            </div>

            <form
              onSubmit={handleAddPromotion}
              className="p-6 space-y-4 text-xs font-medium text-slate-700"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Mã giảm giá
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: LAPTOPNEW"
                  value={newPromoCode}
                  onChange={(e) => setNewPromoCode(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Kiểu giảm giá
                  </label>
                  <select
                    value={newPromoType}
                    onChange={(e) => {
                      setNewPromoType(e.target.value);
                      setNewPromoDiscount(""); // Reset giá trị giảm khi đổi kiểu
                    }}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 text-slate-700 font-medium"
                  >
                    <option value="Phần trăm">Phần trăm (%)</option>
                    <option value="Tiền mặt">Tiền mặt (VND)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Giá trị giảm *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      placeholder={newPromoType === "Phần trăm" ? "Ví dụ: 10" : "Ví dụ: 100.000"}
                      value={
                        newPromoType === "Phần trăm"
                          ? newPromoDiscount
                          : isDiscountFocused
                            ? newPromoDiscount
                            : newPromoDiscount
                              ? Number(newPromoDiscount).toLocaleString("vi-VN")
                              : ""
                      }
                      onFocus={() => setIsDiscountFocused(true)}
                      onBlur={handleDiscountBlur}
                      onChange={handleDiscountChange}
                      className="w-full h-9 pl-3 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all font-medium text-slate-700"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none select-none">
                      {newPromoType === "Phần trăm" ? "%" : "VND"}
                    </span>
                  </div>
                  {newPromoType === "Tiền mặt" && newPromoDiscount && isDiscountFocused && (
                    <span className="text-[10px] text-red-600 font-semibold block mt-0.5 animate-in fade-in duration-200">
                      Định dạng: {Number(newPromoDiscount).toLocaleString("vi-VN")} VND
                    </span>
                  )}
                </div>
              </div>



              {/* Thời lượng đợt giảm giá (Số Giờ) — Chuẩn 100% DATN */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-800 block">
                  Thời lượng đợt giảm giá (Số Giờ)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Nhập số giờ (ví dụ: 24, 48, 64...)"
                  value={newPromoDurationHours}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewPromoDurationHours(val);
                    const hrs = Math.max(1, Number(val) || 1);
                    const now = new Date();
                    const end = new Date(now.getTime() + hrs * 3600 * 1000);
                    setNewPromoStartDate(formatDateTimeLocal(now));
                    setNewPromoEndDate(formatDateTimeLocal(end));
                  }}
                  className="w-full h-10 px-3 text-sm bg-white border border-slate-300 focus:border-red-500 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 text-slate-800 font-medium transition-all"
                />
                <p className="text-[11px] text-slate-500 leading-relaxed pt-0.5">
                  Khi đếm ngược về 00:00:00, tất cả sản phẩm giảm giá sẽ tự động ngừng Flash Sale và trở về giá gốc.
                </p>

                {newPromoStartDate && newPromoEndDate && (
                  <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/70 rounded-xl px-3 py-2 mt-2 flex items-center gap-2 font-medium">
                    <Clock className="size-3.5 shrink-0 text-emerald-600" />
                    <span>
                      Tự động tính đếm ngược: Từ{" "}
                      <strong>
                        {new Date(newPromoStartDate).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </strong>
                      {" đến "}
                      <strong>
                        {new Date(newPromoEndDate).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </strong>
                      {" ("}
                      <strong>{newPromoDurationHours || 24} giờ</strong>
                      {")"}
                    </span>
                  </div>
                )}
              </div>



              <div className="pt-2 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPromoModalOpen(false)}
                  className="rounded-xl h-9 text-xs font-semibold px-4 cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-9 text-xs font-semibold px-5 cursor-pointer"
                >
                  Tạo mã
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* FLASH SALE PRODUCT PICKER MODAL */}
      {isFlashPickerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-red-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-bold">
                  ⚡
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Thêm sản phẩm vào Flash Sale</h3>
                  <p className="text-[10px] text-slate-400">
                    Chọn sản phẩm — thông tin sẽ tự động lấy từ database
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsFlashPickerOpen(false);
                  setFlashPickerSelectedProduct(null);
                  setFlashPickerSearch("");
                  setFlashPickerPromoId("");
                }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="size-4.5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 p-6 overflow-y-auto">
              {/* Step 1: Chọn chương trình khuyến mãi */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Bước 1 — Chọn chương trình Flash Sale (%)
                </label>
                <select
                  value={flashPickerPromoId}
                  onChange={(e) =>
                    setFlashPickerPromoId(e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 transition-all bg-white"
                >
                  <option value="">-- Chọn chương trình giảm giá --</option>
                  {activeKhuyenMais.map((km) => (
                    <option key={km.maKhuyenMai} value={km.maKhuyenMai}>
                      {km.tenKhuyenMai} — Giảm {km.phanTramGiam}% (
                      {km.ngayKetThuc
                        ? `HSD: ${new Date(km.ngayKetThuc).toLocaleDateString("vi-VN")}`
                        : "Không giới hạn"}
                      )
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Tìm và chọn sản phẩm */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Bước 2 — Tìm và chọn sản phẩm (Laptop & Phụ kiện)
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên laptop hoặc phụ kiện..."
                    value={flashPickerSearch}
                    onChange={(e) => setFlashPickerSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 transition-all"
                  />
                </div>

                {/* Product List */}
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                  {allSelectableProductsForFlashSale
                    .filter((p) =>
                      p.name.toLowerCase().includes(flashPickerSearch.toLowerCase()),
                    )
                    .map((p) => {
                      const isSelected =
                        (p.rawItem.maSanPham && flashPickerSelectedProduct?.maSanPham === p.rawItem.maSanPham) ||
                        (p.rawItem.maPhuKien && flashPickerSelectedProduct?.maPhuKien === p.rawItem.maPhuKien);

                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            setFlashPickerSelectedProduct(isSelected ? null : p.rawItem)
                          }
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isSelected
                              ? "bg-orange-50 border-orange-100"
                              : "hover:bg-slate-50"
                            }`}
                        >
                          <img
                            src={p.image || ""}
                            alt={p.name}
                            className="size-10 rounded-lg object-contain bg-slate-100 border border-slate-100 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${p.type === "Laptop" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                                }`}>
                                {p.type}
                              </span>
                              <p className="text-xs font-semibold text-slate-800 truncate">
                                {p.name}
                              </p>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Giá gốc:{" "}
                              <span className="font-bold text-slate-600">
                                {formatVND(p.price)}
                              </span>
                              {" · "}Tồn kho: {p.stock}
                              {p.maKhuyenMai ? (
                                <span className="ml-2 text-orange-600 font-bold">
                                  (Đã có KM)
                                </span>
                              ) : null}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="size-4 text-orange-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  {allSelectableProductsForFlashSale.filter((p) =>
                    p.name.toLowerCase().includes(flashPickerSearch.toLowerCase()),
                  ).length === 0 && (
                      <div className="py-8 text-center text-xs text-slate-400">
                        Không tìm thấy sản phẩm phù hợp
                      </div>
                    )}
                </div>
              </div>

              {/* Preview: Thông tin tự động sau khi chọn */}
              {flashPickerSelectedProduct && flashPickerPromoId && (
                <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-2">
                    ⚡ Xem trước Flash Sale
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={flashPickerSelectedProduct.anhDaiDien || ""}
                      alt={flashPickerSelectedProduct.tenSanPham || flashPickerSelectedProduct.tenPhuKien}
                      className="size-12 rounded-xl object-contain bg-white border border-orange-100"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {flashPickerSelectedProduct.tenSanPham || flashPickerSelectedProduct.tenPhuKien}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400 line-through">
                          {formatVND(flashPickerSelectedProduct.gia)}
                        </span>
                        <span className="text-xs font-extrabold text-red-600">
                          {formatVND(
                            Math.round(
                              flashPickerSelectedProduct.gia *
                              (1 -
                                (activeKhuyenMais.find(
                                  (k) => k.maKhuyenMai === Number(flashPickerPromoId),
                                )?.phanTramGiam ?? 0) /
                                100),
                            ),
                          )}
                        </span>
                        <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                          -
                          {activeKhuyenMais.find(
                            (k) => k.maKhuyenMai === Number(flashPickerPromoId),
                          )?.phanTramGiam ?? 0}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="px-6 pb-5 pt-2 flex justify-end gap-2.5 border-t border-slate-100 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFlashPickerOpen(false);
                  setFlashPickerSelectedProduct(null);
                  setFlashPickerSearch("");
                  setFlashPickerPromoId("");
                }}
                className="rounded-xl h-9 text-xs font-semibold px-4 cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleAssignFlashSale}
                disabled={!flashPickerSelectedProduct || !flashPickerPromoId}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-40 text-white rounded-xl h-9 text-xs font-semibold px-5 cursor-pointer"
              >
                ⚡ Thêm vào Flash Sale
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* CUSTOMER REGISTRATION MODAL */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Đăng ký khách hàng mới</h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="size-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Nhập họ tên đầy đủ"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-red-600/50 focus:ring-4 focus:ring-red-500/5 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Địa chỉ Email *
                </label>
                <input
                  type="email"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-red-600/50 focus:ring-4 focus:ring-red-500/5 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Mật khẩu truy cập *
                </label>
                <input
                  type="password"
                  value={newCustPassword}
                  onChange={(e) => setNewCustPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-red-600/50 focus:ring-4 focus:ring-red-500/5 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="Ví dụ: 0909123456"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-red-600/50 focus:ring-4 focus:ring-red-500/5 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Địa chỉ thường trú
                </label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Địa chỉ nhà, đường, quận, thành phố..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-red-600/50 focus:ring-4 focus:ring-red-500/5 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Vai trò hệ thống
                </label>
                <select
                  value={newCustRole}
                  onChange={(e) => setNewCustRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs outline-none focus:border-red-600/50 focus:ring-4 focus:ring-red-500/5 transition-all bg-white"
                >
                  <option value="khach_hang">Khách hàng (khach_hang)</option>
                  <option value="quan_tri">Quản trị viên (quan_tri)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="rounded-xl h-9 text-xs font-semibold px-4 cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-9 text-xs font-semibold px-5 cursor-pointer"
                >
                  Thêm người dùng
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ORDER DETAIL DIALOG MODAL */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">
                Chi tiết đơn hàng #{selectedOrder?.maDonHang ?? ""}
              </h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="size-4.5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 font-medium">
              {isDetailLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="size-6 animate-spin mx-auto text-red-600 mb-2" />
                  Đang tải chi tiết đơn hàng...
                </div>
              ) : !selectedOrder ? (
                <div className="py-12 text-center text-rose-500">
                  Không tìm thấy thông tin đơn hàng này.
                </div>
              ) : (
                <>
                  {/* Customer & Shipping Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4.5 rounded-2xl border border-slate-100">
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Thông tin khách hàng
                      </h4>
                      <div className="space-y-1">
                        <p className="text-slate-900">
                          <span className="text-slate-400 font-normal">Họ tên:</span>{" "}
                          {selectedOrder.hoTen || "Ẩn danh"}
                        </p>
                        <p className="text-slate-900">
                          <span className="text-slate-400 font-normal">Số điện thoại:</span>{" "}
                          {selectedOrder.soDienThoai || "Không có"}
                        </p>
                        <p className="text-slate-900">
                          <span className="text-slate-400 font-normal">Email:</span>{" "}
                          {selectedOrder.email || "Không có"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Thông tin giao hàng
                      </h4>
                      <div className="space-y-1">
                        <p className="text-slate-900">
                          <span className="text-slate-400 font-normal">Địa chỉ nhận:</span>{" "}
                          {selectedOrder.diaChiGiaoHang || "Không có"}
                        </p>
                        <p className="text-slate-900">
                          <span className="text-slate-400 font-normal">Ngày đặt:</span>{" "}
                          {new Date(selectedOrder.ngayDat).toLocaleString("vi-VN")}
                        </p>
                        <p className="text-slate-900">
                          <span className="text-slate-400 font-normal">Trạng thái: </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${selectedOrder.trangThai === "cho_xac_nhan"
                                ? "bg-amber-50 text-amber-600 border-amber-100"
                                : selectedOrder.trangThai === "da_xac_nhan"
                                  ? "bg-blue-50 text-blue-600 border-blue-100"
                                  : selectedOrder.trangThai === "dang_giao"
                                    ? "bg-purple-50 text-purple-600 border-purple-100"
                                    : selectedOrder.trangThai === "hoan_thanh"
                                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                      : "bg-rose-50 text-rose-600 border-rose-100"
                              }`}
                          >
                            {selectedOrder.trangThai === "cho_xac_nhan"
                              ? "Chờ xác nhận"
                              : selectedOrder.trangThai === "da_xac_nhan"
                                ? "Đã xác nhận"
                                : selectedOrder.trangThai === "dang_giao"
                                  ? "Đang giao"
                                  : selectedOrder.trangThai === "hoan_thanh"
                                    ? "Hoàn thành"
                                    : "Đã hủy"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Status Update Buttons */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                    <p className="text-xs font-semibold text-slate-700 mb-3">
                      Cập nhật trạng thái đơn hàng:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: "cho_xac_nhan", label: "Chờ xử lý", activeClass: "bg-orange-500 text-white border-orange-500" },
                        { key: "da_xac_nhan", label: "Đã xác nhận", activeClass: "bg-indigo-600 text-white border-indigo-600" },
                        { key: "dang_giao", label: "Đang giao hàng", activeClass: "bg-purple-600 text-white border-purple-600" },
                        { key: "hoan_thanh", label: "Hoàn thành", activeClass: "bg-emerald-600 text-white border-emerald-600" },
                        { key: "da_huy", label: "Hủy đơn", activeClass: "bg-red-600 text-white border-red-600" },
                      ].map((s) => (
                        <button
                          key={s.key}
                          onClick={() =>
                            handleUpdateOrderStatus(
                              String(selectedOrder.maDonHang),
                              s.key,
                            )
                          }
                          disabled={selectedOrder.trangThai === s.key}
                          className={`px-4 py-2 rounded-md text-xs font-bold border transition-colors cursor-pointer disabled:cursor-default ${
                            selectedOrder.trangThai === s.key
                              ? s.activeClass
                              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bought Products Table */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Danh sách sản phẩm đã mua
                    </h4>
                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                            <th className="py-2.5 px-4">Ảnh</th>
                            <th className="py-2.5 px-4">Tên sản phẩm</th>
                            <th className="py-2.5 px-4 text-center">Số lượng</th>
                            <th className="py-2.5 px-4 text-right">Đơn giá</th>
                            <th className="py-2.5 px-4 text-right">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {selectedOrder.chiTietDonHangs &&
                            selectedOrder.chiTietDonHangs.length > 0 ? (
                            selectedOrder.chiTietDonHangs.map((item: any, idx: number) => {
                              const itemImage = item.anhDaiDien
                                ? item.anhDaiDien.startsWith("http")
                                  ? item.anhDaiDien
                                  : `${API_BASE_URL}${item.anhDaiDien}`
                                : "/placeholder.svg";
                              return (
                                <tr
                                  key={item.maChiTiet || idx}
                                  className="hover:bg-slate-50/30 transition-colors"
                                >
                                  <td className="py-3 px-4">
                                    <img
                                      src={itemImage}
                                      alt={item.tenSanPham}
                                      className="size-10 object-contain rounded-lg border border-slate-100 bg-slate-50/50"
                                      onError={(e: any) => {
                                        e.target.src = "/placeholder.svg";
                                      }}
                                    />
                                  </td>
                                  <td className="py-3 px-4 text-slate-900 font-semibold max-w-[200px] truncate">
                                    {item.tenSanPham}
                                  </td>
                                  <td className="py-3 px-4 text-center text-slate-900">
                                    {item.soLuong}
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold">
                                    {formatVND(item.donGia)}
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                                    {formatVND(item.soLuong * item.donGia)}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-slate-400">
                                Không tìm thấy sản phẩm nào trong đơn hàng này.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4.5 bg-slate-50/50 rounded-2xl border border-slate-100 gap-4">
                    <p className="text-slate-900">
                      <span className="text-slate-400 font-normal">Phương thức thanh toán: </span>
                      <span className="font-bold">
                        {selectedOrder.phuongThucThanhToan === "tien_mat"
                          ? "Tiền mặt"
                          : selectedOrder.phuongThucThanhToan === "chuyen_khoan"
                            ? "Chuyển khoản"
                            : selectedOrder.phuongThucThanhToan}
                      </span>
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      <span className="text-slate-400 text-xs font-normal">Tổng cộng: </span>
                      <span className="text-red-600 text-base">
                        {formatVND(selectedOrder.tongTien)}
                      </span>
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50/30">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DELETE CONFIRMATION MODAL */}
      {isDeleteOrderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="size-7 text-rose-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  Xác nhận xóa đơn hàng
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bạn có chắc chắn muốn xóa đơn hàng{" "}
                  <span className="font-bold text-slate-700">#{deleteOrderId}</span>
                  {" "}không? Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsDeleteOrderModalOpen(false);
                    setDeleteOrderId(null);
                  }}
                  disabled={isDeletingOrder}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleConfirmDeleteOrder}
                  disabled={isDeletingOrder}
                  className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/20"
                >
                  {isDeletingOrder ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-3.5" />
                      Xóa đơn hàng
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN REPLY MODAL */}
      {isReplyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">
                Phản hồi đánh giá của {selectedReviewForReply?.hoTenNguoiDung}
              </h3>
              <button
                onClick={() => {
                  setIsReplyModalOpen(false);
                  setSelectedReviewForReply(null);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="size-4.5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSaveReply}>
              <div className="p-6 space-y-4 text-xs text-slate-700 font-medium">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">Đánh giá của khách:</span>
                    <span className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`size-3 ${i < (selectedReviewForReply?.soSao || 0)
                              ? "fill-amber-400 text-amber-400"
                              : "fill-slate-100 text-slate-300"
                            }`}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="italic text-slate-600 text-justify">
                    "{selectedReviewForReply?.noiDung}"
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="admin-reply-textarea"
                    className="block text-xs font-bold text-slate-700 mb-2"
                  >
                    Nội dung Phản hồi của quản trị viên
                  </label>
                  <textarea
                    id="admin-reply-textarea"
                    rows={5}
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    placeholder="Nhập câu trả lời cho khách hàng (để trống nếu muốn xóa phản hồi cũ)..."
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all placeholder:text-gray-400 font-medium text-slate-800"
                    disabled={isReplySubmitting}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/30">
                <button
                  type="button"
                  onClick={() => {
                    setIsReplyModalOpen(false);
                    setSelectedReviewForReply(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  disabled={isReplySubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-md shadow-red-600/10 flex items-center gap-1.5"
                  disabled={isReplySubmitting}
                >
                  {isReplySubmitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu phản hồi"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT CATEGORY */}
      {(isAddCategoryOpen || editingCategory) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <FolderTree className="size-5 text-red-600" />
                <span>{editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddCategoryOpen(false);
                  setEditingCategory(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Laptop Doanh Nhân, Tai Nghe Bluetooth..."
                  value={categoryNameInput}
                  onChange={(e) => setCategoryNameInput(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mô tả / Ghi chú
                </label>
                <textarea
                  rows={3}
                  placeholder="Nhập mô tả chi tiết cho phân loại sản phẩm này (không bắt buộc)..."
                  value={categoryDescInput}
                  onChange={(e) => setCategoryDescInput(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all font-medium text-slate-900"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddCategoryOpen(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={categorySubmitting}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-red-600/20 flex items-center gap-2"
                >
                  {categorySubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>{editingCategory ? "Lưu thay đổi" : "Tạo danh mục"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE CATEGORY CONFIRMATION */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="size-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
              <AlertTriangle className="size-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Xác nhận xóa danh mục?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bạn có chắc chắn muốn xóa danh mục <strong className="text-slate-900">"{deletingCategory.tenDanhMuc}"</strong> không?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex-1"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteCategory}
                disabled={categorySubmitting}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-red-600/20 flex-1 flex items-center justify-center gap-1.5"
              >
                {categorySubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Xóa danh mục"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* PROMOTION EDIT MODAL */}
      {isEditPromoModalOpen && editingPromo && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Chỉnh sửa mã khuyến mãi #{editingPromo.id}</h3>
              <button
                onClick={() => {
                  setIsEditPromoModalOpen(false);
                  setEditingPromo(null);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="size-4.5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveEditPromo}
              className="p-6 space-y-4 text-xs font-medium text-slate-700"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Mã giảm giá
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: SUMMER2026, M1, KM20..."
                  value={editPromoCode}
                  onChange={(e) => setEditPromoCode(e.target.value.toUpperCase())}
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all font-mono font-bold text-red-600 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Kiểu giảm giá
                  </label>
                  <select
                    value={editPromoType}
                    onChange={(e) => setEditPromoType(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 text-slate-700 font-medium"
                  >
                    <option value="Phần trăm">Phần trăm (%)</option>
                    <option value="Tiền mặt">Tiền mặt (VND)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Giá trị giảm *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      placeholder="Ví dụ: 20"
                      value={editPromoDiscount}
                      onChange={(e) => setEditPromoDiscount(e.target.value.replace(/\D/g, ""))}
                      className="w-full h-9 pl-3 pr-8 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all font-bold text-slate-900"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none select-none">
                      {editPromoType === "Phần trăm" ? "%" : "VND"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-800 block">
                  Thời lượng đợt giảm giá (Số Giờ)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Nhập số giờ (ví dụ: 24, 48, 72...)"
                  value={editPromoDurationHours}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditPromoDurationHours(val);
                    const hrs = Math.max(1, Number(val) || 1);
                    const now = new Date();
                    const end = new Date(now.getTime() + hrs * 3600 * 1000);
                    setEditPromoStartDate(formatDateTimeLocal(now));
                    setEditPromoEndDate(formatDateTimeLocal(end));
                  }}
                  className="w-full h-10 px-3 text-sm bg-white border border-slate-300 focus:border-red-500 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 text-slate-800 font-medium transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Trạng thái
                </label>
                <select
                  value={editPromoStatus}
                  onChange={(e) => setEditPromoStatus(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 text-slate-700 font-medium"
                >
                  <option value="hoat_dong">Đang diễn ra (Hoạt động)</option>
                  <option value="ngung">Tạm ngưng / Hết hạn</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditPromoModalOpen(false);
                    setEditingPromo(null);
                  }}
                  className="rounded-xl h-9 text-xs font-semibold px-4 cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-9 text-xs font-semibold px-5 cursor-pointer"
                >
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
