export type DataType = "string" | "number" | "date" | "datetime" | "boolean" | "guid" | "decimal" | "integer"

export type ValidationRule = {
  id: string
  type: "required" | "min" | "max" | "pattern" | "custom"
  value?: string | number
  message: string
}

export type FieldDefinition = {
  id: string
  name: string
  dataType: DataType
  order: number
  validationRules: ValidationRule[]
  description?: string
}

export type TransformationRule = {
  id: string
  type: string
  category: "Merge" | "Row" | "Column" | "Format" | "Conditional" | "Input" | "Other"
  purpose: string
  ruleLogic: string
  parameters?: Record<string, any>
}

export type FieldMapping = {
  id: string
  mappingType: "input-to-output" | "output-only" // Type of mapping
  sourceFieldId?: string // Optional - only for input-to-output mappings
  targetFieldId: string // Required - the output field
  transformRule?: string // Simple transformation description (e.g., "Convert to ISO date format")

  // For output-only mappings
  defaultValueType?: "static" | "dropdown" | "api-call" | "system-generated"
  defaultValue?: string // Static default value
  dropdownOptions?: string[] // Options for dropdown fields
  apiEndpoint?: string // API endpoint for dynamic values
  systemGeneratedRule?: string // Description of how system generates the value
}

export type MappingSchema = {
  id: string
  clientId: number
  moduleType: "timesheets" | "payroll" | "invoicing"
  inputFields: FieldDefinition[]
  outputFields: FieldDefinition[]
  fieldMappings: FieldMapping[]
  lastUpdated: string
}
