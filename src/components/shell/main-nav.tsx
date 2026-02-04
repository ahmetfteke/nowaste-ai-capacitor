"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Package, ChefHat, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/capture", label: "Capture", icon: Camera },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/shopping", label: "Shopping", icon: ShoppingCart },
  { href: "/recipes", label: "Recipes", icon: ChefHat },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
