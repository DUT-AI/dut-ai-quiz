import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import ThemeProvider from "@/components/providers/theme-provider";
import { Providers } from "./providers";
import { ImageZoomPortal } from "@/components/atoms/ImageZoomPortal";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "DUT AI Quiz Portal",
  description: "Hệ thống quản lý học tập và đánh giá năng lực tích hợp AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <ThemeProvider>
            <NextTopLoader color="#7C3AED" showSpinner={true} height={3} />
            {children}
            <ImageZoomPortal />
            <Toaster position="top-right" />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
