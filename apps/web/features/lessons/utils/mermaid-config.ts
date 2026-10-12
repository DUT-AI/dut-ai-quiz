import type { MermaidConfig } from "mermaid";

const FONT_STACK =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export function getMermaidConfig(isDark: boolean): MermaidConfig {
  const bg = isDark ? "#090C14" : "#FFFFFF";
  const textColor = isDark ? "#E2E8F0" : "#0F172A";

  const config: any = {
    startOnLoad: false,
    securityLevel: "loose",
    fontFamily: FONT_STACK,
    theme: isDark ? "dark" : "neutral",
    hideEmptyMembersBox: true,
    nodeSpacing: 120,
    rankSpacing: 120,
    state: {
      nodeSpacing: 120,
      rankSpacing: 120,
    },
    class: {
      defaultRenderer: "dagre-wrapper",
      nodeSpacing: 120,
      rankSpacing: 120,
      padding: 15,
      hideEmptyMembersBox: true,
    },
    flowchart: {
      nodeSpacing: 100,
      rankSpacing: 100,
      htmlLabels: true,
      curve: "basis",
    },
    themeVariables: isDark
      ? {
          fontFamily: FONT_STACK,
          darkMode: true,
          background: "#090C14",
          mainBkg: "#0D1525",
          primaryColor: "#059669",
          primaryTextColor: "#F1F5F9",
          primaryBorderColor: "#1E293B",
          lineColor: "#64748B",
          textColor: "#E2E8F0",
          actorBkg: "#131B2D",
          actorBorder: "#334155",
          actorTextColor: "#F8FAFC",
          actorLineColor: "#64748B",
          signalColor: "#34D399",
          signalTextColor: "#F1F5F9",
          labelBoxBkgColor: "#1E293B",
          labelBoxBorderColor: "#334155",
          labelTextColor: "#F1F5F9",
          loopTextColor: "#94A3B8",
          noteBkgColor: "#1E293B",
          noteBorderColor: "#334155",
          noteTextColor: "#F1F5F9",
          activationBkgColor: "#064E3B",
          activationBorderColor: "#10B981",
          sequenceNumberColor: "#FFFFFF",
          nodeBorder: "#334155",
          clusterBkg: "#0B0F17",
          clusterBorder: "#1E293B",
          edgeLabelBackground: "#0D1525",
          classText: "#E2E8F0",
        }
      : {
          fontFamily: FONT_STACK,
          darkMode: false,
          background: "#FFFFFF",
          mainBkg: "#F8FAFC",
          primaryColor: "#10B981",
          primaryTextColor: "#0F172A",
          primaryBorderColor: "#CBD5E1",
          lineColor: "#64748B",
          textColor: "#0F172A",
          actorBkg: "#F1F5F9",
          actorBorder: "#94A3B8",
          actorTextColor: "#0F172A",
          actorLineColor: "#64748B",
          signalColor: "#059669",
          signalTextColor: "#0F172A",
          labelBoxBkgColor: "#F8FAFC",
          labelBoxBorderColor: "#CBD5E1",
          labelTextColor: "#0F172A",
          loopTextColor: "#475569",
          noteBkgColor: "#FEF3C7",
          noteBorderColor: "#F59E0B",
          noteTextColor: "#92400E",
          activationBkgColor: "#ECFDF5",
          activationBorderColor: "#10B981",
          sequenceNumberColor: "#FFFFFF",
          nodeBorder: "#CBD5E1",
          clusterBkg: "#F8FAFC",
          clusterBorder: "#E2E8F0",
          edgeLabelBackground: "#FFFFFF",
          classText: "#0F172A",
        },
  };

  return config as MermaidConfig;
}

/**
 * Xử lý hậu kỳ SVG sinh ra từ Mermaid:
 * 1. Parse an toàn bằng text/html (không bao giờ lỗi parsererror).
 * 2. Smart Repositioning dựa trên tọa độ vector của đường edgePaths d:
 *    Tự động dời nhãn bội số (0..*, 1..*) lùi ra xa mũi tên và viền hộp.
 * 3. Xóa divider thừa nếu class không có phương thức (loại bỏ ngăn thứ 3 rỗng).
 * 4. Nhúng CSS trực tiếp vào <svg> để biến các nhãn thành pill badge đẹp mắt.
 */
export function postProcessSvg(svgHtml: string, isDark: boolean = false): string {
  if (typeof window === "undefined" || !svgHtml) return svgHtml;
  try {
    const parser = new DOMParser();
    // Parse leniently bằng text/html để không bao giờ bị lỗi do thẻ foreignObject của Mermaid
    const doc = parser.parseFromString(svgHtml, "text/html");
    const svgEl = doc.querySelector("svg");
    if (!svgEl) return svgHtml;

    // 1. Dọn dẹp ngăn methods rỗng nếu class không có phương thức
    const classNodes = svgEl.querySelectorAll("g.node");
    classNodes.forEach((node) => {
      const methodsGroup = node.querySelector(".methods-group");
      const dividers = node.querySelectorAll(".divider");
      const hasMethods = Boolean(methodsGroup && (methodsGroup.textContent?.trim().length ?? 0) > 0);

      // Nếu không có methods và có từ 2 divider trở lên -> xóa divider cuối cùng
      if (!hasMethods && dividers.length >= 2) {
        const lastDivider = dividers[dividers.length - 1];
        lastDivider.remove();
      }
    });

    // 2. Thu thập các điểm mút và vector hướng của tất cả các cạnh quan hệ (edgePaths)
    interface EdgeEndpoint {
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      dirX: number;
      dirY: number;
    }
    const endpoints: EdgeEndpoint[] = [];
    const paths = svgEl.querySelectorAll("g.edgePaths path");
    paths.forEach((p) => {
      const d = p.getAttribute("d");
      if (!d) return;
      const re = /([-\d.]+)[,\s]+([-\d.]+)/g;
      const pts: { x: number; y: number }[] = [];
      let match: RegExpExecArray | null;
      while ((match = re.exec(d)) !== null) {
        pts.push({ x: parseFloat(match[1]), y: parseFloat(match[2]) });
      }
      if (pts.length >= 2) {
        const start = pts[0];
        const end = pts[pts.length - 1];
        const prev = pts[pts.length - 2];
        endpoints.push({
          startX: start.x,
          startY: start.y,
          endX: end.x,
          endY: end.y,
          dirX: end.x - prev.x,
          dirY: end.y - prev.y,
        });
      }
    });

    // 3. Smart Repositioning cho Bội số liên kết (edgeTerminals)
    const edgeTerminals = svgEl.querySelectorAll("g.edgeTerminals");
    edgeTerminals.forEach((term) => {
      const transform = term.getAttribute("transform");
      const match = transform?.match(/translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/);
      if (!match) return;
      let tx = parseFloat(match[1]);
      let ty = parseFloat(match[2]);

      for (const ep of endpoints) {
        const distEnd = Math.hypot(tx - ep.endX, ty - ep.endY);
        const distStart = Math.hypot(tx - ep.startX, ty - ep.startY);

        // Trường hợp 1: Nhãn nằm ở điểm mút ĐÍCH (nơi có đầu mũi tên cắm vào node)
        if (distEnd < 50) {
          if (Math.abs(ep.dirX) >= Math.abs(ep.dirY)) {
            // Đường ngang
            if (ep.dirX > 0) {
              // Mũi tên từ trái sang phải -> lùi sang trái 26px, nhấc lên trên 14px
              tx -= 26;
              ty -= 14;
            } else {
              // Mũi tên từ phải sang trái -> đẩy sang phải 26px, nhấc lên trên 14px
              tx += 26;
              ty -= 14;
            }
          } else {
            // Đường dọc
            if (ep.dirY > 0) {
              // Mũi tên từ trên xuống dưới -> nhấc lên 24px, đẩy sang phải 16px
              ty -= 24;
              tx += 16;
            } else {
              // Mũi tên từ dưới lên trên -> đẩy xuống 24px, đẩy sang phải 16px
              ty += 24;
              tx += 16;
            }
          }
          term.setAttribute("transform", `translate(${tx}, ${ty})`);
          break;
        }

        // Trường hợp 2: Nhãn nằm ở điểm mút NGUỒN (nơi bắt đầu xuất phát từ node)
        if (distStart < 35) {
          if (Math.abs(ep.dirX) >= Math.abs(ep.dirY)) {
            if (ep.dirX > 0) {
              // Xuất phát sang phải -> đẩy sang phải 16px và hạ xuống dưới 14px
              tx += 16;
              ty += 14;
            } else {
              tx -= 16;
              ty += 14;
            }
          } else {
            if (ep.dirY > 0) {
              ty += 16;
              tx += 14;
            } else {
              ty -= 16;
              tx += 14;
            }
          }
          term.setAttribute("transform", `translate(${tx}, ${ty})`);
          break;
        }
      }
    });

    // 4. Re-order: Di chuyển edgeLabels & edgeTerminals xuống cuối root để luôn vẽ đè lên trên
    const root = svgEl.querySelector("g.root") || svgEl;
    const edgeElements = root.querySelectorAll("g.edgeLabels, g.edgeTerminals");
    edgeElements.forEach((el) => {
      root.appendChild(el);
    });

    // 5. Đảm bảo toàn bộ foreignObject không cắt xén text
    svgEl.querySelectorAll("foreignObject").forEach((fo) => {
      fo.setAttribute("overflow", "visible");
      fo.style.overflow = "visible";
    });

    // 6. Chuẩn hóa nhãn quan hệ: Xóa bỏ hoàn toàn SVG rect thừa bên ngoài để triệt tiêu 2 ô lồng nhau
    const edgeLabels = svgEl.querySelectorAll("g.edgeLabel");
    edgeLabels.forEach((el) => {
      const fo = el.querySelector("foreignObject");
      if (fo) {
        // Xóa hẳn SVG rect thừa (chính là ô ngoài cùng gây ra hiện tượng 2 ô lồng nhau)
        el.querySelectorAll("rect").forEach((r) => r.remove());

        const textElements = Array.from(fo.querySelectorAll("span, p, div")).filter(
          (node) => Array.from(node.childNodes).some((c) => c.nodeType === 3 && (c.textContent?.trim().length ?? 0) > 0)
        );
        const targetBadge = textElements[textElements.length - 1] || fo.querySelector("span") || fo.querySelector("p");

        fo.querySelectorAll("*").forEach((child) => {
          if (child !== targetBadge) {
            child.classList.remove("labelBkg", "edgeLabel");
            (child as HTMLElement).style.background = "transparent";
            (child as HTMLElement).style.backgroundColor = "transparent";
            (child as HTMLElement).style.border = "none";
            (child as HTMLElement).style.boxShadow = "none";
            (child as HTMLElement).style.padding = "0";
            (child as HTMLElement).style.margin = "0";
          }
        });

        if (targetBadge) {
          targetBadge.classList.add("mermaid-edge-pill");
        }
      }
    });

    // 7. Nhúng trực tiếp thẻ <style> vào trong SVG để đảm bảo hiệu ứng pill badge và bo góc
    const bg = isDark ? "#090C14" : "#FFFFFF";
    const cardBkg = isDark ? "#0D1525" : "#FFFFFF";
    const borderColor = isDark ? "#334155" : "#CBD5E1";
    const textColor = isDark ? "#E2E8F0" : "#0F172A";

    const styleEl = doc.createElement("style");
    styleEl.setAttribute("id", "mermaid-enhanced-style");
    styleEl.textContent = `
      /* Ẩn hoàn toàn SVG rect của edgeLabel để không bao giờ bị vẽ 2 ô lồng nhau */
      .edgeLabel rect {
        display: none !important;
      }

      /* Reset toàn bộ các thẻ container bọc ngoài */
      .edgeLabel,
      .edgeLabel .label,
      .edgeLabel foreignObject,
      .edgeLabel .labelBkg,
      .edgeLabel div:not(.mermaid-edge-pill),
      .edgeLabel p:not(.mermaid-edge-pill) {
        background: transparent !important;
        background-color: transparent !important;
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      /* Nền và viền badge duy nhất cho text trên line */
      .edgeLabel .mermaid-edge-pill {
        background-color: ${cardBkg} !important;
        border: 1px solid ${borderColor} !important;
        border-radius: 6px !important;
        padding: 3px 10px !important;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        color: ${textColor} !important;
        display: inline-block !important;
        line-height: 1.3 !important;
        white-space: nowrap !important;
      }

      /* Bội số liên kết (0..*, 1, 1..*) rõ nét với halo */
      .edgeTerminals {
        font-size: 13px !important;
        font-weight: 700 !important;
        overflow: visible !important;
        z-index: 9999 !important;
      }
      .edgeTerminals span,
      .edgeTerminals div {
        font-weight: 700 !important;
        font-size: 13px !important;
        color: ${textColor} !important;
        text-shadow: 0 0 4px ${bg}, 0 0 4px ${bg}, 0 0 4px ${bg} !important;
      }
      .edgeTerminals text {
        font-weight: 700 !important;
        font-size: 13px !important;
        fill: ${textColor} !important;
        paint-order: stroke fill;
        stroke: ${bg};
        stroke-width: 4px;
      }

      /* Đường kẻ phân cách divider mảnh dẻ */
      .divider path, .divider line {
        stroke: ${borderColor} !important;
        stroke-width: 1px !important;
      }
    `;
    svgEl.prepend(styleEl);

    return svgEl.outerHTML;
  } catch (e) {
    console.warn("[Mermaid] postProcessSvg error:", e);
    return svgHtml;
  }
}
