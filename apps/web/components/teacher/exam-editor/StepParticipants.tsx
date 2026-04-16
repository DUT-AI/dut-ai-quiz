"use client";
import React, { useState, useMemo } from "react";
import { useExternalTeams, useExternalUsers } from "@/lib/queries";
import { Search, Users, User, Check, Trash2, ShieldCheck, Group } from "lucide-react";
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

  const users = usersData?.data ?? [];
  const teams = teamsData?.data ?? [];

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  const filteredTeams = useMemo(() => {
    return teams.filter(t => 
      t.team_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [teams, search]);

  const toggleUser = (userId: number) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter(id => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  const addTeam = (teamId: number) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    const memberIds = team.members.map(m => m.user_id);
    const newIds = Array.from(new Set([...selectedIds, ...memberIds]));
    onChange(newIds);
  };

  const removeAll = () => onChange([]);

  const selectedUsers = useMemo(() => {
    return users.filter(u => selectedIds.includes(u.id));
  }, [users, selectedIds]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Selection Area */}
        <div className="flex-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-navy opacity-40" />
            <input
              type="text"
              placeholder="Tìm kiếm thí sinh hoặc nhóm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-4 rounded-3xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-purple/50 transition-all font-medium"
            />
          </div>

          <div className="flex p-1.5 rounded-2xl bg-gray-50 dark:bg-white/5 w-fit">
            <button
              onClick={() => setActiveTab("users")}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                activeTab === "users" ? "bg-white dark:bg-navy-blue shadow-sm text-purple" : "text-gray-navy opacity-50"
              )}
            >
              <User className="size-4" /> Cá nhân
            </button>
            <button
              onClick={() => setActiveTab("teams")}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                activeTab === "teams" ? "bg-white dark:bg-navy-blue shadow-sm text-purple" : "text-gray-navy opacity-50"
              )}
            >
              <Users className="size-4" /> Nhóm hỏa tiễn
            </button>
          </div>

          <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {loadingUsers || loadingTeams ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-16 rounded-2xl bg-gray-50 dark:bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : activeTab === "users" ? (
              filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => toggleUser(user.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border transition-all hover:scale-[1.01] active:scale-[0.99]",
                    selectedIds.includes(user.id) 
                      ? "bg-purple/10 border-purple/30 text-purple" 
                      : "bg-white dark:bg-navy-blue/40 border-gray-100 dark:border-white/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 border-2 border-white dark:border-navy-blue">
                      <AvatarImage src={user.avatar_url ?? ""} />
                      <AvatarFallback className="bg-purple/10 text-purple text-xs font-black">
                        {user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-bold text-sm leading-tight">{user.name}</p>
                      <p className="text-[10px] opacity-50 font-medium">{user.email}</p>
                    </div>
                  </div>
                  {selectedIds.includes(user.id) ? (
                    <div className="size-6 rounded-full bg-purple flex items-center justify-center text-white">
                      <Check className="size-3" />
                    </div>
                  ) : (
                    <div className="size-6 rounded-full border-2 border-gray-200 dark:border-white/10" />
                  )}
                </button>
              ))
            ) : (
              filteredTeams.map(team => (
                <button
                  key={team.id}
                  onClick={() => addTeam(team.id)}
                  className="w-full flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-navy-blue/40 border border-gray-100 dark:border-white/5 hover:border-purple/30 transition-all hover:scale-[1.01] group"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                      <Group className="size-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-dark-blue dark:text-white">{team.team_name}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 opacity-60">
                        {team.member_count} thành viên
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 text-[10px] font-black uppercase tracking-tighter group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    Thêm cả nhóm
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Selected List Sidebar */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          <div className="p-6 rounded-[2.5rem] bg-indigo-600 text-white shadow-xl shadow-indigo-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black uppercase tracking-[0.2em] text-[10px] opacity-80">Danh sách đã chọn</h3>
              <button 
                onClick={removeAll}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-all text-white/60 hover:text-white"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <p className="text-4xl font-black mb-1">{selectedIds.length}</p>
            <p className="text-xs font-bold opacity-60">Thí sinh được chốt tham gia</p>
          </div>

          <div className="flex-1 bg-gray-50 dark:bg-white/5 rounded-[2.5rem] p-4 h-[350px] overflow-hidden flex flex-col">
            <div className="h-px bg-gray-200 dark:bg-white/10 mb-4" />
            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              <AnimatePresence>
                {selectedUsers.map(user => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-3 p-2 pr-4 rounded-2xl bg-white dark:bg-navy-blue shadow-sm border border-black/5"
                  >
                    <Avatar className="size-8">
                      <AvatarImage src={user.avatar_url ?? ""} />
                      <AvatarFallback className="text-[10px] bg-purple/10 text-purple font-black">
                        {user.name.substring(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-bold truncate flex-1">{user.name}</span>
                    <button 
                      onClick={() => toggleUser(user.id)}
                      className="size-5 rounded-lg hover:bg-red/10 text-red opacity-30 hover:opacity-100 transition-all flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {selectedIds.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-10 text-center">
                  <Users className="size-10 mb-2" />
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
