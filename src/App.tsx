import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ArticleList from './pages/ArticleList'
import ArticleDetail from './pages/ArticleDetail'
import ArticleNew from './pages/ArticleNew'
import ArticleEdit from './pages/ArticleEdit'
import Trash from './pages/Trash'
import Search from './pages/Search'
import Tags from './pages/Tags'
import AdminCategories from './pages/AdminCategories'
import { ToastProvider } from './contexts/ToastContext'

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ArticleList />} />
          <Route path="/articles/:id" element={<ArticleDetail />} />
          <Route path="/articles/new" element={<ArticleNew />} />
          <Route path="/articles/:id/edit" element={<ArticleEdit />} />
          <Route path="/trash" element={<Trash />} />
          <Route path="/search" element={<Search />} />
          <Route path="/tags" element={<Tags />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
