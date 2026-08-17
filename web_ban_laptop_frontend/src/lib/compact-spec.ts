/** Rút gọn thông số hiển thị trên card — trang chi tiết vẫn dùng chuỗi gốc từ DB. */

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** CPU: bỏ nội dung trong (...) và phần sau dấu ":" */
export function compactCpu(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  let s = value.trim();
  s = s.replace(/\([^)]*\)/g, " ");
  const colon = s.indexOf(":");
  if (colon >= 0) s = s.slice(0, colon);
  return collapseWhitespace(s);
}

/** RAM: chỉ giữ dung lượng dạng NGB */
export function compactRam(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  const m = value.match(/(\d+)\s*GB/i);
  if (m) return `${m[1]}GB`;
  return collapseWhitespace(value.split(/[\s(,|]/)[0] ?? "");
}

/** SSD: chỉ giữ 512GB, 1TB, 2TB… */
export function compactStorage(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  const tb = value.match(/(\d+(?:\.\d+)?)\s*TB/i);
  if (tb) return `${tb[1]}TB`;
  const gb = value.match(/(\d+)\s*GB/i);
  if (gb) return `${gb[1]}GB`;
  return collapseWhitespace(value.split(/[\s(,|]/)[0] ?? "");
}

/** VGA: tên dòng + VRAM, bỏ TGP / Boost / GDDR… */
export function compactGpu(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  let s = value.replace(/\([^)]*\)/g, " ");
  s = s.replace(/\b(GDDR\d+|ROG\s+Boost[^,|]*|TGP[^,|]*)/gi, " ");

  const discrete = s.match(/(RTX|GTX|RX)\s*(\d{3,4}\w*)(?:\s+(\d+)\s*GB)?/i);
  if (discrete) {
    const vram = discrete[3] ? ` ${discrete[3]}GB` : "";
    return `${discrete[1].toUpperCase()} ${discrete[2]}${vram}`.trim();
  }

  const arc = s.match(/\b(Intel\s+)?Arc\s+([A-Za-z0-9]+)/i);
  if (arc) return `Arc ${arc[2]}`;

  const iris = s.match(/\b(Iris\s+Xe(?:\s+\w+)?)/i);
  if (iris) return collapseWhitespace(iris[1]);

  const uhd = s.match(/\b(UHD|HD)\s*Graphics\b/i);
  if (uhd) return collapseWhitespace(uhd[0]);

  return collapseWhitespace(
    s.replace(/\b(NVIDIA|GeForce|AMD|Radeon)\s+/gi, "").split(/[,|]/)[0] ?? "",
  );
}

/** Màn hình: kích thước + độ phân giải / tấm nền ngắn */
export function compactDisplay(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  let s = value.replace(/\([^)]*\)/g, " ");
  s = (s.split(/[,|]/)[0] ?? s).trim();
  s = s.replace(/\b\d+\s*Hz\b/gi, "").replace(/\b\d+\s*nits?\b/gi, "");

  const inchMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:"|inch\b|in\b)?/i);
  const resMatch = s.match(/\b(FHD\+?|QHD\+?|WQXGA|WQHD|UHD\+?|4K|2K\+?|WUXGA|Full\s*HD|HD\+?)\b/i);
  const panelMatch = s.match(/\b(IPS|OLED|VA|TN|Mini\s*LED)\b/i);

  if (inchMatch) {
    const parts = [`${inchMatch[1]} inch`];
    if (resMatch) parts.push(resMatch[1].replace(/\s+/g, ""));
    else if (panelMatch) parts.push(panelMatch[1]);
    return parts.join(" ");
  }

  if (resMatch) {
    const parts = [resMatch[1].replace(/\s+/g, "")];
    if (panelMatch) parts.push(panelMatch[1]);
    return parts.join(" ");
  }

  return collapseWhitespace(s.split(/\s+/).slice(0, 4).join(" "));
}

export type CompactSpecRow = {
  key: string;
  label: string;
  compact: string;
  full: string;
};

/** Chuẩn hóa bộ 5 thông số cho card từ Product / API fields */
export function getCompactSpecRows(input: {
  cpu?: string | null;
  ram?: string | null;
  storage?: string | null;
  gpu?: string | null;
  display?: string | null;
}): CompactSpecRow[] {
  const rows: CompactSpecRow[] = [];

  const push = (key: string, label: string, full: string, compact: (v: string) => string) => {
    const f = full.trim();
    if (!f) return;
    const c = compact(f).trim();
    rows.push({ key, label, full: f, compact: c || f });
  };

  if (input.cpu) push("cpu", "CPU", input.cpu, compactCpu);
  if (input.ram) push("ram", "RAM", input.ram, compactRam);
  if (input.storage) push("storage", "SSD", input.storage, compactStorage);
  if (input.gpu) push("gpu", "VGA", input.gpu, compactGpu);
  if (input.display) push("display", "Màn hình", input.display, compactDisplay);

  return rows;
}
