"use client";

import React from "react";
import { type Hackathon } from "../types";
import { Calendar, Users, ShieldCheck, Eye } from "lucide-react";
import { formatDateTime, getParticipationModeLabel } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { isOwnerOrAdmin } from "@/lib/permissions";

interface HackathonRowProps {
  hackathon: Hackathon;
}

export function HackathonRow({ hackathon }: HackathonRowProps) {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const isOwner = isOwnerOrAdmin(user, hackathon.created_by);

  const isExpired = hackathon.end_time ? new Date(hackathon.end_time) < new Date() : false;
  const isStarted = hackathon.start_time ? new Date(hackathon.start_time) <= new Date() : false;
  const isOngoing = isStarted && !isExpired;

  return (
    <div
      onClick={() => router.push(`/teacher/hackathons/${hackathon.id}`)}
      className="rounded-[2rem] bg-white dark:bg-navy-blue border border-gray-100 dark:border-white/5 overflow-hidden p-6 md:p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20 dark:hover:border-primary/20 cursor-pointer active:scale-[0.99]"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Left Information */}
        <div className="flex-1 space-y-3 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-dark-blue dark:text-white">
              {hackathon.name}
            </h2>
            
            {/* Status badges */}
            {isOngoing && (
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/10">
                Đang diễn ra
              </span>
            )}
            {isExpired && (
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-navy/10 text-gray-navy/60 dark:text-light-blue/40 border border-gray-navy/10 dark:border-white/5">
                Đã kết thúc
              </span>
            )}
            {!isStarted && hackathon.start_time && (
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/10">
                Sắp diễn ra
              </span>
            )}

            {/* Ownership badge */}
            {isOwner ? (
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/10 flex items-center gap-1">
                <ShieldCheck className="size-3" />
                {isAdmin ? "Admin" : "Người tạo"}
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-gray-navy/70 dark:text-light-blue/50 border border-gray-200 dark:border-white/10 flex items-center gap-1">
                <Eye className="size-3" />
                Chỉ xem
              </span>
            )}
          </div>

          {hackathon.description && (
            <p className="text-sm text-gray-navy dark:text-light-blue opacity-75 font-medium leading-relaxed max-w-2xl">
              {hackathon.description}
            </p>
          )}

          {/* Details footer */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-xs font-bold text-gray-navy dark:text-light-blue opacity-60">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4 text-primary" />
              <span>
                {formatDateTime(hackathon.start_time)} - {formatDateTime(hackathon.end_time)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="size-4 text-primary" />
              <span>Hình thức: {getParticipationModeLabel(hackathon.participation_mode)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
