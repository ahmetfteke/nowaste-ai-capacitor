"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { FOOD_ICON_NAMES, matchIconByName } from "@/lib/food-icons";

interface IconPickerProps {
  value?: string;
  onChange: (iconName: string) => void;
  itemName: string;
}

export function IconPicker({ value, onChange, itemName }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => searchRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const displayIcon = value || matchIconByName(itemName);

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return FOOD_ICON_NAMES;
    const q = search.toLowerCase().replace(/\s+/g, "_");
    return FOOD_ICON_NAMES.filter((name) => name.includes(q));
  }, [search]);

  const handleSelect = (iconName: string) => {
    onChange(iconName);
    setOpen(false);
    setSearch("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-9 w-9 shrink-0 rounded-md border border-input bg-[#FAF9F6] flex items-center justify-center hover:bg-muted/50 transition-colors overflow-hidden"
      >
        {displayIcon ? (
          <Image
            src={`/food-icons/${displayIcon}.png`}
            alt={displayIcon}
            width={32}
            height={32}
            className="object-contain"
            unoptimized
          />
        ) : (
          <span className="text-sm text-muted-foreground">?</span>
        )}
      </button>

      <Drawer open={open} onOpenChange={(o) => { if (!o) { setOpen(false); setSearch(""); } }}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Choose Icon</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Search icons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="px-4 pb-4 overflow-y-auto max-h-[50vh]">
            <div className="grid grid-cols-4 gap-2">
              {filteredIcons.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelect(name)}
                  className={`flex flex-col items-center p-1.5 rounded-lg transition-colors ${
                    (value || displayIcon) === name
                      ? "bg-primary/10 ring-1 ring-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="w-10 h-10 rounded-md overflow-hidden bg-[#FAF9F6] flex items-center justify-center">
                    <Image
                      src={`/food-icons/${name}.png`}
                      alt={name}
                      width={40}
                      height={40}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-0.5 truncate w-full text-center">
                    {name.replace(/_/g, " ")}
                  </span>
                </button>
              ))}
            </div>
            {filteredIcons.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No icons match your search
              </p>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
