"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Payment = {
  id: string;
  bookingId?: string;
  passengerId?: string;
  operatorId?: string;
  tripId?: string;
  amount?: number;
  method?: string;
  status?: string;
  createdAt?: any;
};

export default function RevenuePage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPayments() {
      try {
        const paymentsQuery = query(
          collection(db, "payments"),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(paymentsQuery);

        if (cancelled) return;

        const loadedPayments = snapshot.docs.map(
          (paymentDoc) => ({
            id: paymentDoc.id,
            ...paymentDoc.data(),
          })
        ) as Payment[];

        setPayments(loadedPayments);
      } catch (error) {
        console.error(
          "REVENUE LOAD ERROR:",
          error
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPayments();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const successful = payments.filter(
      (payment) => payment.status === "paid"
    );

    const totalRevenue = successful.reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0
    );

    const transactionCount = successful.length;

    const averageTransaction =
      transactionCount > 0
        ? totalRevenue / transactionCount
        : 0;

    const mtn = successful
      .filter(
        (payment) => payment.method === "mtn"
      )
      .reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      );

    const orange = successful
      .filter(
        (payment) => payment.method === "orange"
      )
      .reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      );

    const card = successful
      .filter(
        (payment) => payment.method === "card"
      )
      .reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      );

    return {
      totalRevenue,
      transactionCount,
      averageTransaction,
      mtn,
      orange,
      card,
    };
  }, [payments]);

  const formatAmount = (amount: number) =>
    amount.toLocaleString("en-US");

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "—";

    try {
      const date = timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

      if (Number.isNaN(date.getTime())) {
        return "—";
      }

      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const formatMethod = (method?: string) => {
    switch (method) {
      case "mtn":
        return "MTN Mobile Money";
      case "orange":
        return "Orange Money";
      case "card":
        return "Bank Card";
      default:
        return method || "—";
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      {/* HEADER */}
      <div className="mb-7">
        <h1 className="text-3xl font-black text-[#0B1F3A]">
          Revenue
        </h1>

        <p className="mt-1 text-sm text-[#7B8794]">
          Track payment activity and booking revenue.
        </p>
      </div>

      {/* MAIN STATS */}
      <div className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-3">
        <RevenueCard
          label="Total revenue"
          value={`${formatAmount(
            stats.totalRevenue
          )} FCFA`}
          highlight
        />

        <RevenueCard
          label="Successful payments"
          value={stats.transactionCount}
        />

        <RevenueCard
          label="Average booking"
          value={`${formatAmount(
            Math.round(
              stats.averageTransaction
            )
          )} FCFA`}
        />
      </div>

      {/* PAYMENT METHODS */}
      <div className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-3">
        <MethodCard
          label="MTN Mobile Money"
          amount={stats.mtn}
          total={stats.totalRevenue}
          icon="M"
        />

        <MethodCard
          label="Orange Money"
          amount={stats.orange}
          total={stats.totalRevenue}
          icon="O"
        />

        <MethodCard
          label="Bank Card"
          amount={stats.card}
          total={stats.totalRevenue}
          icon="C"
        />
      </div>

      {/* TRANSACTIONS */}
      <div className="overflow-hidden rounded-3xl border border-[#E7EBF0] bg-white shadow-sm">
        <div className="border-b border-[#EEF1F4] px-6 py-5">
          <h2 className="text-lg font-black text-[#0B1F3A]">
            Payment transactions
          </h2>

          <p className="mt-1 text-xs text-[#8A96A6]">
            Revenue is based on payment records from
            passenger bookings.
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-[#8A96A6]">
            Loading revenue...
          </div>
        ) : payments.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF5FC] text-2xl">
              💰
            </div>

            <h3 className="font-bold text-[#0B1F3A]">
              No payments yet
            </h3>

            <p className="mt-1 text-sm text-[#8A96A6]">
              Successful passenger payments will appear
              here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-[#FAFBFC] text-left text-[11px] font-black uppercase tracking-wider text-[#8A96A6]">
                  <th className="px-6 py-4">
                    Payment
                  </th>

                  <th className="px-6 py-4">
                    Booking
                  </th>

                  <th className="px-6 py-4">
                    Method
                  </th>

                  <th className="px-6 py-4">
                    Amount
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-t border-[#EEF1F4]"
                  >
                    <td className="px-6 py-5">
                      <p className="max-w-[170px] truncate font-bold text-[#26364A]">
                        {payment.id}
                      </p>

                      <p className="mt-1 text-[10px] text-[#8A96A6]">
                        Transaction
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="max-w-[170px] truncate font-semibold text-[#526173]">
                        {payment.bookingId || "—"}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-semibold text-[#26364A]">
                        {formatMethod(
                          payment.method
                        )}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-black text-[#0B1F3A]">
                        {formatAmount(
                          Number(payment.amount || 0)
                        )}{" "}
                        FCFA
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                          payment.status === "paid"
                            ? "bg-[#EAF8F0] text-[#1E9B55]"
                            : "bg-[#FFF4E5] text-[#C77A00]"
                        }`}
                      >
                        {payment.status || "pending"}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm font-semibold text-[#6F7C8C]">
                      {formatDate(
                        payment.createdAt
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function RevenueCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm ${
        highlight
          ? "border-[#1976D2] bg-[#0B1F3A]"
          : "border-[#E7EBF0] bg-white"
      }`}
    >
      <p
        className={`text-xs font-bold ${
          highlight
            ? "text-[#9DB3CB]"
            : "text-[#8A96A6]"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-black ${
          highlight
            ? "text-white"
            : "text-[#0B1F3A]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MethodCard({
  label,
  amount,
  total,
  icon,
}: {
  label: string;
  amount: number;
  total: number;
  icon: string;
}) {
  const percentage =
    total > 0
      ? Math.round((amount / total) * 100)
      : 0;

  return (
    <div className="rounded-3xl border border-[#E7EBF0] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF5FC] font-black text-[#1976D2]">
          {icon}
        </div>

        <div>
          <p className="text-sm font-bold text-[#26364A]">
            {label}
          </p>

          <p className="mt-1 text-xs text-[#8A96A6]">
            {percentage}% of revenue
          </p>
        </div>
      </div>

      <p className="mt-5 text-xl font-black text-[#0B1F3A]">
        {amount.toLocaleString("en-US")} FCFA
      </p>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#EEF1F4]">
        <div
          className="h-full rounded-full bg-[#1976D2]"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}