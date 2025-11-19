export class N8nClient {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = process.env.N8N_WEBHOOK_URL || ""
    this.apiKey = process.env.N8N_API_KEY || ""
  }

  async triggerWorkflow(workflowName: string, data: any) {
    try {
      const response = await fetch(`${this.baseUrl}/${workflowName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`n8n workflow failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error triggering n8n workflow ${workflowName}:`, error)
      throw error
    }
  }

  async processTimesheetCsv(fileUrl: string, fileName: string, uploadedBy: string) {
    return this.triggerWorkflow("process-csv", {
      fileUrl,
      fileName,
      type: "timesheets",
      uploadedBy,
    })
  }

  async processCrosswalkCsv(fileUrl: string, fileName: string, uploadedBy: string) {
    return this.triggerWorkflow("process-csv", {
      fileUrl,
      fileName,
      type: "crosswalk",
      uploadedBy,
    })
  }

  async triggerRematch(mappingId: string, timesheetIds?: string[]) {
    return this.triggerWorkflow("rematch", {
      mappingId,
      timesheetIds,
    })
  }

  async downloadSftpFiles() {
    return this.triggerWorkflow("download-sftp", {})
  }
}

export const n8nClient = new N8nClient()
