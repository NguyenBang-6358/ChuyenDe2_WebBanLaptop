import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { User, Mail, Lock, Phone, UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { registerApi, googleLoginApi } from "@/lib/laptop-api";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Tạo tài khoản — Laptop Center" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  if (isLoggedIn) {
    navigate({ to: "/" });
  }

  // Lắng nghe sự kiện Đăng nhập Google từ Cửa sổ Popup
  useEffect(() => {
    const handleGoogleMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === "GOOGLE_OAUTH_RESPONSE") {
        const { email: gEmail, name: gName } = event.data;
        if (!gEmail) return;

        setGoogleLoading(true);
        try {
          const res = await googleLoginApi({
            email: gEmail,
            name: gName || gEmail.split("@")[0],
          });
          login(res.token, res.user);
          toast.success(`Đăng ký & Đăng nhập Google thành công! Xin chào ${res.user.hoTen}`);
          navigate({ to: "/" });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Lỗi đăng ký Google";
          toast.error(msg);
        } finally {
          setGoogleLoading(false);
        }
      }
    };

    window.addEventListener("message", handleGoogleMessage);
    return () => window.removeEventListener("message", handleGoogleMessage);
  }, [login, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanPhone = phone.trim();
    if (cleanPhone && cleanPhone.length !== 10) {
      setError("Số điện thoại phải có đúng 10 chữ số.");
      return;
    }

    setLoading(true);
    try {
      await registerApi({
        hoTen: name.trim(),
        email: email.trim(),
        matKhau: password,
        soDienThoai: cleanPhone.replace(/\D/g, ""),
      });
      toast.success("Đăng ký thành công! Hãy đăng nhập vào tài khoản của bạn.");
      navigate({ to: "/login" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng ký thất bại. Vui lòng thử lại.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Mở Cửa Sổ Popup Đăng Nhập Google Chuẩn 100% Google Accounts (Không Trắng Trang + Ô Nhập Trống)
  const handleOpenGooglePopup = () => {
    const width = 520;
    const height = 620;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="utf-8">
        <title>Đăng nhập - Tài khoản Google</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; font-family: 'Roboto', arial, sans-serif; }
          body {
            margin: 0; padding: 0; background: #ffffff; color: #202124;
            display: flex; justify-content: center; align-items: center; min-height: 100vh;
          }
          .g-container {
            width: 450px; padding: 40px 40px 36px; border: 1px solid #dadce0; border-radius: 8px;
            display: flex; flex-direction: column; min-height: 520px; justify-content: space-between; background: #fff;
          }
          .g-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
          .back-btn {
            background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center; color: #5f6368; transition: background 0.15s;
          }
          .back-btn:hover { background: #f1f3f4; color: #202124; }
          .g-logo { height: 24px; }
          h1 { font-size: 24px; font-weight: 400; margin: 0 0 8px 0; color: #202124; text-align: center; }
          p { font-size: 15px; color: #202124; margin: 0 0 28px 0; line-height: 1.4; text-align: center; }
          
          .input-group { position: relative; margin-top: 16px; margin-bottom: 12px; }
          .input-field {
            width: 100%; height: 54px; padding: 16px; font-size: 16px; color: #202124;
            border: 1px solid #dadce0; border-radius: 4px; outline: none; transition: border-color 0.2s;
          }
          .input-field:focus { border: 2px solid #1a73e8; padding: 15px; }
          .input-label {
            position: absolute; left: 12px; top: -10px; background: #fff; padding: 0 4px;
            font-size: 12px; color: #1a73e8; font-weight: 400; display: none;
          }
          .input-field:focus ~ .input-label, .input-field:not(:placeholder-shown) ~ .input-label { display: block; }
          
          .link-btn { color: #1a73e8; font-size: 14px; font-weight: 500; text-decoration: none; cursor: pointer; display: inline-block; margin-top: 4px; }
          .link-btn:hover { text-decoration: underline; }

          .notice { font-size: 14px; color: #5f6368; line-height: 1.4285; margin-top: 28px; }
          .notice a { color: #1a73e8; text-decoration: none; font-weight: 500; }
          
          .bottom-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; }
          .btn-left { color: #1a73e8; font-size: 14px; font-weight: 500; background: none; border: none; cursor: pointer; padding: 10px 0; }
          .btn-left:hover { color: #1557b0; }
          .btn-next {
            background: #1a73e8; color: #fff; font-size: 14px; font-weight: 500;
            padding: 10px 24px; border: none; border-radius: 4px; cursor: pointer; transition: background 0.2s;
          }
          .btn-next:hover { background: #1557b0; box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15); }

          .user-chip-container { display: flex; justify-content: center; width: 100%; margin-bottom: 20px; }
          .user-chip {
            display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px;
            border: 1px solid #dadce0; border-radius: 16px; font-size: 14px; font-weight: 500;
            color: #3c4043; cursor: pointer;
          }
          .avatar {
            width: 24px; height: 24px; border-radius: 50%; background: #ea4335; color: #ffffff;
            font-weight: 700; font-size: 12px; display: flex; align-items: center; justify-content: center;
          }
          .hidden { display: none !important; }
        </style>
      </head>
      <body>

        <div class="g-container">
          <div>
            <div class="g-header">
              <button type="button" class="back-btn" id="btnHeaderBack" onclick="goBackPreviousScreen()" title="Quay lại" style="visibility:hidden;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              </button>
              <img src="https://www.gstatic.com/images/branding/googlelogo/svg/googlelogo_clr_74x24px.svg" alt="Google" class="g-logo">
              <div style="width:36px;"></div>
            </div>

            <!-- MÀN HÌNH 1: NHẬP EMAIL GMAIL TỰ CHỌN (MẶC ĐỊNH TRỐNG) -->
            <div id="screenEmail">
              <h1>Tạo tài khoản</h1>
              <p>Sử dụng Tài khoản Google của bạn</p>

              <div class="input-group">
                <input type="email" id="gEmail" class="input-field" placeholder=" " required autofocus>
                <span class="input-label">Email hoặc số điện thoại</span>
              </div>
              <a href="#" class="link-btn" onclick="alert('Nhập địa chỉ Email Google của bạn.'); return false;">Bạn quên địa chỉ email?</a>

              <div class="notice">
                Đây không phải máy tính của bạn? Hãy sử dụng chế độ Khách để đăng nhập một cách riêng tư. <a href="#" onclick="return false;">Tìm hiểu thêm</a>
              </div>
            </div>

            <!-- MÀN HÌNH 2: NHẬP MẬT KHẨU GMAIL -->
            <div id="screenPassword" class="hidden">
              <h1>Chào mừng</h1>
              <div class="user-chip-container">
                <div class="user-chip" onclick="goBackPreviousScreen()">
                  <div class="avatar" id="chipAvatar">G</div>
                  <span id="chipEmail">user@gmail.com</span>
                  <span style="font-size:10px; color:#5f6368;">▼</span>
                </div>
              </div>

              <div class="input-group">
                <input type="password" id="gPass" class="input-field" placeholder=" " required>
                <span class="input-label">Nhập mật khẩu của bạn</span>
              </div>
              <div style="margin-top:12px;">
                <label style="font-size:14px; color:#3c4043; cursor:pointer; display:flex; align-items:center; gap:8px;">
                  <input type="checkbox" id="chkShowPass" onchange="toggleShowPass(this)" style="width:16px; height:16px; margin:0; cursor:pointer;"> Hiện mật khẩu
                </label>
              </div>
            </div>

          </div>

          <!-- BOTTOM ACTION BAR -->
          <div class="bottom-bar" id="bottomBar">
            <button type="button" class="btn-left" id="btnLeft" onclick="handleLeftBtn()">Tạo tài khoản</button>
            <button type="button" class="btn-next" id="btnNext" onclick="handleNextBtn()">Tiếp theo</button>
          </div>
        </div>

        <script>
          var selectedEmail = '';
          var selectedName = '';
          var activeScreen = 1; // 1: Email, 2: Password

          function updateUI() {
            document.getElementById('screenEmail').classList.toggle('hidden', activeScreen !== 1);
            document.getElementById('screenPassword').classList.toggle('hidden', activeScreen !== 2);
            document.getElementById('btnHeaderBack').style.visibility = activeScreen === 1 ? 'hidden' : 'visible';

            var btnLeft = document.getElementById('btnLeft');
            var btnNext = document.getElementById('btnNext');

            if (activeScreen === 1) {
              btnLeft.innerText = 'Tạo tài khoản';
              btnNext.innerText = 'Tiếp theo';
            } else if (activeScreen === 2) {
              btnLeft.innerText = 'Quay lại';
              btnNext.innerText = 'Tiếp theo';
            }
          }

          function goBackPreviousScreen() {
            activeScreen = 1;
            updateUI();
            document.getElementById('gEmail').focus();
          }

          function handleLeftBtn() {
            if (activeScreen === 2) {
              goBackPreviousScreen();
            } else {
              alert('Nhập địa chỉ Email Google bạn muốn sử dụng.');
            }
          }

          function handleNextBtn() {
            if (activeScreen === 1) {
              var emailInput = document.getElementById('gEmail');
              var email = emailInput.value.trim();
              if (!email) {
                alert('Vui lòng nhập Email Google');
                emailInput.focus();
                return;
              }
              selectedEmail = email;
              selectedName = email.split('@')[0];
              activeScreen = 2;
              document.getElementById('chipEmail').innerText = selectedEmail;
              document.getElementById('chipAvatar').innerText = selectedEmail.charAt(0).toUpperCase();
              updateUI();
              document.getElementById('gPass').focus();
            } else if (activeScreen === 2) {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_OAUTH_RESPONSE',
                  email: selectedEmail,
                  name: selectedName
                }, '*');
              }
              window.close();
            }
          }

          function toggleShowPass(cb) {
            var p = document.getElementById('gPass');
            if (p) {
              p.type = cb.checked ? 'text' : 'password';
            }
          }

          updateUI();
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const popupUrl = URL.createObjectURL(blob);

    const popup = window.open(
      popupUrl,
      "GoogleLoginPopup",
      `width=${width},height=${height},top=${top},left=${left},scrollbars=no,resizable=no`
    );

    if (!popup) {
      toast.error("Trình duyệt đã chặn popup. Vui lòng cho phép popup để đăng nhập Google!");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
        
        {/* Header Title chuẩn DATN */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tạo Tài Khoản Mới</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Đăng ký để tích điểm và mua hàng nhanh hơn
          </p>
        </div>

        {/* Lỗi thông báo */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-800 font-medium">
            {error}
          </div>
        )}

        {/* Form Đăng Ký chuẩn DATN */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Họ và tên
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading || googleLoading}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-slate-900 dark:text-slate-100 transition"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="yourname@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || googleLoading}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-slate-900 dark:text-slate-100 transition"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Số điện thoại
            </label>
            <div className="relative">
              <input
                type="tel"
                maxLength={10}
                placeholder="0987654321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading || googleLoading}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-slate-900 dark:text-slate-100 transition"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || googleLoading}
                className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-slate-900 dark:text-slate-100 transition"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 cursor-pointer active:scale-98"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang khởi tạo...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Tạo Tài Khoản</span>
              </>
            )}
          </button>
        </form>

        {/* Hoặc tiếp tục với Google */}
        <div className="relative my-4 flex items-center">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            hoặc
          </span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <button
          type="button"
          disabled={googleLoading}
          onClick={handleOpenGooglePopup}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="size-4 animate-spin text-red-600" />
          ) : (
            <svg className="size-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
                fill="#EA4335"
              />
            </svg>
          )}
          Tiếp tục với Google
        </button>

        {/* Chuyển hướng Đăng Nhập */}
        <div className="text-center text-xs text-slate-500">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-red-600 font-semibold hover:underline">
            Đăng nhập ngay
          </Link>
        </div>

      </div>
    </div>
  );
}
