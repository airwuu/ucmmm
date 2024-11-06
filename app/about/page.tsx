import { title } from "@/components/primitives";

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className={title()}>About</h1>
      <p>we're working on this on the github!</p>
    </div>
  );
}
