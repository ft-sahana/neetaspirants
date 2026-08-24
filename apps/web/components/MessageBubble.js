function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function MessageBubble({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
          isOwn ? "rounded-br-md bg-accent-muted text-ink" : "rounded-bl-md bg-surface text-ink"
        }`}
      >
        {!isOwn && <div className="mb-0.5 text-xs font-semibold text-accent">{message.senderAlias}</div>}
        <div className="whitespace-pre-wrap">{message.body}</div>
        <div className={`mt-1 text-[10px] ${isOwn ? "text-ink/50" : "text-muted"}`}>
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
}
