"use client"

import { useState, useEffect } from "react"
import { CampaignModal } from "@/components/campaign-modal"
import { DatabaseSearchingAnimation } from "@/components/database-searching-animation"
import { EmailGenerationAnimation } from "@/components/email-generation-animation"
import { EmailSendingAnimation } from "@/components/email-sending-animation"
import { CampaignDashboard } from "@/components/campaign-dashboard"
import { Button } from "@/components/ui/button"
import { LayoutDashboard } from "lucide-react"
import type { Campaign, BackendCampaignResponse, BackendCampaignsListResponse } from "@/types/campaign"
import { transformBackendCampaign, transformBackendCampaignSummary } from "@/types/campaign"

const SEARCH_DURATION_MS = 6000
const GENERATION_DURATION_MS = 6000
const SENDING_DURATION_MS = 6000

export default function PhishingTrainerPage() {
  const [isModalOpen, setIsModalOpen] = useState(true)
  const [currentStep, setCurrentStep] = useState<"idle" | "searching" | "generating" | "sending" | "complete">("idle")
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch("/api/campaigns")

      if (!response.ok) {
        throw new Error("Failed to fetch campaigns")
      }

      const data: BackendCampaignsListResponse = await response.json()

      // Fetch full details for each campaign
      const campaignDetailsPromises = data.campaigns.map(async (summary) => {
        try {
          const detailResponse = await fetch(`/api/campaigns/${summary.id}/status`)

          if (!detailResponse.ok) {
            console.error(`Failed to fetch details for campaign ${summary.id}`)
            return transformBackendCampaignSummary(summary)
          }

          const detailData: BackendCampaignResponse = await detailResponse.json()

          // Transform with metadata (using placeholders since we don't store these in backend)
          return transformBackendCampaign(detailData, {
            name: `Campaign ${summary.id}`,
            organization: "Unknown",
            businessFunction: "Unknown",
          })
        } catch (error) {
          console.error(`Error fetching campaign ${summary.id}:`, error)
          return transformBackendCampaignSummary(summary)
        }
      })

      const transformedCampaigns = await Promise.all(campaignDetailsPromises)
      setCampaigns(transformedCampaigns)
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      // TODO: Show error toast/notification to user
    }
  }

  // Load campaigns on page mount
  useEffect(() => {
    fetchCampaigns()
  }, [])

  const handleRefreshCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/status`)

      if (!response.ok) {
        throw new Error("Failed to refresh campaign")
      }

      const backendData: BackendCampaignResponse = await response.json()

      // Find the existing campaign to get its metadata
      const existingCampaign = campaigns.find((c) => c.id === campaignId)
      if (!existingCampaign) {
        console.error("Campaign not found in state")
        return
      }

      // Transform backend response to frontend Campaign type
      const refreshedCampaign = transformBackendCampaign(backendData, {
        name: existingCampaign.name,
        organization: existingCampaign.organization,
        businessFunction: existingCampaign.businessFunction,
      })

      // Update campaigns state with refreshed data
      setCampaigns((prevCampaigns) =>
        prevCampaigns.map((c) => (c.id === campaignId ? refreshedCampaign : c))
      )
    } catch (error) {
      console.error("Error refreshing campaign:", error)
      // TODO: Show error toast/notification to user
    }
  }

  const handleCreateCampaign = async (data: {
    name: string
    organization: string
    businessFunction: string
    targetCount: number
  }) => {
    setIsModalOpen(false)
    setCurrentStep("searching")

    // Start backend API call immediately
    const apiCallPromise = fetch("/api/campaigns", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ num_users: data.targetCount }),
    })

    // Animation timeline
    const animationPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        setCurrentStep("generating")

        setTimeout(() => {
          setCurrentStep("sending")

          setTimeout(() => {
            resolve()
          }, SENDING_DURATION_MS)
        }, GENERATION_DURATION_MS)
      }, SEARCH_DURATION_MS)
    })

    // Wait for both API call and animations to complete
    try {
      const [response] = await Promise.all([apiCallPromise, animationPromise])

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
          {(currentStep === "idle" || currentStep === "complete") && (
            <CampaignDashboard
              campaigns={campaigns}
              onRefresh={handleRefreshCampaign}
              onCreateNewCampaign={() => setIsModalOpen(true)}
            />
          )}
        </main>

        <CampaignModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSubmit={handleCreateCampaign}
          onNavigateToDashboard={async () => {
            await fetchCampaigns()
            setCurrentStep("idle")
          }}
          hasCampaigns={campaigns.length > 0}
        />
      </div>
    </div>
  )
}
