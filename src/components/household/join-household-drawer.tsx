"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { getFunctions, httpsCallable } from "firebase/functions";

interface JoinHouseholdDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinHouseholdDrawer({
  open,
  onOpenChange,
}: JoinHouseholdDrawerProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const functions = getFunctions();
      const joinFn = httpsCallable(functions, "joinHousehold");
      await joinFn({ shareCode: code.trim().toUpperCase() });
      setCode("");
      onOpenChange(false);
    } catch (err: any) {
      const message =
        err?.message || err?.details || "Failed to join household";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Join a Household</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 space-y-4">
          <div>
            <Label htmlFor="share-code">Enter Invite Code</Label>
            <Input
              id="share-code"
              placeholder="ABC123"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              maxLength={6}
              className="text-center text-lg font-mono tracking-widest mt-1.5"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Ask a household member for their 6-character invite code.
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DrawerFooter>
          <Button
            onClick={handleJoin}
            disabled={loading || code.length < 6}
            className="w-full"
          >
            {loading ? "Joining..." : "Join Household"}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
