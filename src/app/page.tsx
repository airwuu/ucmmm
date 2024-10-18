import Demo from "./components/demo"
export const runtime = "edge";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-items-center min-h-screen font-[family-name:var(--font-geist-sans)] ">
      <Demo/>
    </div>
  );
}
