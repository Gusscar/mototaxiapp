"use client";

export function ImageBackground({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen w-full relative"
      style={{
        backgroundImage: "url('/bg-moto3.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Overlay degradado oscuro */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-orange-900/60" />
      {/* Contenido */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
