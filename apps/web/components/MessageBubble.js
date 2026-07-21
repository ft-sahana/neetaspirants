export default function MessageBubble({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
          isOwn ? "bg-accent-secondary text-ink" : "bg-surface-alt text-ink"
        }`}
      >
        {!isOwn && <div className="mb-0.5 text-xs text-muted">{message.senderAlias}</div>}
        <div className="whitespace-pre-wrap">{message.body}</div>
      </div>
    </div>
  );
}
