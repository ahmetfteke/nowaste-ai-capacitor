"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Check,
  Trash2,
  ShoppingCart,
  X,
} from "lucide-react";

const MAX_SHOPPING_ITEMS = 1000;
import { FoodIcon } from "@/components/food-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useShoppingList } from "@/hooks/use-shopping-list";
import type { ShoppingListItem, FoodCategory } from "@/types";

export default function ShoppingListPage() {
  const {
    items,
    uncheckedItems,
    checkedItems,
    loading,
    addItem,
    toggleChecked,
    removeItem,
    clearChecked,
  } = useShoppingList();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = async (data: Omit<ShoppingListItem, "id" | "userId" | "createdAt">) => {
    // Check limit before adding
    if (items.length >= MAX_SHOPPING_ITEMS) {
      setError(`You've reached the maximum of ${MAX_SHOPPING_ITEMS} items.`);
      return;
    }
    setError(null);
    await addItem(data);
  };

  // Filter items by search
  const filteredUnchecked = uncheckedItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredChecked = checkedItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading shopping list...</div>
      </div>
    );
  }

  // Empty state
  if (uncheckedItems.length === 0 && checkedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <ShoppingCart className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Your Shopping List is Empty
        </h2>
        <p className="text-muted-foreground max-w-sm mb-6">
          Add items you need to buy at the grocery store.
        </p>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>

        <AddItemDrawer
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onAdd={handleAddItem}
          error={error}
        />
      </div>
    );
  }

  return (
    <div className="min-h-full pb-4">
      {/* Search & Add */}
      <div className="sticky top-0 z-10 bg-background px-5 pt-4 pb-3">
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button size="icon" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Summary badges */}
          <div className="flex gap-2">
            <Badge variant="outline">
              {uncheckedItems.length} to buy
            </Badge>
            {checkedItems.length > 0 && (
              <Badge variant="secondary" className="cursor-pointer" onClick={clearChecked}>
                {checkedItems.length} done · Clear
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="px-5 space-y-6">
        <div className="max-w-md mx-auto">
          {/* Unchecked Items */}
          {filteredUnchecked.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                To Buy ({filteredUnchecked.length})
              </h2>
              <div className="space-y-2">
                {filteredUnchecked.map((item) => (
                  <ShoppingItemCard
                    key={item.id}
                    item={item}
                    onToggle={() => toggleChecked(item.id, true)}
                    onDelete={() => removeItem(item.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Checked Items */}
          {filteredChecked.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                Done ({filteredChecked.length})
              </h2>
              <div className="space-y-2">
                {filteredChecked.map((item) => (
                  <ShoppingItemCard
                    key={item.id}
                    item={item}
                    checked
                    onToggle={() => toggleChecked(item.id, false)}
                    onDelete={() => removeItem(item.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {filteredUnchecked.length === 0 && filteredChecked.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No items match your search</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Drawer */}
      <AddItemDrawer
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddItem}
        error={error}
      />
    </div>
  );
}

// Shopping Item Card Component
function ShoppingItemCard({
  item,
  checked = false,
  onToggle,
  onDelete,
}: {
  item: ShoppingListItem;
  checked?: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className={`p-4 ${checked ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <FoodIcon name={item.name} category={item.category} size={40} />
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-foreground truncate ${checked ? "line-through" : ""}`}>
              {item.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {item.quantity} {item.unit}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${checked ? "text-muted-foreground" : "text-primary"}`}
            onClick={onToggle}
            title={checked ? "Uncheck" : "Mark as done"}
          >
            {checked ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Add Item Drawer
function AddItemDrawer({
  open,
  onClose,
  onAdd,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (data: Omit<ShoppingListItem, "id" | "userId" | "createdAt">) => Promise<void>;
  error?: string | null;
}) {
  const [formData, setFormData] = useState({
    name: "",
    quantity: 1,
    unit: "pcs",
  });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      await onAdd({
        name: formData.name.trim(),
        quantity: formData.quantity,
        unit: formData.unit,
        checked: false,
      });
      setFormData({ name: "", quantity: 1, unit: "pcs" });
      onClose();
    } catch (error) {
      console.error("Failed to add item:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Add to Shopping List</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-name">Item Name</Label>
            <Input
              id="add-name"
              placeholder="e.g., Milk, Eggs, Bread"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-quantity">Quantity</Label>
              <Input
                id="add-quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-unit">Unit</Label>
              <Input
                id="add-unit"
                placeholder="pcs, lb, oz"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
        </div>
        <DrawerFooter>
          <Button
            className="w-full"
            onClick={handleAdd}
            disabled={!formData.name.trim() || saving}
          >
            {saving ? "Adding..." : "Add Item"}
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
