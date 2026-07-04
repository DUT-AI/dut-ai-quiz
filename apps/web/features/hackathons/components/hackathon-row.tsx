"use client";

import React from "react";
import { type Hackathon } from "../types";
import { useDeleteHackathon } from "@/lib/queries";
import { Calendar, Users, Pencil, Trash2 } from "lucide-react";
import { formatDateTime, getParticipationModeLabel } from "@/lib/utils";

interface HackathonRowProps {
  hackathon: Hackathon;
  onEdit: () => void;
}

export function HackathonRow({ hackathon, onEdit }: HackathonRowProps) {
  const deleteMut = useDeleteHackathon();

  const isExpired = hackathon.end_time ? new Date(hackathon.end_time) < new Date() : false;
  const isStarted = hackathon.start_time ? new Date(hackathon.start_time) <= new Date() : false;
  const isOngoing = isStarted && !isExpired;

  return (
    <div className="rounded-[2rem] bg-white dark:bg-navy-blue border border-gray-100 dark:border-white/5 overflow-hidden p-6 md:p-8 shadow-sm transition-all hover:shadow-md">
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

        {/* Right Actions */}
        <div className="flex items-center gap-3 self-end md:self-center shrink-0">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl border border-gray-150 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-dark-blue dark:text-white transition font-black"
          >
            <Pencil className="size-3.5" />
            <span>Sửa</span>
          </button>
          <button
            onClick={() => {
              if (confirm(`Bạn có chắc chắn muốn xoá hackathon "${hackathon.name}"?`)) {
                deleteMut.mutate(hackathon.id);
              }
            }}
            className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl bg-red/10 text-red hover:bg-red hover:text-white transition font-black border border-red/10 hover:border-transparent"
          >
            <Trash2 className="size-3.5" />
            <span>Xoá</span>
          </button>
        </div>

      </div>
    </div>
  );
}
