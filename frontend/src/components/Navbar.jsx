function Navbar({ user, signOut }) {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <span className="font-semibold text-gray-800 text-lg">
            Soccer Ball Tracker
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {user?.signInDetails?.loginId || user?.username}
          </span>
          <button
            onClick={signOut}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar