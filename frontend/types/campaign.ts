// Backend API response types
export interface BackendCampaignEmail {
  id: number
  campaign_id: number
  employee_id: number
  recipient_email: string
  subject: string | null
  resend_message_id: string | null
  status: string
  last_event: string | null
  last_event_at: string | null
  created_at: string | null
  sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
  bounced_at: string | null
  complained_at: string | null
  body_text: string | null
  body_html: string | null
}

export interface BackendEmployee {
  id: number
  email: string
  name: string
  company: string
  context: string | null
}

export interface BackendCampaignMember {
  employee: BackendEmployee
  emails: BackendCampaignEmail[]
}

export interface BackendCampaign {
  id: number
  num_users: number
  created_at: string | null
}

export interface BackendCampaignResponse {
  campaign: BackendCampaign
  members: BackendCampaignMember[]
}

export interface BackendCampaignSummary {
  id: number
  num_users: number
  created_at: string | null
  emails: {
    total: number
    sent: number
  }
  last_activity_at: string | null
}

export interface BackendCampaignsListResponse {
  campaigns: BackendCampaignSummary[]
}

// Frontend types (UI layer)
export type EmailStatus = "sent" | "delivered" | "clicked" | "opened" | "bounced" | "complained" | "queued" | "sending"

export interface Email {
  id: string
  recipient: string
  subject: string
  content: string
  status: EmailStatus
  sentAt: Date
  statusHistory: Array<{
    status: EmailStatus
    timestamp: Date
  }>
}

export interface Campaign {
  id: string
  name: string
  organization: string
  businessFunction: string
  createdAt: Date
  emails: Email[]
}

// Helper to convert backend email status to frontend status
export function mapEmailStatus(backendStatus: string): EmailStatus {
  const statusMap: Record<string, EmailStatus> = {
    queued: "queued",
    sending: "sending",
    sent: "sent",
    delivered: "delivered",
    opened: "opened",
    clicked: "clicked",
    bounced: "bounced",
    complained: "complained",
  }
  return (statusMap[backendStatus] || "sent") as EmailStatus
}

// Helper to build status history from backend timestamps
export function buildStatusHistory(email: BackendCampaignEmail): Array<{ status: EmailStatus; timestamp: Date }> {
  const history: Array<{ status: EmailStatus; timestamp: Date }> = []

  if (email.sent_at) {
    history.push({ status: "sent", timestamp: new Date(email.sent_at) })
  }
  if (email.delivered_at) {
    history.push({ status: "delivered", timestamp: new Date(email.delivered_at) })
  }
  if (email.opened_at) {
    history.push({ status: "opened", timestamp: new Date(email.opened_at) })
  }
  if (email.clicked_at) {
    history.push({ status: "clicked", timestamp: new Date(email.clicked_at) })
  }
  if (email.bounced_at) {
    history.push({ status: "bounced", timestamp: new Date(email.bounced_at) })
  }
  if (email.complained_at) {
    history.push({ status: "complained", timestamp: new Date(email.complained_at) })
  }

  // Sort by timestamp
  history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  return history
}

// Convert backend campaign response to frontend Campaign type
export function transformBackendCampaign(
  backendData: BackendCampaignResponse,
  metadata: {
    name: string
    organization: string
    businessFunction: string
  }
): Campaign {
  const emails: Email[] = backendData.members.flatMap((member) =>
    member.emails.map((email) => ({
      id: email.id.toString(),
      recipient: email.recipient_email,
      subject: email.subject || "No subject",
      content: email.body_html || email.body_text || "",
      status: mapEmailStatus(email.status),
      sentAt: email.sent_at ? new Date(email.sent_at) : new Date(),
      statusHistory: buildStatusHistory(email),
    }))
  )

  return {
    id: backendData.campaign.id.toString(),
    name: metadata.name,
    organization: metadata.organization,
    businessFunction: metadata.businessFunction,
    createdAt: backendData.campaign.created_at ? new Date(backendData.campaign.created_at) : new Date(),
    emails,
  }
}

// Convert backend campaign summary to frontend Campaign type (for list views)
export function transformBackendCampaignSummary(summary: BackendCampaignSummary): Campaign {
  return {
    id: summary.id.toString(),
    name: `Campaign ${summary.id}`,
    organization: "Unknown",
    businessFunction: "Unknown",
    createdAt: summary.created_at ? new Date(summary.created_at) : new Date(),
    emails: [], // Summary doesn't include full email details
  }
}
