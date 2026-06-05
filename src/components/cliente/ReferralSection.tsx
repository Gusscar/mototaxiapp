"use client";

import { useState } from "react";
import { Share2, Copy, CheckCheck, Gift, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReferralSectionProps {
  referralCode: string;
  totalReferrals: number;
  totalEarned: number;
  walletBalance: number;
}

export function ReferralSection({
  referralCode,
  totalReferrals,
  totalEarned,
  walletBalance,
}: ReferralSectionProps) {
  const [copied, setCopied] = useState(false);

  const referralUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/register?ref=${referralCode}`
      : `/auth/register?ref=${referralCode}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({
        title: "MotoTaxi",
        text: `¡Únete a MotoTaxi y recibe S/ 5.00 de saldo! Usa mi código: ${referralCode}`,
        url: referralUrl,
      });
    } else {
      handleCopy();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Gift className="w-4 h-4 text-orange-500" />
          Referidos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-orange-50 rounded-xl p-3">
            <p className="text-xl font-bold text-orange-500">S/ {walletBalance.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Saldo</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xl font-bold text-gray-700">{totalReferrals}</p>
            <p className="text-xs text-gray-500 mt-0.5">Referidos</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-xl font-bold text-green-600">S/ {totalEarned.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Ganado</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-sm">
          <p className="font-medium text-orange-700">¿Cómo funciona?</p>
          <p className="text-orange-600 text-xs mt-1">
            Comparte tu código. Cuando alguien se registre con él, <strong>ambos reciben S/ 5.00</strong> de saldo para usar en viajes.
          </p>
        </div>

        {/* Código */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">Tu código de referido</p>
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl border p-3">
            <span className="font-mono font-bold text-gray-800 tracking-widest flex-1 text-lg">
              {referralCode}
            </span>
            <button
              onClick={handleCopy}
              className="text-gray-400 hover:text-orange-500 transition-colors"
              title="Copiar"
            >
              {copied ? (
                <CheckCheck className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <Button className="w-full" onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-2" />
          Compartir enlace
        </Button>
      </CardContent>
    </Card>
  );
}
