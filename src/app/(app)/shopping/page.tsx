"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Check,
  Trash2,
  ShoppingCart,
  X,
  Upload,
  AlertCircle,
  FileText,
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
import {
  parseShoppingListCSV,
  parseShoppingListJSON,
  convertToShoppingItem,
  readFileContent,
  detectFileType,
  type ParsedShoppingItem,
  type ValidationError,
} from "@/lib/import";
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
  const [showImportDrawer, setShowImportDrawer] = useState(false);
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

  const handleImportItems = async (parsedItems: ParsedShoppingItem[]) => {
    // Check limit
    if (items.length + parsedItems.length > MAX_SHOPPING_ITEMS) {
      setError(`Cannot import ${parsedItems.length} items. Maximum is ${MAX_SHOPPING_ITEMS} items (current: ${items.length}).`);
      return;
    }
    setError(null);

    // Add items sequentially
    for (const parsed of parsedItems) {
      const itemData = convertToShoppingItem(parsed);
      await addItem(itemData);
    }
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDrawer(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        <AddItemDrawer
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onAdd={handleAddItem}
          error={error}
        />

        <ImportDrawer
          open={showImportDrawer}
          onClose={() => setShowImportDrawer(false)}
          onImport={handleImportItems}
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
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowImportDrawer(true)}
              title="Import from file"
            >
              <Upload className="w-4 h-4" />
            </Button>
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

      {/* Import Drawer */}
      <ImportDrawer
        open={showImportDrawer}
        onClose={() => setShowImportDrawer(false)}
        onImport={handleImportItems}
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

// Import Drawer Component
function ImportDrawer({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (items: ParsedShoppingItem[]) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedShoppingItem[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [importing, setImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsedItems([]);
    setErrors([]);
    setParseError(null);

    try {
      const content = await readFileContent(selectedFile);
      const fileType = detectFileType(selectedFile);

      let result;
      if (fileType === "csv") {
        result = parseShoppingListCSV(content);
      } else if (fileType === "json") {
        result = parseShoppingListJSON(content);
      } else {
        setParseError("Unsupported file type. Please use CSV or JSON.");
        return;
      }

      setParsedItems(result.items);
      setErrors(result.errors);
    } catch {
      setParseError("Failed to read file. Please try again.");
    }
  };

  const handleImport = async () => {
    if (parsedItems.length === 0) return;

    setImporting(true);
    try {
      await onImport(parsedItems);
      handleClose();
    } catch {
      setParseError("Failed to import items. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedItems([]);
    setErrors([]);
    setParseError(null);
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && handleClose()}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Import Shopping List</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="import-file">Select File (CSV or JSON)</Label>
            <Input
              id="import-file"
              type="file"
              accept=".csv,.json"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
          </div>

          {/* Format Help */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
            <p className="font-medium mb-1">Expected CSV format:</p>
            <code className="block bg-background p-2 rounded text-[10px]">
              Name,Quantity,Unit<br/>
              Milk,2,liters<br/>
              Eggs,12,pcs
            </code>
          </div>

          {/* Parse Error */}
          {parseError && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {parseError}
            </div>
          )}

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="p-3 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm">
              <p className="font-medium mb-1">Warnings ({errors.length}):</p>
              <ul className="list-disc list-inside text-xs space-y-1 max-h-20 overflow-y-auto">
                {errors.slice(0, 5).map((err, i) => (
                  <li key={i}>Row {err.row}: {err.message}</li>
                ))}
                {errors.length > 5 && (
                  <li>...and {errors.length - 5} more</li>
                )}
              </ul>
            </div>
          )}

          {/* Preview */}
          {parsedItems.length > 0 && (
            <div className="space-y-2">
              <Label>Preview ({parsedItems.length} items)</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md divide-y">
                {parsedItems.slice(0, 10).map((item, i) => (
                  <div key={i} className="p-2 flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate">{item.name}</span>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
                {parsedItems.length > 10 && (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    ...and {parsedItems.length - 10} more items
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <DrawerFooter>
          <Button
            className="w-full"
            onClick={handleImport}
            disabled={parsedItems.length === 0 || importing}
          >
            {importing ? "Importing..." : `Import ${parsedItems.length} Item${parsedItems.length !== 1 ? "s" : ""}`}
          </Button>
          <Button variant="outline" className="w-full" onClick={handleClose}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
