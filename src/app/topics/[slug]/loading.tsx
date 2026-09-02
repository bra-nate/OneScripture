export default function TopicDetailLoading() {
  return (
    <section
      className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 md:py-20"
      aria-label="Loading scripture topic"
    >
      <div className="h-5 w-24 rounded bg-surface motion-safe:animate-pulse" />
      <div className="mt-16 grid gap-10 md:grid-cols-[1fr_23rem]">
        <div className="h-24 rounded bg-surface motion-safe:animate-pulse" />
        <div className="h-24 rounded bg-surface motion-safe:animate-pulse" />
      </div>
      <div className="mt-16 h-28 rounded bg-surface motion-safe:animate-pulse" />
    </section>
  );
}
