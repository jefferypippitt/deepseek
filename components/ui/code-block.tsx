"use client"

import { cn } from "@/lib/utils"
import React, { useEffect, useState } from "react"
import { createHighlighter, type Highlighter, bundledLanguages } from "shiki"

// Create a cache to store highlighter instances by theme
const highlighterCache = new Map<string, Promise<Highlighter>>()

// Function to get or create a highlighter instance
async function getHighlighterInstance(theme: string = 'github-light'): Promise<Highlighter> {
  const cacheKey = theme
  
  if (!highlighterCache.has(cacheKey)) {
    // Create a new highlighter instance and store it in the cache
    const highlighterPromise = createHighlighter({
      themes: [theme],
      langs: Object.keys(bundledLanguages),
    })
    
    highlighterCache.set(cacheKey, highlighterPromise)
  }
  
  return highlighterCache.get(cacheKey)!
}

// Initialize a default highlighter on the client side
if (typeof window !== 'undefined') {
  getHighlighterInstance()
}

// Helper function to escape HTML
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export type CodeBlockProps = {
  children?: React.ReactNode
  className?: string
} & React.HTMLProps<HTMLDivElement>

function CodeBlock({ children, className, ...props }: CodeBlockProps) {
  return (
    <div
      className={cn(
        "not-prose flex w-full flex-col overflow-clip border",
        "border-border bg-card text-card-foreground rounded-xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export type CodeBlockCodeProps = {
  code: string
  language?: string
  theme?: string
  className?: string
} & React.HTMLProps<HTMLDivElement>

function CodeBlockCode({
  code,
  language = "tsx",
  theme = "github-light",
  className,
  ...props
}: CodeBlockCodeProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null)

  useEffect(() => {
    async function highlight() {
      if (!code) {
        setHighlightedHtml('<pre><code></code></pre>')
        return
      }

      try {
        // Ensure language is a valid string
        const safeLanguage = language && typeof language === 'string' 
          ? language 
          : 'plaintext'
        
        // Get or create a highlighter instance
        const highlighter = await getHighlighterInstance(theme)
        
        // Check if the language is supported
        let langToUse = 'plaintext'
        
        // Check if the language is in bundled languages
        if (safeLanguage in bundledLanguages) {
          langToUse = safeLanguage
        } else {
          console.warn(`Language '${safeLanguage}' not supported, falling back to plaintext`)
        }
        
        // Use the highlighter to convert code to HTML
        const html = highlighter.codeToHtml(code, {
          lang: langToUse,
          theme: theme,
        })
        
        setHighlightedHtml(html)
      } catch (error) {
        console.error("Error highlighting code:", error)
        // Fallback to plain text if highlighting fails
        setHighlightedHtml(`<pre><code>${escapeHtml(code)}</code></pre>`)
      }
    }
    highlight()
  }, [code, language, theme])

  const classNames = cn(
    "w-full overflow-x-auto text-[13px] [&>pre]:px-4 [&>pre]:py-4",
    className
  )

  // SSR fallback: render plain code if not hydrated yet
  return highlightedHtml ? (
    <div
      className={classNames}
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      {...props}
    />
  ) : (
    <div className={classNames} {...props}>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  )
}

export type CodeBlockGroupProps = React.HTMLAttributes<HTMLDivElement>

function CodeBlockGroup({
  children,
  className,
  ...props
}: CodeBlockGroupProps) {
  return (
    <div
      className={cn("flex items-center justify-between", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { CodeBlockGroup, CodeBlockCode, CodeBlock }
