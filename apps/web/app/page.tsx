import React from "react";
import { LandingPage } from "@/components/organisms/landing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DUT AI Quiz Portal - Hệ thống đánh giá năng lực tích hợp AI",
  description: "Hệ thống quản lý học tập và đánh giá năng lực tích hợp trí tuệ nhân tạo. Luyện thi trực tuyến, ôn tập bài học thông minh cùng trợ lý AI.",
  keywords: [
    "DUT AI",
    "DUT AI Quiz Portal",
    "Hệ thống đánh giá năng lực",
    "Luyện thi AI",
    "Ôn tập thông minh",
    "DUT Quiz",
    "Trắc nghiệm AI",
  ],
  openGraph: {
    title: "DUT AI Quiz Portal - Đánh giá năng lực tích hợp AI",
    description: "Hệ thống quản lý học tập và đánh giá năng lực tích hợp trí tuệ nhân tạo. Luyện thi trực tuyến cùng trợ lý AI.",
    type: "website",
    url: "https://quiz.dutai.site",
    siteName: "DUT AI Quiz Portal",
  },
  twitter: {
    card: "summary_large_image",
    title: "DUT AI Quiz Portal - Đánh giá năng lực tích hợp AI",
    description: "Hệ thống quản lý học tập và đánh giá năng lực tích hợp trí tuệ nhân tạo. Luyện thi trực tuyến cùng trợ lý AI.",
  },
};

export default function Home() {
  return <LandingPage />;
}
