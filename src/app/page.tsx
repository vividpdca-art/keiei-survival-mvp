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

  const [promiseMethod, setPromiseMethod] = useState<string>("");
  const [promiseAction, setPromiseAction] = useState<string>("");
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);

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
    // 1. 最優先：粗利益不足
    if (stats.grossProfit < stats.fixedCosts + stats.repayments) {
      return {
        cause: "粗利益不足",
        options: [
          { label: "売上を増やす", tag: "本命", desc: "不足分を売上・粗利で埋める" },
          { label: "固定費を下げる", tag: "現実的", desc: "今月止められる支出を探す" },
          { label: "返済条件を相談する", tag: "緊急時", desc: "資金繰りが厳しい時の相談準備" },
        ],
        dont: "根拠のない追加借入",
      };
    }

    // 2. 返済負担が重い
    if (stats.repayments > stats.grossProfit * 0.3) {
      return {
        cause: "返済負担が重い",
        options: [
          { label: "返済条件を相談する", tag: "本命", desc: "資金繰りが厳しい時の相談準備" },
          { label: "固定費を下げる", tag: "補助", desc: "今月止められる支出を探す" },
          { label: "売上を増やす", tag: "中長期", desc: "不足分を売上・粗利で埋める" },
        ],
        dont: "個人資金で場当たり的に補填する",
      };
    }

    // 3. 固定費が重い
    if (stats.fixedCosts > stats.monthlyRevenue * 0.4) {
      return {
        cause: "固定費が重い",
        options: [
          { label: "固定費を下げる", tag: "本命", desc: "今月止められる支出を探す" },
          { label: "売上を増やす", tag: "補助", desc: "不足分を売上・粗利で埋める" },
          { label: "返済条件を相談する", tag: "緊急時", desc: "資金繰りが厳しい時の相談準備" },
        ],
        dont: "新規の設備投資",
      };
    }

    // 4. 粗利率が低い
    if (
      stats.monthlyRevenue > 0 &&
      stats.grossProfit / stats.monthlyRevenue < 0.25
    ) {
      return {
        cause: "粗利率が低い",
        options: [
          { label: "売上を増やす", tag: "注意", desc: "不足分を売上・粗利で埋める" },
          { label: "固定費を下げる", tag: "補助", desc: "今月止められる支出を探す" },
          { label: "返済条件を相談する", tag: "緊急時", desc: "資金繰りが厳しい時の相談準備" },
        ],
        dont: "薄利のまま売上だけ増やす",
      };
    }

    // 5. 安定
    return {
      cause: "返済ラインは達成",
      options: [
        { label: "売上を増やす", tag: "成長", desc: "不足分を売上・粗利で埋める" },
        { label: "固定費を下げる", tag: "維持", desc: "今月止められる支出を探す" },
        { label: "返済条件を相談する", tag: "不要", desc: "資金繰りが厳しい時の相談準備" },
      ],
      dont: "余裕が出た直後の大きな支出",
    };
  }, [stats]);

  const simulationStats = useMemo(() => {
    let simulatedGrossProfit = stats.grossProfit;
    let simulatedFixedCosts = stats.fixedCosts;
    let simulatedRepayments = stats.repayments;

    if (selectedActionIds.includes("sales")) {
      simulatedGrossProfit *= 1.1;
    }
    if (selectedActionIds.includes("fixed")) {
      simulatedFixedCosts *= 0.9;
    }
    if (selectedActionIds.includes("repayment")) {
      simulatedRepayments *= 0.5;
    }

    const simulatedMonthlyCashDecrease =
      simulatedFixedCosts + simulatedRepayments - simulatedGrossProfit;
    const simulatedShortfallGrossProfit = Math.max(0, simulatedMonthlyCashDecrease);
    const simulatedRemainingDays =
      simulatedMonthlyCashDecrease > 0
        ? Math.floor((stats.cash / simulatedMonthlyCashDecrease) * 30)
        : Infinity;

    return {
      monthlyCashDecrease: simulatedMonthlyCashDecrease,
      shortfallGrossProfit: simulatedShortfallGrossProfit,
      remainingDays: simulatedRemainingDays,
    };
  }, [stats, selectedActionIds]);

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
            今の資金余力と、次に確認すべきことを見える化します v1.0.10
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

              {!stats.isTargetAchieved && stats.shortfallGrossProfit > 0 && (
                <div className="mt-4 rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <p className="text-xs font-bold text-gray-700 mb-3">
                    不足をどう埋めるか？（目安）
                  </p>
                  <ul className="space-y-3 text-sm">
                    <li className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-blue-600">① 売上を増やす</span>
                      <p className="text-gray-700">
                        {stats.grossProfitMargin && stats.grossProfitMargin > 0 ? (
                          <>
                            粗利率{stats.grossProfitMargin.toFixed(1)}%なら、
                            必要売上は約<span className="font-bold">{formatYen(Math.ceil(stats.shortfallGrossProfit / (stats.grossProfitMargin / 100)))}</span>
                            <br />
                            <span className="text-[10px] text-gray-500">※値上げ・原価見直しで粗利率を上げる方法もあります</span>
                          </>
                        ) : (
                          "計算不可"
                        )}
                      </p>
                    </li>
                    <li className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-indigo-600">② 固定費を下げる</span>
                      <p className="text-gray-700">
                        固定費を<span className="font-bold">{formatYen(stats.shortfallGrossProfit)}</span>下げれば返済ライン達成
                      </p>
                    </li>
                    <li className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-purple-600">③ 返済条件を相談する</span>
                      <p className="text-gray-700">
                        返済額を<span className="font-bold">{formatYen(stats.shortfallGrossProfit)}</span>軽くできれば返済ライン達成の可能性
                      </p>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-slate-900 p-5 text-white shadow-lg">
          <h2 className="border-b border-slate-700 pb-3 text-lg font-bold">
            <span className="italic text-blue-400">Advisor</span> 次に決めること
          </h2>

          <div className="mt-4">
            <p className="text-xs text-slate-400">今の詰まりどころ</p>
            <p className="text-xl font-black text-blue-300">{advisor.cause}</p>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-bold text-green-400">
              まず、どれで埋めますか？
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {advisor.options.map((opt) => (
                <div key={opt.label} className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{opt.label}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      opt.tag === "本命" ? "bg-red-500 text-white" : 
                      opt.tag === "現実的" ? "bg-blue-500 text-white" :
                      opt.tag === "緊急時" ? "bg-orange-500 text-white" :
                      "bg-slate-600 text-slate-200"
                    }`}>
                      {opt.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-bold text-red-400">
                今月やらないこと
              </p>
              <div className="rounded-lg border border-red-800 bg-red-950/30 p-3 text-sm">
                ✕ {advisor.dont}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-bold text-slate-400">
                次回確認すること
              </p>
              <ul className="space-y-1 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-slate-500"></span>
                  実際に不足額が減ったか
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-slate-500"></span>
                  残り資金日数が伸びたか
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-slate-500"></span>
                  選んだ打ち手を実行できたか
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-1 border-l-4 border-orange-500 pl-3 text-lg font-bold">
            次の一手を試す
          </h2>
          <p className="mb-4 text-xs text-gray-500">
            打ち手を組み合わせた時の改善効果をシミュレーションします（最大2つまで）
          </p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              { id: "sales", label: "売上を増やす", desc: "売上10%アップ分の粗利益だけ改善" },
              { id: "fixed", label: "固定費を下げる", desc: "固定費10%ダウン" },
              { id: "repayment", label: "返済条件を相談する", desc: "返済額50%ダウン" },
            ].map((action) => {
              const isSelected = selectedActionIds.includes(action.id);
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedActionIds(selectedActionIds.filter((id) => id !== action.id));
                    } else if (selectedActionIds.length < 2) {
                      setSelectedActionIds([...selectedActionIds, action.id]);
                    }
                  }}
                  className={`relative flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span className={`text-sm font-bold ${isSelected ? "text-orange-700" : "text-gray-700"}`}>
                    {action.label}
                  </span>
                  <span className="mt-1 text-[10px] text-gray-500">{action.desc}</span>
                  {isSelected && (
                    <span className="absolute right-2 top-2 rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      選択中
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl bg-gray-900 p-5 text-white">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="text-center md:border-r md:border-gray-700">
                <p className="text-[10px] text-gray-400">改善後の月間収支</p>
                <p className={`text-xl font-black ${simulationStats.monthlyCashDecrease <= 0 ? "text-green-400" : "text-red-400"}`}>
                  {simulationStats.monthlyCashDecrease <= 0 ? "+" : "▲"}
                  {formatYen(Math.abs(simulationStats.monthlyCashDecrease))}
                </p>
              </div>
              <div className="text-center md:border-r md:border-gray-700">
                <p className="text-[10px] text-gray-400">改善後の不足粗利益</p>
                <p className="text-xl font-black text-white">
                  {formatYen(simulationStats.shortfallGrossProfit)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400">改善後の残り資金日数</p>
                <p className="text-xl font-black text-orange-400">
                  {simulationStats.remainingDays === Infinity ? "∞" : simulationStats.remainingDays}日
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-700 pt-4 text-center">
              {selectedActionIds.length === 0 ? (
                <p className="text-sm text-gray-400 italic">上のブロックを選んでシミュレーションを開始してください</p>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    {simulationStats.remainingDays >= 90 ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold">✓</span>
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold">!</span>
                    )}
                    <p className="text-sm font-bold">
                      {simulationStats.remainingDays >= 90 
                        ? "90日以上の資金余力を確保できそうです！" 
                        : "まだ90日に届きません。他の組み合わせも検討しましょう。"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-1 border-l-4 border-green-600 pl-3 text-lg font-bold">
            今月の約束
          </h2>
          <p className="mb-4 text-xs text-gray-500">
            今月、まず1つだけ実行することを決めましょう。
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {[
                { id: "売上を増やす", label: "売上を増やす" },
                { id: "固定費を下げる", label: "固定費を下げる" },
                { id: "返済条件を相談する", label: "返済条件を相談する" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPromiseMethod(m.id)}
                  className={`rounded-lg border p-3 text-center text-sm font-bold transition-all ${
                    promiseMethod === m.id
                      ? "border-green-600 bg-green-50 text-green-700 ring-2 ring-green-200"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-500">
                具体的にやること
              </label>
              <input
                type="text"
                value={promiseAction}
                onChange={(e) => setPromiseAction(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                placeholder={
                  promiseMethod === "売上を増やす"
                    ? "どの商品・サービスで売上を作るか（例：単価の高いメニューを優先提案する）"
                    : promiseMethod === "固定費を下げる"
                      ? "何のコストを削減するか（例：外注費を1社見直す／家賃交渉の相談をする）"
                      : promiseMethod === "返済条件を相談する"
                        ? "どこに・何を相談するか（例：金融機関に返済条件の相談日を決める）"
                        : "まず上の戦略を選んでください"
                }
              />
            </div>

            {(promiseMethod || promiseAction) && (
              <div className="rounded-xl border border-green-100 bg-green-50/50 p-4 text-sm">
                <p className="font-bold text-green-800">今月の約束：</p>
                <p className="mt-1 text-green-700 leading-relaxed">
                  {promiseMethod ? `「${promiseMethod}」ために、` : ""}
                  {promiseAction || "（具体的な行動を入力してください）"}
                </p>
              </div>
            )}
          </div>
        </section>

        <footer className="pb-6 text-center text-xs text-gray-400">
          © 資金余力かんたん診断 MVP Prototype
        </footer>
      </div>
    </main>
  );
}
