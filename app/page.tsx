import Gallery from "../components/Gallery";
import UploadButton from "../components/UploadButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-white px-4 py-5 text-neutral-950 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-red-600 md:text-2xl">
              yunus archive
            </h1>
            <p className="mt-1 text-xs text-neutral-500">
              visual archive
            </p>
          </div>

          <UploadButton />
        </header>

        <Gallery />
      </div>
    </main>
  );
}