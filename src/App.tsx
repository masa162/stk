import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import ArticleList from './pages/ArticleList'
import ArticleDetail from './pages/ArticleDetail'
import ArticleNew from './pages/ArticleNew'
import ArticleEdit from './pages/ArticleEdit'
import Trash from './pages/Trash'
import Search from './pages/Search'
import Tags from './pages/Tags'
import AdminTags from './pages/AdminTags'
import Quick from './pages/Quick'
import { ToastProvider } from './contexts/ToastContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function GlobalShortcuts() {
  const navigate = useNavigate()
  const lastKey = useRef<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (lastKey.current === 'g' && e.key === 'h') {
        navigate('/')
      }

      lastKey.current = e.key
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => { lastKey.current = null }, 1000)
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  return null
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <GlobalShortcuts />
          <Routes>
            <Route path="/" element={<ArticleList />} />
            <Route path="/articles/:id" element={<ArticleDetail />} />
            <Route path="/articles/new" element={<ArticleNew />} />
            <Route path="/articles/:id/edit" element={<ArticleEdit />} />
            <Route path="/trash" element={<Trash />} />
            <Route path="/search" element={<Search />} />
            <Route path="/tags" element={<Tags />} />
            <Route path="/admin/tags" element={<AdminTags />} />
            <Route path="/quick" element={<Quick />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
