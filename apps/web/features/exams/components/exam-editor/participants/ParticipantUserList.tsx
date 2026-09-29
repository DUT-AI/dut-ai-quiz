"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ExternalUser } from "@/features/exams/types";

interface ParticipantUserListProps {
  users: ExternalUser[];
  selectedIds: number[];
  onToggleUser: (userId: number) => void;
  isLoading: boolean;
}

export function ParticipantUserList({
  users,
  selectedIds,
  onToggleUser,
  isLoading,
}: ParticipantUserListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-14 rounded-2xl bg-gray-50 dark:bg-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-10 text-xs text-gray-navy dark:text-light-blue/60">
        Không tìm thấy thành viên nào
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {users.map((user) => {
        const isSelected = selectedIds.includes(user.id);
        return (
          <button
            type="button"
            key={user.id}
            onClick={() => onToggleUser(user.id)}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-2xl border transition-all hover:border-primary/50 cursor-pointer",
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
                <p className="font-bold text-xs truncate leading-normal">
                  {user.name}
                </p>
                <p className="text-[10px] text-gray-navy dark:text-zinc-400 font-medium truncate">
                  {user.email}
                </p>
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
      })}
    </div>
  );
}
