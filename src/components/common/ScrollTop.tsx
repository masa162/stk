export default function ScrollTop() {
  const handleScrollTop = () => {
    // Scroll window
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Also scroll any overflow containers
    const scrollables = document.querySelectorAll('[class*="overflow-y-auto"]')
    scrollables.forEach((el) => {
      el.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  return (
    <button
      onClick={handleScrollTop}
      className="fixed bottom-4 right-4 z-30 px-3 py-2 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xl font-bold"
      aria-label="Scroll to top"
    >
      ↑
    </button>
  )
}
