"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { rehypeHeadingIds } from "../utils/theory-parser";
import { CodeBlock } from "./code-block";

interface TheoryContentProps {
  contentMd: string;
}

const components = {
  h1: ({ children, id }: any) => (
    <h1 id={id} className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-16 mb-5 leading-tight scroll-mt-24">
      {children}
    </h1>
  ),
  h2: ({ children, id }: any) => (
    <h2 id={id} className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-9 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700 scroll-mt-24">
      {children}
    </h2>
  ),
  h3: ({ children, id }: any) => (
    <h3 id={id} className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-7 mb-3 scroll-mt-24">
      {children}
    </h3>
  ),
  h4: ({ children, id }: any) => (
    <h4 id={id} className="text-lg md:text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200 mt-6 mb-2 pl-3 border-l-2 border-slate-300 dark:border-slate-600 scroll-mt-24">
      {children}
    </h4>
  ),
  p: ({ children }: any) => (
    <p className="text-lg md:text-xl text-slate-700 dark:text-slate-200 font-normal leading-relaxed my-5 break-words">
      {children}
    </p>
  ),
  ul: ({ children }: any) => (
    <ul className="my-4 list-disc pl-6 space-y-2 text-lg md:text-xl text-slate-700 dark:text-slate-200 font-normal leading-relaxed">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="my-4 list-decimal pl-6 space-y-2 text-lg md:text-xl text-slate-700 dark:text-slate-200 font-normal leading-relaxed">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="my-2 leading-relaxed break-words">
      {children}
    </li>
  ),
  a: ({ children, href }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 underline underline-offset-4 decoration-emerald-600/30 hover:decoration-emerald-500 transition-colors font-medium break-all">
      {children}
    </a>
  ),
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
    <div className="relative pl-12 pr-6 py-5 my-8 rounded-2xl bg-gradient-to-r from-slate-50/80 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-900/10 border-l-4 border-emerald-500 shadow-sm">
      <div className="absolute left-4 top-5 text-emerald-500/40 dark:text-emerald-500/30 select-none">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 14.725c0-5.141 3.892-10.519 10-11.725l.944 2c-3.077 1.183-4.944 3.388-4.944 6.5h4v9h-10v-5.775zm-13 0c0-5.141 3.892-10.519 10-11.725l.944 2c-3.077 1.183-4.944 3.388-4.944 6.5h4v9h-10v-5.775z"/>
        </svg>
      </div>
      <blockquote className="italic text-slate-650 dark:text-slate-350 text-lg md:text-xl m-0 leading-relaxed">
        {children}
      </blockquote>
    </div>
  ),
  aside: ({ children }: any) => (
    <div className="relative pl-12 pr-6 py-5 my-8 rounded-2xl bg-emerald-50/30 dark:bg-emerald-950/[0.04] border-l-4 border-emerald-500/80 dark:border-emerald-500/60 shadow-sm">
      <div className="absolute left-4 top-5.5 text-emerald-500/80 dark:text-emerald-500/60 select-none">
        <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <aside className="text-slate-750 dark:text-slate-300 text-lg md:text-xl font-normal leading-relaxed m-0">
        {children}
      </aside>
    </div>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto theory-scrollbar my-8 rounded-2xl border border-zinc-200 dark:border-[#2A3E5A] shadow-md shadow-zinc-200/30 dark:shadow-xl dark:shadow-black/30 bg-[#FFFFFF] dark:bg-[#1C2B40] transition-all duration-300 hover:shadow-lg hover:border-zinc-300 dark:hover:border-[#385175]">
      <table className="w-full border-collapse text-left text-lg md:text-xl">
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
    <tr className="group odd:bg-[#FFFFFF] even:bg-zinc-50/40 dark:odd:bg-[#182638] dark:even:bg-[#1F3148] hover:bg-emerald-50/50 dark:hover:bg-[#163D2E] transition-all duration-150">
      {children}
    </tr>
  ),
  th: ({ children, style, ...props }: any) => (
    <th
      style={style}
      className="px-6 py-4.5 font-semibold text-emerald-900 dark:text-emerald-300 text-lg md:text-xl tracking-wide border-r border-zinc-200/60 dark:border-[#1E4E3C]/60 last:border-r-0"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, style, ...props }: any) => (
    <td
      style={style}
      className="px-6 py-4 text-zinc-700 dark:text-zinc-200 font-normal leading-relaxed text-lg md:text-xl border-r border-zinc-200/40 dark:border-[#253952] last:border-r-0 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors"
      {...props}
    >
      {children}
    </td>
  ),
  img: ({ src, alt }: any) => (
    <img
      src={src}
      alt={alt}
      className="mx-auto rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer my-6 max-w-full h-auto"
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

export const TheoryContent = React.memo(function TheoryContent({ contentMd }: TheoryContentProps) {
  return (
    <div className="bg-white dark:bg-[#121E31]/90 border border-gray-200 dark:border-white/20 rounded-[2.5rem] shadow-xl p-6 md:p-12 text-left transition-colors duration-300">
      <style dangerouslySetInnerHTML={{
        __html: `
          .theory-markdown-content .katex-display {
            margin-top: 1.5rem;
            margin-bottom: 1.5rem;
            padding: 0.5rem;
            overflow-x: auto;
            overflow-y: hidden;
            user-select: all;
          }
          .theory-markdown-content .katex {
            font-size: 1.05em;
            user-select: all;
          }
          .theory-markdown-content p:first-of-type {
            margin-top: 0;
          }
          .theory-markdown-content p:last-of-type {
            margin-bottom: 0;
          }
        `,
      }} />
      <div className="max-w-4xl mx-auto text-left font-sans antialiased text-dark-blue dark:text-white break-words theory-markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeHeadingIds, rehypeKatex]}
          components={components}
        >
          {contentMd}
        </ReactMarkdown>
      </div>
    </div>
  );
});