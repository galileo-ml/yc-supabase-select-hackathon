"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { maskEmail } from "@/lib/utils"
import { X, Mail, Clock, AlertCircle, CheckCircle2, Circle, Eye, Ban, AlertTriangle, Send } from "lucide-react"

type EmailStatus = "sent" | "delivered" | "clicked" | "opened" | "bounced" | "complained" | "queued" | "sending"

interface EmailDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: {
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
  } | null
}

export function EmailDetailModal({ open, onOpenChange, email }: EmailDetailModalProps) {
  if (!open || !email) {
    return null
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const getStatusIcon = (status: EmailStatus) => {
    switch (status) {
      case "clicked":
        return <AlertCircle className="h-4 w-4" />
      case "opened":
        return <Eye className="h-4 w-4" />
      case "delivered":
        return <CheckCircle2 className="h-4 w-4" />
      case "sent":
        return <Circle className="h-4 w-4" />
      case "sending":
        return <Send className="h-4 w-4" />
      case "queued":
        return <Clock className="h-4 w-4" />
      case "bounced":
        return <Ban className="h-4 w-4" />
      case "complained":
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: EmailStatus) => {
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
    }
  }

  const getStatusColor = (status: EmailStatus) => {
    switch (status) {
      case "clicked":
        return "text-destructive"
      case "opened":
        return "text-warning"
      case "delivered":
        return "text-success"
      case "sent":
        return "text-muted-foreground"
      case "sending":
        return "text-primary"
      case "queued":
        return "text-muted-foreground"
      case "bounced":
        return "text-destructive"
      case "complained":
        return "text-destructive"
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-border bg-card px-6 py-5">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-sans text-xl font-semibold text-foreground">{email.subject}</h2>
            </div>
            <p className="text-sm text-muted-foreground">Email Details</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Close email detail modal">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-6 px-6 py-6">
          {/* Metadata Section */}
          <Card className="border-border bg-secondary p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Recipient</p>
                <p className="font-mono text-sm text-foreground">{maskEmail(email.recipient)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                <div>{getStatusBadge(email.status)}</div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Sent At</p>
                <p className="text-sm text-foreground">{email.sentAt.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          {/* Timeline Section */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="h-4 w-4" />
              Status Timeline
            </h3>
            <div className="space-y-3">
              {email.statusHistory.map((history, index) => {
                const isLast = index === email.statusHistory.length - 1
                return (
                  <div key={index} className="flex items-start gap-3">
                    {/* Timeline Line */}
                    <div className="flex flex-col items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                        history.status === "clicked" ? "border-destructive bg-destructive/10" :
                        history.status === "delivered" ? "border-success bg-success/10" :
                        "border-muted-foreground bg-muted/10"
                      }`}>
                        <div className={getStatusColor(history.status)}>
                          {getStatusIcon(history.status)}
                        </div>
                      </div>
                      {!isLast && (
                        <div className="h-8 w-0.5 bg-border" />
                      )}
                    </div>
                    {/* Timeline Content */}
                    <div className="flex-1 pt-1">
                      <p className="text-sm font-medium capitalize text-foreground">
                        {history.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {history.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Email Content Section */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Email Content</h3>
            <Card className="border-border bg-secondary p-6">
              <div
                className="prose prose-sm max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: email.content }}
              />
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-border bg-card px-6 py-4">
          <Button onClick={handleClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
