"use client";

import React from "react";
import NextImage from "next/image";
import { AlertTriangle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParticipantStat {
  user_id: number;
  attempts_count: number;
  best_score: number | null;
  max_tab_out: number;
}

interface ParticipantsTabProps {
  participants: ParticipantStat[];
  userMap: Map<number, {
    id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
  }>;
}

export function ParticipantsTab({ participants, userMap }: ParticipantsTabProps) {
  return (
    <div className="bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 rounded-[3rem] p-8 md:p-10 shadow-sm">
      <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
        <Users className="size-5 text-blue-500" />
        Thí sinh ({participants.length})
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
        {participants.sort((a, b) => (b.best_score || 0) - (a.best_score || 0)).map((p) => {
          const user = userMap.get(p.user_id);
          return (
            <div key={p.user_id} className="group p-5 rounded-[2rem] bg-gray-50 dark:bg-white/5 border border-transparent hover:border-blue-500/20 transition-all flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-blue-500/10 flex items-center justify-center font-black text-blue-500 overflow-hidden shrink-0">
                  {user?.avatar_url ? (
                    <NextImage src={user.avatar_url} alt="" width={48} height={48} className="size-full object-cover" unoptimized />
                  ) : (
                    user?.name?.charAt(0) || p.user_id
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-dark-blue dark:text-white truncate">
                    {user?.name || `User #${p.user_id}`}
                  </p>
                  <p className="text-[10px] text-gray-navy opacity-60 uppercase font-black truncate">
                    {p.attempts_count} lượt làm bài
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn(
                    "text-xl font-black",
                    p.best_score && p.best_score >= 8 ? "text-green-500" : 
                    p.best_score && p.best_score >= 5 ? "text-blue-500" : "text-gray-navy"
                  )}>
                    {p.best_score ?? "N/A"}
                  </p>
                </div>
              </div>
              
              {p.max_tab_out > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red/10 text-red text-[10px] font-black uppercase tracking-tighter w-fit">
                  <AlertTriangle className="size-3" />
                  {p.max_tab_out} lần thoát tab
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
