export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-neutral-800 p-8 sticky top-0 h-screen">

      <h1 className="text-4xl font-bold">
        FrameVault
      </h1>

      <p className="text-neutral-500 mt-2">
        Private Archive
      </p>

      <nav className="mt-10 space-y-2">

        <button className="w-full text-left px-4 py-3 rounded-xl bg-neutral-900">
          🏠 Home
        </button>

        <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-neutral-900">
          ❤️ Favorites
        </button>

        <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-neutral-900">
          📁 Collections
        </button>

        <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-neutral-900">
          ⚙️ Settings
        </button>

      </nav>

    </aside>
  );
}