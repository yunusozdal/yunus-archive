export default function SearchBar() {
  return (
    <input
      type="text"
      placeholder="Search projects, tags, brands..."
      className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-6 py-4 outline-none focus:border-neutral-600 transition"
    />
  );
}