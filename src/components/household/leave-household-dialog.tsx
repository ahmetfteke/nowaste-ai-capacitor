"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useHousehold } from "@/lib/household-context";
import { getFunctions, httpsCallable } from "firebase/functions";

interface LeaveHouseholdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeaveHouseholdDialog({
  open,
  onOpenChange,
}: LeaveHouseholdDialogProps) {
  const { household, isOwner } = useHousehold();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLeave = async () => {
    setLoading(true);
    setError(null);

    try {
      const functions = getFunctions();
      const leaveFn = httpsCallable(functions, "leaveHousehold");
      await leaveFn({});
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to leave household");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Leave Household</DrawerTitle>
          <DrawerDescription>
            {isOwner
              ? "As the owner, leaving will transfer ownership to the next member. Your contributed items will stay with the household."
              : `Are you sure you want to leave "${household?.name}"? Your contributed items will stay with the household.`}
          </DrawerDescription>
        </DrawerHeader>

        {error && (
          <div className="px-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <DrawerFooter>
          <Button
            variant="destructive"
            onClick={handleLeave}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Leaving..." : "Leave Household"}
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
