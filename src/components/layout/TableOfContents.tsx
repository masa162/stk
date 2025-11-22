import { useState, useEffect } from 'react'

interface Heading {
  level: number
  text: string
  id: string
}

interface TableOfContentsProps {
  content: string
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([])

  useEffect(() => {
    // Extract headings from markdown content
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    const matches = Array.from(content.matchAll(headingRegex))

    const extractedHeadings = matches.map((match) => ({
      level: match[1].length,
      text: match[2],
      id: match[2]
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]/g, ''),
    }))

    setHeadings(extractedHeadings)
  }, [content])

  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (headings.length === 0) {
    return null
  }

  return (
    <aside className="w-64 bg-gray-50 border-l border-gray-200 h-screen overflow-y-auto sticky top-0">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase">
          目次
        </h2>
        <nav className="space-y-1">
          {headings.map((heading, index) => (
            <button
              key={index}
              onClick={() => handleClick(heading.id)}
              className="block w-full text-left text-sm text-gray-700 hover:text-blue-600 transition-colors py-1"
              style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
            >
              {heading.text}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  )
}
