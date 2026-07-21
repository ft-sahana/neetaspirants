const COMMON = "h-5 w-5";

export default function NavIcon({ name, className = COMMON }) {
  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <path d="M4 11.5 12 4l8 7.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 10v9a1 1 0 001 1h4v-5h2v5h4a1 1 0 001-1v-9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "communities":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" strokeLinecap="round" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M15.5 14.2c2.5.3 4.5 2.1 4.5 4.8" strokeLinecap="round" />
        </svg>
      );
    case "rooms":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <path
            d="M4 12a8 8 0 1113.9 5.4L20 20l-3.2-1.1A8 8 0 014 12z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "notifications":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <path
            d="M6 10a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M10 19a2 2 0 004 0" strokeLinecap="round" />
        </svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" strokeLinecap="round" />
        </svg>
      );
    case "assistant":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <rect x="4" y="7" width="16" height="11" rx="3" />
          <path d="M12 3v4M9 12h.01M15 12h.01" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
