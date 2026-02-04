"use client";

import { useState } from "react";
import { Check, Trash2, Edit2, Plus } from "lucide-react";
import { FoodIcon } from "@/components/food-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import type { ExtractedItem } from "@/lib/ai";
import type { StorageSpaceId } from "@/types";

interface StorageSpace {
  id: StorageSpaceId;
  name: string;
  icon: string;
}

interface ReviewItemsProps {
  items: ExtractedItem[];
  storageSpaces: StorageSpace[];
  onConfirm: (items: ExtractedItem[]) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
  currentItemCount?: number;
  maxItems?: number;
}

export function ReviewItems({
  items: initialItems,
  storageSpaces,
  onConfirm,
  onCancel,
  loading,
  error,
  currentItemCount = 0,
  maxItems = 1000,
}: ReviewItemsProps) {
  const [items, setItems] = useState<ExtractedItem[]>(initialItems);
  const [editingItem, setEditingItem] = useState<ExtractedItem | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const defaultStorageId = storageSpaces[0]?.id || "";

  const updateItem = (id: string, updates: Partial<ExtractedItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addItem = (item: ExtractedItem) => {
    setItems((prev) => [...prev, item]);
    setShowAddDialog(false);
  };

  const handleConfirm = () => {
    // Assign default storage space to items without one
    const itemsWithStorage = items.map((item) => ({
      ...item,
      storageSpaceId: item.storageSpaceId || defaultStorageId,
    }));
    onConfirm(itemsWithStorage);
  };

  return (
    <div className="min-h-full pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-semibold text-foreground">Review Items</h1>
            <Button variant="ghost" size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {items.length} item{items.length !== 1 ? "s" : ""} detected. Tap to edit.
          </p>
        </div>
      </div>

      {/* Items List */}
      <div className="px-5 pb-6">
        <div className="max-w-md mx-auto space-y-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setEditingItem(item)}
            >
              <div className="flex items-start justify-between gap-3">
                <FoodIcon name={item.iconHint || item.name} category={item.category} size={48} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate mb-1">
                    {item.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} {item.unit} · Expires{" "}
                    {new Date(item.expirationDate).toLocaleDateString()}
                  </p>
                  {item.storageSpaceId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {storageSpaces.find((s) => s.id === item.storageSpaceId)?.name}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItem(item);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No items to add</p>
              <Button variant="outline" onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item Manually
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t border-border">
        <div className="max-w-md mx-auto space-y-3">
          {/* Error message */}
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Item count info */}
          {currentItemCount > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {currentItemCount} of {maxItems} items in inventory
            </p>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={items.length === 0 || loading || currentItemCount + items.length > maxItems}
            >
              {loading ? (
                "Adding..."
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Add {items.length} Item{items.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Drawer */}
      <EditItemDrawer
        item={editingItem}
        storageSpaces={storageSpaces}
        onSave={(updated) => {
          updateItem(updated.id, updated);
          setEditingItem(null);
        }}
        onClose={() => setEditingItem(null)}
      />

      {/* Add Drawer */}
      <AddItemDrawer
        open={showAddDialog}
        storageSpaces={storageSpaces}
        onAdd={addItem}
        onClose={() => setShowAddDialog(false)}
      />
    </div>
  );
}

// Edit Item Drawer
function EditItemDrawer({
  item,
  storageSpaces,
  onSave,
  onClose,
}: {
  item: ExtractedItem | null;
  storageSpaces: StorageSpace[];
  onSave: (item: ExtractedItem) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<ExtractedItem | null>(null);

  // Reset form when item changes
  if (item && (!formData || formData.id !== item.id)) {
    setFormData(item);
  }

  if (!item || !formData) return null;

  return (
    <Drawer open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Edit Item</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiration">Expiration Date</Label>
            <Input
              id="expiration"
              type="date"
              value={formData.expirationDate}
              onChange={(e) =>
                setFormData({ ...formData, expirationDate: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storage">Storage Location</Label>
            <Select
              value={formData.storageSpaceId || ""}
              onValueChange={(value) =>
                setFormData({ ...formData, storageSpaceId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {storageSpaces.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DrawerFooter>
          <Button className="w-full" onClick={() => onSave(formData)}>
            Save
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Add Item Drawer
function AddItemDrawer({
  open,
  storageSpaces,
  onAdd,
  onClose,
}: {
  open: boolean;
  storageSpaces: StorageSpace[];
  onAdd: (item: ExtractedItem) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    quantity: 1,
    unit: "count",
    expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    storageSpaceId: storageSpaces[0]?.id || "",
  });

  const handleAdd = () => {
    onAdd({
      id: crypto.randomUUID(),
      ...formData,
      confidence: 1,
    });
    setFormData({
      name: "",
      quantity: 1,
      unit: "count",
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      storageSpaceId: storageSpaces[0]?.id || "",
    });
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Add Item</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-name">Name</Label>
            <Input
              id="add-name"
              placeholder="e.g., Milk, Eggs, Bread"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-unit">Unit</Label>
              <Input
                id="add-unit"
                placeholder="count, lbs, oz"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-expiration">Expiration Date</Label>
            <Input
              id="add-expiration"
              type="date"
              value={formData.expirationDate}
              onChange={(e) =>
                setFormData({ ...formData, expirationDate: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-storage">Storage Location</Label>
            <Select
              value={formData.storageSpaceId}
              onValueChange={(value) =>
                setFormData({ ...formData, storageSpaceId: value as StorageSpaceId })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {storageSpaces.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DrawerFooter>
          <Button
            className="w-full"
            onClick={handleAdd}
            disabled={!formData.name.trim() || !formData.expirationDate}
          >
            Add Item
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
