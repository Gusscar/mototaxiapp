import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ImageBackground } from "@/components/ui/ImageBackground";
import { ScaleIn, FadeIn } from "@/components/ui/PageTransition";

export default function RegisterPage() {
  return (
    <ImageBackground>
      <main className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <FadeIn className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white drop-shadow-lg tracking-tight">
              🏍️ MotoTaxi
            </h1>
            <p className="text-orange-200 mt-2 text-lg font-medium drop-shadow">
              Crea tu cuenta
            </p>
          </FadeIn>
          <ScaleIn delay={0.15}>
            <div className="backdrop-blur-md bg-white/90 rounded-2xl shadow-2xl ring-1 ring-white/20">
              <Suspense>
                <RegisterForm />
              </Suspense>
            </div>
          </ScaleIn>
        </div>
      </main>
    </ImageBackground>
  );
}
