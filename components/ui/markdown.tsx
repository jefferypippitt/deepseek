import { cn } from "@/lib/utils"
import { memo, useId, useMemo } from "react"
import ReactMarkdown, { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { CodeBlock, CodeBlockCode } from "./code-block"
import { bundledLanguages } from "shiki"
import "katex/dist/katex.min.css"

export type MarkdownProps = {
  children: string
  id?: string
  className?: string
  components?: Partial<Components>
}

// Function to preprocess markdown content
function preprocessMarkdown(markdown: string): string {
  // Convert LaTeX-style brackets to proper markdown math syntax
  // Replace [math] with $math$
  return markdown.replace(/\[(.*?)\]/g, (match, content) => {
    // Only convert if it looks like math content
    if (/\\|=|\+|-|\*|\/|boxed|quad|text/.test(content)) {
      return `$${content}$`;
    }
    return match;
  });
}

// Keep the entire content as one block
function parseMarkdownIntoBlocks(markdown: string): string[] {
  return [preprocessMarkdown(markdown)];
}

function extractLanguage(className?: string): string {
  if (!className) return "plaintext"
  
  // Extract language from className (e.g., "language-javascript" -> "javascript")
  const match = className.match(/language-(\w+)/)
  const extractedLang = match ? match[1] : "plaintext"
  
  // Check if the language is supported by Shiki
  if (extractedLang in bundledLanguages) {
    return extractedLang
  }
  
  // Handle common aliases
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'sh': 'bash',
    'yml': 'yaml',
    'md': 'markdown',
  }
  
  if (extractedLang in langMap && langMap[extractedLang] in bundledLanguages) {
    return langMap[extractedLang]
  }
  
  // Default to plaintext if language is not supported
  return "plaintext"
}

const INITIAL_COMPONENTS: Partial<Components> = {
  code: function CodeComponent({ className, children, ...props }) {
    const isInline =
      !props.node?.position?.start.line ||
      props.node?.position?.start.line === props.node?.position?.end.line

    if (isInline) {
      return (
        <span
          className={cn(
            "bg-primary-foreground rounded-sm px-1 font-mono text-sm",
            className
          )}
          {...props}
        >
          {children}
        </span>
      )
    }

    const language = extractLanguage(className)

    return (
      <CodeBlock className={className}>
        <CodeBlockCode code={children as string} language={language} />
      </CodeBlock>
    )
  },
  pre: function PreComponent({ children }) {
    return <>{children}</>
  },
}

const MemoizedMarkdownBlock = memo(
  function MarkdownBlock({
    content,
    components = INITIAL_COMPONENTS,
  }: {
    content: string
    components?: Partial<Components>
  }) {
    return (
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkMath]} 
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    )
  },
  function propsAreEqual(prevProps, nextProps) {
    return prevProps.content === nextProps.content
  }
)

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock"

function MarkdownComponent({
  children,
  id,
  className,
  components = INITIAL_COMPONENTS,
}: MarkdownProps) {
  const generatedId = useId()
  const blockId = id ?? generatedId
  const blocks = useMemo(() => parseMarkdownIntoBlocks(children), [children])

  return (
    <div className={className}>
      {blocks.map((block, index) => (
        <MemoizedMarkdownBlock
          key={`${blockId}-block-${index}`}
          content={block}
          components={components}
        />
      ))}
    </div>
  )
}

const Markdown = memo(MarkdownComponent)
Markdown.displayName = "Markdown"

export { Markdown }
