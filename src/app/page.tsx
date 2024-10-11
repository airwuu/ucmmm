import Image from "next/image";
export const runtime = "edge";
export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <form action="/api" method="POST">
        <input type="text" name="name" id=""></input>
        <input type="text" name="email" id=""></input>
        <input type="submit" value="submit"></input>
      </form>
    </div>
  );
}