"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { rehypeHeadingIds } from "@/features/lessons/utils/theory-parser";
import { CodeBlock } from "@/features/lessons/components/code-block";

interface MarkdownProps {
  content: string;
  className?: string;
}

export const markdownComponents = {
  h1: ({ children, id }: any) => (
    <h1 id={id} className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-8 mb-4 leading-tight scroll-mt-24">
      {children}
    </h1>
  ),
  h2: ({ children, id }: any) => (
    <h2 id={id} className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-6 mb-3 pb-1 border-b border-slate-200 dark:border-slate-700 scroll-mt-24">
      {children}
    </h2>
  ),
  h3: ({ children, id }: any) => (
    <h3 id={id} className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-5 mb-2 scroll-mt-24">
      {children}
    </h3>
  ),
  h4: ({ children, id }: any) => (
    <h4 id={id} className="text-base md:text-lg font-bold tracking-tight text-slate-800 dark:text-slate-200 mt-4 mb-2 pl-3 border-l-2 border-slate-300 dark:border-slate-600 scroll-mt-24">
      {children}
    </h4>
  ),
  p: ({ children }: any) => (
    <p className="leading-relaxed my-3 break-words">
      {children}
    </p>
  ),
  ul: ({ children }: any) => (
    <ul className="my-3 list-disc pl-6 space-y-1.5 leading-relaxed">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="my-3 list-decimal pl-6 space-y-1.5 leading-relaxed">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="my-1 leading-relaxed break-words">
      {children}
    </li>
  ),
  a: ({ children, href }: any) => {
    let finalHref = href;
    if (href === "url" || !href) {
      const text = React.Children.toArray(children)
        .map((child: any) => {
          if (typeof child === "string") return child;
          if (child && child.props && typeof child.props.children === "string") {
            return child.props.children;
          }
          return "";
        })
        .join("")
        .trim();
      
      if (text.startsWith("http://") || text.startsWith("https://")) {
        finalHref = text;
      }
    }

    return (
      <a
        href={finalHref}
        target="_blank"
        rel="noopener noreferrer"
        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 underline underline-offset-4 decoration-emerald-600/30 hover:decoration-emerald-500 transition-colors font-medium break-all"
      >
        {children}
      </a>
    );
  },
  strong: ({ children }: any) => (
    <strong className="font-bold text-slate-900 dark:text-white">
      {children}
    </strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-slate-600 dark:text-slate-400">
      {children}
    </em>
  ),
  blockquote: ({ children }: any) => (
    <div className="relative pl-10 pr-4 py-4 my-6 rounded-2xl bg-gradient-to-r from-slate-50/80 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-900/10 border-l-4 border-emerald-500 shadow-sm">
      <div className="absolute left-3 top-4 text-emerald-500/40 dark:text-emerald-500/30 select-none">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 14.725c0-5.141 3.892-10.519 10-11.725l.944 2c-3.077 1.183-4.944 3.388-4.944 6.5h4v9h-10v-5.775zm-13 0c0-5.141 3.892-10.519 10-11.725l.944 2c-3.077 1.183-4.944 3.388-4.944 6.5h4v9h-10v-5.775z" />
        </svg>
      </div>
      <blockquote className="italic text-slate-650 dark:text-slate-350 m-0 leading-relaxed">
        {children}
      </blockquote>
    </div>
  ),
  aside: ({ children }: any) => (
    <div className="relative pl-10 pr-4 py-4 my-6 rounded-2xl bg-emerald-50/30 dark:bg-emerald-950/[0.04] border-l-4 border-emerald-500/80 dark:border-emerald-500/60 shadow-sm">
      <div className="absolute left-3 top-4 text-emerald-500/80 dark:text-emerald-500/60 select-none">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <aside className="text-slate-750 dark:text-slate-300 font-normal leading-relaxed m-0">
        {children}
      </aside>
    </div>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto theory-scrollbar my-6 rounded-2xl border border-zinc-200 dark:border-[#2A3E5A] shadow-md bg-white dark:bg-[#1C2B40] transition-all duration-300">
      <table className="w-full border-collapse text-left">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-emerald-50/80 dark:bg-[#18352B] border-b border-zinc-200 dark:border-[#1E4E3C] select-none">
      {children}
    </thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="divide-y divide-zinc-200/60 dark:divide-[#253952]/80">
      {children}
    </tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="group odd:bg-white even:bg-zinc-50/40 dark:odd:bg-[#182638] dark:even:bg-[#1F3148] hover:bg-emerald-50/50 dark:hover:bg-[#163D2E] transition-all duration-150">
      {children}
    </tr>
  ),
  th: ({ children, style, ...props }: any) => (
    <th
      style={style}
      className="px-4 py-3 font-semibold text-emerald-900 dark:text-emerald-300 tracking-wide border-r border-zinc-200/60 dark:border-[#1E4E3C]/60 last:border-r-0"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, style, ...props }: any) => (
    <td
      style={style}
      className="px-4 py-3 text-zinc-700 dark:text-zinc-200 font-normal leading-relaxed border-r border-zinc-200/40 dark:border-[#253952] last:border-r-0 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors"
      {...props}
    >
      {children}
    </td>
  ),
  img: ({ src, alt }: any) => (
    <img
      src={src}
      alt={alt}
      className="mx-auto rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer my-4 max-w-full h-auto"
    />
  ),
  code: ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const lang = match ? match[1] : "";
    const codeString = String(children).replace(/\n$/, "");

    if (!inline && match) {
      return <CodeBlock code={codeString} language={lang} />;
    }

    return (
      <code
        className="font-mono text-sm font-semibold text-pink-600 dark:text-pink-400 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-zinc-700/50 px-1.5 py-0.5 rounded-md"
        {...props}
      >
        {children}
      </code>
    );
  },
};

const preprocessMath = (text: string) => {
  if (!text) return "";
  // Ensure $$ math $$ has newlines before, after, and inside so remark-math parses it as block display math
  return text.replace(/\$\$([\s\S]+?)\$\$/g, (match, math) => {
    return `\n\n$$\n${math.trim()}\n$$\n\n`;
  });
};

export const Markdown = React.memo(function Markdown({ content, className = "" }: MarkdownProps) {
  const [activeImg, setActiveImg] = React.useState<string | null>(null);

  const customComponents = React.useMemo(() => ({
    ...markdownComponents,
    img: ({ src, alt }: any) => (
      <img
        src={src}
        alt={alt}
        onClick={() => setActiveImg(src)}
        className="mx-auto rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer my-4 max-w-full h-auto"
      />
    ),
  }), []);

  return (
    <div className={`theory-markdown-content ${className}`}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .theory-markdown-content .katex-display {
            margin-top: 1rem;
            margin-bottom: 1rem;
            padding: 0.5rem;
            overflow-x: auto;
            overflow-y: hidden;
            user-select: all;
            text-align: center !important;
            display: block !important;
          }
          .theory-markdown-content p:has(.katex-display) {
            text-align: center !important;
          }
          .theory-markdown-content .katex {
            font-size: 1.05em;
            user-select: all;
            max-width: 100%;
            overflow-x: auto;
            overflow-y: hidden;
            vertical-align: middle;
          }
          .theory-markdown-content .katex-display .katex {
            font-size: 1.25em !important;
          }
          .theory-markdown-content > *:first-child {
            margin-top: 0 !important;
          }
          .theory-markdown-content p:first-of-type {
            margin-top: 0;
          }
          .theory-markdown-content p:last-of-type {
            margin-bottom: 0;
          }
        `,
      }} />
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex, rehypeHeadingIds]}
        components={customComponents}
      >
        {preprocessMath(content)}
      </ReactMarkdown>

      <AnimatePresence>
        {activeImg && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-zoom-out"
            onClick={() => setActiveImg(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-[80vw] h-[80vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activeImg}
                alt="Enlarged view"
                className="w-full h-full object-contain rounded-2xl shadow-2xl border border-white/10"
              />
              <button
                onClick={() => setActiveImg(null)}
                className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"
              >
                <X className="size-6" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
