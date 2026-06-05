"use client";

import { useState } from "react";
import { Tag, Wallet, CreditCard, Smartphone, Banknote, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { validateCoupon } from "@/services/coupons";
import type { PaymentMethod, CouponValidation } from "@/types/payment";

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "CASH",   label: "Efectivo", icon: <Banknote className="w-5 h-5" />,    color: "text-green-600" },
  { id: "YAPE",   label: "Yape",     icon: <Smartphone className="w-5 h-5" />,  color: "text-purple-600" },
  { id: "WALLET", label: "Saldo",    icon: <Wallet className="w-5 h-5" />,      color: "text-orange-500" },
  { id: "CARD",   label: "Tarjeta",  icon: <CreditCard className="w-5 h-5" />, color: "text-blue-600" },
];

interface PaymentSelectorProps {
  tripPrice: number;
  userId: string;
  walletBalance: number;
  onConfirm: (method: PaymentMethod, couponValidation: CouponValidation | null) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function PaymentSelector({
  tripPrice,
  userId,
  walletBalance,
  onConfirm,
  onCancel,
  loading = false,
}: PaymentSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("CASH");
  const [couponCode, setCouponCode] = useState("");
  const [couponValidation, setCouponValidation] = useState<CouponValidation | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const finalPrice = couponValidation?.valid
    ? couponValidation.finalPrice
    : tripPrice;

  async function handleValidateCoupon() {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    const result = await validateCoupon(couponCode, userId, tripPrice);
    setCouponValidation(result);
    setValidatingCoupon(false);
  }

  function handleRemoveCoupon() {
    setCouponCode("");
    setCouponValidation(null);
  }

  const isWalletInsufficient =
    selectedMethod === "WALLET" && walletBalance < finalPrice;

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-gray-800">Método de pago</p>

      {/* Métodos de pago */}
      <div className="grid grid-cols-2 gap-2">
        {PAYMENT_METHODS.map((m) => {
          const disabled = m.id === "WALLET" && walletBalance < finalPrice;
          return (
            <button
              key={m.id}
              type="button"
              disabled={disabled}
              onClick={() => setSelectedMethod(m.id)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                selectedMethod === m.id
                  ? "border-orange-500 bg-orange-50"
                  : disabled
                  ? "border-gray-100 bg-gray-50 opacity-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <span className={m.color}>{m.icon}</span>
              <span className="text-gray-700">{m.label}</span>
              {m.id === "WALLET" && (
                <span className="ml-auto text-xs text-gray-400">
                  S/ {walletBalance.toFixed(2)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cupón */}
      {!couponValidation?.valid ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> Cupón de descuento (opcional)
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Ej: BIENVENIDO10"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                if (couponValidation) setCouponValidation(null);
              }}
              className="uppercase text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleValidateCoupon}
              disabled={!couponCode.trim() || validatingCoupon}
              className="shrink-0"
            >
              {validatingCoupon ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Aplicar"
              )}
            </Button>
          </div>
          {couponValidation && !couponValidation.valid && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              {couponValidation.error}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xs font-semibold text-green-700">
                {couponCode} aplicado
              </p>
              <p className="text-xs text-green-600">
                -{couponValidation.coupon?.discount_type === "PERCENT"
                  ? `${couponValidation.coupon.discount_value}%`
                  : `S/ ${couponValidation.discount.toFixed(2)}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemoveCoupon}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Quitar
          </button>
        </div>
      )}

      {/* Resumen de precio */}
      <div className="bg-gray-50 rounded-xl p-3 space-y-1">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Precio del viaje</span>
          <span>S/ {tripPrice.toFixed(2)}</span>
        </div>
        {couponValidation?.valid && (
          <div className="flex items-center justify-between text-sm text-green-600">
            <span>Descuento</span>
            <span>-S/ {couponValidation.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex items-center justify-between font-bold text-base border-t pt-1 mt-1">
          <span>Total a pagar</span>
          <span className="text-orange-500">S/ {finalPrice.toFixed(2)}</span>
        </div>
        {selectedMethod === "WALLET" && (
          <p className="text-xs text-gray-400">
            Saldo restante: S/ {(walletBalance - finalPrice).toFixed(2)}
          </p>
        )}
      </div>

      {isWalletInsufficient && (
        <p className="text-xs text-red-500">
          Saldo insuficiente. Tu saldo es S/ {walletBalance.toFixed(2)}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Atrás
        </Button>
        <Button
          className="flex-1"
          onClick={() => onConfirm(selectedMethod, couponValidation?.valid ? couponValidation : null)}
          disabled={loading || isWalletInsufficient}
        >
          {loading ? "Procesando..." : "Confirmar pago"}
        </Button>
      </div>
    </div>
  );
}
