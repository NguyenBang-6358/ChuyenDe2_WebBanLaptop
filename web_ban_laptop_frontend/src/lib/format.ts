export function formatVNDAmount(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function formatVND(value: number): string {
  return formatVNDAmount(value) + "đ";
}
