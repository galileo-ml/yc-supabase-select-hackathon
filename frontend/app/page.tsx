"use client"

import { useState } from "react"
import { CampaignModal } from "@/components/campaign-modal"
import { DatabaseSearchingAnimation } from "@/components/database-searching-animation"
import { EmailGenerationAnimation } from "@/components/email-generation-animation"
import { EmailSendingAnimation } from "@/components/email-sending-animation"
import { CampaignDashboard } from "@/components/campaign-dashboard"

const SEARCH_DURATION_MS = 3000
const GENERATION_DURATION_MS = 7000
const SENDING_DURATION_MS = 8000

type Campaign = {
  id: string
  name: string
  organization: string
  businessFunction: string
  createdAt: Date
  emails: Array<{
    id: string
    recipient: string
    subject: string
    content: string
    status: "sent" | "delivered" | "clicked"
    sentAt: Date
    statusHistory: Array<{
      status: "sent" | "delivered" | "clicked"
      timestamp: Date
    }>
  }>
}

export default function PhishingTrainerPage() {
  const [isModalOpen, setIsModalOpen] = useState(true)
  const [currentStep, setCurrentStep] = useState<"idle" | "searching" | "generating" | "sending" | "complete">("idle")
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  const handleCreateCampaign = (data: {
    name: string
    organization: string
    businessFunction: string
    targetCount: number
  }) => {
    setIsModalOpen(false)
    setCurrentStep("searching")

    // Simulate database searching phase
    setTimeout(() => {
      setCurrentStep("generating")

      // Simulate email generation (7 seconds - longest phase)
      setTimeout(() => {
        setCurrentStep("sending")

        // Simulate email sending (8 seconds)
        setTimeout(() => {
          const newCampaign: Campaign = {
            id: Math.random().toString(36).substr(2, 9),
            name: data.name,
            organization: data.organization,
            businessFunction: data.businessFunction,
            createdAt: new Date(),
            emails: Array.from({ length: data.targetCount }, (_, i) => {
              const baseTime = new Date()
              const sentTime = new Date(baseTime.getTime() - (data.targetCount - i) * 1000)
              const status: "sent" | "delivered" | "clicked" = Math.random() > 0.7 ? "clicked" : Math.random() > 0.5 ? "delivered" : "sent"

              // Build status history based on final status
              const statusHistory: Array<{ status: "sent" | "delivered" | "clicked"; timestamp: Date }> = [
                { status: "sent", timestamp: sentTime }
              ]

              if (status === "delivered" || status === "clicked") {
                statusHistory.push({
                  status: "delivered",
                  timestamp: new Date(sentTime.getTime() + Math.random() * 60000 + 5000) // 5-65 seconds after sent
                })
              }

              if (status === "clicked") {
                statusHistory.push({
                  status: "clicked",
                  timestamp: new Date(statusHistory[statusHistory.length - 1].timestamp.getTime() + Math.random() * 30000 + 2000) // 2-32 seconds after delivered
                })
              }

              return {
                id: Math.random().toString(36).substr(2, 9),
                recipient: `employee${i + 1}@company.com`,
                subject: `Important: Action Required - ${data.organization}`,
                content: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <p>Dear Team Member,</p>
                    <p>This is an urgent notification regarding your account security. We have detected unusual activity and need you to verify your credentials immediately.</p>
                    <p><strong>Action Required:</strong> Please click the link below to verify your account within 24 hours to prevent suspension.</p>
                    <p style="margin: 20px 0;">
                      <a href="#" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Verify Account Now
                      </a>
                    </p>
                    <p>If you do not recognize this activity, please contact IT security immediately.</p>
                    <p style="margin-top: 30px; color: #666; font-size: 12px;">
                      This is a simulated phishing email for security awareness training purposes.
                    </p>
                    <p style="color: #666; font-size: 12px;">
                      IT Security Team<br>
                      ${data.organization}
                    </p>
                  </div>
                `,
                status,
                sentAt: sentTime,
                statusHistory,
              }
            }),
          }

          setCampaigns([newCampaign, ...campaigns])
          setCurrentStep("complete")

          setTimeout(() => {
            setCurrentStep("idle")
          }, 2000)
        }, SENDING_DURATION_MS)
      }, GENERATION_DURATION_MS)
    }, SEARCH_DURATION_MS)
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <svg className="pointer-events-none absolute h-0 w-0">
        <defs>
          <filter id="grainy-page">
            <feTurbulence type="fractalNoise" baseFrequency="0.375" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0 1" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      <div className="pointer-events-none absolute inset-0 bg-[var(--page-backdrop,#f7efe1)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-45 mix-blend-multiply"
        style={{ filter: "url(#grainy-page)" }}
      />

      <div className="relative z-10 min-h-screen">
        {/* Main Content */}
        <main className="container mx-auto px-6 py-12">
          {currentStep === "searching" && (
            <div className="mx-auto w-[70%] rounded-lg border border-border bg-card">
              <DatabaseSearchingAnimation />
            </div>
          )}
          {currentStep === "generating" && (
            <div className="mx-auto w-[70%] rounded-lg border border-border bg-card">
              <EmailGenerationAnimation />
            </div>
          )}
          {currentStep === "sending" && (
            <div className="mx-auto w-[70%] rounded-lg border border-border bg-card">
              <EmailSendingAnimation />
            </div>
          )}
          {(currentStep === "idle" || currentStep === "complete") && campaigns.length > 0 && (
            <CampaignDashboard campaigns={campaigns} />
          )}
        </main>

        <CampaignModal open={isModalOpen} onOpenChange={setIsModalOpen} onSubmit={handleCreateCampaign} />
      </div>
    </div>
  )
}
