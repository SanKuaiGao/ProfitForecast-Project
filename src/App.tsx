import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type MonthlyEntry = {
  id: string;
  month: string;
  amount: number;
};

type DailyEntry = {
  id: string;
  date: string;
  amount: number;
};

type RegressionResult = {
  slope: number;
  intercept: number;
  r2: number;
};

const revenueSeed: MonthlyEntry[] = [
  { id: 'r1', month: '2025-10', amount: 120000 },
  { id: 'r2', month: '2025-11', amount: 128000 },
  { id: 'r3', month: '2025-12', amount: 137000 },
  { id: 'r4', month: '2026-01', amount: 145000 },
  { id: 'r5', month: '2026-02', amount: 151000 },
  { id: 'r6', month: '2026-03', amount: 159000 },
];

const costSeed: MonthlyEntry[] = [
  { id: 'c1', month: '2025-10', amount: 76000 },
  { id: 'c2', month: '2025-11', amount: 79000 },
  { id: 'c3', month: '2025-12', amount: 81500 },
  { id: 'c4', month: '2026-01', amount: 84200 },
  { id: 'c5', month: '2026-02', amount: 86000 },
  { id: 'c6', month: '2026-03', amount: 89100 },
];

const dailyProfitSeed: DailyEntry[] = [
  { id: 'dp1', date: '2026-03-01', amount: 1620 },
  { id: 'dp2', date: '2026-03-02', amount: 1840 },
  { id: 'dp3', date: '2026-03-03', amount: 1710 },
  { id: 'dp4', date: '2026-03-04', amount: 1935 },
  { id: 'dp5', date: '2026-03-05', amount: 2070 },
  { id: 'dp6', date: '2026-03-06', amount: 1980 },
  { id: 'dp7', date: '2026-03-07', amount: 2210 },
  { id: 'dp8', date: '2026-03-08', amount: 2140 },
  { id: 'dp9', date: '2026-03-09', amount: 2290 },
  { id: 'dp10', date: '2026-03-10', amount: 2350 },
  { id: 'dp11', date: '2026-03-11', amount: 2405 },
  { id: 'dp12', date: '2026-03-12', amount: 2480 },
];

const dailyCostSeed: DailyEntry[] = [
  { id: 'dc1', date: '2026-03-01', amount: 860 },
  { id: 'dc2', date: '2026-03-02', amount: 910 },
  { id: 'dc3', date: '2026-03-03', amount: 890 },
  { id: 'dc4', date: '2026-03-04', amount: 935 },
  { id: 'dc5', date: '2026-03-05', amount: 980 },
  { id: 'dc6', date: '2026-03-06', amount: 955 },
  { id: 'dc7', date: '2026-03-07', amount: 1025 },
  { id: 'dc8', date: '2026-03-08', amount: 1010 },
  { id: 'dc9', date: '2026-03-09', amount: 1060 },
  { id: 'dc10', date: '2026-03-10', amount: 1095 },
  { id: 'dc11', date: '2026-03-11', amount: 1110 },
  { id: 'dc12', date: '2026-03-12', amount: 1140 },
];

const STORAGE_KEYS = {
  companyName: 'profit-forecast-company-name',
  dailyProfit: 'profit-forecast-daily-profit',
  dailyCost: 'profit-forecast-daily-cost',
  revenue: 'profit-forecast-revenue',
  cost: 'profit-forecast-cost',
};

const PAGE_SIZE = 6;

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function monthLabel(month: string) {
  if (!month) return '';
  const [year, mon] = month.split('-');
  return `${year.slice(2)}.${mon}`;
}

function dayLabel(dateText: string) {
  if (!dateText) return '';
  const [, month, day] = dateText.split('-');
  return `${month}.${day}`;
}

function nextMonth(month: string) {
  const [year, mon] = month.split('-').map(Number);
  const date = new Date(year, mon - 1, 1);
  date.setMonth(date.getMonth() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function nextDay(dateText: string) {
  const [year, month, day] = dateText.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + 1);
  const nextYear = date.getFullYear();
  const nextMonthValue = String(date.getMonth() + 1).padStart(2, '0');
  const nextDayValue = String(date.getDate()).padStart(2, '0');

  return `${nextYear}-${nextMonthValue}-${nextDayValue}`;
}

function sortMonthlyEntries(entries: MonthlyEntry[]) {
  return [...entries].sort((a, b) => a.month.localeCompare(b.month));
}

function sortDailyEntries(entries: DailyEntry[]) {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

function fitLinearRegression(values: number[]): RegressionResult {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0, r2: 0 };

  const xs = values.map((_, index) => index + 1);
  const xMean = xs.reduce((sum, x) => sum + x, 0) / n;
  const yMean = values.reduce((sum, y) => sum + y, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i += 1) {
    numerator += (xs[i] - xMean) * (values[i] - yMean);
    denominator += (xs[i] - xMean) ** 2;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;

  const ssTotal = values.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
  const ssResidual = values.reduce((sum, y, index) => {
    const predicted = intercept + slope * xs[index];
    return sum + (y - predicted) ** 2;
  }, 0);

  return {
    slope,
    intercept,
    r2: ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal,
  };
}

function usePaginatedList<T>(items: T[], initialPage = 1) {
  const [page, setPage] = useState(initialPage);
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  return { page, setPage, pageCount, paginated };
}

function AppShell({
  companyName,
  setCompanyName,
  dailyProfit,
  setDailyProfit,
  dailyCost,
  setDailyCost,
  revenue,
  setRevenue,
  cost,
  setCost,
}: {
  companyName: string;
  setCompanyName: Dispatch<SetStateAction<string>>;
  dailyProfit: DailyEntry[];
  setDailyProfit: Dispatch<SetStateAction<DailyEntry[]>>;
  dailyCost: DailyEntry[];
  setDailyCost: Dispatch<SetStateAction<DailyEntry[]>>;
  revenue: MonthlyEntry[];
  setRevenue: Dispatch<SetStateAction<MonthlyEntry[]>>;
  cost: MonthlyEntry[];
  setCost: Dispatch<SetStateAction<MonthlyEntry[]>>;
}) {
  const monthlyProfit = useMemo(() => {
    const revenueMap = new Map(revenue.map((item) => [item.month, item.amount]));
    const costMap = new Map(cost.map((item) => [item.month, item.amount]));
    const months = Array.from(new Set([...revenueMap.keys(), ...costMap.keys()])).sort();

    return months.map((month) => {
      const revenueValue = revenueMap.get(month) ?? 0;
      const costValue = costMap.get(month) ?? 0;
      return {
        month,
        revenue: revenueValue,
        cost: costValue,
        profit: revenueValue - costValue,
      };
    });
  }, [cost, revenue]);

  const dailyRegression = useMemo(
    () => fitLinearRegression(dailyProfit.map((item) => item.amount)),
    [dailyProfit],
  );
  const monthlyRegression = useMemo(
    () => fitLinearRegression(monthlyProfit.map((item) => item.profit)),
    [monthlyProfit],
  );

  const dailyForecastData = useMemo(() => {
    if (dailyProfit.length === 0) return [] as { date: string; profit: number | null; forecastProfit: number | null }[];

    const lastDate = dailyProfit[dailyProfit.length - 1].date;
    const future = Array.from({ length: 7 }, (_, index) => {
      let forecastDate = lastDate;
      for (let i = 0; i <= index; i += 1) forecastDate = nextDay(forecastDate);
      const x = dailyProfit.length + index + 1;
      return {
        date: forecastDate,
        profit: null,
        forecastProfit: Math.round(dailyRegression.intercept + dailyRegression.slope * x),
      };
    });

    return [
      ...dailyProfit.map((item) => ({ date: item.date, profit: item.amount, forecastProfit: null })),
      ...future,
    ];
  }, [dailyProfit, dailyRegression]);

  const monthlyForecastData = useMemo(() => {
    if (monthlyProfit.length === 0) {
      return [] as { month: string; profit: number | null; forecastProfit: number | null }[];
    }

    const lastMonth = monthlyProfit[monthlyProfit.length - 1].month;
    const future = Array.from({ length: 3 }, (_, index) => {
      const month = Array.from({ length: index + 1 }).reduce<string>((current) => nextMonth(current), lastMonth);
      const x = monthlyProfit.length + index + 1;
      return {
        month,
        profit: null,
        forecastProfit: Math.round(monthlyRegression.intercept + monthlyRegression.slope * x),
      };
    });

    return [
      ...monthlyProfit.map((item) => ({ month: item.month, profit: item.profit, forecastProfit: null })),
      ...future,
    ];
  }, [monthlyProfit, monthlyRegression]);

  const monthlySummary = useMemo(() => {
    const totalRevenue = revenue.reduce((sum, item) => sum + item.amount, 0);
    const totalCost = cost.reduce((sum, item) => sum + item.amount, 0);
    const totalProfit = monthlyProfit.reduce((sum, item) => sum + item.profit, 0);
    return {
      totalRevenue,
      totalCost,
      totalProfit,
      avgProfit: monthlyProfit.length ? totalProfit / monthlyProfit.length : 0,
    };
  }, [cost, monthlyProfit, revenue]);

  const dailySummary = useMemo(() => {
    const totalProfit = dailyProfit.reduce((sum, item) => sum + item.amount, 0);
    const totalCost = dailyCost.reduce((sum, item) => sum + item.amount, 0);
    return {
      totalProfit,
      avgProfit: dailyProfit.length ? totalProfit / dailyProfit.length : 0,
      latest: dailyProfit[dailyProfit.length - 1]?.amount ?? 0,
      totalCost,
      avgCost: dailyCost.length ? totalCost / dailyCost.length : 0,
    };
  }, [dailyProfit, dailyCost]);

  const nextDaily = dailyForecastData.find((item) => item.forecastProfit !== null)?.forecastProfit ?? 0;
  const nextMonthly = monthlyForecastData.find((item) => item.forecastProfit !== null)?.forecastProfit ?? 0;

  return (
    <div className="mobile-app-bg">
      <div className="mobile-app-shell">
        <header className="app-header glass-card">
          <div>
            <p className="eyebrow">Profit Forecast App</p>
            <h1>{companyName || 'Your Company'}</h1>
            <span>Track daily profit and daily cost, manage monthly revenue and cost, and view short-term and monthly forecasts.</span>
          </div>
        </header>

        <section className="hero-card glass-card">
          <div>
            <p className="eyebrow">Overview</p>
            <h2>{formatCurrency(monthlySummary.totalProfit)}</h2>
            <span>Total monthly profit across saved monthly records</span>
          </div>
          <div className="hero-stats hero-stats-4">
            <div>
              <small>Daily Avg Profit</small>
              <strong>{formatCurrency(dailySummary.avgProfit)}</strong>
            </div>
            <div>
              <small>Daily Avg Cost</small>
              <strong>{formatCurrency(dailySummary.avgCost)}</strong>
            </div>
            <div>
              <small>Next Day</small>
              <strong>{formatCurrency(nextDaily)}</strong>
            </div>
            <div>
              <small>Next Month</small>
              <strong>{formatCurrency(nextMonthly)}</strong>
            </div>
          </div>
        </section>

        <nav className="tabbar glass-card tabbar-3">
          <NavLink to="/daily" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            Daily
          </NavLink>
          <NavLink to="/monthly" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            Monthly
          </NavLink>
          <NavLink to="/forecast" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            Forecast
          </NavLink>
        </nav>

        <div className="page-body">
          <Routes>
            <Route path="/" element={<Navigate to="/daily" replace />} />
            <Route
              path="/daily"
              element={<DailyPage profitEntries={dailyProfit} setProfitEntries={setDailyProfit} costEntries={dailyCost} setCostEntries={setDailyCost} />}
            />
            <Route
              path="/monthly"
              element={
                <MonthlyPage
                  revenue={revenue}
                  setRevenue={setRevenue}
                  cost={cost}
                  setCost={setCost}
                  monthlyProfit={monthlyProfit}
                />
              }
            />
            <Route
              path="/forecast"
              element={
                <ForecastPage
                  dailyProfit={dailyProfit}
                  dailyForecastData={dailyForecastData}
                  dailySummary={dailySummary}
                  monthlyProfit={monthlyProfit}
                  monthlyForecastData={monthlyForecastData}
                  monthlySummary={monthlySummary}
                />
              }
            />
            <Route path="*" element={<Navigate to="/daily" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function DailySection({
  title,
  accent,
  entries,
  setEntries,
}: {
  title: string;
  accent: 'daily' | 'cost';
  entries: DailyEntry[];
  setEntries: Dispatch<SetStateAction<DailyEntry[]>>;
}) {
  const sorted = useMemo(() => sortDailyEntries(entries), [entries]);
  const { page, setPage, pageCount, paginated } = usePaginatedList(sorted);
  const total = sorted.reduce((sum, item) => sum + item.amount, 0);
  const average = sorted.length ? total / sorted.length : 0;

  const [date, setDate] = useState(sorted[sorted.length - 1]?.date || '2026-03-13');
  const [amount, setAmount] = useState('');

  function addEntry() {
    if (!date || !amount) return;
    const numeric = Number(amount);
    if (Number.isNaN(numeric)) return;

    setEntries((current) => {
      const existing = current.find((item) => item.date === date);
      if (existing) {
        return sortDailyEntries(current.map((item) => (item.date === date ? { ...item, amount: numeric } : item)));
      }
      return sortDailyEntries([...current, { id: `${accent}-${date}`, date, amount: numeric }]);
    });

    setAmount('');
    setDate(nextDay(date));
  }

  function removeEntry(id: string) {
    setEntries((current) => current.filter((item) => item.id !== id));
  }

  const chartData = sorted.map((item) => ({ label: dayLabel(item.date), value: item.amount }));
  const isProfit = accent === 'daily';

  return (
    <section className="glass-card form-card">
      <div className="section-copy">
        <p className="eyebrow">{isProfit ? 'Daily Profit' : 'Daily Cost'}</p>
        <h3>{title}</h3>
        <span>
          {isProfit
            ? 'Enter one daily profit value per day. If the same date is entered again, the record is updated automatically.'
            : 'Manage daily cost on the same daily page, similar to the monthly cost section.'}
        </span>
      </div>

      <div className="input-grid">
        <label>
          <span>Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          <span>{isProfit ? 'Profit' : 'Cost'}</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={isProfit ? 'e.g. 2360' : 'e.g. 1080'}
          />
        </label>
      </div>

      <button className={`primary-btn ${accent}`} onClick={addEntry}>
        Save {title}
      </button>

      <section className="metrics-row single-section-gap">
        <MetricCard label="Total" value={formatCurrency(total)} />
        <MetricCard label="Average / Day" value={formatCurrency(average)} />
        <MetricCard label="Days" value={sorted.length} />
      </section>

      <section className="glass-card chart-panel inner-chart-panel">
        <div className="section-copy compact">
          <h3>{isProfit ? 'Daily Profit Trend' : 'Daily Cost Trend'}</h3>
          <span>{isProfit ? 'A quick view of recent daily profit performance.' : 'A quick view of recent daily cost performance.'}</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="screen-stack compact-gap single-section-gap">
        {paginated.map((item) => (
          <div className="glass-card entry-row" key={item.id}>
            <div>
              <strong>{item.date}</strong>
              <span>{isProfit ? 'Daily profit record' : 'Daily cost record'}</span>
            </div>
            <div className="entry-actions">
              <strong>{formatCurrency(item.amount)}</strong>
              <button className="ghost-btn" onClick={() => removeEntry(item.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </section>
    </section>
  );
}

function DailyPage({
  profitEntries,
  setProfitEntries,
  costEntries,
  setCostEntries,
}: {
  profitEntries: DailyEntry[];
  setProfitEntries: Dispatch<SetStateAction<DailyEntry[]>>;
  costEntries: DailyEntry[];
  setCostEntries: Dispatch<SetStateAction<DailyEntry[]>>;
}) {
  const totalProfit = profitEntries.reduce((sum, item) => sum + item.amount, 0);
  const avgProfit = profitEntries.length ? totalProfit / profitEntries.length : 0;
  const totalCost = costEntries.reduce((sum, item) => sum + item.amount, 0);
  const avgCost = costEntries.length ? totalCost / costEntries.length : 0;

  return (
    <div className="screen-stack">
      <section className="glass-card form-card">
        <div className="section-copy">
          <p className="eyebrow">Daily Finance</p>
          <h3>Daily Profit and Daily Cost</h3>
          <span>Daily profit forecasting still uses the saved daily profit series, and daily cost is now tracked in a matching section on this page.</span>
        </div>
      </section>

      <section className="metrics-row metrics-row-4">
        <MetricCard label="Profit Days" value={profitEntries.length} />
        <MetricCard label="Avg Daily Profit" value={formatCurrency(avgProfit)} />
        <MetricCard label="Cost Days" value={costEntries.length} />
        <MetricCard label="Avg Daily Cost" value={formatCurrency(avgCost)} />
      </section>

      <section className="dual-grid">
        <DailySection title="Daily Profit" accent="daily" entries={profitEntries} setEntries={setProfitEntries} />
        <DailySection title="Daily Cost" accent="cost" entries={costEntries} setEntries={setCostEntries} />
      </section>
    </div>
  );
}

function MonthlySection({
  title,
  accent,
  entries,
  setEntries,
}: {
  title: string;
  accent: 'revenue' | 'cost';
  entries: MonthlyEntry[];
  setEntries: Dispatch<SetStateAction<MonthlyEntry[]>>;
}) {
  const sorted = useMemo(() => sortMonthlyEntries(entries), [entries]);
  const { page, setPage, pageCount, paginated } = usePaginatedList(sorted);
  const total = sorted.reduce((sum, item) => sum + item.amount, 0);
  const average = sorted.length ? total / sorted.length : 0;

  const [month, setMonth] = useState(sorted[sorted.length - 1]?.month || '2026-04');
  const [amount, setAmount] = useState('');

  function addEntry() {
    if (!month || !amount) return;
    const numeric = Number(amount);
    if (Number.isNaN(numeric)) return;

    setEntries((current) => {
      const existing = current.find((item) => item.month === month);
      if (existing) {
        return sortMonthlyEntries(current.map((item) => (item.month === month ? { ...item, amount: numeric } : item)));
      }
      return sortMonthlyEntries([...current, { id: `${accent}-${month}`, month, amount: numeric }]);
    });

    setAmount('');
    setMonth(nextMonth(month));
  }

  function removeEntry(id: string) {
    setEntries((current) => current.filter((item) => item.id !== id));
  }

  const chartData = sorted.map((item) => ({ label: monthLabel(item.month), value: item.amount }));

  return (
    <section className="glass-card form-card">
      <div className="section-copy">
        <p className="eyebrow">{accent === 'revenue' ? 'Revenue' : 'Cost'}</p>
        <h3>{title}</h3>
        <span>{accent === 'revenue' ? 'Monthly revenue history used for monthly profit forecasting.' : 'Monthly cost is managed here on the same page as monthly revenue.'}</span>
      </div>

      <div className="input-grid">
        <label>
          <span>Month</span>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
        <label>
          <span>Amount</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={accent === 'revenue' ? 'e.g. 165000' : 'e.g. 92000'}
          />
        </label>
      </div>

      <button className={`primary-btn ${accent}`} onClick={addEntry}>
        Save {title}
      </button>

      <section className="metrics-row single-section-gap">
        <MetricCard label="Total" value={formatCurrency(total)} />
        <MetricCard label="Average / Month" value={formatCurrency(average)} />
        <MetricCard label="Months" value={sorted.length} />
      </section>

      <section className="glass-card chart-panel inner-chart-panel">
        <div className="section-copy compact">
          <h3>{accent === 'revenue' ? 'Revenue Trend' : 'Cost Trend'}</h3>
          <span>{accent === 'revenue' ? 'Monthly revenue trend over time.' : 'Monthly cost trend over time.'}</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="screen-stack compact-gap single-section-gap">
        {paginated.map((item) => (
          <div className="glass-card entry-row" key={item.id}>
            <div>
              <strong>{monthLabel(item.month)}</strong>
              <span>{accent === 'revenue' ? 'Revenue record' : 'Cost record'}</span>
            </div>
            <div className="entry-actions">
              <strong>{formatCurrency(item.amount)}</strong>
              <button className="ghost-btn" onClick={() => removeEntry(item.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </section>
    </section>
  );
}

function MonthlyPage({
  revenue,
  setRevenue,
  cost,
  setCost,
  monthlyProfit,
}: {
  revenue: MonthlyEntry[];
  setRevenue: Dispatch<SetStateAction<MonthlyEntry[]>>;
  cost: MonthlyEntry[];
  setCost: Dispatch<SetStateAction<MonthlyEntry[]>>;
  monthlyProfit: { month: string; revenue: number; cost: number; profit: number }[];
}) {
  const chartData = monthlyProfit.map((item) => ({
    label: monthLabel(item.month),
    revenue: item.revenue,
    cost: item.cost,
    profit: item.profit,
  }));

  const totalProfit = monthlyProfit.reduce((sum, item) => sum + item.profit, 0);
  const avgProfit = monthlyProfit.length ? totalProfit / monthlyProfit.length : 0;

  return (
    <div className="screen-stack">
      <section className="glass-card form-card">
        <div className="section-copy">
          <p className="eyebrow">Monthly Finance</p>
          <h3>Monthly Revenue and Cost</h3>
          <span>Revenue and cost are managed together on this page. Monthly profit is calculated as revenue minus cost.</span>
        </div>
      </section>

      <section className="metrics-row metrics-row-4">
        <MetricCard label="Revenue Months" value={revenue.length} />
        <MetricCard label="Cost Months" value={cost.length} />
        <MetricCard label="Avg Monthly Profit" value={formatCurrency(avgProfit)} />
        <MetricCard label="Total Monthly Profit" value={formatCurrency(totalProfit)} />
      </section>

      <section className="glass-card chart-panel large-chart">
        <div className="section-copy compact">
          <h3>Monthly Revenue, Cost, and Profit</h3>
          <span>Profit is derived from the monthly revenue and cost series.</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" name="Revenue" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="cost" name="Cost" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="profit" name="Profit" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="dual-grid">
        <MonthlySection title="Monthly Revenue" accent="revenue" entries={revenue} setEntries={setRevenue} />
        <MonthlySection title="Monthly Cost" accent="cost" entries={cost} setEntries={setCost} />
      </section>
    </div>
  );
}

function ForecastPage({
  dailyProfit,
  dailyForecastData,
  dailySummary,
  monthlyProfit,
  monthlyForecastData,
  monthlySummary,
}: {
  dailyProfit: DailyEntry[];
  dailyForecastData: { date: string; profit: number | null; forecastProfit: number | null }[];
  dailySummary: { totalProfit: number; avgProfit: number; latest: number; totalCost: number; avgCost: number };
  monthlyProfit: { month: string; revenue: number; cost: number; profit: number }[];
  monthlyForecastData: { month: string; profit: number | null; forecastProfit: number | null }[];
  monthlySummary: { totalRevenue: number; totalCost: number; totalProfit: number; avgProfit: number };
}) {
  const dailyChartData = dailyForecastData.map((item) => ({
    label: dayLabel(item.date),
    profit: item.profit,
    forecast: item.forecastProfit,
  }));

  const monthlyChartData = monthlyForecastData.map((item) => ({
    label: monthLabel(item.month),
    profit: item.profit,
    forecast: item.forecastProfit,
  }));

  return (
    <div className="screen-stack">
      <section className="dual-grid">
        <div className="glass-card form-card">
          <div className="section-copy">
            <p className="eyebrow">Daily Forecast</p>
            <h3>Daily Profit Forecast</h3>
            <span>Short-term projection based on the saved daily profit sequence. The app forecasts the next 7 days.</span>
          </div>
          <div className="formula-box stacked-box">
            <div>
              <small>Latest Daily Profit</small>
              <strong>{formatCurrency(dailySummary.latest)}</strong>
            </div>
            <div>
              <small>Average Daily Profit</small>
              <strong>{formatCurrency(dailySummary.avgProfit)}</strong>
            </div>
            <div>
              <small>Average Daily Cost</small>
              <strong>{formatCurrency(dailySummary.avgCost)}</strong>
            </div>
          </div>
        </div>

        <div className="glass-card form-card">
          <div className="section-copy">
            <p className="eyebrow">Monthly Forecast</p>
            <h3>Monthly Profit Forecast</h3>
            <span>Medium-term projection based on monthly profit, where profit equals monthly revenue minus monthly cost.</span>
          </div>
          <div className="formula-box stacked-box">
            <div>
              <small>Total Monthly Revenue</small>
              <strong>{formatCurrency(monthlySummary.totalRevenue)}</strong>
            </div>
            <div>
              <small>Total Monthly Cost</small>
              <strong>{formatCurrency(monthlySummary.totalCost)}</strong>
            </div>
            <div>
              <small>Average Monthly Profit</small>
              <strong>{formatCurrency(monthlySummary.avgProfit)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="metrics-row metrics-row-4">
        <MetricCard label="Daily Avg" value={formatCurrency(dailySummary.avgProfit)} />
        <MetricCard label="Daily Points" value={dailyProfit.length} />
        <MetricCard label="Monthly Avg" value={formatCurrency(monthlySummary.avgProfit)} />
        <MetricCard label="Monthly Points" value={monthlyProfit.length} />
      </section>

      <section className="glass-card chart-panel large-chart">
        <div className="section-copy compact">
          <h3>Daily Profit vs Daily Forecast</h3>
          <span>The solid line shows saved daily profit. The dashed line shows the next 7 forecast days.</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={dailyChartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="label" interval={0} minTickGap={0} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="profit" name="Historical Daily Profit" strokeWidth={3} dot={{ r: 4 }} connectNulls={false} />
            <Line type="monotone" dataKey="forecast" name="Forecast Daily Profit" strokeWidth={3} strokeDasharray="6 6" dot={{ r: 4 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="forecast-list forecast-list-wide">
        {dailyForecastData
          .filter((item) => item.forecastProfit !== null)
          .map((item) => (
            <div key={item.date} className="glass-card forecast-card">
              <span>{dayLabel(item.date)}</span>
              <strong>{formatCurrency(item.forecastProfit ?? 0)}</strong>
              <small>Predicted Daily Profit</small>
            </div>
          ))}
      </section>

      <section className="glass-card chart-panel large-chart">
        <div className="section-copy compact">
          <h3>Monthly Profit vs Monthly Forecast</h3>
          <span>The solid line shows historical monthly profit. The dashed line shows the next 3 forecast months.</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlyChartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="profit" name="Historical Monthly Profit" strokeWidth={3} dot={{ r: 4 }} connectNulls={false} />
            <Line type="monotone" dataKey="forecast" name="Forecast Monthly Profit" strokeWidth={3} strokeDasharray="6 6" dot={{ r: 4 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="forecast-list">
        {monthlyForecastData
          .filter((item) => item.forecastProfit !== null)
          .map((item) => (
            <div key={item.month} className="glass-card forecast-card">
              <span>{monthLabel(item.month)}</span>
              <strong>{formatCurrency(item.forecastProfit ?? 0)}</strong>
              <small>Predicted Monthly Profit</small>
            </div>
          ))}
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass-card metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: Dispatch<SetStateAction<number>>;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="pagination-row glass-card">
      <button className="ghost-btn" onClick={() => onPageChange((current) => Math.max(1, current - 1))}>
        Previous
      </button>
      <span>
        Page {page} / {pageCount}
      </span>
      <button className="ghost-btn" onClick={() => onPageChange((current) => Math.min(pageCount, current + 1))}>
        Next
      </button>
    </div>
  );
}

function AnimatedScreen({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.985)',
        transition: 'opacity 320ms ease, transform 320ms ease',
      }}
    >
      {children}
    </div>
  );
}

export default function App() {
  const [hasEnteredDashboard, setHasEnteredDashboard] = useState<boolean>(() => {
    const saved = localStorage.getItem('profit-forecast-entered-dashboard');
    return saved === 'true';
  });
  const [companyName, setCompanyName] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.companyName) ?? '');
  const [dailyProfit, setDailyProfit] = useState<DailyEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.dailyProfit);
    return saved ? sortDailyEntries(JSON.parse(saved)) : dailyProfitSeed;
  });
  const [dailyCost, setDailyCost] = useState<DailyEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.dailyCost);
    return saved ? sortDailyEntries(JSON.parse(saved)) : dailyCostSeed;
  });
  const [revenue, setRevenue] = useState<MonthlyEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.revenue);
    return saved ? sortMonthlyEntries(JSON.parse(saved)) : revenueSeed;
  });
  const [cost, setCost] = useState<MonthlyEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.cost);
    return saved ? sortMonthlyEntries(JSON.parse(saved)) : costSeed;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.companyName, companyName);
  }, [companyName]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.dailyProfit, JSON.stringify(sortDailyEntries(dailyProfit)));
  }, [dailyProfit]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.dailyCost, JSON.stringify(sortDailyEntries(dailyCost)));
  }, [dailyCost]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.revenue, JSON.stringify(sortMonthlyEntries(revenue)));
  }, [revenue]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.cost, JSON.stringify(sortMonthlyEntries(cost)));
  }, [cost]);

  useEffect(() => {
    localStorage.setItem('profit-forecast-entered-dashboard', String(hasEnteredDashboard));
  }, [hasEnteredDashboard]);

  return hasEnteredDashboard ? (
    <AnimatedScreen>
      <AppShell
        companyName={companyName}
        setCompanyName={setCompanyName}
        dailyProfit={dailyProfit}
        setDailyProfit={setDailyProfit}
        dailyCost={dailyCost}
        setDailyCost={setDailyCost}
        revenue={revenue}
        setRevenue={setRevenue}
        cost={cost}
        setCost={setCost}
      />
    </AnimatedScreen>
  ) : (
    <AnimatedScreen>
      <WelcomeScreen
        companyName={companyName}
        setCompanyName={setCompanyName}
        onContinue={() => setHasEnteredDashboard(true)}
      />
    </AnimatedScreen>
  );
}

function WelcomeScreen({
  companyName,
  setCompanyName,
  onContinue,
}: {
  companyName: string;
  setCompanyName: Dispatch<SetStateAction<string>>;
  onContinue: () => void;
}) {
  return (
    <div className="mobile-app-bg">
      <div className="mobile-app-shell welcome-shell">
        <section
          className="glass-card welcome-card"
          style={{
            maxWidth: 560,
            margin: '64px auto',
            padding: '32px',
          }}
        >
          <div className="section-copy" style={{ marginBottom: 20 }}>
            <p className="eyebrow">Profit Forecast App</p>
            <h1 style={{ marginBottom: 10 }}>Welcome</h1>
            <span style={{ display: 'block', lineHeight: 1.6 }}>
              Enter your company name to continue to the dashboard. Your daily and monthly
              forecast tools are ready with sample data so you can start immediately.
            </span>
          </div>

          <div
            className="glass-card"
            style={{
              padding: 16,
              marginBottom: 18,
            }}
          >
            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Company Name</span>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && companyName.trim()) {
                    onContinue();
                  }
                }}
              />
            </label>
          </div>

          <button
            className="primary-btn"
            onClick={() => {
              if (!companyName.trim()) return;
              onContinue();
            }}
            disabled={!companyName.trim()}
            style={{ width: '100%' }}
          >
            Enter Dashboard
          </button>
          </p>
        </section>
      </div>
    </div>
  );
}
