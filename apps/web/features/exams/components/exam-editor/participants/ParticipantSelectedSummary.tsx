"use client";

import React from "react";
import { Trash2, Users, Group, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ExternalTeam, ExternalUser } from "@/features/exams/types";

interface ParticipantSelectedSummaryProps {
  selectedIds: number[];
  fullySelectedTeams: ExternalTeam[];
  selectedIndividualUsers: ExternalUser[];
  expandedSelectedTeams: number[];
  userMap: Map<number, ExternalUser>;
  onToggleSelectedTeamExpand: (teamId: number) => void;
  onRemoveTeam: (teamId: number) => void;
  onToggleUser: (userId: number) => void;
  onRemoveAll: () => void;
}

export function ParticipantSelectedSummary({
  selectedIds,
  fullySelectedTeams,
  selectedIndividualUsers,
  expandedSelectedTeams,
  userMap,
  onToggleSelectedTeamExpand,
  onRemoveTeam,
  onToggleUser,
  onRemoveAll,
}: ParticipantSelectedSummaryProps) {
  return (
    <div className="w-full md:w-80 flex-shrink-0">
      <div className="flex flex-col rounded-3xl border border-gray-150 bg-gray-50/50 dark:border-white/10 dark:bg-navy-blue/30 h-[435px] p-4 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-250 dark:border-white/10 mb-3">
          <div>
            <h3 className="font-black uppercase tracking-wider text-[10px] text-gray-navy dark:text-zinc-400">
              Danh sách đã chọn
            </h3>
            <p className="text-xs text-primary font-bold">
              {selectedIds.length} học viên được chọn
            </p>
          </div>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={onRemoveAll}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
              title="Xóa tất cả"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>

        {/* Scrollable list area */}
        <div className="flex-1 overflow-y-auto pr-0.5 space-y-1.5 custom-scrollbar">
          <AnimatePresence>
            {/* 1. Fully Selected Teams */}
            {fullySelectedTeams.map((team) => {
              const isExpanded = expandedSelectedTeams.includes(team.id);
              return (
                <motion.div
                  key={`selected-team-${team.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-2xl border border-gray-150 dark:border-white/15 bg-white dark:bg-zinc-950/30 overflow-hidden"
                >
                  <div className="flex items-center justify-between p-2.5">
                    <button
                      type="button"
                      onClick={() => onToggleSelectedTeamExpand(team.id)}
                      className="flex items-center gap-2 text-xs font-bold text-left truncate flex-1 hover:text-primary dark:text-white cursor-pointer"
                    >
                      <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                        <Group className="size-3.5" />
                      </div>
                      <span className="truncate">{team.team_name}</span>
                      <span className="text-[9px] text-gray-navy dark:text-zinc-400 font-normal">
                        ({team.members.length})
                      </span>
                      <div className="text-gray-navy dark:text-light-blue/70">
                        {isExpanded ? (
                          <ChevronUp className="size-3" />
                        ) : (
                          <ChevronDown className="size-3" />
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemoveTeam(team.id)}
                      className="p-1 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  {/* Members list inside selection card */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden bg-gray-50/50 dark:bg-zinc-950/20 border-t border-gray-100 dark:border-white/5"
                      >
                        <div className="p-2 pl-6 pr-2 space-y-1">
                          {team.members.map((m) => {
                            const u = userMap.get(m.user_id);
                            if (!u) return null;
                            return (
                              <div
                                key={`selected-team-member-${m.user_id}`}
                                className="flex items-center justify-between p-1 rounded-lg text-xs text-dark-blue dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <Avatar className="size-5">
                                    <AvatarImage src={u.avatar_url ?? ""} />
                                    <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-bold">
                                      {u.name.substring(0, 1).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="truncate text-[11px] font-medium">
                                    {u.name}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onToggleUser(m.user_id)}
                                  className="p-1 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* 2. Individual selected users */}
            {selectedIndividualUsers.map((user) => (
              <motion.div
                key={`selected-user-${user.id}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-2 p-2 pr-3 rounded-2xl bg-white dark:bg-zinc-950/30 border border-gray-150 dark:border-white/15 shadow-sm"
              >
                <Avatar className="size-6">
                  <AvatarImage src={user.avatar_url ?? ""} />
                  <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-black">
                    {user.name.substring(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-bold truncate flex-1 text-dark-blue dark:text-white">
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleUser(user.id)}
                  className="size-6 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Trash2 className="size-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {selectedIds.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-40 py-16 text-center text-gray-navy dark:text-zinc-400">
              <Users className="size-8 mb-2" />
              <p className="text-[10px] font-black uppercase">
                Chưa chọn thí sinh nào
              </p>
              <p className="text-[10px] mt-1 max-w-[180px]">
                Hãy chọn học viên hoặc nhóm từ danh sách bên trái
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
