"use client";

import { useState } from "react";
import { Crown, MoreVertical, UserMinus, ShieldCheck, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { HouseholdMember } from "@/types";
import { getFunctions, httpsCallable } from "firebase/functions";

interface MemberListProps {
  members: HouseholdMember[];
  currentUserId: string;
  isOwner: boolean;
  householdId: string;
}

export function MemberList({
  members,
  currentUserId,
  isOwner,
  householdId,
}: MemberListProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleRemove = async (targetUserId: string) => {
    setLoading(targetUserId);
    try {
      const functions = getFunctions();
      const removeFn = httpsCallable(functions, "removeMember");
      await removeFn({ targetUserId });
    } catch (err) {
      console.error("Failed to remove member:", err);
    } finally {
      setLoading(null);
    }
  };

  const handleChangeRole = async (
    targetUserId: string,
    role: "member" | "viewer"
  ) => {
    setLoading(targetUserId);
    try {
      const functions = getFunctions();
      const updateRoleFn = httpsCallable(functions, "updateMemberRole");
      await updateRoleFn({ targetUserId, role });
    } catch (err) {
      console.error("Failed to update role:", err);
    } finally {
      setLoading(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return (
          <span className="inline-flex items-center gap-1 text-xs text-amber-600">
            <Crown className="w-3 h-3" /> Owner
          </span>
        );
      case "viewer":
        return (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="w-3 h-3" /> Viewer
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="w-3 h-3" /> Member
          </span>
        );
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div
          key={member.uid}
          className="flex items-center gap-3 py-1.5"
        >
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
            {getInitials(member.displayName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {member.displayName}
              {member.uid === currentUserId && (
                <span className="text-muted-foreground font-normal"> (you)</span>
              )}
            </p>
            {getRoleBadge(member.role)}
          </div>

          {/* Owner actions for other members */}
          {isOwner && member.uid !== currentUserId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={loading === member.uid}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {member.role !== "member" && (
                  <DropdownMenuItem
                    onClick={() => handleChangeRole(member.uid, "member")}
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Make Member
                  </DropdownMenuItem>
                )}
                {member.role !== "viewer" && (
                  <DropdownMenuItem
                    onClick={() => handleChangeRole(member.uid, "viewer")}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Make Viewer
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleRemove(member.uid)}
                  className="text-destructive focus:text-destructive"
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}
    </div>
  );
}
