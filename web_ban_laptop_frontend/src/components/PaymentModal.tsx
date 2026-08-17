import { useState } from "react";
import { QrCode, Copy, Check, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatVND } from "@/lib/format";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tongTien: number;
  transferContent: string;
  onConfirmBankTransfer: () => Promise<number | void>;
  onSuccess: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  tongTien,
  transferContent,
  onConfirmBankTransfer,
  onSuccess,
}: PaymentModalProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdMaDonHang, setCreatedMaDonHang] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    toast.success("Đã sao chép vào bộ nhớ tạm!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleManualConfirm = async () => {
    setIsVerifying(true);
    try {
      const resultMaDonHang = await onConfirmBankTransfer();
      if (typeof resultMaDonHang === "number") {
        setCreatedMaDonHang(resultMaDonHang);
      }
      setIsSuccess(true);
      toast.success("Xác nhận thanh toán thành công!");
    } catch (err: any) {
      toast.error(err.message || "Không thể xác nhận thanh toán. Vui lòng thử lại!");
    } finally {
      setIsVerifying(false);
    }
  };

  // DATN Payment Success View
  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-gray-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto text-3xl font-black">
            ✓
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">
            Thanh toán Thành công!
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Đơn hàng{" "}
            <strong className="text-red-600 font-extrabold">
              {createdMaDonHang ? `#${createdMaDonHang}` : ""}
            </strong>{" "}
            đã được xác nhận thanh toán thành công. Nhân viên Laptop Center sẽ tiến hành xử lý và giao hàng tới bạn trong thời gian sớm nhất.
          </p>
          <button
            type="button"
            onClick={() => {
              onSuccess();
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl transition cursor-pointer shadow-md tracking-wide"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    );
  }

  const bankInfo = {
    bankName: "MBBank (NHTMCP Quân Đội)",
    accountNo: "0359424754",
    accountName: "LAPTOP CENTER",
    amount: tongTien,
    transferContent: transferContent,
  };

  const qrUrl = `https://img.vietqr.io/image/MB-0359424754-compact2.png?amount=${tongTien}&addInfo=${encodeURIComponent(
    transferContent,
  )}&accountName=LAPTOP%20CENTER`;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-slate-800 space-y-5 relative my-8 text-gray-900 dark:text-gray-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-lg">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-gray-100">
                Thanh toán Chuyển khoản QR
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tổng tiền: <strong className="text-red-600">{formatVND(tongTien)}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold p-1 rounded-md transition"
          >
            ✕
          </button>
        </div>

        {/* VietQR Bank Transfer 2-Column Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          {/* Left: QR Image Box */}
          <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700">
            <img
              src={qrUrl}
              alt="Mã QR VietQR MBBank"
              className="w-48 h-48 object-contain rounded-lg bg-white p-2 shadow-xs"
            />
            <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 font-medium flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin text-red-600" /> Auto-check 24/7
            </span>
          </div>

          {/* Right: Transfer Details Copying List */}
          <div className="space-y-3 text-xs">
            {/* Bank Name */}
            <div className="bg-gray-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-gray-200 dark:border-slate-700">
              <div className="text-gray-500 dark:text-gray-400 text-[11px]">Ngân hàng nhận</div>
              <div className="font-extrabold text-gray-900 dark:text-gray-100 text-sm">
                {bankInfo.bankName}
              </div>
            </div>

            {/* Account Number */}
            <div className="bg-gray-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-[11px]">Số tài khoản</div>
                <div className="font-extrabold text-red-600 text-sm tracking-wide">
                  {bankInfo.accountNo}
                </div>
                <div className="text-[10px] text-gray-500">{bankInfo.accountName}</div>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(bankInfo.accountNo, "accountNo")}
                className="p-1.5 bg-white dark:bg-slate-700 hover:bg-gray-100 rounded text-gray-700 dark:text-gray-200 font-medium transition cursor-pointer flex items-center gap-1 text-[11px] border border-gray-200 dark:border-slate-600"
              >
                {copiedField === "accountNo" ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedField === "accountNo" ? "Đã chép" : "Sao chép"}</span>
              </button>
            </div>

            {/* Transfer Amount */}
            <div className="bg-gray-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-[11px]">Số tiền cần chuyển</div>
                <div className="font-extrabold text-red-600 text-sm">
                  {formatVND(bankInfo.amount)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(String(bankInfo.amount), "amount")}
                className="p-1.5 bg-white dark:bg-slate-700 hover:bg-gray-100 rounded text-gray-700 dark:text-gray-200 font-medium transition cursor-pointer flex items-center gap-1 text-[11px] border border-gray-200 dark:border-slate-600"
              >
                {copiedField === "amount" ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedField === "amount" ? "Đã chép" : "Sao chép"}</span>
              </button>
            </div>

            {/* Transfer Content */}
            <div className="bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-200 dark:border-red-900/60 flex items-center justify-between">
              <div>
                <div className="text-red-600 font-bold text-[11px]">
                  Nội dung chuyển khoản (BẮT BUỘC)
                </div>
                <div className="font-black text-red-600 text-base tracking-wider">
                  {bankInfo.transferContent}
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(bankInfo.transferContent, "content")}
                className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold transition cursor-pointer flex items-center gap-1 text-[11px]"
              >
                {copiedField === "content" ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedField === "content" ? "Đã chép" : "Sao chép"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Warning Note */}
        <div className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-300 dark:border-amber-700/60 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>
            Vui lòng giữ nguyên <strong>Nội dung chuyển khoản ({bankInfo.transferContent})</strong> và bấm nút <strong>"Xác nhận đã chuyển khoản"</strong> bên dưới để hoàn tất lưu đơn hàng vào hệ thống.
          </span>
        </div>

        {/* Footer Action Buttons */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleManualConfirm}
            disabled={isVerifying}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isVerifying ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Xác nhận đã chuyển khoản</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
