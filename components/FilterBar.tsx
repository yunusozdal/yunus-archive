const filters = [
  "All",
  "AI",
  "Poster",
  "Product",
  "Social",
  "Outdoor",
  "Motion",
  "Branding",
  "3D",
];

export default function FilterBar() {
  return (
    <div className="flex gap-3 flex-wrap mb-8">
      {filters.map((filter, index) => (
        <button
          key={filter}
          className={`px-5 py-2 rounded-full transition ${
            index === 0
              ? "bg-white text-black"
              : "bg-neutral-900 hover:bg-neutral-800"
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}