/**
 * Google Authentication Helper (Google Identity Services / OAuth 2.0)
 * Tích hợp đăng nhập Google chính thức từ accounts.google.com
 */

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
  sub?: string;
}

// Client ID Google OAuth lấy từ biến môi trường (hoặc fallback nếu chưa cấu hình)
export const GOOGLE_CLIENT_ID =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_GOOGLE_CLIENT_ID) ||
  "";

/**
 * Tự động nạp Google Identity Services script nếu chưa có
 */
export function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if ((window as any).google?.accounts) return resolve();

    const existingScript = document.getElementById("google-gsi-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", (e) => reject(e));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

/**
 * Giải mã JWT ID Token do Google trả về (không cần thư viện bên ngoài)
 */
export function parseJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Kích hoạt popup đăng nhập Google chính thức (Google OAuth 2.0)
 */
export async function triggerGoogleLogin(): Promise<GoogleUserProfile> {
  await loadGoogleScript();

  return new Promise((resolve, reject) => {
    const google = (window as any).google;

    if (!google || !google.accounts) {
      reject(new Error("Không thể tải Google Identity Services. Vui lòng kiểm tra kết nối mạng."));
      return;
    }

    const clientId = GOOGLE_CLIENT_ID;

    // Trường hợp chưa cấu hình Client ID, thông báo hướng dẫn rõ ràng
    if (!clientId) {
      // Mở hộp thoại popup Google OAuth tiêu chuẩn hoặc hướng dẫn người dùng
      console.warn("Chưa cấu hình VITE_GOOGLE_CLIENT_ID trong file .env!");
    }

    // Sử dụng OAuth2 Token Client của Google
    if (google.accounts.oauth2 && clientId) {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "email profile openid",
        callback: async (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error || "Người dùng đã hủy đăng nhập Google"));
            return;
          }
          if (response.access_token) {
            try {
              // Lấy thông tin user profile từ Google API
              const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${response.access_token}` },
              });
              if (!res.ok) throw new Error("Không thể lấy thông tin tài khoản Google.");
              const userInfo = await res.json();
              resolve({
                email: userInfo.email,
                name: userInfo.name || userInfo.email.split("@")[0],
                picture: userInfo.picture,
                sub: userInfo.sub,
              });
            } catch (err) {
              reject(err);
            }
          }
        },
        error_callback: (err: any) => {
          reject(new Error(err.message || "Lỗi khởi tạo đăng nhập Google."));
        },
      });

      client.requestAccessToken({ prompt: "select_account" });
    } else {
      // Fallback: Nếu chưa có Client ID trong .env, sử dụng Google OAuth2 popup chuẩn của Google Accounts
      // với hướng dẫn trực quan
      const fallbackClientId = clientId || "863484433065-sample.apps.googleusercontent.com";
      
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;

      // Google OAuth endpoint
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(fallbackClientId)}` +
        `&redirect_uri=${encodeURIComponent(window.location.origin)}` +
        `&response_type=token%20id_token` +
        `&scope=${encodeURIComponent("email profile openid")}` +
        `&prompt=select_account` +
        `&nonce=${Math.random().toString(36).substring(2)}`;

      const popup = window.open(
        oauthUrl,
        "GoogleLogin",
        `width=${width},height=${height},top=${top},left=${left}`
      );

      if (!popup) {
        reject(new Error("Trình duyệt đã chặn popup. Vui lòng cho phép popup để đăng nhập Google!"));
        return;
      }

      // Lắng nghe kết quả trả về nếu qua redirect
      const checkPopup = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkPopup);
            // Người dùng đóng popup mà chưa hoàn tất
          }
        } catch {
          // Cross-origin check
        }
      }, 500);

      // Nếu chưa có client_id thì giải thích
      if (!clientId) {
        reject(new Error("Vui lòng cấu hình VITE_GOOGLE_CLIENT_ID trong file .env để kết nối Google Cloud!"));
      }
    }
  });
}
