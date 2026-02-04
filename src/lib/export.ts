import type { FoodItem } from "@/types";

interface ExportableFoodItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expirationDate: string;
  storageLocation: string;
  daysUntilExpiry: number;
  status: string;
}

function getDaysUntilExpiry(expirationDate: string): number {
  const expDate = new Date(expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expDate.setHours(0, 0, 0, 0);
  return Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function prepareItemsForExport(
  items: FoodItem[],
  getStorageName: (id: string) => string
): ExportableFoodItem[] {
  return items.map((item) => ({
    name: item.name,
    category: item.category || "generic",
    quantity: item.quantity,
    unit: item.unit,
    expirationDate: item.expirationDate.split("T")[0],
    storageLocation: getStorageName(item.storageSpaceId),
    daysUntilExpiry: getDaysUntilExpiry(item.expirationDate),
    status: item.status,
  }));
}

export function exportToCSV(
  items: FoodItem[],
  getStorageName: (id: string) => string
): void {
  const exportItems = prepareItemsForExport(items, getStorageName);

  const headers = [
    "Name",
    "Category",
    "Quantity",
    "Unit",
    "Expiration Date",
    "Storage Location",
    "Days Until Expiry",
    "Status",
  ];

  const csvContent = [
    headers.join(","),
    ...exportItems.map((item) =>
      [
        `"${item.name.replace(/"/g, '""')}"`,
        item.category,
        item.quantity,
        `"${item.unit.replace(/"/g, '""')}"`,
        item.expirationDate,
        `"${item.storageLocation.replace(/"/g, '""')}"`,
        item.daysUntilExpiry,
        item.status,
      ].join(",")
    ),
  ].join("\n");

  downloadFile(csvContent, "inventory-export.csv", "text/csv;charset=utf-8;");
}

export function exportToJSON(
  items: FoodItem[],
  getStorageName: (id: string) => string
): void {
  const exportItems = prepareItemsForExport(items, getStorageName);

  const exportData = {
    exportDate: new Date().toISOString(),
    itemCount: exportItems.length,
    items: exportItems,
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadFile(jsonContent, "inventory-export.json", "application/json;charset=utf-8;");
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
