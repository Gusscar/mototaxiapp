import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500">MotoTaxi</h1>
          <p className="text-muted-foreground mt-2">
            Tu mototaxi en minutos
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
