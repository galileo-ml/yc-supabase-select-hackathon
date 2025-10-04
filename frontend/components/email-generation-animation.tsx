"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { TypingAnimation } from "@/components/typing-animation"
import { Mail } from "lucide-react"

const EMAIL_TEMPLATES = [
  {
    subject: "Resend Sponsor Announcement: New Prize Category at the Supabase Select Hackathon",
    body: "Hi Ant,\n\nResend, as a proud sponsor of the Supabase Select Hackathon, is excited to announce an additional prize category at the event. Here's a quick overview:\n\nNew Prize Category: To be announced at the event\nEligibility: Open to all hackathon participants\nPrize: Details TBD at opening remarks\nTimeline: Announcement during opening remarks on day 1\n\nWe appreciate your support and participation.\n\nSee here for more info.\n\nBest regards,\nThe Supabase Select Hackathon Team",
  },
  {
    subject: "Sponsorship Prize Update",
    body: "Hi Reno,\n\nWe are debating whether or not to change the prize to $1,000 in credits. Let me know if that is okay.\n\nBest,\n\nChris.",
  },
  {
    subject: "HR: Benefits Enrollment Deadline",
    body: "Important Notice,\n\nThe deadline for benefits enrollment is approaching. Click here to review and update your selections...",
  },
] as const

export function EmailGenerationAnimation() {
  const [text, setText] = useState("")
  const [currentEmail, setCurrentEmail] = useState(() => Math.floor(Math.random() * EMAIL_TEMPLATES.length))

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

  // Split text into subject and body
  const parts = text.split("\n\n")
  const subject = parts[0] || ""
  const body = parts.slice(1).join("\n\n")

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 p-8">
      <TypingAnimation
        text="Generating tailored emails to recipients..."
        speed={50}
        className="text-center text-lg font-medium text-foreground"
      />
      <div className="w-full max-w-2xl space-y-6">
        <Card className="relative overflow-hidden border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">
                {subject}
                {subject && !body && <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-primary" />}
              </div>
            </div>
          </div>

          <div className="font-mono text-sm text-foreground">
            <pre className="whitespace-pre-wrap">{body}</pre>
            {body && <span className="inline-block h-4 w-2 animate-pulse bg-primary" />}
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
