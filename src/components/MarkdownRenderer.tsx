import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

interface MarkdownRendererProps {
  content: string
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-lg max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
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
          code: ({ inline, className, children, ...props }: any) =>
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
          a: ({ children, ...props }) => (
            <a className="text-blue-600 hover:text-blue-800 underline" {...props}>
              {children}
            </a>
          ),
          p: ({ children, ...props }) => (
            <p className="my-4 leading-relaxed" {...props}>
              {children}
            </p>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
