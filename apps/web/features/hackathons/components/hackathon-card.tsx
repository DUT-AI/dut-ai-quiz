"use client";

import React, { useState } from "react";
import { type Hackathon } from "../types";
import { HackathonDetailModal } from "./hackathon-detail-modal";
import { AnimatePresence } from "framer-motion";
import { Calendar, Users, ArrowRight } from "lucide-react";
import { formatDateTime, getParticipationModeLabel } from "@/lib/utils";
import { useHackathonRegistrationStatus } from "../queries";
import { useRouter } from "next/navigation";

interface HackathonCardProps {
  hackathon: Hackathon;
}

export function HackathonCard({ hackathon }: HackathonCardProps) {
  const router = useRouter();
  const [showDetail, setShowDetail] = useState(false);
  const { data: regStatus } = useHackathonRegistrationStatus(hackathon.id);

  const isApproved = regStatus?.registration?.status === "approved";

  const isExpired = hackathon.end_time ? new Date(hackathon.end_time) < new Date() : false;
  const isStarted = hackathon.start_time ? new Date(hackathon.start_time) <= new Date() : false;
  const isOngoing = isStarted && !isExpired;

  const handleClick = () => {
    if (isApproved) {
      router.push(`/hackathons/${hackathon.id}`);
    } else {
      setShowDetail(true);
    }
  };

  return (
    <>
      <div 
        onClick={handleClick}
        className="rounded-[2rem] bg-white dark:bg-navy-blue border border-gray-100 dark:border-white/5 overflow-hidden p-6 md:p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.005] hover:border-primary/20 cursor-pointer text-left flex flex-col justify-between gap-4 group"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status badges */}
            {isOngoing && (
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/10">
                Đang diễn ra
              </span>
            )}
            {isExpired && (
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gray-navy/10 text-gray-navy/60 dark:text-light-blue/40 border border-gray-navy/10 dark:border-white/5">
                Đã kết thúc
              </span>
            )}
            {!isStarted && hackathon.start_time && (
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/10">
                Sắp diễn ra
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-dark-blue dark:text-white group-hover:text-primary transition-colors leading-tight">
            {hackathon.name}
          </h3>

          {hackathon.description && (
            <p className="text-sm text-gray-navy dark:text-light-blue opacity-75 font-medium leading-relaxed line-clamp-2">
              {hackathon.description}
            </p>
          )}
        </div>

        {/* Footer info & Arrow */}
        <div className="flex items-end justify-between gap-4 pt-2 border-t border-gray-50 dark:border-white/[0.02]">
          <div className="space-y-1.5 text-xs font-bold text-gray-navy dark:text-light-blue opacity-60">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4 text-primary shrink-0" />
              <span className="truncate">
                {formatDateTime(hackathon.start_time)} - {formatDateTime(hackathon.end_time)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="size-4 text-primary shrink-0" />
              <span>Hình thức: {getParticipationModeLabel(hackathon.participation_mode)}</span>
            </div>
          </div>

          <div className="size-9 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 flex items-center justify-center text-gray-navy dark:text-light-blue group-hover:bg-primary group-hover:text-white group-hover:border-transparent transition-all transform group-hover:translate-x-1 duration-300">
            <ArrowRight className="size-4" />
          </div>
        </div>
      </div>

      {/* Modal chi tiết */}
      <AnimatePresence>
        {showDetail && (
          <HackathonDetailModal 
            hackathon={hackathon} 
            onClose={() => setShowDetail(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}
