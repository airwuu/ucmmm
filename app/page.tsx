import Demo from "@/components/demo"
import Cards from "@/components/cards"
import { Suspense } from "react";

export default function Home() {
  return (
    // <Demo></Demo>
    <Suspense fallback={<div>Loading...</div>}>
      <Cards></Cards>
    </Suspense>
  );
}
