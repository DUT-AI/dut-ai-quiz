"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useExternalTeams, useExternalUsers } from "@/lib/queries";
import { Search, Users, User, Check, Trash2, Group, ChevronDown, ChevronUp, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export default function StepParticipants({ selectedIds, onChange }: Props) {
  const { data: teamsData, isLoading: loadingTeams } = useExternalTeams();
  const { data: usersData, isLoading: loadingUsers } = useExternalUsers();
  
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "teams">("users");
  
  // Track expanded teams in the left selection list
  const [expandedTeams, setExpandedTeams] = useState<number[]>([]);
  
  // Track expanded teams in the right selected list
  const [expandedSelectedTeams, setExpandedSelectedTeams] = useState<number[]>([]);

  // Create a mapping of user details by user ID
  const userMap = useMemo(() => {
    return new Map((usersData?.data ?? []).map((u) => [u.id, u]));
  }, [usersData?.data]);

  const filteredUsers = useMemo(() => {
    const list = usersData?.data ?? [];
    return list.filter(u => 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [usersData?.data, search]);

  const filteredTeams = useMemo(() => {
    const list = teamsData?.data ?? [];
    return list.filter(t => 
      t.team_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [teamsData?.data, search]);

  const toggleUser = (userId: number) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter(id => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  const addTeam = (teamId: number) => {
    const list = teamsData?.data ?? [];
    const team = list.find(t => t.id === teamId);
    if (!team) return;
    const memberIds = team.members.map(m => m.user_id);
    const newIds = Array.from(new Set([...selectedIds, ...memberIds]));
    onChange(newIds);
  };

  const removeTeam = (teamId: number) => {
    const list = teamsData?.data ?? [];
    const team = list.find(t => t.id === teamId);
    if (!team) return;
    const memberIds = new Set(team.members.map(m => m.user_id));
    onChange(selectedIds.filter(id => !memberIds.has(id)));
  };

  const removeAll = () => onChange([]);

  // Check if all filtered items are selected
  const isAllUsersSelected = useMemo(() => {
    if (filteredUsers.length === 0) return false;
    return filteredUsers.every(u => selectedIds.includes(u.id));
  }, [filteredUsers, selectedIds]);

  const toggleSelectAllUsers = () => {
    if (isAllUsersSelected) {
      const filteredIds = new Set(filteredUsers.map(u => u.id));
      onChange(selectedIds.filter(id => !filteredIds.has(id)));
    } else {
      const newIds = Array.from(new Set([...selectedIds, ...filteredUsers.map(u => u.id)]));
      onChange(newIds);
    }
  };

  const isAllTeamsSelected = useMemo(() => {
    const allTeamUserIds = filteredTeams.flatMap(t => t.members.map(m => m.user_id));
    if (allTeamUserIds.length === 0) return false;
    return allTeamUserIds.every(id => selectedIds.includes(id));
  }, [filteredTeams, selectedIds]);

  const toggleSelectAllTeams = () => {
    if (isAllTeamsSelected) {
      const allTeamUserIds = new Set(filteredTeams.flatMap(t => t.members.map(m => m.user_id)));
      onChange(selectedIds.filter(id => !allTeamUserIds.has(id)));
    } else {
      const allTeamUserIds = filteredTeams.flatMap(t => t.members.map(m => m.user_id));
      const newIds = Array.from(new Set([...selectedIds, ...allTeamUserIds]));
      onChange(newIds);
    }
  };

  // Toggle expanding a team card in the left list
  const toggleTeamExpand = (teamId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (expandedTeams.includes(teamId)) {
      setExpandedTeams(expandedTeams.filter(id => id !== teamId));
    } else {
      setExpandedTeams([...expandedTeams, teamId]);
    }
  };

  // Group selected users by fully selected teams
  const fullySelectedTeams = useMemo(() => {
    const list = teamsData?.data ?? [];
    return list.filter(team => 
      team.members.length > 0 && team.members.every(m => selectedIds.includes(m.user_id))
    );
  }, [teamsData?.data, selectedIds]);

  const fullySelectedTeamUserIds = useMemo(() => {
    const ids = new Set<number>();
    fullySelectedTeams.forEach(t => t.members.forEach(m => ids.add(m.user_id)));
    return ids;
  }, [fullySelectedTeams]);

  // Selected users who are NOT part of a fully selected team
  const selectedIndividualUsers = useMemo(() => {
    const list = usersData?.data ?? [];
    return list.filter(u => selectedIds.includes(u.id) && !fullySelectedTeamUserIds.has(u.id));
  }, [usersData?.data, selectedIds, fullySelectedTeamUserIds]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex flex-col md:flex-row gap-5">
        
        {/* Left Side: Selection Area */}
        <div className="flex-1 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-gray-navy opacity-55" />
            <input
              type="text"
              placeholder="Tìm kiếm thí sinh hoặc nhóm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-5 py-3 rounded-md bg-gray-50 dark:bg-zinc-950/40 border border-gray-250 dark:border-white/20 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm font-medium text-dark-blue dark:text-white"
            />
          </div>

          {/* Tab switches and Select All Button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex p-0.5 rounded-md bg-gray-100 dark:bg-white/5 border border-gray-150 dark:border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className={cn(
                  "px-4 py-1.5 rounded-[4px] text-xs font-bold transition-all flex items-center gap-1.5",
                  activeTab === "users" 
                    ? "bg-white dark:bg-zinc-800 shadow-sm text-primary" 
                    : "text-gray-navy dark:text-light-blue/70"
                )}
              >
                <User className="size-3.5" /> Cá nhân
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("teams")}
                className={cn(
                  "px-4 py-1.5 rounded-[4px] text-xs font-bold transition-all flex items-center gap-1.5",
                  activeTab === "teams" 
                    ? "bg-white dark:bg-zinc-800 shadow-sm text-primary" 
                    : "text-gray-navy dark:text-light-blue/70"
                )}
              >
                <Users className="size-3.5" /> Nhóm hỏa tiễn
              </button>
            </div>

            {/* Select All Action Button */}
            {activeTab === "users" ? (
              <button
                type="button"
                onClick={toggleSelectAllUsers}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 py-1 px-2"
              >
                {isAllUsersSelected ? (
                  <>
                    <Minus className="size-3" /> Bỏ chọn tất cả cá nhân
                  </>
                ) : (
                  <>
                    <Plus className="size-3" /> Chọn tất cả cá nhân ({filteredUsers.length})
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleSelectAllTeams}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 py-1 px-2"
              >
                {isAllTeamsSelected ? (
                  <>
                    <Minus className="size-3" /> Bỏ chọn tất cả các nhóm
                  </>
                ) : (
                  <>
                    <Plus className="size-3" /> Chọn tất cả các nhóm ({filteredTeams.length})
                  </>
                )}
              </button>
            )}
          </div>

          {/* List panel */}
          <div className="h-[360px] overflow-y-auto pr-1.5 custom-scrollbar space-y-1.5">
            {loadingUsers || loadingTeams ? (
              <div className="flex flex-col gap-1.5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 rounded-md bg-gray-50 dark:bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : activeTab === "users" ? (
              filteredUsers.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-navy dark:text-light-blue/60">Không tìm thấy thành viên nào</div>
              ) : (
                filteredUsers.map(user => {
                  const isSelected = selectedIds.includes(user.id);
                  return (
                    <button
                      type="button"
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-md border transition-all hover:border-primary/50",
                        isSelected 
                          ? "bg-primary/10 border-primary/30 text-primary" 
                          : "bg-white dark:bg-zinc-950/20 border-gray-150 dark:border-white/10 text-dark-blue dark:text-white"
                      )}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Avatar className="size-8">
                          <AvatarImage src={user.avatar_url ?? ""} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left truncate">
                          <p className="font-bold text-xs truncate leading-normal">{user.name}</p>
                          <p className="text-[10px] text-gray-navy dark:text-zinc-400 font-medium truncate">{user.email}</p>
                        </div>
                      </div>
                      {isSelected ? (
                        <div className="size-5 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                          <Check className="size-3" />
                        </div>
                      ) : (
                        <div className="size-5 rounded-full border-2 border-gray-200 dark:border-white/20 flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )
            ) : (
              filteredTeams.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-navy dark:text-light-blue/60">Không tìm thấy nhóm nào</div>
              ) : (
                filteredTeams.map(team => {
                  const isExpanded = expandedTeams.includes(team.id);
                  
                  // Calculate selection states for this team
                  const teamMemberIds = team.members.map(m => m.user_id);
                  const selectedTeamMembersCount = teamMemberIds.filter(id => selectedIds.includes(id)).length;
                  const isFullySelected = team.members.length > 0 && selectedTeamMembersCount === team.members.length;
                  const isPartiallySelected = selectedTeamMembersCount > 0 && !isFullySelected;

                  return (
                    <div 
                      key={team.id}
                      className="rounded-md border border-gray-150 dark:border-white/10 bg-white dark:bg-zinc-950/20 overflow-hidden"
                    >
                      {/* Team Card Header bar */}
                      <div 
                        onClick={(e) => toggleTeamExpand(team.id, e)}
                        className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="size-9 rounded bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 flex-shrink-0">
                            <Group className="size-5" />
                          </div>
                          <div className="text-left truncate">
                            <p className="font-bold text-xs text-dark-blue dark:text-white truncate leading-normal">{team.team_name}</p>
                            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                              {team.member_count} thành viên {selectedTeamMembersCount > 0 && `(Đã chọn ${selectedTeamMembersCount})`}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons on the right */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isFullySelected) {
                                removeTeam(team.id);
                              } else {
                                addTeam(team.id);
                              }
                            }}
                            className={cn(
                              "px-3 py-1 rounded-[4px] text-[10px] font-bold uppercase transition-all",
                              isFullySelected
                                ? "bg-red/10 text-red hover:bg-red hover:text-white"
                                : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500"
                            )}
                          >
                            {isFullySelected ? "Bỏ chọn cả nhóm" : "Chọn cả nhóm"}
                          </button>
                          
                          <div className="text-gray-navy dark:text-light-blue/70">
                            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Dropdown list of team members */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="overflow-hidden bg-gray-50/50 dark:bg-zinc-950/10 border-t border-gray-100 dark:border-white/5"
                          >
                            <div className="p-2 pl-6 pr-4 space-y-1">
                              {team.members.map(member => {
                                const u = userMap.get(member.user_id);
                                if (!u) return null;
                                const isMemberSelected = selectedIds.includes(member.user_id);

                                return (
                                  <button
                                    key={`team-${team.id}-user-${member.user_id}`}
                                    type="button"
                                    onClick={() => toggleUser(member.user_id)}
                                    className={cn(
                                      "w-full flex items-center justify-between p-2 rounded-[4px] text-xs transition-colors",
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
                })
              )
            )}
          </div>
        </div>

        {/* Right Side: Merged Selected List Card */}
        <div className="w-full md:w-80 flex-shrink-0">
          <div className="flex flex-col rounded-md border border-gray-150 bg-gray-50/40 dark:border-white/20 dark:bg-navy-blue/30 h-[435px] p-4 shadow-sm">
            {/* Merged Header */}
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
                  onClick={removeAll}
                  className="p-1.5 rounded-[4px] hover:bg-red-50 text-red dark:hover:bg-red-500/10 transition-colors"
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
                {fullySelectedTeams.map(team => {
                  const isExpanded = expandedSelectedTeams.includes(team.id);
                  return (
                    <motion.div 
                      key={`selected-team-${team.id}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="rounded-[5px] border border-gray-150 dark:border-white/15 bg-white dark:bg-zinc-950/30 overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedSelectedTeams(expandedSelectedTeams.filter(id => id !== team.id));
                            } else {
                              setExpandedSelectedTeams([...expandedSelectedTeams, team.id]);
                            }
                          }}
                          className="flex items-center gap-2 text-xs font-bold text-left truncate flex-1 hover:text-primary dark:text-white"
                        >
                          <div className="p-1 rounded-[3px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                            <Group className="size-3.5" />
                          </div>
                          <span className="truncate">{team.team_name}</span>
                          <span className="text-[9px] text-gray-navy dark:text-zinc-400 font-normal">
                            ({team.members.length})
                          </span>
                          <div className="text-gray-navy dark:text-light-blue/70">
                            {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                          </div>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => removeTeam(team.id)}
                          className="p-1 rounded-[5px] text-red hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      {/* Members expanded list inside Selection Card */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="overflow-hidden bg-gray-50/50 dark:bg-zinc-950/20 border-t border-gray-100 dark:border-white/5"
                          >
                            <div className="p-2 pl-6 pr-2 space-y-1">
                              {team.members.map(m => {
                                const u = userMap.get(m.user_id);
                                if (!u) return null;
                                return (
                                  <div 
                                    key={`selected-team-member-${m.user_id}`} 
                                    className="flex items-center justify-between p-1 rounded-[3px] text-xs text-dark-blue dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <Avatar className="size-5">
                                        <AvatarImage src={u.avatar_url ?? ""} />
                                        <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-bold">
                                          {u.name.substring(0, 1).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="truncate text-[11px] font-medium">{u.name}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => toggleUser(m.user_id)}
                                      className="p-1 rounded-[3px] text-red hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
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
                {selectedIndividualUsers.map(user => (
                  <motion.div
                    key={`selected-user-${user.id}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-2 p-2 pr-3 rounded-[4px] bg-white dark:bg-zinc-950/30 border border-gray-150 dark:border-white/15 shadow-sm"
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
                      onClick={() => toggleUser(user.id)}
                      className="size-5 rounded-[4px] hover:bg-red-50 text-red dark:hover:bg-red-500/10 transition-colors flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </motion.div>
                ))}

              </AnimatePresence>

              {selectedIds.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-30 py-16 text-center text-gray-navy dark:text-zinc-400">
                  <Users className="size-8 mb-2" />
                  <p className="text-[10px] font-black uppercase">Chưa chọn ai</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
