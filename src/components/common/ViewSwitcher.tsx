export type ViewMode = 'gmail' | 'table' | 'card'

interface ViewSwitcherProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export default function ViewSwitcher({ viewMode, onViewModeChange }: ViewSwitcherProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onViewModeChange('gmail')}
        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
          viewMode === 'gmail'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        title="Gmail風ビュー"
      >
        📧 Gmail
      </button>
      <button
        onClick={() => onViewModeChange('table')}
        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
          viewMode === 'table'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        title="テーブルビュー"
      >
        📊 テーブル
      </button>
      <button
        onClick={() => onViewModeChange('card')}
        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
          viewMode === 'card'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        title="カードビュー"
      >
        🎴 カード
      </button>
    </div>
  )
}
