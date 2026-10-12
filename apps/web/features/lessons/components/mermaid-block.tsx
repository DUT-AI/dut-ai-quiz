"use client";

import React, { useState, useEffect, useId, useRef } from "react";
import { useTheme } from "next-themes";
import { Check, Copy, Maximize2, Code2, Eye, AlertTriangle, Loader2 } from "lucide-react";
import { getMermaidConfig, postProcessSvg } from "../utils/mermaid-config";
import { MermaidModal } from "./mermaid-modal";
import { CodeBlock } from "./code-block";

interface MermaidBlockProps {
  code: string;
  className?: string;
}

export const MermaidBlock = React.memo(function MermaidBlock({
  code,
  className = "",
}: MermaidBlockProps) {
  const { resolvedTheme } = useTheme();
  const rawId = useId();
  const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");

  const [svgHtml, setSvgHtml] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"diagram" | "code">("diagram");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const renderSeqRef = useRef<number>(0);

  useEffect(() => {
    let isCancelled = false;
    const currentSeq = ++renderSeqRef.current;
    const isDark = resolvedTheme === "dark";

    async function renderDiagram() {
      setIsLoading(true);
      setError(null);

      try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;

        if (isCancelled || currentSeq !== renderSeqRef.current) return;

        // Initialize mermaid with current theme config
        mermaid.initialize({
          ...getMermaidConfig(isDark),
          suppressErrorRendering: true,
        });

        // Clean code string
        const trimmedCode = code.trim();
        if (!trimmedCode) {
          throw new Error("Empty diagram code");
        }

        // Generate collision-safe unique ID
        const containerId = `mermaid-svg-${cleanId}-${currentSeq}`;

        // Render SVG diagram
        const { svg } = await mermaid.render(containerId, trimmedCode);

        if (!isCancelled && currentSeq === renderSeqRef.current) {
          const processedSvg = postProcessSvg(svg, isDark);
          setSvgHtml(processedSvg);
          setError(null);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!isCancelled && currentSeq === renderSeqRef.current) {
          console.warn("[MermaidBlock] Render error:", err);
          setError(err?.message || "Failed to render Mermaid diagram");
          setIsLoading(false);

          // Clean up any stray error elements created by mermaid in document body
          const strayErrorElement = document.getElementById(`dmermaid-svg-${cleanId}-${currentSeq}`);
          if (strayErrorElement) {
            strayErrorElement.remove();
          }
        }
      }
    }

    renderDiagram();

    return () => {
      isCancelled = true;
    };
  }, [code, resolvedTheme, cleanId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code: ", err);
    }
  };

  return (
    <>
      <div
        className={`mermaid-block-container my-8 rounded-2xl overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#090C14] transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 ${className}`}
      >
        {/* macOS-style Header Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-100 dark:bg-[#0D1525] border-b border-zinc-200 dark:border-zinc-800/60 select-none">
          {/* Dots and Title */}
          <div className="flex space-x-2 items-center">
            <span className="w-3 h-3 rounded-full bg-rose-500/85"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/85"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/85"></span>
            <span className="ml-3 text-xs md:text-sm font-semibold tracking-wide text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5">
              <span>mermaid</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                diagram
              </span>
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-1.5 md:space-x-2">
            {/* Toggle Diagram / Code View */}
            {!error && (
              <div className="flex items-center bg-slate-200/80 dark:bg-zinc-800/60 rounded-lg p-0.5 border border-zinc-300/50 dark:border-zinc-700/40 mr-1">
                <button
                  onClick={() => setViewMode("diagram")}
                  title="Diagram View"
                  className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    viewMode === "diagram"
                      ? "bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Diagram</span>
                </button>
                <button
                  onClick={() => setViewMode("code")}
                  title="Source Code View"
                  className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    viewMode === "code"
                      ? "bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Code</span>
                </button>
              </div>
            )}

            {/* Fullscreen Expand Modal */}
            {!error && !isLoading && svgHtml && (
              <button
                onClick={() => setIsModalOpen(true)}
                title="Fullscreen Preview"
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-slate-200/60 dark:bg-zinc-800/60 hover:bg-slate-300/60 dark:hover:bg-zinc-700 active:scale-95 transition-all text-xs font-medium border border-zinc-300/50 dark:border-zinc-700/40 shadow-xs cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Expand</span>
              </button>
            )}

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              title="Copy Mermaid Code"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-slate-200/60 dark:bg-zinc-800/60 hover:bg-slate-300/60 dark:hover:bg-zinc-700 active:scale-95 transition-all text-xs font-medium border border-zinc-300/50 dark:border-zinc-700/40 shadow-xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        {error ? (
          /* Error Fallback Banner & Code */
          <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border-b border-rose-200/60 dark:border-rose-900/40">
            <div className="flex items-start space-x-3 text-rose-700 dark:text-rose-400 mb-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Mermaid Syntax Error</p>
                <p className="text-xs text-rose-600/90 dark:text-rose-400/80 font-mono mt-0.5">
                  {error}
                </p>
              </div>
            </div>
            <CodeBlock code={code} language="mermaid" />
          </div>
        ) : viewMode === "code" ? (
          /* Raw Code View */
          <div className="p-2">
            <CodeBlock code={code} language="mermaid" />
          </div>
        ) : isLoading ? (
          /* Loading Shimmer State */
          <div className="p-12 flex flex-col items-center justify-center space-y-3 min-h-[220px] bg-slate-50/40 dark:bg-zinc-900/20">
            <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-wide animate-pulse">
              Rendering diagram...
            </p>
          </div>
        ) : (
          /* Rendered SVG Diagram */
          <div className="p-6 md:p-8 overflow-x-auto theory-scrollbar flex items-center justify-center bg-white dark:bg-[#090C14]">
            <div
              className="w-full flex items-center justify-center [&_svg]:max-w-full [&_svg]:h-auto [&_svg_foreignObject]:overflow-visible [&_svg_.edgeLabel]:overflow-visible [&_svg_.edgeLabel_p]:whitespace-nowrap [&_svg_.edgeLabel_span]:whitespace-nowrap transition-transform duration-200"
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      <MermaidModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        svgHtml={svgHtml}
        code={code}
      />
    </>
  );
});
