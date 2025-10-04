"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { TypingAnimation } from "@/components/typing-animation"
import { Mail } from "lucide-react"

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
