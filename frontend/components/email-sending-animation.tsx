"use client"

import { useEffect, useState } from "react"
import { Laptop, Mail, Mailbox } from "lucide-react"

export function EmailSendingAnimation() {
  const [sentCount, setSentCount] = useState(0)
  const [flyingEmails, setFlyingEmails] = useState<{ id: number; mailboxIndex: number }[]>([])
  const [bouncingMailboxes, setBouncingMailboxes] = useState<number[]>([])
  const totalEmails = 10

  useEffect(() => {
    const interval = setInterval(() => {
      setSentCount((previous) => {
        if (previous < totalEmails) {
          const nextCount = previous + 1
          const mailboxIndex = (previous) % 4 // Distribute across 4 mailboxes
          setFlyingEmails((emails) => [...emails, { id: nextCount, mailboxIndex }])

          // Trigger mailbox bounce when email arrives
          setTimeout(() => {
            setBouncingMailboxes((boxes) => [...boxes, mailboxIndex])

            // Remove email from flying state
            setFlyingEmails((emails) => emails.filter((email) => email.id !== nextCount))

            // Stop mailbox bounce after animation
            setTimeout(() => {
              setBouncingMailboxes((boxes) => boxes.filter((idx) => idx !== mailboxIndex))
            }, 400)
          }, 1200)

          return nextCount
        }

        clearInterval(interval)
        return previous
      })
    }, 800)

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
                  } ${bouncingMailboxes.includes(index) ? "animate-mailbox-bounce" : ""}`}
                />
              </div>
            ))}
          </div>

          <div className="absolute inset-0 overflow-hidden">
            {flyingEmails.map((email) => {
              const verticalOffset = (email.mailboxIndex - 1.5) * 60 // Offset for each mailbox
              return (
                <div
                  key={email.id}
                  className="absolute left-20 top-1/2"
                  style={{
                    animation: "flyToMailbox 1.2s ease-in-out forwards",
                    "--vertical-offset": `${verticalOffset}px`,
                  } as React.CSSProperties & { "--vertical-offset": string }}
                >
                  <Mail className="h-6 w-6 text-primary" />
                </div>
              )
            })}
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
            transform: translateX(0) translateY(calc(-50% + 0px)) scale(1);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateX(calc(100vw - 280px)) translateY(calc(-50% + var(--vertical-offset))) scale(0.5);
            opacity: 0;
          }
        }

        @media (min-width: 768px) {
          @keyframes flyToMailbox {
            0% {
              transform: translateX(0) translateY(calc(-50% + 0px)) scale(1);
              opacity: 1;
            }
            70% {
              opacity: 1;
            }
            100% {
              transform: translateX(520px) translateY(calc(-50% + var(--vertical-offset))) scale(0.5);
              opacity: 0;
            }
          }
        }

        @keyframes mailbox-bounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.3);
          }
        }

        .animate-mailbox-bounce {
          animation: mailbox-bounce 0.4s ease-in-out;
        }
      `}</style>
    </div>
  )
}
