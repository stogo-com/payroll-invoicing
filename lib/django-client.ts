// Django API Client
// Handles all CRUD operations with Django REST Framework APIs

export interface DjangoApiConfig {
  baseUrl: string
  apiKey?: string
  token?: string
  timeout?: number
}

export interface DjangoApiError {
  message: string
  status: number
  errors?: Record<string, string[]>
}

export class DjangoApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = "DjangoApiError"
  }
}

export class DjangoClient {
  private baseUrl: string
  private apiKey?: string
  private token?: string
  private timeout: number

  constructor(config?: DjangoApiConfig) {
    this.baseUrl = config?.baseUrl || process.env.DJANGO_API_URL || ""
    this.apiKey = config?.apiKey || process.env.DJANGO_API_KEY
    this.token = config?.token
    this.timeout = config?.timeout || 30000 // 30 seconds default

    if (!this.baseUrl) {
      console.warn("Django API URL not configured. Set DJANGO_API_URL environment variable.")
    }
  }

  /**
   * Set authentication token (e.g., JWT from Django)
   */
  setToken(token: string) {
    this.token = token
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = undefined
  }

  /**
   * Get default headers for API requests
   */
  private getHeaders(additionalHeaders?: Record<string, string>): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...additionalHeaders,
    }

    // Add authentication
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    } else if (this.apiKey) {
      headers["Authorization"] = `Api-Key ${this.apiKey}`
    }

    return headers
  }

  /**
   * Make HTTP request with error handling and retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type")
      if (!contentType?.includes("application/json")) {
        if (!response.ok) {
          throw new DjangoApiError(
            response.status,
            `Request failed: ${response.statusText}`
          )
        }
        return (await response.text()) as T
      }

      const data = await response.json()

      if (!response.ok) {
        // Handle Django REST Framework error format
        const errors = data.detail
          ? { detail: [data.detail] }
          : data.errors || data

        throw new DjangoApiError(
          response.status,
          data.detail || data.message || "API request failed",
          errors
        )
      }

      return data
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof DjangoApiError) {
        throw error
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new DjangoApiError(408, "Request timeout")
        }
        throw new DjangoApiError(500, error.message)
      }

      throw new DjangoApiError(500, "Unknown error occurred")
    }
  }

  /**
   * GET - Retrieve resource(s)
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      url += `?${searchParams.toString()}`
    }

    return this.request<T>(url, { method: "GET" })
  }

  /**
   * POST - Create resource
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT - Update resource (full update)
   */
  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  /**
   * PATCH - Update resource (partial update)
   */
  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  /**
   * DELETE - Delete resource
   */
  async delete<T = void>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }

  /**
   * Upload file to Django API
   */
  async uploadFile(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<any> {
    const formData = new FormData()
    formData.append("file", file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, typeof value === "string" ? value : JSON.stringify(value))
        }
      })
    }

    const headers: HeadersInit = {}
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    } else if (this.apiKey) {
      headers["Authorization"] = `Api-Key ${this.apiKey}`
    }
    // Don't set Content-Type for FormData - browser will set it with boundary

    const url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      throw new DjangoApiError(
        response.status,
        error.detail || error.message || "File upload failed",
        error.errors
      )
    }

    return response.json()
  }
}

// Singleton instance
export const djangoClient = new DjangoClient()

// Example usage patterns for common CRUD operations

/**
 * Example: Timesheets CRUD
 */
export const timesheetsApi = {
  // List timesheets with filters
  list: (params?: { status?: string; network?: string; page?: number }) =>
    djangoClient.get("/api/timesheets/", params),

  // Get single timesheet
  get: (id: string) => djangoClient.get(`/api/timesheets/${id}/`),

  // Create timesheet
  create: (data: any) => djangoClient.post("/api/timesheets/", data),

  // Update timesheet
  update: (id: string, data: any) =>
    djangoClient.patch(`/api/timesheets/${id}/`, data),

  // Delete timesheet
  delete: (id: string) => djangoClient.delete(`/api/timesheets/${id}/`),
}

/**
 * Example: Clients CRUD
 */
export const clientsApi = {
  list: (params?: { search?: string; page?: number }) =>
    djangoClient.get("/api/clients/", params),

  get: (id: string) => djangoClient.get(`/api/clients/${id}/`),

  create: (data: any) => djangoClient.post("/api/clients/", data),

  update: (id: string, data: any) =>
    djangoClient.patch(`/api/clients/${id}/`, data),

  delete: (id: string) => djangoClient.delete(`/api/clients/${id}/`),
}

/**
 * Example: Employees CRUD
 */
export const employeesApi = {
  list: (params?: { client_id?: string; search?: string }) =>
    djangoClient.get("/api/employees/", params),

  get: (id: string) => djangoClient.get(`/api/employees/${id}/`),

  create: (data: any) => djangoClient.post("/api/employees/", data),

  update: (id: string, data: any) =>
    djangoClient.patch(`/api/employees/${id}/`, data),

  delete: (id: string) => djangoClient.delete(`/api/employees/${id}/`),
}

