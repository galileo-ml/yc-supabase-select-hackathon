"use client"

import type { CSSProperties } from "react"
import { useEffect, useState } from "react"
import { Laptop, Mail, Mailbox } from "lucide-react"

const DESTINATION_COUNT = 3
const FLIGHT_DURATION_MS = 1200
const EMAIL_INTERVAL_MS = 800
const BOUNCE_DURATION_MS = 400

interface FlyingEmail {
  id: number
  mailboxIndex: number
}

type MailFlightStyle = CSSProperties & {
  "--vertical-offset": string
}

export function EmailSendingAnimation() {
  const [sentCount, setSentCount] = useState(0)
  const [flyingEmails, setFlyingEmails] = useState<FlyingEmail[]>([])
  const [bouncingDestinations, setBouncingDestinations] = useState<number[]>([])
  const totalEmails = 10
  const emailsPerDestination = totalEmails / DESTINATION_COUNT

  useEffect(() => {
    let emailId = 0
    const interval = setInterval(() => {
      setSentCount((previous) => {
        if (previous >= totalEmails) {
          clearInterval(interval)
          return previous
        }

        const nextCount = previous + 1
        const mailboxIndex = previous % DESTINATION_COUNT
        emailId += 1
        const currentId = emailId

        setFlyingEmails((emails) => [...emails, { id: currentId, mailboxIndex }])

        setTimeout(() => {
          setBouncingDestinations((indices) => [...indices, mailboxIndex])
          setFlyingEmails((emails) => emails.filter((email) => email.id !== currentId))

          setTimeout(() => {
            setBouncingDestinations((indices) => indices.filter((idx) => idx !== mailboxIndex))
          }, BOUNCE_DURATION_MS)
        }, FLIGHT_DURATION_MS)

        return nextCount
      })
    }, EMAIL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [])

  const renderDestination = (index: number) => {
    const isActive = sentCount >= (index + 0.5) * emailsPerDestination
    const isBouncing = bouncingDestinations.includes(index)

    return (
      <div
        key={index}
        className={`flex h-14 w-14 items-center justify-center transition-all duration-300 ${
          isActive ? "text-primary" : "text-muted-foreground"
        } ${isBouncing ? "animate-mailbox-bounce" : ""}`}
      >
        <Mailbox className="h-9 w-9" />
      </div>
    )
  }

  const renderFlyingEmail = ({ id, mailboxIndex }: FlyingEmail) => {
    const centerIndex = (DESTINATION_COUNT - 1) / 2
    const verticalOffset = (mailboxIndex - centerIndex) * 70
    const flightStyle: MailFlightStyle = {
      animation: "flyToMailbox 1.2s ease-in-out forwards",
      "--vertical-offset": `${verticalOffset}px`,
    }

    return (
      <div key={id} className="absolute left-20 top-1/2" style={flightStyle}>
        <Mail className="h-6 w-6 text-primary" />
      </div>
    )
  }

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

          <div className="absolute right-0 top-1/2 flex h-48 -translate-y-1/2 flex-col justify-between">
            {Array.from({ length: DESTINATION_COUNT }).map((_, index) => renderDestination(index))}
          </div>

          <div className="absolute inset-0 overflow-hidden">
            {flyingEmails.map((email) => renderFlyingEmail(email))}
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
    </div>
  )
}
