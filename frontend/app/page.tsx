"use client"

import { useState } from "react"
import { CampaignModal } from "@/components/campaign-modal"
import { DatabaseSearchingAnimation } from "@/components/database-searching-animation"
import { EmailGenerationAnimation } from "@/components/email-generation-animation"
import { EmailSendingAnimation } from "@/components/email-sending-animation"
import { CampaignDashboard } from "@/components/campaign-dashboard"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

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
    status: "sent" | "opened" | "clicked"
    sentAt: Date
  }>
}

export default function PhishingTrainerPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<"idle" | "searching" | "generating" | "sending" | "complete">("idle")
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [activeTab, setActiveTab] = useState<"searching" | "generating" | "sending">("searching")

  const handleCreateCampaign = (data: {
    name: string
    organization: string
    businessFunction: string
    targetCount: number
  }) => {
    setIsModalOpen(false)
    setCurrentStep("searching")

    // Simulate database searching (3 seconds)
    setTimeout(() => {
      setCurrentStep("generating")

      // Simulate email generation (7 seconds - longest phase)
      setTimeout(() => {
        setCurrentStep("sending")

        // Simulate email sending (3 seconds)
        setTimeout(() => {
          const newCampaign: Campaign = {
            id: Math.random().toString(36).substr(2, 9),
            name: data.name,
            organization: data.organization,
            businessFunction: data.businessFunction,
            createdAt: new Date(),
            emails: Array.from({ length: data.targetCount }, (_, i) => ({
              id: Math.random().toString(36).substr(2, 9),
              recipient: `employee${i + 1}@company.com`,
              subject: `Important: Action Required`,
              status: Math.random() > 0.7 ? "clicked" : Math.random() > 0.5 ? "opened" : "sent",
              sentAt: new Date(),
            })),
          }

          setCampaigns([newCampaign, ...campaigns])
          setCurrentStep("complete")

          setTimeout(() => {
            setCurrentStep("idle")
          }, 2000)
        }, 3000)
      }, 7000)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {currentStep === "idle" && campaigns.length === 0 && (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Animation Preview</h2>
                <Button onClick={() => setIsModalOpen(true)} size="sm" variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Test Full Flow
                </Button>
              </div>
              <div className="flex gap-2 border-b border-border">
                <button
                  onClick={() => setActiveTab("searching")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "searching"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Database Searching
                </button>
                <button
                  onClick={() => setActiveTab("generating")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "generating"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Email Generation
                </button>
                <button
                  onClick={() => setActiveTab("sending")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "sending"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Email Sending
                </button>
              </div>
            </div>

            {/* Animation Display Area */}
            <div className="rounded-lg border border-border bg-card">
              {activeTab === "searching" && <DatabaseSearchingAnimation />}
              {activeTab === "generating" && <EmailGenerationAnimation />}
              {activeTab === "sending" && <EmailSendingAnimation />}
            </div>
          </div>
        )}

        {currentStep === "searching" && <DatabaseSearchingAnimation />}
        {currentStep === "generating" && <EmailGenerationAnimation />}
        {currentStep === "sending" && <EmailSendingAnimation />}
        {(currentStep === "idle" || currentStep === "complete") && campaigns.length > 0 && (
          <CampaignDashboard campaigns={campaigns} />
        )}
      </main>

      <CampaignModal open={isModalOpen} onOpenChange={setIsModalOpen} onSubmit={handleCreateCampaign} />
    </div>
  )
}
