"use client";

import { useMemo, useState } from "react";

type Inputs = {
  monthlyRevenue: string;
  variableCosts: string;
  fixedCosts: string;
  laborCosts: string;
  repayments: string;
  cash: string;
};

const parseAmount = (value: string): number => {
  const numeric = value.replace(/[^\d]/g, "");
  return numeric === "" ? 0 : Number(numeric);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("ja-JP").format(Math.round(value));
};

const formatYen = (value: number): string => {
  return `${formatNumber(value)}円`;
};

export default function Home() {
  const [inputs, setInputs] = useState<Inputs>({
    monthlyRevenue: "700000",
    variableCosts: "300000",
    fixedCosts: "400000",
    laborCosts: "200000",
    repayments: "150000",
    cash: "700000",
  });

  const updateInput = (key: keyof Inputs, value: string) => {
    const numericOnly = value.replace(/[^\d]/g, "");
    setInputs((prev) => ({
      ...prev,
      [key]: numericOnly,
    }));
  };

  const stats = useMemo(() => {
    const monthlyRevenue = parseAmount(inputs.monthlyRevenue);
    const variableCosts = parseAmount(inputs.variableCosts);
    const fixedCosts = parseAmount(inputs.fixedCosts);
    const laborCosts = parseAmount(inputs.laborCosts);
    const repayments = parseAmount(inputs.repayments);
    const cash = parseAmount(inputs.cash);

    const grossProfit = monthlyRevenue - variableCosts;
    const grossProfitMargin =
      monthlyRevenue > 0 ? (grossProfit / monthlyRevenue) * 100 : null;

    const laborDistributionRatio =
      laborCosts > 0 && grossProfit > 0
        ? (laborCosts / grossProfit) * 100
        : null;

    const monthlyCashDecrease = fixedCosts + repayments - grossProfit;
    const shortfallGrossProfit = Math.max(0, monthlyCashDecrease);
    const isTargetAchieved = monthlyCashDecrease <= 0;

    const remainingDays =
      monthlyCashDecrease > 0
        ? Math.floor((cash / monthlyCashDecrease) * 30)
        : Infinity;

    return {
      monthlyRevenue,
      variableCosts,
      fixedCosts,
      repayments,
      laborCosts,
      cash,
      grossProfit,
      grossProfitMargin,
      laborDistributionRatio,
      monthlyCashDecrease,
      shortfallGrossProfit,
      isTargetAchieved,
      remainingDays,
    };
  }, [inputs]);

  const advisor = useMemo(() => {
    if (stats.repayments > stats.grossProfit * 0.5) {
      return {
        cause: "返済負担が重い",
        dos: ["金融機関への相談準備", "資金繰り表の作成", "不要支出の洗い出し"],
        dont: "安易な追加借入",
      };
    }

    if (stats.fixedCosts > stats.monthlyRevenue * 0.4) {
      return {
        cause: "固定費が重い",
        dos: ["固定費の内訳確認", "人件費以外の経費確認", "外注費・家賃等の見直し"],
        dont: "新規の設備投資",
      };
    }

    if (
      stats.monthlyRevenue > 0 &&
      stats.grossProfit / stats.monthlyRevenue < 0.25
    ) {
      return {
        cause: "粗利率が低い",
        dos: ["原価の見直し", "売価の適正化", "低利益商品の整理"],
        dont: "薄利多売の拡大",
      };
    }

    return {
      cause: "粗利不足",
      dos: ["固定費の削減", "売価の適正化", "仕入原価の見直し"],
      dont: "安易な借入の追加",
    };
  }, [stats]);

  const daysColor =
    stats.monthlyCashDecrease <= 0
      ? "bg-green-500 text-white"
      : stats.remainingDays < 60
        ? "bg-red-500 text-white"
        : stats.remainingDays < 120
          ? "bg-orange-500 text-white"
          : stats.remainingDays < 180
            ? "bg-yellow-400 text-black"
            : "bg-green-500 text-white";

  const fields: {
    key: keyof Inputs;
    label: string;
  }[] = [
    { key: "monthlyRevenue", label: "月商" },
    { key: "variableCosts", label: "変動費" },
    { key: "fixedCosts", label: "固定費" },
    { key: "laborCosts", label: "うち人件費（任意）" },
    { key: "repayments", label: "返済額" },
    { key: "cash", label: "現預金" },
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 text-gray-900" translate="no">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-bold">資金余力かんたん診断</h1>
          <p className="mt-1 text-sm text-gray-500">
            今の資金余力と、次に確認すべきことを見える化します v1.0.4
          </p>
        </header>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 border-l-4 border-blue-600 pl-3 text-lg font-bold">
            状況の入力
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-xs font-bold text-gray-500">
                  {field.label}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-gray-400">
                    ¥
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={
                      inputs[field.key] === ""
                        ? ""
                        : formatNumber(parseAmount(inputs[field.key]))
                    }
                    onChange={(e) => updateInput(field.key, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-8 py-2 text-right font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={`rounded-2xl p-6 text-center shadow ${daysColor}`}>
          <p className="text-sm font-bold">残り資金日数</p>
          <div className="mt-2 text-5xl font-black tabular-nums whitespace-nowrap" translate="no">
            {stats.monthlyCashDecrease <= 0
              ? "∞日"
              : `${stats.remainingDays}日`}
          </div>

          {stats.monthlyCashDecrease > 0 && (
            <div className="mt-4 rounded-lg bg-black/10 p-3 text-xs font-bold">
              <p>残り資金日数 = 現預金 ÷ 月間キャッシュ減少額 × 30</p>
              <p className="mt-1 font-mono">
                {formatYen(stats.cash)} ÷ {formatYen(stats.monthlyCashDecrease)} ×
                30 = {stats.remainingDays}日
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-gray-500">現状粗利益（月）</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-2xl font-black">
                  {formatYen(stats.grossProfit)}
                </p>
                <span className="rounded bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                  粗利率：
                  {stats.grossProfitMargin === null
                    ? "-"
                    : `${stats.grossProfitMargin.toFixed(1)}%`}
                </span>
                {stats.laborDistributionRatio !== null && (
                  <span className="rounded bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">
                    労働分配率：{stats.laborDistributionRatio.toFixed(1)}%
                  </span>
                )}
              </div>

              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                <p>現状粗利益（月）= 月商 − 変動費</p>
                <p className="font-mono font-bold">
                  {formatYen(stats.monthlyRevenue)} −{" "}
                  {formatYen(stats.variableCosts)} ={" "}
                  {formatYen(stats.grossProfit)}
                </p>

                {stats.laborDistributionRatio !== null && (
                  <div className="mt-2 border-t pt-2">
                    <p>労働分配率 = うち人件費 ÷ 現状粗利益 × 100</p>
                    <p className="font-mono font-bold">
                      {formatYen(stats.laborCosts)} ÷{" "}
                      {formatYen(stats.grossProfit)} × 100 ={" "}
                      {stats.laborDistributionRatio.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-5">
              <p className="text-xs font-bold text-gray-500">不足粗利益（月）</p>
              <p
                className={`mt-1 text-2xl font-black ${
                  stats.isTargetAchieved ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatYen(stats.shortfallGrossProfit)}
                {stats.isTargetAchieved && (
                  <span className="ml-2 text-sm">返済ライン達成</span>
                )}
              </p>

              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                <p>不足粗利益（月）= 固定費 + 返済額 − 現状粗利益</p>
                <p className="font-mono font-bold">
                  {formatYen(stats.fixedCosts)} + {formatYen(stats.repayments)} −{" "}
                  {formatYen(stats.grossProfit)} ={" "}
                  {formatYen(stats.monthlyCashDecrease)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-slate-900 p-5 text-white shadow-lg">
          <h2 className="border-b border-slate-700 pb-3 text-lg font-bold">
            <span className="italic text-blue-400">Advisor</span> AI参謀の判断
          </h2>

          <div className="mt-4">
            <p className="text-xs text-slate-400">主原因</p>
            <p className="text-xl font-black text-blue-300">{advisor.cause}</p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-bold text-green-400">
                今月やるべき3つ
              </p>
              <ul className="space-y-2">
                {advisor.dos.map((item, index) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-3 text-sm font-bold text-red-400">
                やらないこと1つ
              </p>
              <div className="rounded-lg border border-red-800 bg-red-950/30 p-3 text-sm">
                ✕ {advisor.dont}
              </div>
            </div>
          </div>
        </section>

        <footer className="pb-6 text-center text-xs text-gray-400">
          © 資金余力かんたん診断 MVP Prototype
        </footer>
      </div>
    </main>
  );
}
