import React from "react";
import Link from "next/link";
import { MotionDiv } from "@/components/animated/motion-div";
import MaxWidthWrapper from "@/components/atoms/max-width-wrapper";

export function LandingPage() {
  return (
    <div className="bg-white dark:bg-black w-full min-h-screen relative overflow-y-auto">
      <MaxWidthWrapper className="flex flex-col items-center justify-center min-h-screen text-center px-6">
        <MotionDiv
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl space-y-8"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-dark-blue dark:text-white leading-tight font-serif">
            Welcome to the <br />
            <span className="text-primary">DUT AI Quiz Portal</span>
          </h1>
          <p className="text-xl text-gray-navy dark:text-light-blue max-w-lg mx-auto opacity-70">
            Hệ thống quản lý học tập và đánh giá năng lực tích hợp trí tuệ nhân tạo.
          </p>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-10 py-5 bg-primary hover:bg-primary/90 text-white rounded-2xl text-xl font-bold shadow-xl transition transform hover:scale-105 inline-block"
            >
              Đăng nhập Portal
            </Link>
          </div>
        </MotionDiv>
      </MaxWidthWrapper>
    </div>
  );
}
