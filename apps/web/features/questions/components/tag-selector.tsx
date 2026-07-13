"use client";

import React, { useState, useMemo } from "react";
import * as Popover from "@radix-ui/react-popover";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Trash2,
  Plus,
  Check,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useTags, useCreateTag, useDeleteTag } from "@/lib/queries";
import { toast } from "sonner";
import { useThemeStore } from "@/store/theme-store";
import { cn } from "@/lib/utils";

interface TagSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function TagSelector({ value, onChange }: TagSelectorProps) {
  const { darkMode } = useThemeStore();
  const { data: allTags = [], isLoading } = useTags();
  const createTagMut = useCreateTag();
  const deleteTagMut = useDeleteTag();

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allTags;
    return allTags.filter((tag) => tag.name.toLowerCase().includes(query));
  }, [allTags, searchQuery]);

  // Map of tags for quick lookup
  const tagMap = useMemo(() => {
    const map = new Map<string, string>();
    allTags.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [allTags]);

  const handleToggle = (tagId: string) => {
    if (value.includes(tagId)) {
      onChange(value.filter((id) => id !== tagId));
    } else {
      onChange([...value, tagId]);
    }
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    try {
      const newTag = await createTagMut.mutateAsync({ name });
      onChange([...value, newTag.id]);
      setNewTagName("");
      setIsAdding(false);
      toast.success(`Đã tạo tag #${name}`);
    } catch (err) {
      console.error("Failed to create tag", err);
      toast.error("Không thể tạo tag. Có thể tag đã tồn tại!");
    }
  };

  const handleCreateFromSearch = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const newTag = await createTagMut.mutateAsync({ name: trimmed });
      onChange([...value, newTag.id]);
      setSearchQuery("");
      toast.success(`Đã tạo tag #${trimmed}`);
    } catch (err) {
      console.error("Failed to create tag", err);
      toast.error("Không thể tạo tag.");
    }
  };

  const handleDeleteConfirm = async (tagId: string) => {
    const tagName = tagMap.get(tagId) || "";
    try {
      await deleteTagMut.mutateAsync(tagId);
      // Remove deleted tag from selected value if present
      if (value.includes(tagId)) {
        onChange(value.filter((id) => id !== tagId));
      }
      setDeletingTagId(null);
      toast.success(`Đã xóa tag #${tagName}`);
    } catch (err) {
      console.error("Failed to delete tag", err);
      toast.error("Không thể xóa tag này.");
    }
  };

  return (
    <div className="space-y-3 col-span-full text-left">
      <label className="text-xs font-black text-gray-navy dark:text-light-blue opacity-40 uppercase tracking-[0.2em] px-1 italic block">
        Tags kỹ năng / Kiến thức
      </label>

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={cn(
              "flex flex-wrap gap-2 items-center w-full px-4 py-3 rounded-2xl border text-left outline-none transition-all duration-200",
              darkMode
                ? "bg-white/5 border-white/10 hover:border-indigo-500/30 focus:border-indigo-500/50"
                : "bg-white border-gray-200/80 shadow-sm hover:border-indigo-500/30 focus:border-indigo-500/50"
            )}
          >
            {value.length === 0 ? (
              <span className="text-gray-navy/50 dark:text-light-blue/40 text-xs font-semibold">
                Chọn tags kỹ năng / kiến thức...
              </span>
            ) : (
              <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                {value.map((tagId) => {
                  const name = tagMap.get(tagId) || "Loading...";
                  return (
                    <span
                      key={tagId}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 max-w-full truncate"
                    >
                      #{name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(tagId);
                        }}
                        className="hover:bg-indigo-500/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <ChevronDown className="size-4 text-gray-navy/40 dark:text-light-blue/40 shrink-0 ml-auto" />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={6}
            className={cn(
              "z-[150] w-72 sm:w-80 p-4 rounded-3xl outline-none shadow-2xl transition-all duration-150 animate-in fade-in zoom-in-95 duration-150",
              darkMode
                ? "dark bg-[#1E2A3A] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] text-white"
                : "bg-white border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.12)] text-dark-blue"
            )}
          >
            <div className="space-y-3">
              {/* Search Header */}
              <div className="relative flex items-center border-b border-gray-100 dark:border-white/5 pb-2">
                <Search className="absolute left-2 size-3.5 text-gray-navy/40 dark:text-light-blue/30" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-gray-50/50 dark:bg-white/5 border border-transparent focus:border-indigo-500/30 outline-none text-dark-blue dark:text-white placeholder-gray-navy/40 dark:placeholder-light-blue/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 text-gray-navy/40 hover:text-red dark:text-light-blue/30 dark:hover:text-red transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Tags List */}
              <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
                {isLoading ? (
                  <div className="flex items-center justify-center py-6 text-xs text-gray-navy/40 dark:text-light-blue/30">
                    <Loader2 className="size-4 animate-spin mr-1.5" /> Đang tải tags...
                  </div>
                ) : filteredTags.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-navy/40 dark:text-light-blue/30">
                    Không tìm thấy tag nào
                  </div>
                ) : (
                  filteredTags.map((tag) => {
                    const isSelected = value.includes(tag.id);
                    return (
                      <div
                        key={tag.id}
                        className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                          isSelected
                            ? "bg-indigo-500/5 text-indigo-500 dark:text-indigo-400"
                            : "text-gray-navy dark:text-light-blue/80 hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}
                        onClick={() => handleToggle(tag.id)}
                      >
                        <div className="flex items-center gap-2 min-w-0 mr-2">
                          <div
                            className={`size-4 rounded-md flex items-center justify-center border transition-all ${
                              isSelected
                                ? "bg-indigo-500 border-indigo-500 text-white"
                                : "border-gray-200 dark:border-white/10"
                            }`}
                          >
                            {isSelected && <Check className="size-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">#{tag.name}</span>
                        </div>

                        {/* Delete actions */}
                        {deletingTagId === tag.id ? (
                          <div
                            className="flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleDeleteConfirm(tag.id)}
                              className="px-2 py-0.5 bg-red text-white rounded-lg text-[10px] font-black hover:opacity-90 transition-all"
                            >
                              Xóa
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTagId(null)}
                              className="text-[10px] text-gray-navy hover:text-dark-blue dark:text-light-blue/50 dark:hover:text-white transition-colors"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingTagId(tag.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-navy/40 hover:text-red dark:text-light-blue/30 dark:hover:text-red rounded-lg hover:bg-red/10 dark:hover:bg-red/20 transition-all duration-200"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Inline Creation Option from Search */}
              {searchQuery &&
                !filteredTags.some(
                  (t) => t.name.toLowerCase() === searchQuery.trim().toLowerCase()
                ) && (
                  <button
                    type="button"
                    onClick={() => handleCreateFromSearch(searchQuery)}
                    disabled={createTagMut.isPending}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-indigo-500/5 hover:bg-indigo-500/10 border border-dashed border-indigo-500/20 text-indigo-500 text-xs font-bold transition-all text-left disabled:opacity-50"
                  >
                    <span className="truncate">Tạo tag "#{searchQuery.trim()}"</span>
                    {createTagMut.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                  </button>
                )}

              {/* Add Tag Section */}
              <div className="border-t border-gray-100 dark:border-white/5 pt-3">
                {isAdding ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Tên tag mới..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateTag();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 outline-none text-dark-blue dark:text-white placeholder-gray-navy/40 dark:placeholder-light-blue/30 focus:border-indigo-500/30"
                    />
                    <button
                      type="button"
                      onClick={handleCreateTag}
                      disabled={createTagMut.isPending}
                      className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shrink-0"
                    >
                      {createTagMut.isPending ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        "Thêm"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="p-1.5 text-gray-navy/50 hover:text-red dark:text-light-blue/40 dark:hover:text-red rounded-xl hover:bg-gray-150 dark:hover:bg-white/5 shrink-0"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-600 w-full py-1.5 px-2 rounded-xl hover:bg-indigo-500/5 transition-all"
                  >
                    <Plus className="size-4" /> Tạo tag mới
                  </button>
                )}
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
