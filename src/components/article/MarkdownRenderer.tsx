import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import 'highlight.js/styles/github-dark.css'

interface MarkdownRendererProps {
  content: string
}

interface CodeProps {
  inline?: boolean
  className?: string
  children?: React.ReactNode
}

/**
 * Process Hugo-style shortcodes in markdown content
 * Currently supports: {{< youtube VIDEO_ID >}}
 */
function processShortcodes(content: string): string {
  // Replace {{< youtube VIDEO_ID >}} with YouTube iframe
  return content.replace(
    /\{\{<\s*youtube\s+([a-zA-Z0-9_-]+)\s*>\}\}/g,
    (_, videoId) => `
<div class="aspect-video w-full max-w-4xl mx-auto my-6">
  <iframe
    width="100%"
    height="100%"
    src="https://www.youtube-nocookie.com/embed/${videoId}"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
    class="rounded-lg"
  ></iframe>
</div>
    `.trim()
  )
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Process shortcodes before rendering
  const processedContent = processShortcodes(content)
  // Configure sanitize schema to allow audio, video, and iframe elements
  const sanitizeSchema = {
    ...defaultSchema,
    tagNames: [...(defaultSchema.tagNames || []), 'audio', 'video', 'source', 'iframe'],
    attributes: {
      ...defaultSchema.attributes,
      audio: ['src', 'controls', 'autoplay', 'loop', 'muted', 'preload'],
      video: ['src', 'controls', 'autoplay', 'loop', 'muted', 'preload', 'width', 'height', 'poster'],
      source: ['src', 'type'],
      iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'class'],
      div: [...(defaultSchema.attributes?.div || []), 'class'],
    },
  }

  return (
    <div className="prose prose-lg max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={{
          h1: ({ children, ...props }) => (
            <h1
              id={children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')}
              className="text-3xl font-bold mt-8 mb-4 pb-2 border-b border-gray-200"
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              id={children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')}
              className="text-2xl font-bold mt-6 mb-3"
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              id={children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')}
              className="text-xl font-semibold mt-5 mb-2"
              {...props}
            >
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4
              id={children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')}
              className="text-lg font-semibold mt-4 mb-2"
              {...props}
            >
              {children}
            </h4>
          ),
          code: ({ inline, className, children, ...props }: CodeProps) =>
            inline ? (
              <code className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            ) : (
              <code className={`${className} block bg-gray-900 text-white p-4 rounded-lg overflow-x-auto`} {...props}>
                {children}
              </code>
            ),
          pre: ({ children, ...props }) => (
            <pre className="bg-gray-900 rounded-lg overflow-hidden my-4" {...props}>
              {children}
            </pre>
          ),
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border border-gray-300" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-gray-100" {...props}>
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th className="border border-gray-300 px-4 py-2 text-left font-semibold" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border border-gray-300 px-4 py-2" {...props}>
              {children}
            </td>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 italic text-gray-700 bg-gray-50" {...props}>
              {children}
            </blockquote>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside my-4 space-y-2" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside my-4 space-y-2" {...props}>
              {children}
            </ol>
          ),
          a: ({ children, href, ...props }) => {
            // Check if link is external
            const isExternal = href && (
              href.startsWith('http://') ||
              href.startsWith('https://') ||
              href.startsWith('//')
            ) && !href.includes(window.location.hostname);

            return (
              <a
                href={href}
                className="text-blue-600 hover:text-blue-800 underline"
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                {...props}
              >
                {children}
              </a>
            );
          },
          p: ({ children, ...props }) => (
            <p className="my-4 leading-relaxed" {...props}>
              {children}
            </p>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}
