"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Utensils,
  Trash2,
  AlertTriangle,
  Clock,
  Leaf,
  Package,
  ShoppingCart,
  Pencil,
  MoreVertical,
  Download,
  FileText,
  FileJson,
  Upload,
  AlertCircle,
} from "lucide-react";
import { FoodIcon } from "@/components/food-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFoodItems } from "@/hooks/use-food-items";
import { useStorageSpaces } from "@/hooks/use-storage-spaces";
import { useShoppingList } from "@/hooks/use-shopping-list";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationPrompt } from "@/components/notification-prompt";
import type { FoodItem } from "@/types";
import { exportToCSV, exportToJSON } from "@/lib/export";
import {
  parseInventoryCSV,
  parseInventoryJSON,
  convertToFoodItem,
  readFileContent,
  detectFileType,
  type ParsedInventoryItem,
  type ValidationError,
} from "@/lib/import";

export default function InventoryPage() {
  const router = useRouter();
  const { items, loading, markUsed, removeItem, editItem, addItem } = useFoodItems();
  const { spaces } = useStorageSpaces();
  const { addItem: addToShoppingList } = useShoppingList();
  const { shouldShowPrompt, requestPermission, declineNotifications } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStorage, setSelectedStorage] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  const [showImportDrawer, setShowImportDrawer] = useState(false);

  const handleEnableNotifications = async () => {
    await requestPermission();
    setShowNotificationBanner(false);
  };

  const handleDeclineNotifications = async () => {
    await declineNotifications();
    setShowNotificationBanner(false);
  };

  const handleAddToShoppingList = async (item: FoodItem) => {
    await addToShoppingList({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      checked: false,
    });
  };

  const handleImportItems = async (parsedItems: ParsedInventoryItem[]) => {
    // Add items sequentially
    for (const parsed of parsedItems) {
      const itemData = convertToFoodItem(parsed, spaces);
      await addItem(itemData);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStorage = !selectedStorage || item.storageSpaceId === selectedStorage;
    return matchesSearch && matchesStorage;
  });

  // Group filtered items
  const getFilteredGrouped = () => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    return {
      expired: filteredItems.filter((item) => new Date(item.expirationDate) < now),
      expiringSoon: filteredItems.filter((item) => {
        const expDate = new Date(item.expirationDate);
        return expDate >= now && expDate <= threeDaysFromNow;
      }),
      fresh: filteredItems.filter(
        (item) => new Date(item.expirationDate) > threeDaysFromNow
      ),
    };
  };

  const grouped = getFilteredGrouped();

  const getStorageName = (id: string) =>
    spaces.find((s) => s.id === id)?.name || "Unknown";

  const handleExportCSV = () => {
    exportToCSV(items, getStorageName);
  };

  const handleExportJSON = () => {
    exportToJSON(items, getStorageName);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getDaysUntilExpiration = (dateString: string) => {
    const expDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);
    return Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading inventory...</div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Your Inventory is Empty
        </h2>
        <p className="text-muted-foreground max-w-sm mb-6">
          Add items by taking a photo, or import from a file.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDrawer(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => router.push("/capture")}>Add Items</Button>
        </div>

        {/* Import Drawer for empty state */}
        <ImportInventoryDrawer
          open={showImportDrawer}
          onClose={() => setShowImportDrawer(false)}
          onImport={handleImportItems}
          spaces={spaces}
        />
      </div>
    );
  }

  return (
    <div className="min-h-full pb-4">
      {/* Search & Filters */}
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" title="Export inventory">
                  <Download className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJSON}>
                  <FileJson className="w-4 h-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Storage filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <Badge
              variant={selectedStorage === null ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setSelectedStorage(null)}
            >
              All ({items.length})
            </Badge>
            {spaces.map((space) => {
              const count = items.filter(
                (item) => item.storageSpaceId === space.id
              ).length;
              if (count === 0) return null;
              return (
                <Badge
                  key={space.id}
                  variant={selectedStorage === space.id ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() =>
                    setSelectedStorage(selectedStorage === space.id ? null : space.id)
                  }
                >
                  {space.name} ({count})
                </Badge>
              );
            })}
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="px-5 space-y-6">
        <div className="max-w-md mx-auto">
          {/* Notification Banner */}
          {shouldShowPrompt && showNotificationBanner && items.length > 0 && (
            <NotificationPrompt
              variant="banner"
              onEnable={handleEnableNotifications}
              onDecline={handleDeclineNotifications}
            />
          )}

          {/* Expired Section */}
          {grouped.expired.length > 0 && (
            <ItemSection
              title="Expired"
              icon={<AlertTriangle className="w-4 h-4" />}
              items={grouped.expired}
              variant="expired"
              getStorageName={getStorageName}
              formatDate={formatDate}
              getDaysUntilExpiration={getDaysUntilExpiration}
              onMarkUsed={markUsed}
              onDelete={removeItem}
              onAddToShoppingList={handleAddToShoppingList}
              onEdit={setEditingItem}
            />
          )}

          {/* Expiring Soon Section */}
          {grouped.expiringSoon.length > 0 && (
            <ItemSection
              title="Expiring Soon"
              icon={<Clock className="w-4 h-4" />}
              items={grouped.expiringSoon}
              variant="warning"
              getStorageName={getStorageName}
              formatDate={formatDate}
              getDaysUntilExpiration={getDaysUntilExpiration}
              onMarkUsed={markUsed}
              onDelete={removeItem}
              onAddToShoppingList={handleAddToShoppingList}
              onEdit={setEditingItem}
            />
          )}

          {/* Fresh Section */}
          {grouped.fresh.length > 0 && (
            <ItemSection
              title="Fresh"
              icon={<Leaf className="w-4 h-4" />}
              items={grouped.fresh}
              variant="fresh"
              getStorageName={getStorageName}
              formatDate={formatDate}
              getDaysUntilExpiration={getDaysUntilExpiration}
              onMarkUsed={markUsed}
              onDelete={removeItem}
              onAddToShoppingList={handleAddToShoppingList}
              onEdit={setEditingItem}
            />
          )}

          {/* No results */}
          {filteredItems.length === 0 && items.length > 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No items match your search</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Drawer */}
      <EditItemDrawer
        item={editingItem}
        spaces={spaces}
        onClose={() => setEditingItem(null)}
        onSave={editItem}
      />

      {/* Import Drawer */}
      <ImportInventoryDrawer
        open={showImportDrawer}
        onClose={() => setShowImportDrawer(false)}
        onImport={handleImportItems}
        spaces={spaces}
      />
    </div>
  );
}

// Item Section Component
function ItemSection({
  title,
  icon,
  items,
  variant,
  getStorageName,
  formatDate,
  getDaysUntilExpiration,
  onMarkUsed,
  onDelete,
  onAddToShoppingList,
  onEdit,
}: {
  title: string;
  icon: React.ReactNode;
  items: FoodItem[];
  variant: "expired" | "warning" | "fresh";
  getStorageName: (id: string) => string;
  formatDate: (date: string) => string;
  getDaysUntilExpiration: (date: string) => number;
  onMarkUsed: (id: string) => void;
  onDelete: (id: string) => void;
  onAddToShoppingList: (item: FoodItem) => void;
  onEdit: (item: FoodItem) => void;
}) {
  const variantStyles = {
    expired: "text-destructive",
    warning: "text-amber-600 dark:text-amber-400",
    fresh: "text-primary",
  };

  return (
    <div className="mb-6">
      <div className={`flex items-center gap-2 mb-3 ${variantStyles[variant]}`}>
        {icon}
        <h2 className="text-sm font-medium">
          {title} ({items.length})
        </h2>
      </div>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{
                opacity: 0,
                x: 100,
                scale: 0.8,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              transition={{ duration: 0.2 }}
            >
              <FoodItemCard
                item={item}
                variant={variant}
                storageName={getStorageName(item.storageSpaceId)}
                formattedDate={formatDate(item.expirationDate)}
                daysUntil={getDaysUntilExpiration(item.expirationDate)}
                onMarkUsed={() => onMarkUsed(item.id)}
                onDelete={() => onDelete(item.id)}
                onAddToShoppingList={() => onAddToShoppingList(item)}
                onEdit={() => onEdit(item)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Food Item Card Component
function FoodItemCard({
  item,
  variant,
  storageName,
  formattedDate,
  daysUntil,
  onMarkUsed,
  onDelete,
  onAddToShoppingList,
  onEdit,
}: {
  item: FoodItem;
  variant: "expired" | "warning" | "fresh";
  storageName: string;
  formattedDate: string;
  daysUntil: number;
  onMarkUsed: () => void;
  onDelete: () => void;
  onAddToShoppingList: () => void;
  onEdit: () => void;
}) {
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);

  const handleAddToShoppingList = async () => {
    onAddToShoppingList();
    setShowAddedFeedback(true);
    setTimeout(() => setShowAddedFeedback(false), 1500);
  };
  const expirationLabel =
    daysUntil < 0
      ? `Expired ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""} ago`
      : daysUntil === 0
        ? "Expires today"
        : `Expires ${formattedDate}`;

  const expirationColor = {
    expired: "text-destructive",
    warning: "text-amber-600 dark:text-amber-400",
    fresh: "text-muted-foreground",
  };

  return (
    <Card className="p-4 relative overflow-hidden">
      {/* Added to shopping list feedback */}
      <AnimatePresence>
        {showAddedFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 bg-primary/10 flex items-center justify-center z-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 text-primary font-medium"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Added to list!</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3">
        <FoodIcon name={item.name} category={item.category} size={48} />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{item.name}</h3>
          <p className="text-sm text-muted-foreground">
            {item.quantity} {item.unit} · {storageName}
          </p>
          <p className={`text-xs mt-1 ${expirationColor[variant]}`}>
            {expirationLabel}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <motion.div
            whileTap={{ scale: 0.85 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary active:bg-primary/20"
              onClick={onMarkUsed}
              title="Mark as consumed"
            >
              <Utensils className="w-4 h-4" />
            </Button>
          </motion.div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddToShoppingList}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Shopping List
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}

// Edit Item Drawer (mobile-friendly bottom sheet)
function EditItemDrawer({
  item,
  spaces,
  onClose,
  onSave,
}: {
  item: FoodItem | null;
  spaces: { id: string; name: string }[];
  onClose: () => void;
  onSave: (id: string, data: Partial<Omit<FoodItem, "id" | "userId">>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: "",
    quantity: 1,
    unit: "",
    storageSpaceId: "",
    expirationDate: "",
  });
  const [saving, setSaving] = useState(false);

  // Reset form when item changes
  const itemId = item?.id;
  if (item && formData.name === "" && itemId) {
    setFormData({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      storageSpaceId: item.storageSpaceId,
      expirationDate: item.expirationDate.split("T")[0],
    });
  }

  const handleSave = async () => {
    if (!item || !formData.name.trim()) return;

    setSaving(true);
    try {
      await onSave(item.id, {
        name: formData.name.trim(),
        quantity: formData.quantity,
        unit: formData.unit,
        storageSpaceId: formData.storageSpaceId,
        expirationDate: formData.expirationDate,
      });
      setFormData({ name: "", quantity: 1, unit: "", storageSpaceId: "", expirationDate: "" });
      onClose();
    } catch (error) {
      console.error("Failed to update item:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", quantity: 1, unit: "", storageSpaceId: "", expirationDate: "" });
    onClose();
  };

  return (
    <Drawer open={!!item} onOpenChange={(open) => !open && handleClose()}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Edit Item</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
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
              <Label htmlFor="edit-unit">Unit</Label>
              <Input
                id="edit-unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-storage">Storage</Label>
            <select
              id="edit-storage"
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.storageSpaceId}
              onChange={(e) => setFormData({ ...formData, storageSpaceId: e.target.value })}
            >
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-expiration">Expiration Date</Label>
            <Input
              id="edit-expiration"
              type="date"
              value={formData.expirationDate}
              onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
            />
          </div>
        </div>
        <DrawerFooter>
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={!formData.name.trim() || saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="outline" className="w-full" onClick={handleClose}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Import Inventory Drawer Component
function ImportInventoryDrawer({
  open,
  onClose,
  onImport,
  spaces,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (items: ParsedInventoryItem[]) => Promise<void>;
  spaces: { id: string; name: string }[];
}) {
  const [, setFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedInventoryItem[]>([]);
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
        result = parseInventoryCSV(content);
      } else if (fileType === "json") {
        result = parseInventoryJSON(content);
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

  const getStorageName = (location: string) => {
    const normalized = location.toLowerCase();
    const space = spaces.find(s => s.name.toLowerCase() === normalized);
    return space?.name || location;
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && handleClose()}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Import Inventory</DrawerTitle>
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
            <code className="block bg-background p-2 rounded text-[10px] overflow-x-auto">
              Name,Quantity,Unit,Expiration Date,Storage Location<br/>
              Milk,2,liters,2024-02-15,Fridge<br/>
              Eggs,12,pcs,2024-02-28,Fridge
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
                  <div key={i} className="p-2 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate font-medium">{item.name}</span>
                      <span className="text-muted-foreground whitespace-nowrap">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground ml-6 mt-1">
                      Expires: {item.expirationDate} · {getStorageName(item.storageLocation)}
                    </div>
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
