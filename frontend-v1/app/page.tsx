import Snap from "@/components/snap"
import { Suspense } from "react";

export default function Home() {
  return (
    <section className="h-full flex flex-col items-center justify-center gap-4 py-2 md:py-4">
      <div className="h-full inline-block max-w-xl md:max-w-full text-center justify-center">
        <Suspense fallback={<div>Loading...</div>}>
          <Snap/>
        </Suspense>
      </div>
    </section>
  );
}
