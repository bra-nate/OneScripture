export default function PassageLoading() {
  return (
    <section
      aria-label="Loading scripture passage"
      className="mx-auto w-full max-w-6xl flex-1 animate-pulse px-6 py-12"
    >
      <div className="h-4 w-28 rounded bg-surface" />
      <div className="mt-8 h-12 w-72 rounded bg-surface" />
      <div className="mt-10 max-w-3xl space-y-5">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="flex gap-4">
            <div className="h-4 w-6 rounded bg-surface" />
            <div className="h-6 flex-1 rounded bg-surface" />
          </div>
        ))}
      </div>
    </section>
  );
}
