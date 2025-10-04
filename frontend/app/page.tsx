"use client"

import { useState, useEffect } from "react"
import { CampaignModal } from "@/components/campaign-modal"
import { DatabaseSearchingAnimation } from "@/components/database-searching-animation"
import { EmailGenerationAnimation } from "@/components/email-generation-animation"
import { EmailSendingAnimation } from "@/components/email-sending-animation"
import { CampaignDashboard } from "@/components/campaign-dashboard"
import type { Campaign, BackendCampaignResponse } from "@/types/campaign"
import { transformBackendCampaign } from "@/types/campaign"

const SEARCH_DURATION_MS = 6000
const GENERATION_DURATION_MS = 6000
const SENDING_DURATION_MS = 6000

export default function PhishingTrainerPage() {
  const [isModalOpen, setIsModalOpen] = useState(true)
  const [currentStep, setCurrentStep] = useState<"idle" | "searching" | "generating" | "sending" | "complete">("idle")
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  const handleCreateCampaign = async (data: {
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

      // Simulate email generation phase
      setTimeout(() => {
        setCurrentStep("sending")

        // Call backend API to create campaign
        setTimeout(async () => {
          try {
            const response = await fetch("/api/campaigns", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ num_users: data.targetCount }),
            })

            if (!response.ok) {
              throw new Error("Failed to create campaign")
            }

            const backendData: BackendCampaignResponse = await response.json()

            // Transform backend response to frontend Campaign type
            const newCampaign = transformBackendCampaign(backendData, {
              name: data.name,
              organization: data.organization,
              businessFunction: data.businessFunction,
            })

            setCampaigns([newCampaign, ...campaigns])
            setCurrentStep("complete")

            setTimeout(() => {
              setCurrentStep("idle")
            }, 2000)
          } catch (error) {
            console.error("Error creating campaign:", error)
            // Revert to idle state on error
            setCurrentStep("idle")
            // TODO: Show error toast/notification to user
          }
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
