import { NewCareerForm } from "@/components/career/new-career-form";
import { AppNav } from "@/components/nav/app-nav";
import { NATIONALITY_OPTIONS } from "@/lib/data/nationalities";

export const metadata = { title: "Nueva carrera · FCS" };

export default function NewCareerPage() {
  return (
    <div className="pitch-bg min-h-dvh">
      <AppNav />
      <main className="container max-w-3xl py-10">
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">
          Crea tu <span className="text-gradient-pitch">futbolista</span>
        </h1>
        <p className="mb-8 mt-3 text-muted-foreground">
          Tres pasos y a jugar. El club de debut lo decide el sorteo, no tú.
        </p>
        <NewCareerForm countries={NATIONALITY_OPTIONS} />
      </main>
    </div>
  );
}
