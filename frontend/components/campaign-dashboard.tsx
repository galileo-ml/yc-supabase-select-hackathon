"use client"

import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Mail, AlertCircle, CheckCircle2, Circle } from "lucide-react"

export type Campaign = {
  id: string
  name: string
  organization: string
  businessFunction: string
  createdAt: Date
  emails: Array<{
    id: string
    recipient: string
    subject: string
    status: "sent" | "opened" | "clicked"
    sentAt: Date
  }>
}

interface CampaignDashboardProps {
  campaigns: Campaign[]
}

export function CampaignDashboard({ campaigns }: CampaignDashboardProps) {
  if (!campaigns?.length) {
    return null
  }

  const latestCampaign = campaigns[0]

  const stats = {
    total: latestCampaign.emails.length,
    sent: latestCampaign.emails.filter((e) => e.status === "sent").length,
    opened: latestCampaign.emails.filter((e) => e.status === "opened").length,
    clicked: latestCampaign.emails.filter((e) => e.status === "clicked").length,
  }

  const clickRate = ((stats.clicked / stats.total) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Campaign Header */}
      <div>
        <h2 className="mb-1 font-sans text-2xl font-semibold text-foreground">{latestCampaign.name}</h2>
        <p className="text-sm text-muted-foreground">
          {latestCampaign.organization} • {latestCampaign.businessFunction} •{" "}
          {latestCampaign.createdAt.toLocaleDateString()}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Sent</p>
              <p className="mt-1 font-sans text-2xl font-semibold text-foreground">{stats.total}</p>
            </div>
            <Mail className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Delivered</p>
              <p className="mt-1 font-sans text-2xl font-semibold text-foreground">{stats.sent}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Opened</p>
              <p className="mt-1 font-sans text-2xl font-semibold text-foreground">{stats.opened}</p>
            </div>
            <Circle className="h-8 w-8 text-warning" />
          </div>
        </Card>

        <Card className="border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Clicked</p>
              <p className="mt-1 font-sans text-2xl font-semibold text-destructive">{stats.clicked}</p>
              <p className="text-xs text-muted-foreground">{clickRate}% click rate</p>
            </div>
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </Card>
      </div>

      {/* Email Table */}
      <Card className="border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="font-sans text-lg font-semibold text-foreground">Campaign Results</h3>
          <p className="text-sm text-muted-foreground">Detailed breakdown of email delivery and engagement</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Recipient</TableHead>
              <TableHead className="text-muted-foreground">Subject</TableHead>
              <TableHead className="text-muted-foreground">Sent At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {latestCampaign.emails.map((email) => (
              <TableRow key={email.id} className="border-border">
                <TableCell>
                  {email.status === "clicked" && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Clicked
                    </Badge>
                  )}
                  {email.status === "opened" && (
                    <Badge variant="outline" className="gap-1 border-warning text-warning">
                      <Circle className="h-3 w-3" />
                      Opened
                    </Badge>
                  )}
                  {email.status === "sent" && (
                    <Badge variant="outline" className="gap-1 border-success text-success">
                      <CheckCircle2 className="h-3 w-3" />
                      Sent
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm text-foreground">{email.recipient}</TableCell>
                <TableCell className="text-foreground">{email.subject}</TableCell>
                <TableCell className="text-muted-foreground">{email.sentAt.toLocaleTimeString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
