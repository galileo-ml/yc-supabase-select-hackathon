"use client"

import type { CSSProperties } from "react"

import type { IconKey } from "@/lib/icons"
import { iconLibrary } from "@/lib/icons"

type PathConfig = {
  id: string
  path: string
  icon: IconKey
  delay: number
}

const PATHS: PathConfig[] = [
  {
    id: "path-top",
    path: "M 0,100 C 145,80 230,65 400,50",
    icon: "database",
    delay: 0,
  },
  {
    id: "path-middle",
    path: "M 0,100 C 145,100 230,100 400,100",
    icon: "database",
    delay: 0.25,
  },
  {
    id: "path-bottom",
    path: "M 0,100 C 145,120 230,135 400,150",
    icon: "database",
    delay: 0.5,
  },
]

export function DatabaseSearchingAnimation() {
  const DatabaseIcon = iconLibrary.database

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
            animationDelay: `${delay}s`,
          }

          return (
            <span key={`dot-${id}`} className="path-dot" style={sharedStyle}>
              <span className="path-dot__inner" />
            </span>
          )
        })}

        {PATHS.map(({ id, path, icon, delay }) => {
          const Icon = iconLibrary[icon]
          const sharedStyle: CSSProperties = {
            offsetPath: `path('${path}')`,
            WebkitOffsetPath: `path('${path}')`,
            offsetRotate: "0deg",
            WebkitOffsetRotate: "0deg",
            animationDelay: `${delay + 0.2}s`,
          }

          return (
            <div key={`icon-${id}`} className="path-icon" style={sharedStyle}>
              <div className="pointer-events-none flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary/10 shadow-sm">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-12">
        {[0, 1, 2].map((index) => (
          <div
            key={`database-${index}`}
            className="database-icon"
            style={{ animationDelay: `${index * 0.25}s` }}
          >
            <DatabaseIcon className="h-9 w-9" />
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
          opacity: 0;
          z-index: 0;
          animation: dotTravel 2.4s ease-in-out infinite;
        }

        .path-dot__inner {
          display: block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary);
          transform: translate(-50%, -50%);
        }

        .path-icon {
          position: absolute;
          top: 0;
          left: 0;
          opacity: 0;
          z-index: 2;
          animation: iconTravel 2.6s ease-in-out infinite;
        }

        .database-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          animation: destinationPulse 2.4s ease-in-out infinite;
        }

        .database-icon svg {
          color: var(--foreground);
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
          12% {
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
          12% {
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
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
