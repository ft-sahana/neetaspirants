"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

const BAR_DAYS = 30;
const CHART_WIDTH = 680;
const CHART_HEIGHT = 190;
const PAD = { top: 10, right: 6, bottom: 26, left: 6 };

const LEVELS = [
  { key: "calm", label: "Calm", min: 0, color: "var(--stress-calm)" },
  { key: "steady", label: "Steady", min: 0.35, color: "var(--stress-steady)" },
  { key: "stressed", label: "Stressed", min: 0.55, color: "var(--stress-stressed)" },
  { key: "overwhelmed", label: "Overwhelmed", min: 0.75, color: "var(--stress-overwhelmed)" },
];

const NOTES = {
  calm: [
    "Nice and steady — whatever you're doing right now, it's working.",
    "This is a good rhythm. No need to change a thing today.",
    "Calm looks good on you. Ride this a little longer before the next big push.",
    "You've got some breathing room right now — a good moment to plan ahead, not cram.",
    "Quiet days add up. This one's doing its job.",
  ],
  steady: [
    "Steady is a completely fine place to be — most good days feel exactly like this.",
    "You're holding your own. Keep the pace you've got.",
    "Nothing dramatic here — just consistent effort, which is most of the work anyway.",
    "A normal day. Those are underrated.",
    "You're managing this well. Small breaks now will keep it that way.",
  ],
  stressed: [
    "It's been a heavier stretch. A short walk or a real break isn't a delay — it's part of studying well.",
    "Pressure's building a bit. Try breaking today's plan into smaller pieces.",
    "This is a normal peak before an exam push, not a sign you're falling behind.",
    "Worth checking in with a friend today — talking it through usually helps more than pushing through alone.",
    "You don't have to fix everything today. Pick one thing and let the rest wait.",
  ],
  overwhelmed: [
    "This has been a rough stretch. Be gentle with yourself today — rest counts as progress too.",
    "If it feels like too much, it's okay to step back for a bit. NEET prep is a marathon, not one bad week.",
    "You don't have to carry this alone — reach out to someone you trust, or drop into a room here.",
    "Overwhelmed doesn't mean you're behind. It means you're due for a real break, not a longer to-do list.",
    "If this feeling isn't easing up, please talk to someone you trust — a friend, family member, or counselor.",
  ],
};

function toLocalDateKey(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function levelFor(score) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

function formatShortDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFullDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function roundedTopBarPath(x, width, yTop, yBottom, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, yBottom - yTop));
  if (r === 0) return `M ${x} ${yBottom} L ${x} ${yTop} L ${x + width} ${yTop} L ${x + width} ${yBottom} Z`;
  return [
    `M ${x} ${yBottom}`,
    `L ${x} ${yTop + r}`,
    `Q ${x} ${yTop} ${x + r} ${yTop}`,
    `L ${x + width - r} ${yTop}`,
    `Q ${x + width} ${yTop} ${x + width} ${yTop + r}`,
    `L ${x + width} ${yBottom}`,
    "Z",
  ].join(" ");
}

/** Fills gaps so the strip reads as one continuous timeline, not just the days with posts. */
function useDailySeries(points) {
  return useMemo(() => {
    const byDate = new Map((points ?? []).map((p) => [p.date, p]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = BAR_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = toLocalDateKey(d);
      const point = byDate.get(dateKey) ?? null;
      days.push({ date: dateKey, point, level: point ? levelFor(point.avgScore) : null });
    }
    return days;
  }, [points]);
}

function StressBars({ points }) {
  const days = useDailySeries(points);
  const [active, setActive] = useState(null);

  const innerW = CHART_WIDTH - PAD.left - PAD.right;
  const innerH = CHART_HEIGHT - PAD.top - PAD.bottom;
  const baseline = PAD.top + innerH;

  const maxCount = Math.max(1, ...days.map((d) => d.point?.sampleCount ?? 0));
  const slot = innerW / days.length;
  const barWidth = Math.max(3, slot * 0.6);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full" role="img" aria-label="Daily stress bars for the last 30 days, bar height is post/comment count, color is stress level">
        {[0.25, 0.5, 0.75].map((frac) => (
          <line
            key={frac}
            x1={PAD.left}
            x2={CHART_WIDTH - PAD.right}
            y1={PAD.top + frac * innerH}
            y2={PAD.top + frac * innerH}
            stroke="var(--color-muted)"
            strokeOpacity="0.12"
            strokeWidth="1"
          />
        ))}
        <line x1={PAD.left} x2={CHART_WIDTH - PAD.right} y1={baseline} y2={baseline} stroke="var(--color-muted)" strokeOpacity="0.25" strokeWidth="1" />

        {days.map((day, i) => {
          const x = PAD.left + i * slot + (slot - barWidth) / 2;
          const isActive = active === day;
          if (!day.point) {
            return (
              <g key={day.date}>
                <rect x={x} y={baseline - 2} width={barWidth} height={2} rx={1} fill="var(--stress-empty)" />
                <rect
                  x={PAD.left + i * slot}
                  y={PAD.top}
                  width={slot}
                  height={innerH}
                  fill="transparent"
                  tabIndex={0}
                  role="button"
                  aria-label={`${formatFullDate(day.date)}: no data`}
                  onMouseEnter={() => setActive(day)}
                  onFocus={() => setActive(day)}
                  onMouseLeave={() => setActive((c) => (c === day ? null : c))}
                  onBlur={() => setActive((c) => (c === day ? null : c))}
                  className="outline-none focus-visible:fill-accent/10"
                />
              </g>
            );
          }
          const h = Math.max(6, (day.point.sampleCount / maxCount) * innerH);
          const yTop = baseline - h;
          return (
            <g key={day.date}>
              <path
                d={roundedTopBarPath(x, barWidth, yTop, baseline, 3)}
                fill={day.level.color}
                opacity={isActive ? 1 : 0.92}
                stroke={isActive ? "var(--color-ink)" : "none"}
                strokeWidth={isActive ? 1 : 0}
              />
              <rect
                x={PAD.left + i * slot}
                y={PAD.top}
                width={slot}
                height={innerH}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${formatFullDate(day.date)}: ${day.level.label}, ${day.point.sampleCount} post${day.point.sampleCount === 1 ? "" : "s"}`}
                onMouseEnter={() => setActive(day)}
                onFocus={() => setActive(day)}
                onMouseLeave={() => setActive((c) => (c === day ? null : c))}
                onBlur={() => setActive((c) => (c === day ? null : c))}
                className="outline-none focus-visible:fill-accent/10"
              />
            </g>
          );
        })}

        <text x={PAD.left} y={CHART_HEIGHT - 6} fill="var(--color-muted)" fontSize="10">
          {formatShortDate(days[0].date)}
        </text>
        <text x={CHART_WIDTH - PAD.right} y={CHART_HEIGHT - 6} fill="var(--color-muted)" fontSize="10" textAnchor="end">
          {formatShortDate(days[days.length - 1].date)}
        </text>
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted">
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <span className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: "var(--stress-empty)" }} />
          {LEVELS.map((lvl) => (
            <span key={lvl.key} className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: lvl.color }} />
          ))}
          <span>More</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {LEVELS.map((lvl) => (
            <span key={lvl.key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: lvl.color }} />
              {lvl.label}
            </span>
          ))}
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="mt-3 flex h-9 items-center rounded-lg border border-muted/20 bg-base/40 px-3 text-xs"
      >
        {active ? (
          <>
            <span className="font-medium text-ink">{formatFullDate(active.date)}</span>
            <span className="mx-1.5 text-muted">·</span>
            <span className="text-muted">
              {active.point
                ? `${active.level.label} · ${active.point.sampleCount} post${active.point.sampleCount === 1 ? "" : "s"}`
                : "No activity"}
            </span>
          </>
        ) : (
          <span className="text-muted">Hover or focus a bar to see that day's reading</span>
        )}
      </div>
    </div>
  );
}

export default function WellnessPage() {
  const { token, profile, ready } = useAuth();
  const router = useRouter();

  const [points, setPoints] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ready && !profile) router.push("/login");
  }, [ready, profile, router]);

  useEffect(() => {
    if (!token) return;
    apiFetch(`/wellness/stress-trend?days=${BAR_DAYS}`, { token })
      .then(setPoints)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load your wellness trend."));
  }, [token]);

  const today = points && points.length > 0 ? points[points.length - 1] : null;
  const isToday = today && today.date === toLocalDateKey(new Date());
  const todayLevel = today ? levelFor(today.avgScore) : null;

  const note = useMemo(() => {
    if (!todayLevel) return null;
    const pool = NOTES[todayLevel.key];
    return pool[Math.floor(Math.random() * pool.length)];
  }, [todayLevel?.key, today?.date]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-4 py-10">
      <h1 className="text-2xl font-semibold text-ink">Your wellness trend</h1>
      <p className="mt-1 text-sm text-muted">
        A private read on how stressed your recent posts and comments sound — inferred quietly from what you write.
        Only you can see this.
      </p>

      <div className="mt-6 rounded-xl border border-muted/20 bg-surface p-4">
        <div className="text-xs text-muted">{isToday ? "Today" : "Most recent reading"}</div>
        <div className="mt-1 text-xl font-semibold text-ink">{todayLevel ? todayLevel.label : "—"}</div>
      </div>

      {note && (
        <div className="mt-4 rounded-xl border border-accent/25 bg-accent/5 p-4">
          <div className="text-xs font-medium text-accent">A note for today</div>
          <p className="mt-1 text-sm leading-relaxed text-ink">{note}</p>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-muted/20 bg-surface p-4">
        {error && <p className="text-sm text-accent">{error}</p>}

        {!error && points === null && <p className="text-sm text-muted">Loading…</p>}

        {!error && points !== null && points.length === 0 && (
          <p className="text-sm text-muted">
            Nothing here yet. Once you post or comment, your stress trend will start showing up here.
          </p>
        )}

        {!error && points !== null && points.length > 0 && <StressBars points={points} />}
      </div>
    </div>
  );
}
