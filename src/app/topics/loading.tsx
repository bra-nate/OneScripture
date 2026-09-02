export default function TopicsLoading() {
  return (
    <section
      className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 motion-safe:animate-pulse md:py-24"
      aria-label="Loading topical scriptures"
    >
      <div className="h-4 w-36 rounded bg-surface" />
      <div className="mt-6 h-16 max-w-3xl rounded bg-surface" />
      <div className="mt-16 space-y-px border-y border-border">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-44 bg-surface" />
        ))}
      </div>
    </section>
  );
}
