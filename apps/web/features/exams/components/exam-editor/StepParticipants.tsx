"use client";

import React from "react";
import { Search, User, Users, Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useParticipantSelection } from "./participants/useParticipantSelection";
import { ParticipantScopeHeader } from "./participants/ParticipantScopeHeader";
import { ParticipantPublicBanner } from "./participants/ParticipantPublicBanner";
import { ParticipantUserList } from "./participants/ParticipantUserList";
import { ParticipantTeamList } from "./participants/ParticipantTeamList";
import { ParticipantSelectedSummary } from "./participants/ParticipantSelectedSummary";

interface Props {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  accessScope?: "PUBLIC" | "RESTRICTED";
  onAccessScopeChange?: (scope: "PUBLIC" | "RESTRICTED") => void;
}

export default function StepParticipants(props: Props) {
  const selection = useParticipantSelection(props);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Scope Switcher */}
      <ParticipantScopeHeader
        isPublic={selection.isPublic}
        onToggleScope={selection.handleToggleScope}
      />

      {/* Mode 1: Public Mode */}
      {selection.isPublic ? (
        <ParticipantPublicBanner
          totalUsersCount={selection.totalUsersCount}
          onSwitchToRestricted={() => selection.handleToggleScope(false)}
        />
      ) : (
        /* Mode 2: Restricted Mode */
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          <div className="flex flex-col md:flex-row gap-5">
            {/* Left Selection Area */}
            <div className="flex-1 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-gray-navy opacity-55" />
                <input
                  type="text"
                  placeholder="Tìm kiếm thí sinh hoặc nhóm..."
                  value={selection.search}
                  onChange={(e) => selection.setSearch(e.target.value)}
                  className="w-full pl-11 pr-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-950/40 border border-gray-250 dark:border-white/20 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm font-medium text-dark-blue dark:text-white"
                />
              </div>

              {/* Tab Switches and Select All */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex p-0.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-150 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => selection.setActiveTab("users")}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                      selection.activeTab === "users"
                        ? "bg-white dark:bg-zinc-800 shadow-sm text-primary"
                        : "text-gray-navy dark:text-light-blue/70"
                    )}
                  >
                    <User className="size-3.5" /> Cá nhân
                  </button>
                  <button
                    type="button"
                    onClick={() => selection.setActiveTab("teams")}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                      selection.activeTab === "teams"
                        ? "bg-white dark:bg-zinc-800 shadow-sm text-primary"
                        : "text-gray-navy dark:text-light-blue/70"
                    )}
                  >
                    <Users className="size-3.5" /> Nhóm
                  </button>
                </div>

                {/* Select All Toggle Button */}
                {selection.activeTab === "users" ? (
                  <button
                    type="button"
                    onClick={selection.toggleSelectAllUsers}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 py-1 px-2 cursor-pointer"
                  >
                    {selection.isAllUsersSelected ? (
                      <>
                        <Minus className="size-3" /> Bỏ chọn tất cả cá nhân
                      </>
                    ) : (
                      <>
                        <Plus className="size-3" /> Chọn tất cả cá nhân (
                        {selection.filteredUsers.length})
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={selection.toggleSelectAllTeams}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 py-1 px-2 cursor-pointer"
                  >
                    {selection.isAllTeamsSelected ? (
                      <>
                        <Minus className="size-3" /> Bỏ chọn tất cả các nhóm
                      </>
                    ) : (
                      <>
                        <Plus className="size-3" /> Chọn tất cả các nhóm (
                        {selection.filteredTeams.length})
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Scrollable list container */}
              <div className="h-[360px] overflow-y-auto pr-1.5 custom-scrollbar space-y-1.5">
                {selection.activeTab === "users" ? (
                  <ParticipantUserList
                    users={selection.filteredUsers}
                    selectedIds={props.selectedIds}
                    onToggleUser={selection.toggleUser}
                    isLoading={selection.loadingUsers}
                  />
                ) : (
                  <ParticipantTeamList
                    teams={selection.filteredTeams}
                    selectedIds={props.selectedIds}
                    expandedTeams={selection.expandedTeams}
                    userMap={selection.userMap}
                    onToggleUser={selection.toggleUser}
                    onAddTeam={selection.addTeam}
                    onRemoveTeam={selection.removeTeam}
                    onToggleTeamExpand={selection.toggleTeamExpand}
                    isLoading={selection.loadingTeams || selection.loadingUsers}
                  />
                )}
              </div>
            </div>

            {/* Right Summary Card */}
            <ParticipantSelectedSummary
              selectedIds={props.selectedIds}
              fullySelectedTeams={selection.fullySelectedTeams}
              selectedIndividualUsers={selection.selectedIndividualUsers}
              expandedSelectedTeams={selection.expandedSelectedTeams}
              userMap={selection.userMap}
              onToggleSelectedTeamExpand={selection.toggleSelectedTeamExpand}
              onRemoveTeam={selection.removeTeam}
              onToggleUser={selection.toggleUser}
              onRemoveAll={selection.removeAll}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
