"use client"

import { useEffect, useState } from "react"
import { Laptop, Mail, Mailbox } from "lucide-react"

export function EmailSendingAnimation() {
  const [sentCount, setSentCount] = useState(0)
  const [flyingEmails, setFlyingEmails] = useState<number[]>([])
  const totalEmails = 10

  useEffect(() => {
    const interval = setInterval(() => {
      setSentCount((previous) => {
        if (previous < totalEmails) {
          const nextCount = previous + 1
          setFlyingEmails((emails) => [...emails, nextCount])

          setTimeout(() => {
            setFlyingEmails((emails) => emails.filter((id) => id !== nextCount))
          }, 1200)

          return nextCount
        }

        clearInterval(interval)
        return previous
      })
    }, 300)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-[80%] space-y-8">
        <div className="relative h-64">
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <div className="flex h-16 w-16 items-center justify-center">
              <Laptop className="h-12 w-12 text-primary" />
            </div>
            <p className="mt-2 text-center text-sm text-muted-foreground">Source</p>
          </div>

          <div className="absolute right-0 top-1/2 flex -translate-y-1/2 flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex h-12 w-12 items-center justify-center transition-all duration-300">
                <Mailbox
                  className={`h-7 w-7 transition-colors ${
                    index < Math.floor(sentCount / 2.5) ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="absolute inset-0 overflow-hidden">
            {flyingEmails.map((emailId) => (
              <div
                key={emailId}
                className="absolute left-20 top-1/2 -translate-y-1/2"
                style={{ animation: "flyToMailbox 1.2s ease-in-out forwards" }}
              >
                <Mail className="h-6 w-6 text-primary" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="font-mono text-sm text-foreground">
              {sentCount} / {totalEmails}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(sentCount / totalEmails) * 100}%` }}
            />
          </div>
        </div>

        {sentCount === totalEmails && (
          <div className="text-center text-sm text-primary animate-in fade-in duration-500">
            ✓ All emails sent successfully!
          </div>
        )}
      </div>

      <style>{`
        @keyframes flyToMailbox {
          0% {
            transform: translateX(0) translateY(-50%) scale(1);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateX(calc(100vw - 280px)) translateY(-50%) scale(0.5);
            opacity: 0;
          }
        }

        @media (min-width: 768px) {
          @keyframes flyToMailbox {
            0% {
              transform: translateX(0) translateY(-50%) scale(1);
              opacity: 1;
            }
            70% {
              opacity: 1;
            }
            100% {
              transform: translateX(520px) translateY(-50%) scale(0.5);
              opacity: 0;
            }
          }
        }
      `}</style>
    </div>
  )
}
