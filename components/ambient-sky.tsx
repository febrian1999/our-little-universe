export function AmbientSky() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Soft Stars */}
      <span
        className="animate-twinkle absolute top-10 left-10 text-white/80 text-xs sm:text-sm select-none"
        style={{ animationDelay: "0s", animationDuration: "3.5s" }}
      >
        ✦
      </span>
      <span
        className="animate-twinkle absolute top-24 right-16 text-pink-200/90 text-sm sm:text-base select-none"
        style={{ animationDelay: "1.2s", animationDuration: "4s" }}
      >
        ★
      </span>
      <span
        className="animate-twinkle absolute top-1/2 left-8 text-purple-200/80 text-xs select-none"
        style={{ animationDelay: "0.7s", animationDuration: "2.8s" }}
      >
        ✦
      </span>
      <span
        className="animate-twinkle absolute bottom-36 right-12 text-white/90 text-sm select-none"
        style={{ animationDelay: "2s", animationDuration: "3.8s" }}
      >
        ★
      </span>
      <span
        className="animate-twinkle absolute bottom-20 left-1/4 text-amber-200/70 text-xs select-none"
        style={{ animationDelay: "1.5s", animationDuration: "4.5s" }}
      >
        ✦
      </span>

      {/* Floating Sakura Petals */}
      <span
        className="absolute -top-6 text-sm text-pink-300/60 select-none"
        style={{
          left: "12%",
          animation: "floatPetal 14s linear infinite",
          animationDelay: "0s",
        }}
      >
        🌸
      </span>
      <span
        className="absolute -top-6 text-xs text-pink-300/50 select-none"
        style={{
          left: "38%",
          animation: "floatPetal 16s linear infinite",
          animationDelay: "4s",
        }}
      >
        🌸
      </span>
      <span
        className="absolute -top-6 text-sm text-pink-200/60 select-none"
        style={{
          left: "68%",
          animation: "floatPetal 13s linear infinite",
          animationDelay: "2s",
        }}
      >
        🌸
      </span>
      <span
        className="absolute -top-6 text-xs text-pink-300/50 select-none"
        style={{
          left: "88%",
          animation: "floatPetal 17s linear infinite",
          animationDelay: "7s",
        }}
      >
        🌸
      </span>
    </div>
  );
}
