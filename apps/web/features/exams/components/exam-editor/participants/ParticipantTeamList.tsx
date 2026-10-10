"use client";

import React from "react";
import { Group, ChevronDown, ChevronUp, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ExternalTeam, ExternalUser } from "@/features/exams/types";

interface ParticipantTeamListProps {
  teams: ExternalTeam[];
  selectedIds: number[];
  expandedTeams: number[];
  userMap: Map<number, ExternalUser>;
  onToggleUser: (userId: number) => void;
  onAddTeam: (teamId: number) => void;
  onRemoveTeam: (teamId: number) => void;
  onToggleTeamExpand: (teamId: number, e: React.MouseEvent) => void;
  isLoading: boolean;
}

export function ParticipantTeamList({
  teams,
  selectedIds,
  expandedTeams,
  userMap,
  onToggleUser,
  onAddTeam,
  onRemoveTeam,
  onToggleTeamExpand,
  isLoading,
}: ParticipantTeamListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-1.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 rounded-2xl bg-gray-50 dark:bg-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-10 text-xs text-gray-navy dark:text-light-blue/60">
        Không tìm thấy nhóm nào
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {teams.map((team) => {
        const isExpanded = expandedTeams.includes(team.id);
        const teamMemberIds = team.members.map((m) => m.user_id);
        const selectedTeamMembersCount = teamMemberIds.filter((id) =>
          selectedIds.includes(id)
        ).length;
        const isFullySelected =
          team.members.length > 0 &&
          selectedTeamMembersCount === team.members.length;

        return (
          <div
            key={team.id}
            className="rounded-2xl border border-gray-150 dark:border-white/10 bg-white dark:bg-zinc-950/20 overflow-hidden"
          >
            {/* Header bar */}
            <div
              onClick={(e) => onToggleTeamExpand(team.id, e)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 truncate">
                <div className="size-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <Group className="size-5" />
                </div>
                <div className="text-left truncate">
                  <p className="font-bold text-xs text-dark-blue dark:text-white truncate leading-normal">
                    {team.team_name}
                  </p>
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {team.member_count} thành viên{" "}
                    {selectedTeamMembersCount > 0 &&
                      `(Đã chọn ${selectedTeamMembersCount})`}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isFullySelected) {
                      onRemoveTeam(team.id);
                    } else {
                      onAddTeam(team.id);
                    }
                  }}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer",
                    isFullySelected
                      ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                      : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500"
                  )}
                >
                  {isFullySelected ? "Bỏ chọn cả nhóm" : "Chọn cả nhóm"}
                </button>

                <div className="text-gray-navy dark:text-light-blue/70">
                  {isExpanded ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded members */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden bg-gray-50/50 dark:bg-zinc-950/10 border-t border-gray-100 dark:border-white/5"
                >
                  <div className="p-2 pl-6 pr-4 space-y-1">
                    {team.members.map((member) => {
                      const u = userMap.get(member.user_id);
                      if (!u) return null;
                      const isMemberSelected = selectedIds.includes(member.user_id);

                      return (
                        <button
                          key={`team-${team.id}-user-${member.user_id}`}
                          type="button"
                          onClick={() => onToggleUser(member.user_id)}
                          className={cn(
                            "w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer",
                            isMemberSelected
                              ? "bg-primary/5 text-primary"
                              : "hover:bg-gray-100 dark:hover:bg-white/5 text-dark-blue dark:text-white"
                          )}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Avatar className="size-6">
                              <AvatarImage src={u.avatar_url ?? ""} />
                              <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                                {u.name.substring(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{u.name}</span>
                          </div>
                          {isMemberSelected ? (
                            <Check className="size-3 text-primary" />
                          ) : (
                            <div className="size-3.5 rounded-full border border-gray-300 dark:border-white/30" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
