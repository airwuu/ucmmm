import Cards from "@/components/cards"
import { Suspense } from "react";

export default function Home() {
  return (
    <section className="h-full flex flex-col items-center justify-center gap-4 py-2 md:py-4">
      <div className="h-full inline-block max-w-xl md:max-w-full text-center justify-center">
        <Suspense fallback={<div>Loading...</div>}>
          <div className="flex snap-mandatory snap-x overflow-x-auto w-full px-36 gap-3 py-2 overflow-y-auto">
            <Cards name="Pavilion" location="pav"/>
            <Cards name="Dining Center" location="dc"/>
          </div>
        </Suspense> 
      </div>
    </section>
  );
}
