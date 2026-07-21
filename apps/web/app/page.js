"use client";

import Link from "next/link";

const HIGHLIGHTS = [
  { label: "Anonymous", icon: "incognito" },
  { label: "Real-time chat", icon: "chat" },
  { label: "Peer community", icon: "users" },
  { label: "Counselling access", icon: "heart" },
];

const FEATURES = [
  {
    title: "Anonymous, always",
    body: "Sign up and you're given an alias like SilentAchiever_204. No real name, no photo, ever.",
  },
  {
    title: "Reddit-style community",
    body: "Post, reply, upvote, and sort by Hot, New, or Top across topic-based sub-forums.",
  },
  {
    title: "Real-time chat",
    body: "1-on-1 DMs and group rooms like Late-night grind or Physics doubts, with typing indicators.",
  },
  {
    title: "Counselling Corner",
    body: "A dedicated space to escalate to a real counsellor when you need more than peer support.",
  },
];

function HighlightIcon({ icon }) {
  const common = "h-5 w-5";
  switch (icon) {
    case "incognito":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={common}>
          <path d="M3 13l2-5a3 3 0 013-2h8a3 3 0 013 2l2 5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="7" cy="15" r="2.5" />
          <circle cx="17" cy="15" r="2.5" />
          <path d="M9.5 15h5" strokeLinecap="round" />
        </svg>
      );
    case "chat":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={common}>
          <path
            d="M4 12a8 8 0 1113.9 5.4L20 20l-3.2-1.1A8 8 0 014 12z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" strokeLinecap="round" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M15.5 14.2c2.5.3 4.5 2.1 4.5 4.8" strokeLinecap="round" />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={common}>
          <path
            d="M12 20s-7-4.4-9.5-8.8C.8 8 2 4.5 5.5 4a5 5 0 016.5 2 5 5 0 016.5-2c3.5.5 4.7 4 3 7.2C19 15.6 12 20 12 20z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden">
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 pb-16 pt-24 text-center">
          <span className="mb-6 rounded-full border border-muted/30 bg-surface px-4 py-1 text-xs uppercase tracking-wide text-muted">
            For NEET aspirants
          </span>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-6xl">
            You&apos;re{" "}
            <span
              style={{
                backgroundImage: "linear-gradient(90deg, #00e5ff, #8b2fe0, #ff2fb0)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
              }}
            >
              not doing this alone.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            An anonymous peer-support community and real-time chat for the stress, burnout,
            and exam anxiety that comes with NEET prep — talk, vent, motivate, and get real
            counselling support, without ever revealing who you are.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-accent px-8 py-3 font-medium text-on-accent hover:opacity-90"
            >
              Join anonymously
            </Link>
            <Link
              href="/c/motivation"
              className="rounded-full border border-muted/40 px-8 py-3 font-medium text-ink hover:bg-surface"
            >
              Browse the community
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-4xl border-y border-muted/20 px-4 py-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {HIGHLIGHTS.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2 text-center">
                <span className="text-accent">
                  <HighlightIcon icon={item.icon} />
                </span>
                <span className="text-xs text-muted">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-16">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-muted">
          What you get
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-muted/20 bg-surface p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-ink">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-28">
        <div
          className="relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl border border-muted/20 px-8 py-14 text-center"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--color-surface), color-mix(in srgb, var(--color-surface) 60%, #8b2fe0), color-mix(in srgb, var(--color-surface) 55%, #c22591))",
          }}
        >
          <h2 className="text-2xl font-semibold text-ink sm:text-3xl">
            You don&apos;t have to do this alone.
          </h2>
          <p className="max-w-md text-sm text-muted">
            Join anonymously in seconds — no real name, no photo, just support when you need it.
          </p>
          <Link
            href="/signup"
            className="mt-2 rounded-full bg-accent px-8 py-3 font-medium text-on-accent hover:opacity-90"
          >
            Join anonymously
          </Link>
        </div>
      </section>
    </div>
  );
}
