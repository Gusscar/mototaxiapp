import { DriverProfileForm } from "@/components/conductor/DriverProfileForm";

export default function DriverProfilePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Completa tu perfil</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Necesitamos estos datos para activar tu cuenta de mototaxista
          </p>
        </div>
        <DriverProfileForm />
      </div>
    </main>
  );
}
