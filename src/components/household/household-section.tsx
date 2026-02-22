"use client";

import { useState } from "react";
import { Users, UserPlus, Copy, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useHousehold } from "@/lib/household-context";
import { useAuth } from "@/lib/auth-context";
import { regenerateShareCode, updateHouseholdName } from "@/lib/household";
import { MemberList } from "./member-list";
import { JoinHouseholdDrawer } from "./join-household-drawer";
import { LeaveHouseholdDialog } from "./leave-household-dialog";

export function HouseholdSection() {
  const { user } = useAuth();
  const { household, householdId, isOwner, members } = useHousehold();
  const [showJoin, setShowJoin] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");

  if (!household || !householdId) return null;

  const isShared = members.length > 1;

  const handleCopyCode = async () => {
    if (!household.shareCode) return;
    try {
      await navigator.clipboard.writeText(household.shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS
    }
  };

  const handleRegenerateCode = async () => {
    if (!householdId) return;
    setRegenerating(true);
    try {
      await regenerateShareCode(householdId);
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveName = async () => {
    if (!householdId || !nameValue.trim()) return;
    await updateHouseholdName(householdId, nameValue.trim());
    setEditingName(false);
  };

  const startEditName = () => {
    setNameValue(household.name || "");
    setEditingName(true);
  };

  return (
    <div>
      <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">
        Household
      </h2>
      <Card className="p-4 space-y-4">
        {/* Household Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  className="flex-1 text-sm border rounded px-2 py-1 bg-background"
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleSaveName}>
                  Save
                </Button>
              </div>
            ) : (
              <div>
                <p
                  className={`font-medium text-foreground truncate ${isOwner ? "cursor-pointer hover:text-primary" : ""}`}
                  onClick={isOwner ? startEditName : undefined}
                >
                  {household.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {members.length} member{members.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Members */}
        {isShared && (
          <MemberList
            members={members}
            currentUserId={user?.uid || ""}
            isOwner={isOwner}
            householdId={householdId}
          />
        )}

        {/* Invite Code */}
        <div className="border-t pt-3">
          <p className="text-xs text-muted-foreground mb-2">Invite Code</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-center text-lg font-mono font-semibold tracking-widest bg-muted rounded-lg py-2">
              {household.shareCode}
            </code>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={handleCopyCode}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            {isOwner && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={handleRegenerateCode}
                disabled={regenerating}
              >
                <RefreshCw className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t pt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setShowJoin(true)}
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Join Another
          </Button>
          {isShared && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={() => setShowLeave(true)}
            >
              Leave
            </Button>
          )}
        </div>
      </Card>

      <JoinHouseholdDrawer open={showJoin} onOpenChange={setShowJoin} />
      <LeaveHouseholdDialog open={showLeave} onOpenChange={setShowLeave} />
    </div>
  );
}
