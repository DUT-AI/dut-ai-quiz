"use client";

import React, { useState, useEffect } from "react";
import { CommentList } from "@/features/comments/components/comment-list";
import { FeedbackHeader } from "./components/feedback-header";
import { FeedbackSuggestionsModal } from "./components/feedback-suggestions-modal";
import { FeedbackSuccessModal } from "./components/feedback-success-modal";

export default function FeedbackPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem("has-seen-feedback-suggestions");
    if (!hasSeen) {
      setIsModalOpen(true);
      localStorage.setItem("has-seen-feedback-suggestions", "true");
    }
  }, []);

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 text-left">
      <FeedbackHeader onShowSuggestions={() => setIsModalOpen(true)} />

      <FeedbackSuggestionsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      <FeedbackSuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
      />

      {/* Main Comment Module (Cardless, sitting directly on background) */}
      <div className="max-w-5xl mx-auto pt-4 text-left">
        <CommentList 
          targetType="system_feedback" 
          targetId={null} 
          title="Bảng góp ý từ người dùng"
          description="Xem đóng góp của mọi người và cùng thảo luận, bình chọn cho ý tưởng tốt nhất."
          showIcon={true}
          onSuccess={() => setIsSuccessOpen(true)}
        />
      </div>
    </div>
  );
}
