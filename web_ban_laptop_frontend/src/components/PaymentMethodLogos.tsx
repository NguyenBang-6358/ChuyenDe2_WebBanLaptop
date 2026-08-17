import type { ReactNode } from "react";

const PAYMENT_SVG_CLASS = "h-4 w-auto shrink-0";

function PaymentIcon({ title, children }: { title: string; children: ReactNode }) {
  return (
    <span
      title={title}
      className="inline-flex h-4 cursor-default items-center justify-center transition-opacity hover:opacity-80"
      aria-label={title}
    >
      {children}
    </span>
  );
}

function VisaLogo() {
  return (
    <span
      className="mr-1 align-middle font-sans text-[13px] font-black italic tracking-tighter text-blue-800"
      style={{ fontFamily: "'Arial Black', sans-serif" }}
    >
      VISA
    </span>
  );
}

function MastercardLogo() {
  return (
    <svg className={PAYMENT_SVG_CLASS} viewBox="0 0 34 26" fill="none" aria-hidden>
      <circle cx="12.5" cy="13" r="8.5" fill="#EB001B" />
      <circle cx="21.5" cy="13" r="8.5" fill="#F79E1B" />
      <path fill="#FF5F00" fillOpacity="0.8" d="M17 6a8.5 8.5 0 0 0 0 14 8.5 8.5 0 0 0 0-14z" />
    </svg>
  );
}

function CashLogo() {
  return (
    <svg className={PAYMENT_SVG_CLASS} viewBox="0 0 30 22" fill="none" aria-hidden>
      <rect
        x="0.5"
        y="0.5"
        width="29"
        height="21"
        rx="3.5"
        fill="#EFF6FF"
        stroke="#93C5FD"
        strokeWidth="1"
      />
      <rect
        x="7"
        y="6"
        width="16"
        height="10"
        rx="2"
        stroke="#2563EB"
        strokeWidth="1.25"
        fill="#fff"
      />
      <text
        x="15"
        y="13.8"
        textAnchor="middle"
        fill="#2563EB"
        fontSize="9"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        $
      </text>
    </svg>
  );
}

export function PaymentMethodLogos({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <PaymentIcon title="Hỗ trợ thẻ VISA">
        <VisaLogo />
      </PaymentIcon>
      <PaymentIcon title="Hỗ trợ thẻ MasterCard">
        <MastercardLogo />
      </PaymentIcon>
      <PaymentIcon title="Thanh toán tiền mặt">
        <CashLogo />
      </PaymentIcon>
    </div>
  );
}
