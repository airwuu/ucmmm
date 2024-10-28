import Demo from "@/components/demo"

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-2 md:py-4">
      <div className="inline-block max-w-xl md:max-w-full text-center justify-center">
        <Demo></Demo>
      </div>
    </section>
  );
}
