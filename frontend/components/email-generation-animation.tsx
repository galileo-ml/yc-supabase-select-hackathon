"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Mail, Sparkles } from "lucide-react"

const EMAIL_TEMPLATES = [
  {
    subject: "Urgent: Password Reset Required",
    body: "Dear Team Member,\n\nWe have detected unusual activity on your account. Please reset your password immediately by clicking the link below...",
  },
  {
    subject: "IT Department: System Upgrade",
    body: "Hello,\n\nOur IT department is performing a mandatory system upgrade. Please verify your credentials to maintain access...",
  },
  {
    subject: "HR: Benefits Enrollment Deadline",
    body: "Important Notice,\n\nThe deadline for benefits enrollment is approaching. Click here to review and update your selections...",
  },
] as const

export function EmailGenerationAnimation() {
  const [text, setText] = useState("")
  const [currentEmail, setCurrentEmail] = useState(0)

  useEffect(() => {
    const template = EMAIL_TEMPLATES[currentEmail]
    const fullText = `${template.subject}\n\n${template.body}`
    let index = 0
    const interval = setInterval(() => {
      if (index <= fullText.length) {
        setText(fullText.slice(0, index))
        index++
      } else {
        clearInterval(interval)
        setTimeout(() => {
          if (currentEmail < EMAIL_TEMPLATES.length - 1) {
            setCurrentEmail(currentEmail + 1)
            setText("")
          }
        }, 1000)
      }
    }, 30)

    return () => clearInterval(interval)
  }, [currentEmail])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 animate-pulse text-primary" />
            <h2 className="font-sans text-xl font-semibold text-foreground">Generating Phishing Emails</h2>
          </div>
          <p className="text-sm text-muted-foreground">Creating realistic phishing scenarios using AI...</p>
        </div>

        <Card className="relative overflow-hidden border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="h-2 w-32 animate-pulse rounded bg-muted" />
            </div>
          </div>

          <div className="font-mono text-sm text-foreground">
            <pre className="whitespace-pre-wrap">{text}</pre>
            <span className="inline-block h-4 w-2 animate-pulse bg-primary" />
          </div>

          {/* Envelope animation overlay */}
          <div className="absolute bottom-4 right-4 opacity-20">
            <svg width="80" height="60" viewBox="0 0 80 60" fill="none" className="animate-pulse">
              <rect x="5" y="10" width="70" height="45" stroke="currentColor" strokeWidth="2" />
              <path d="M5 10 L40 35 L75 10" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </Card>

        <div className="flex items-center justify-center gap-2">
          {EMAIL_TEMPLATES.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${index === currentEmail ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
