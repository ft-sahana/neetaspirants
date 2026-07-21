const DARK_WAVES = [
  { color: "#00e5ff", opacity: 0.35, baseY: 130, amp: 20, duration: 22, top: "8%", reverse: false },
  { color: "#8b2fe0", opacity: 0.32, baseY: 190, amp: 30, duration: 30, top: "24%", reverse: true },
  { color: "#3355ff", opacity: 0.24, baseY: 240, amp: 18, duration: 36, top: "42%", reverse: false },
  { color: "#ff2fb0", opacity: 0.2, baseY: 290, amp: 26, duration: 44, top: "60%", reverse: true },
  { color: "#00e5ff", opacity: 0.16, baseY: 340, amp: 16, duration: 52, top: "78%", reverse: false },
];

const LIGHT_WAVES = [
  { color: "#38bdf8", opacity: 0.55, baseY: 130, amp: 20, duration: 22, top: "8%", reverse: false },
  { color: "#a78bfa", opacity: 0.5, baseY: 190, amp: 30, duration: 30, top: "24%", reverse: true },
  { color: "#818cf8", opacity: 0.4, baseY: 240, amp: 18, duration: 36, top: "42%", reverse: false },
  { color: "#f472b6", opacity: 0.4, baseY: 290, amp: 26, duration: 44, top: "60%", reverse: true },
  { color: "#38bdf8", opacity: 0.3, baseY: 340, amp: 16, duration: 52, top: "78%", reverse: false },
];

function buildWavePath(baseY, amp) {
  let d = `M0,${baseY}`;
  for (let x = 0; x < 1600; x += 200) {
    d += ` C${x + 50},${baseY - amp} ${x + 150},${baseY + amp} ${x + 200},${baseY}`;
  }
  return d;
}

function Waves({ waves, background }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ transform: "translateZ(0)", isolation: "isolate" }}
    >
      <div className="absolute inset-0" style={{ background }} />
      {waves.map((wave, i) => (
        <svg
          key={i}
          viewBox="0 0 1600 400"
          preserveAspectRatio="none"
          className="absolute left-0 h-[40%] w-[200%]"
          style={{
            top: wave.top,
            animation: `wave-flow ${wave.duration}s linear infinite`,
            animationDirection: wave.reverse ? "reverse" : "normal",
            willChange: "transform",
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
          }}
        >
          <path
            d={buildWavePath(wave.baseY, wave.amp)}
            stroke={wave.color}
            strokeOpacity={wave.opacity}
            strokeWidth="1.4"
            fill="none"
          />
        </svg>
      ))}
    </div>
  );
}

export default function WaveBackground() {
  return (
    <div className="fixed inset-0" aria-hidden="true">
      <div className="wave-background absolute inset-0">
        <Waves
          waves={DARK_WAVES}
          background="linear-gradient(160deg, #05040d 0%, #0a0e2a 30%, #121454 55%, #24124a 80%, #05040d 100%)"
        />
      </div>
      <div className="light-background absolute inset-0">
        <Waves
          waves={LIGHT_WAVES}
          background="linear-gradient(160deg, #eef2ff 0%, #f5f3ff 35%, #fdf2f8 65%, #eef2ff 100%)"
        />
      </div>
    </div>
  );
}
