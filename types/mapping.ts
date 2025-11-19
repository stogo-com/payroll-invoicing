export interface Client {
  id: string
  name: string
  code: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface FieldMapping {
  id: string
  clientId: string
  sourceField: string
  targetField: string
  transformRule: string
  transformType: "string" | "numeric" | "dateParse" | "concat" | "lookup"
  transformConfig?: any
  lastUpdated: Date
  createdAt: Date
}

export interface ForeignEmployeeMap {
  id: string
  clientId: string
  clientEmployeeId: string
  internalEmployeeId: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TransformPreview {
  original: Record<string, any>
  transformed: Record<string, any>
}
