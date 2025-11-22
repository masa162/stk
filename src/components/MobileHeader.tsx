interface MobileHeaderProps {
  onMenuClick: () => void
  title?: string
}

export default function MobileHeader({ onMenuClick, title }: MobileHeaderProps) {
  return (
    <div className="md:hidden sticky top-0 z-20 bg-white border-b shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 rounded-lg"
          aria-label="メニューを開く"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        {title && <h1 className="text-lg font-semibold">{title}</h1>}
        <div className="w-10" />
      </div>
    </div>
  )
}
