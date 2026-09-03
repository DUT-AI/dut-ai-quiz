"use client";

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/context/auth-context";
import { toast } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error: any, query) => {
            if (error?.status === 401) return;
            // Ignore 404 No Active Session check error toast
            if (
              error?.status === 404 &&
              query.queryKey?.[0] === "game" &&
              query.queryKey?.[1] === "sessions" &&
              query.queryKey?.[2] === "active"
            ) {
              return;
            }
            const message = error?.message || "Đã có lỗi xảy ra ở hệ thống vui lòng liên hệ admin!";
            toast.error(message);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error: any) => {
            if (error?.status === 401) return;
            const message = error?.message || "Yêu cầu thực hiện thất bại";
            // Ignore inline PDF password errors
            if (
              message.includes("PDF_LOCKED") ||
              message.includes("INVALID_PASSWORD") ||
              message.includes("Mật khẩu PDF không đúng")
            ) {
              return;
            }
            toast.error(message);
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
