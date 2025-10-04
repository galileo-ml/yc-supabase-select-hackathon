"use client"

import type { CSSProperties } from "react"

import { Database, Fingerprint, Network } from "lucide-react"

type PathConfig = {
  id: string
  path: string
  Icon: typeof Database
  delay: number
}

const PATHS: PathConfig[] = [
  {
    id: "path-top",
    path: "M 0,100 C 150,50 250,30 400,20",
    Icon: Fingerprint,
    delay: 0,
  },
  {
    id: "path-middle",
    path: "M 0,100 C 150,100 250,100 400,100",
    Icon: Network,
    delay: 0.25,
  },
  {
    id: "path-bottom",
    path: "M 0,100 C 150,150 250,170 400,180",
    Icon: Database,
    delay: 0.5,
  },
]

export function DatabaseSearchingAnimation() {
  return (
    <div className="flex w-full max-w-6xl items-center gap-8 p-8 lg:p-16">
      <div className="flex shrink-0 flex-col items-center gap-3">
        <div className="flex h-32 w-32 items-center justify-center rounded-xl border-2 border-border/40 bg-card query-border-animation">
          <div className="flex flex-col items-center gap-2">
            <div className="h-2 w-14 rounded-full bg-foreground/20" />
            <div className="h-2 w-10 rounded-full bg-foreground/10" />
            <div className="h-6 w-6 rounded-full border border-border/50" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Query</p>
      </div>

      <div className="relative h-80 flex-1">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          style={{ overflow: "visible" }}
        >
          {PATHS.map(({ id, path }) => (
            <path
              key={id}
              d={path}
              stroke="var(--border)"
              strokeWidth={1.5}
              fill="none"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {PATHS.map(({ id, path, delay }) => {
          const sharedStyle: CSSProperties = {
            offsetPath: `path('${path}')`,
            WebkitOffsetPath: `path('${path}')`,
            offsetRotate: "0deg",
            WebkitOffsetRotate: "0deg",
          }

          return (
            <span
              key={`dot-${id}`}
              className="path-dot"
              style={{ ...sharedStyle, animationDelay: `${delay}s` }}
            />
          )
        })}

        {PATHS.map(({ id, path, Icon, delay }) => {
          const sharedStyle: CSSProperties = {
            offsetPath: `path('${path}')`,
            WebkitOffsetPath: `path('${path}')`,
            offsetRotate: "0deg",
            WebkitOffsetRotate: "0deg",
          }

          return (
            <div
              key={`icon-${id}`}
              className="path-icon"
              style={{ ...sharedStyle, animationDelay: `${delay + 0.3}s` }}
            >
              <div className="-translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 p-3 shadow-lg">
                <Icon className="h-8 w-8 text-primary" />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex h-80 shrink-0 flex-col justify-between py-4">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary destination-pulse"
            style={{ animationDelay: `${index * 0.25}s` }}
          >
            <Database className="h-10 w-10 text-foreground" />
          </div>
        ))}
      </div>

      <style>{`
        .query-border-animation {
          animation: queryBorderPulse 2.1s ease-in-out infinite;
        }

        .path-dot {
          position: absolute;
          top: 0;
          left: 0;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--foreground);
          opacity: 0;
          animation: dotTravel 2s ease-in-out infinite;
        }

        .path-icon {
          position: absolute;
          top: 0;
          left: 0;
          opacity: 0;
          animation: iconTravel 2.2s ease-in-out infinite;
        }

        .destination-pulse {
          animation: destinationPulse 2s ease-in-out infinite;
        }

        @keyframes queryBorderPulse {
          0% { border-color: rgba(80,85,120,0.2); }
          50% { border-color: rgba(80,85,120,0.65); }
          100% { border-color: rgba(80,85,120,0.2); }
        }

        @keyframes dotTravel {
          0% {
            offset-distance: 100%;
            opacity: 0;
          }
          15% {
            opacity: 0.6;
          }
          100% {
            offset-distance: 0%;
            opacity: 0;
          }
        }

        @keyframes iconTravel {
          0% {
            offset-distance: 100%;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            offset-distance: 0%;
            opacity: 0;
          }
        }

        @keyframes destinationPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
