"use client";

/**
 * Loading component shown during Zustand store hydration
 *
 * Displayed while the store is initializing and hydrating from localStorage
 */
export default function ZustandHydration() {
  return (
    <div
      className="flex flex-col justify-center items-center h-screen"
      style={{ backgroundColor: "hsl(var(--dark-slate))" }}
    >
      <div
        className="p-6 rounded-md border shadow-lg max-w-sm text-center"
        style={{
          borderColor: "hsl(var(--neon-green))",
          backgroundColor: "hsla(var(--dark-slate), 0.8)",
          boxShadow: "0 0 15px rgba(0, 255, 135, 0.2)",
        }}
      >
        <div className="animate-pulse mb-4">
          <div
            className="inline-block w-16 h-16 rounded-full mb-2"
            style={{ backgroundColor: "rgba(0, 255, 135, 0.2)" }}
          ></div>
        </div>
        <h2
          className="text-xl font-mono mb-2"
          style={{ color: "hsl(var(--neon-green))" }}
        >
          Initializing Application
        </h2>
        <p className="text-gray-300 text-sm mb-4">Loading dashboard state...</p>
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full animate-[pulse_2s_ease-in-out_infinite] rounded-full"
            style={{
              backgroundColor: "hsl(var(--neon-green))",
              width: "75%",
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
