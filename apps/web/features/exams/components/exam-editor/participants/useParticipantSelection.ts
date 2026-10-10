import { useState, useMemo, useRef, useEffect } from "react";
import { useExternalTeams, useExternalUsers } from "@/lib/queries";

interface UseParticipantSelectionProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  accessScope?: "PUBLIC" | "RESTRICTED";
  onAccessScopeChange?: (scope: "PUBLIC" | "RESTRICTED") => void;
}

export function useParticipantSelection({
  selectedIds,
  onChange,
  accessScope = "PUBLIC",
  onAccessScopeChange,
}: UseParticipantSelectionProps) {
  const { data: teamsData, isLoading: loadingTeams } = useExternalTeams();
  const { data: usersData, isLoading: loadingUsers } = useExternalUsers();

  const isPublic = accessScope === "PUBLIC";
  const savedSelectedIdsRef = useRef<number[]>(selectedIds.length > 0 ? selectedIds : []);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "teams">("users");
  const [expandedTeams, setExpandedTeams] = useState<number[]>([]);
  const [expandedSelectedTeams, setExpandedSelectedTeams] = useState<number[]>([]);

  // Sync backup ref if selectedIds changes externally
  useEffect(() => {
    if (selectedIds.length > 0) {
      savedSelectedIdsRef.current = selectedIds;
    }
  }, [selectedIds]);

  const handleToggleScope = (newIsPublic: boolean) => {
    const newScope = newIsPublic ? "PUBLIC" : "RESTRICTED";
    onAccessScopeChange?.(newScope);

    if (newIsPublic) {
      if (selectedIds.length > 0) {
        savedSelectedIdsRef.current = selectedIds;
      }
      onChange([]);
    } else {
      if (savedSelectedIdsRef.current.length > 0) {
        onChange(savedSelectedIdsRef.current);
      }
    }
  };

  // Map user ID to user object for quick lookup
  const userMap = useMemo(() => {
    return new Map((usersData?.data ?? []).map((u) => [u.id, u]));
  }, [usersData?.data]);

  // Filtered users by search text
  const filteredUsers = useMemo(() => {
    const list = usersData?.data ?? [];
    return list.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [usersData?.data, search]);

  // Filtered teams by search text
  const filteredTeams = useMemo(() => {
    const list = teamsData?.data ?? [];
    return list.filter((t) =>
      t.team_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [teamsData?.data, search]);

  // Toggle single user selection
  const toggleUser = (userId: number) => {
    if (selectedIds.includes(userId)) {
      const next = selectedIds.filter((id) => id !== userId);
      savedSelectedIdsRef.current = next;
      onChange(next);
    } else {
      const next = [...selectedIds, userId];
      savedSelectedIdsRef.current = next;
      onChange(next);
    }
  };

  // Add all members of a team
  const addTeam = (teamId: number) => {
    const list = teamsData?.data ?? [];
    const team = list.find((t) => t.id === teamId);
    if (!team) return;
    const memberIds = team.members.map((m) => m.user_id);
    const newIds = Array.from(new Set([...selectedIds, ...memberIds]));
    savedSelectedIdsRef.current = newIds;
    onChange(newIds);
  };

  // Remove all members of a team
  const removeTeam = (teamId: number) => {
    const list = teamsData?.data ?? [];
    const team = list.find((t) => t.id === teamId);
    if (!team) return;
    const memberIds = new Set(team.members.map((m) => m.user_id));
    const next = selectedIds.filter((id) => !memberIds.has(id));
    savedSelectedIdsRef.current = next;
    onChange(next);
  };

  const removeAll = () => {
    savedSelectedIdsRef.current = [];
    onChange([]);
  };

  // Check if all filtered users are selected
  const isAllUsersSelected = useMemo(() => {
    if (filteredUsers.length === 0) return false;
    return filteredUsers.every((u) => selectedIds.includes(u.id));
  }, [filteredUsers, selectedIds]);

  const toggleSelectAllUsers = () => {
    if (isAllUsersSelected) {
      const filteredIds = new Set(filteredUsers.map((u) => u.id));
      const next = selectedIds.filter((id) => !filteredIds.has(id));
      savedSelectedIdsRef.current = next;
      onChange(next);
    } else {
      const newIds = Array.from(
        new Set([...selectedIds, ...filteredUsers.map((u) => u.id)])
      );
      savedSelectedIdsRef.current = newIds;
      onChange(newIds);
    }
  };

  // Check if all filtered teams are selected
  const isAllTeamsSelected = useMemo(() => {
    const allTeamUserIds = filteredTeams.flatMap((t) =>
      t.members.map((m) => m.user_id)
    );
    if (allTeamUserIds.length === 0) return false;
    return allTeamUserIds.every((id) => selectedIds.includes(id));
  }, [filteredTeams, selectedIds]);

  const toggleSelectAllTeams = () => {
    if (isAllTeamsSelected) {
      const allTeamUserIds = new Set(
        filteredTeams.flatMap((t) => t.members.map((m) => m.user_id))
      );
      const next = selectedIds.filter((id) => !allTeamUserIds.has(id));
      savedSelectedIdsRef.current = next;
      onChange(next);
    } else {
      const allTeamUserIds = filteredTeams.flatMap((t) =>
        t.members.map((m) => m.user_id)
      );
      const newIds = Array.from(new Set([...selectedIds, ...allTeamUserIds]));
      savedSelectedIdsRef.current = newIds;
      onChange(newIds);
    }
  };

  // Toggle expanding team in left panel
  const toggleTeamExpand = (teamId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  // Toggle expanding team in right summary
  const toggleSelectedTeamExpand = (teamId: number) => {
    setExpandedSelectedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  // Group selected users by fully selected teams
  const fullySelectedTeams = useMemo(() => {
    const list = teamsData?.data ?? [];
    return list.filter(
      (team) =>
        team.members.length > 0 &&
        team.members.every((m) => selectedIds.includes(m.user_id))
    );
  }, [teamsData?.data, selectedIds]);

  const fullySelectedTeamUserIds = useMemo(() => {
    const ids = new Set<number>();
    fullySelectedTeams.forEach((t) =>
      t.members.forEach((m) => ids.add(m.user_id))
    );
    return ids;
  }, [fullySelectedTeams]);

  // Selected individual users (not part of fully selected teams)
  const selectedIndividualUsers = useMemo(() => {
    const list = usersData?.data ?? [];
    return list.filter(
      (u) => selectedIds.includes(u.id) && !fullySelectedTeamUserIds.has(u.id)
    );
  }, [usersData?.data, selectedIds, fullySelectedTeamUserIds]);

  const totalUsersCount = usersData?.data?.length || 0;

  return {
    isPublic,
    search,
    setSearch,
    activeTab,
    setActiveTab,
    loadingUsers,
    loadingTeams,
    userMap,
    filteredUsers,
    filteredTeams,
    expandedTeams,
    expandedSelectedTeams,
    fullySelectedTeams,
    selectedIndividualUsers,
    isAllUsersSelected,
    isAllTeamsSelected,
    totalUsersCount,
    handleToggleScope,
    toggleUser,
    addTeam,
    removeTeam,
    removeAll,
    toggleSelectAllUsers,
    toggleSelectAllTeams,
    toggleTeamExpand,
    toggleSelectedTeamExpand,
  };
}
