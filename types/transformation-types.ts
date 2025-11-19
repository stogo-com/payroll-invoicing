export type TransformationType =
  | "Stack"
  | "Filter"
  | "DateTime Format"
  | "Lookup"
  | "Dedupe"
  | "Split Col"
  | "If"
  | "Calculate"
  | "Extract"
  | "Copy Cols"
  | "Replace"
  | "Concat Cols"
  | "New Col"
  | "Remove Cols"
  | "Rename Cols"
  | "Reorder Cols"
  | "Sort"
  | "Unique"
  | "Compare Cols"
  | "Join"
  | "Whitespace"
  | "Input"
  | "Javascript"

export type TransformationCategory = "Merge" | "Row" | "Column" | "Format" | "Conditional" | "Input" | "Other"

export interface TransformationRule {
  id: string
  name: TransformationType
  category: TransformationCategory
  purpose: string
  ruleLogic: string
  dataPointsReferenced: string[]
  inputFields: string[]
  outputFields: string[]
  parameters?: Record<string, any>
}

export const TRANSFORMATION_TYPES: Record<
  TransformationType,
  { category: TransformationCategory; description: string }
> = {
  // Merge Operations
  Stack: {
    category: "Merge",
    description: "Merges multiple files into a single file",
  },
  Lookup: {
    category: "Merge",
    description: "Populates values from a lookup table based on matching keys",
  },
  Join: {
    category: "Merge",
    description: "Merges datasets side by side using a key column",
  },

  // Row Operations
  Filter: {
    category: "Row",
    description: "Removes or keeps rows based on conditions",
  },
  Dedupe: {
    category: "Row",
    description: "Removes duplicate rows based on specific columns",
  },
  Sort: {
    category: "Row",
    description: "Sorts rows in ascending or descending order",
  },
  Unique: {
    category: "Row",
    description: "Combines rows with duplicate values using aggregation",
  },

  // Column Operations
  "Split Col": {
    category: "Column",
    description: "Splits a column into multiple columns using a delimiter",
  },
  "Copy Cols": {
    category: "Column",
    description: "Duplicates a column into a new column",
  },
  "New Col": {
    category: "Column",
    description: "Creates a new blank or populated column",
  },
  "Remove Cols": {
    category: "Column",
    description: "Removes unneeded columns",
  },
  "Rename Cols": {
    category: "Column",
    description: "Renames column headers",
  },
  "Reorder Cols": {
    category: "Column",
    description: "Changes the order of columns",
  },
  "Concat Cols": {
    category: "Column",
    description: "Combines multiple columns into a new column",
  },

  // Format Operations
  "DateTime Format": {
    category: "Format",
    description: "Changes date/time formats",
  },
  Extract: {
    category: "Format",
    description: "Extracts specific characters from a field",
  },
  Replace: {
    category: "Format",
    description: "Replaces specific values with new values",
  },
  Whitespace: {
    category: "Format",
    description: "Cleans up whitespace and special characters",
  },

  // Conditional Operations
  If: {
    category: "Conditional",
    description: "Creates conditional logic (IF/THEN/ELSE)",
  },
  Calculate: {
    category: "Conditional",
    description: "Performs calculations on columns",
  },
  "Compare Cols": {
    category: "Conditional",
    description: "Compares columns and flags differences",
  },

  // Input Operations
  Input: {
    category: "Input",
    description: "Loads a crosswalk or mapping file",
  },

  // Other Operations
  Javascript: {
    category: "Other",
    description: "Custom JavaScript transformation logic",
  },
}
