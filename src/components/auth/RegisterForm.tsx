"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signUp } from "@/services/auth";
import { applyReferralCode } from "@/services/referrals";
import type { UserRole } from "@/types/user";

const schema = z
  .object({
    name: z.string().min(2, "Nombre muy corto"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string(),
    role: z.enum(["CLIENT", "DRIVER"]),
    referralCode: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [referralApplied, setReferralApplied] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "CLIENT", referralCode: refCode },
  });

  const selectedRole = watch("role");

  async function onSubmit(data: FormData) {
    try {
      setError(null);
      const result = await signUp(data.email, data.password, data.name, data.role as UserRole);

      // Aplicar código de referido si existe
      if (data.referralCode?.trim() && result.user) {
        const applied = await applyReferralCode(result.user.id, data.referralCode.trim());
        setReferralApplied(applied);
      }

      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al registrarse");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Selector de rol */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setValue("role", "CLIENT")}
              className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${
                selectedRole === "CLIENT"
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Cliente
            </button>
            <button
              type="button"
              onClick={() => setValue("role", "DRIVER")}
              className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${
                selectedRole === "DRIVER"
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Mototaxista
            </button>
          </div>
          <input type="hidden" {...register("role")} />

          <div>
            <Input placeholder="Nombre completo" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Input placeholder="Email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Input placeholder="Contraseña" type="password" {...register("password")} />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <Input placeholder="Confirmar contraseña" type="password" {...register("confirmPassword")} />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Código de referido */}
          <div>
            <Input
              placeholder="Código de referido (opcional)"
              className="uppercase"
              {...register("referralCode")}
            />
            {refCode && (
              <p className="text-xs text-green-600 mt-1">
                Código aplicado: {refCode} — recibirás S/ 5.00 de saldo
              </p>
            )}
          </div>

          {selectedRole === "DRIVER" && (
            <p className="text-xs text-gray-500 bg-orange-50 border border-orange-200 rounded p-2">
              Como mototaxista deberás completar tu perfil y esperar aprobación.
            </p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <a href="/auth/login" className="text-orange-500 hover:underline">
            Inicia sesión
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
