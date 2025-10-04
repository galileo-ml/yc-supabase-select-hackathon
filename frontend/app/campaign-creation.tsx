"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Building2, Target, Users, X } from "lucide-react"

interface CampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    name: string
    organization: string
    businessFunction: string
    targetCount: number
  }) => void
}

const ORGANIZATIONS = [
  { value: "engineering", label: "Engineering" },
  { value: "sales", label: "Sales" },
  { value: "marketing", label: "Marketing" },
  { value: "hr", label: "Human Resources" },
  { value: "finance", label: "Finance" },
  { value: "operations", label: "Operations" },
]

const BUSINESS_FUNCTIONS = [
  { value: "cx", label: "Customer Experience" },
  { value: "product", label: "Product" },
  { value: "design", label: "Design" },
  { value: "data", label: "Data & Analytics" },
  { value: "security", label: "Security" },
  { value: "legal", label: "Legal" },
]

const DEFAULT_TARGET_COUNT = "10"

export function CampaignModal({ open, onOpenChange, onSubmit }: CampaignModalProps) {
  const [name, setName] = useState("")
  const [organization, setOrganization] = useState("")
  const [businessFunction, setBusinessFunction] = useState("")
  const [targetCount, setTargetCount] = useState(DEFAULT_TARGET_COUNT)

  if (!open) {
    return null
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      name: name.trim(),
      organization,
      businessFunction,
      targetCount: Number.parseInt(targetCount, 10),
    })

    setName("")
    setOrganization("")
    setBusinessFunction("")
    setTargetCount(DEFAULT_TARGET_COUNT)
    onOpenChange(false)
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="font-sans text-xl font-semibold text-foreground">Create New Campaign</h2>
            <p className="text-sm text-muted-foreground">
              Configure your phishing simulation campaign parameters.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Close campaign modal">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          <FieldGroup id="campaign-name" label="Campaign Name">
            <input
              id="campaign-name"
              placeholder="Q1 2025 Security Training"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </FieldGroup>

          <FieldGroup
            id="campaign-organization"
            label="Organization"
            icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
          >
            <select
              id="campaign-organization"
              value={organization}
              onChange={(event) => setOrganization(event.target.value)}
              required
              className="w-full appearance-none rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="" disabled>
                Select organization
              </option>
              {ORGANIZATIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup
            id="campaign-function"
            label="Business Function"
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
          >
            <select
              id="campaign-function"
              value={businessFunction}
              onChange={(event) => setBusinessFunction(event.target.value)}
              required
              className="w-full appearance-none rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="" disabled>
                Select function
              </option>
              {BUSINESS_FUNCTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup
            id="campaign-targets"
            label="Number of Targets"
            icon={<Target className="h-4 w-4 text-muted-foreground" />}
            hint="Number of employees to include in this campaign"
          >
            <input
              id="campaign-targets"
              type="number"
              min={1}
              max={100}
              value={targetCount}
              onChange={(event) => setTargetCount(event.target.value)}
              required
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </FieldGroup>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Launch Campaign</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FieldGroup({
  id,
  label,
  icon,
  hint,
  children,
}: {
  id: string
  label: React.ReactNode
  icon?: React.ReactNode
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
