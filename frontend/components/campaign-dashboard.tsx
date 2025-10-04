"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmailDetailModal } from "@/components/email-detail-modal"
import { maskEmail } from "@/lib/utils"
import { Mail, AlertCircle, CheckCircle2, Circle, Eye, Ban, AlertTriangle, Clock, Send, RefreshCw, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Campaign } from "@/types/campaign"

interface CampaignDashboardProps {
  campaigns: Campaign[]
  onRefresh: (campaignId: string) => Promise<void>
  onCreateNewCampaign: () => void
}

export function CampaignDashboard({ campaigns, onRefresh, onCreateNewCampaign }: CampaignDashboardProps) {
  const [selectedEmail, setSelectedEmail] = useState<Campaign["emails"][0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaigns[0]?.id || "")
  const [isRefreshing, setIsRefreshing] = useState(false)

  if (!campaigns?.length) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <Card className="border-border bg-card p-8 text-center">
          <Mail className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 font-sans text-lg font-semibold text-foreground">No Campaigns Yet</h3>
          <p className="text-sm text-muted-foreground">Create your first phishing simulation campaign to get started.</p>
        </Card>
      </div>
    )
  }

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0]

  const handleRowClick = (email: Campaign["emails"][0]) => {
    setSelectedEmail(email)
    setIsModalOpen(true)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh(selectedCampaignId)
    } finally {
      setIsRefreshing(false)
    }
  }

  const stats = {
    total: selectedCampaign.emails.length,
    queued: selectedCampaign.emails.filter((e) => e.status === "queued").length,
    sending: selectedCampaign.emails.filter((e) => e.status === "sending").length,
    sent: selectedCampaign.emails.filter((e) => e.status === "sent").length,
    delivered: selectedCampaign.emails.filter((e) => e.status === "delivered").length,
    opened: selectedCampaign.emails.filter((e) => e.status === "opened").length,
    clicked: selectedCampaign.emails.filter((e) => e.status === "clicked").length,
    bounced: selectedCampaign.emails.filter((e) => e.status === "bounced").length,
    complained: selectedCampaign.emails.filter((e) => e.status === "complained").length,
  }

  const clickRate = stats.total > 0 ? ((stats.clicked / stats.total) * 100).toFixed(1) : "0.0"
  const openRate = stats.total > 0 ? ((stats.opened / stats.total) * 100).toFixed(1) : "0.0"

  const renderStatusBadge = (status: Campaign["emails"][0]["status"]) => {
    switch (status) {
      case "clicked":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Clicked
          </Badge>
        )
      case "opened":
        return (
          <Badge variant="outline" className="gap-1 border-warning text-warning">
            <Eye className="h-3 w-3" />
            Opened
          </Badge>
        )
      case "delivered":
        return (
          <Badge variant="outline" className="gap-1 border-success text-success">
            <CheckCircle2 className="h-3 w-3" />
            Delivered
          </Badge>
        )
      case "sent":
        return (
          <Badge variant="outline" className="gap-1 border-muted-foreground text-muted-foreground">
            <Circle className="h-3 w-3" />
            Sent
          </Badge>
        )
      case "sending":
        return (
          <Badge variant="outline" className="gap-1 border-primary text-primary">
            <Send className="h-3 w-3" />
            Sending
          </Badge>
        )
      case "queued":
        return (
          <Badge variant="outline" className="gap-1 border-muted-foreground text-muted-foreground">
            <Clock className="h-3 w-3" />
            Queued
          </Badge>
        )
      case "bounced":
        return (
          <Badge variant="outline" className="gap-1 border-destructive text-destructive">
            <Ban className="h-3 w-3" />
            Bounced
          </Badge>
        )
      case "complained":
        return (
          <Badge variant="outline" className="gap-1 border-destructive text-destructive">
            <AlertTriangle className="h-3 w-3" />
            Complained
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Campaign Header with Filter and Refresh */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="mb-1 font-sans text-2xl font-semibold text-foreground">{selectedCampaign.name}</h2>
          <p className="text-sm text-muted-foreground">
            {selectedCampaign.organization} • {selectedCampaign.businessFunction} •{" "}
            {selectedCampaign.createdAt.toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onCreateNewCampaign}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {campaigns.length > 1 && (
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
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
              <p className="text-sm text-muted-foreground">Sent</p>
              <p className="mt-1 font-sans text-2xl font-semibold text-foreground">{stats.sent}</p>
            </div>
            <Circle className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Delivered</p>
              <p className="mt-1 font-sans text-2xl font-semibold text-success">{stats.delivered}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
        </Card>

        <Card className="border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Opened</p>
              <p className="mt-1 font-sans text-2xl font-semibold text-primary">{stats.opened}</p>
              <p className="text-xs text-muted-foreground">{openRate}% open rate</p>
            </div>
            <Eye className="h-8 w-8 text-primary" />
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
            {selectedCampaign.emails.map((email) => (
              <TableRow
                key={email.id}
                className="border-border cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => handleRowClick(email)}
              >
                <TableCell>{renderStatusBadge(email.status)}</TableCell>
                <TableCell className="font-mono text-sm text-foreground">{maskEmail(email.recipient)}</TableCell>
                <TableCell className="text-foreground">{email.subject}</TableCell>
                <TableCell className="text-muted-foreground">{email.sentAt.toLocaleTimeString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <EmailDetailModal open={isModalOpen} onOpenChange={setIsModalOpen} email={selectedEmail} />
    </div>
  )
}
