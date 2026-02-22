export const UNIT_OPTIONS = {
  metric: [
    { value: "pcs", label: "Pieces" },
    { value: "kg", label: "kg" },
    { value: "g", label: "g" },
    { value: "L", label: "L" },
    { value: "mL", label: "mL" },
    { value: "dozen", label: "Dozen" },
    { value: "pack", label: "Pack" },
    { value: "bunch", label: "Bunch" },
    { value: "can", label: "Can" },
    { value: "bottle", label: "Bottle" },
    { value: "bag", label: "Bag" },
    { value: "box", label: "Box" },
    { value: "jar", label: "Jar" },
    { value: "loaf", label: "Loaf" },
    { value: "slice", label: "Slice" },
  ],
  imperial: [
    { value: "pcs", label: "Pieces" },
    { value: "lb", label: "lb" },
    { value: "oz", label: "oz" },
    { value: "gallon", label: "Gallon" },
    { value: "quart", label: "Quart" },
    { value: "pint", label: "Pint" },
    { value: "cup", label: "Cup" },
    { value: "fl oz", label: "fl oz" },
    { value: "dozen", label: "Dozen" },
    { value: "pack", label: "Pack" },
    { value: "bunch", label: "Bunch" },
    { value: "can", label: "Can" },
    { value: "bottle", label: "Bottle" },
    { value: "bag", label: "Bag" },
    { value: "box", label: "Box" },
    { value: "jar", label: "Jar" },
    { value: "loaf", label: "Loaf" },
    { value: "slice", label: "Slice" },
  ],
} as const;

/**
 * Get unit options for a given unit system, including the current value
 * if it doesn't match any predefined option (e.g. from AI).
 */
export function getUnitOptions(unitSystem: "metric" | "imperial", currentValue?: string) {
  const options = UNIT_OPTIONS[unitSystem];
  if (!currentValue || options.some((o) => o.value === currentValue)) {
    return options;
  }
  return [{ value: currentValue, label: currentValue }, ...options];
}
