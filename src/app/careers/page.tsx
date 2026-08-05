import { AppNav } from "@/components/nav/app-nav";
import { MyCareersList } from "@/components/career/my-careers-list";

export const metadata = { title: "Mis carreras · FCS" };

export default function MyCareersPage() {
  return (
    <div className="pitch-bg min-h-dvh">
      <AppNav />
      <main className="container max-w-4xl py-10">
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">
          Mis <span className="text-gradient-pitch">carreras</span>
        </h1>
        <p className="mb-8 mt-3 text-muted-foreground">
          Todas tus carreras guardadas en la nube. Retómalas, hazlas públicas
          para compartirlas o compáralas con las de tus amigos.
        </p>
        <MyCareersList />
      </main>
    </div>
  );
}
