"use client";

/**
 * Loading component for dashboard content
 *
 * Shows a detailed loading state with progress indicators for different phases
 * of dashboard initialization.
 */
interface DashboardLoadingStateProps {
  status?: string;
  isInitialLoad?: boolean;
  isStoreInitialized?: boolean;
  message?: string;
}

export default function DashboardLoadingState({
  status,
  isInitialLoad = true,
  isStoreInitialized = false,
  message = "Loading dashboard...",
}: DashboardLoadingStateProps) {
  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: "hsl(var(--dark-slate))" }}
    >
      {/* Header with status message */}
      <div
        className="p-4 border-b"
        style={{
          borderColor: "hsl(var(--neon-green))",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
        }}
      >
        <div className="flex justify-between items-center">
          <div
            className="animate-pulse h-8 w-40 rounded"
            style={{ backgroundColor: "rgba(0, 255, 135, 0.2)" }}
          ></div>
          <div className="text-sm text-gray-400">{message}</div>
        </div>
      </div>

      {/* Main content area with loading stages */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="mb-8 text-center">
          <div
            className="text-xl font-bold mb-2"
            style={{ color: "hsl(var(--neon-green))" }}
          >
            {message}
          </div>
          <div className="text-sm text-gray-400">
            Please wait while we prepare your dashboard
          </div>
        </div>

        {/* Loading progress stages */}
        <div className="w-full max-w-md mb-8">
          <div className="flex items-center mb-4">
            <div
              className={`h-3 w-3 rounded-full mr-3 ${status === "loading" ? "animate-pulse" : ""}`}
              style={{
                backgroundColor:
                  status === "loading"
                    ? "hsl(var(--neon-green))"
                    : status === "authenticated"
                      ? "hsl(var(--green))"
                      : "hsl(var(--gray))",
              }}
            ></div>
            <div className="text-sm">Authentication</div>
            <div className="ml-auto text-xs text-gray-400">
              {status === "loading"
                ? "In progress..."
                : status === "authenticated"
                  ? "Complete"
                  : "Waiting..."}
            </div>
          </div>

          <div className="flex items-center mb-4">
            <div
              className={`h-3 w-3 rounded-full mr-3 ${status === "authenticated" && !isStoreInitialized ? "animate-pulse" : ""}`}
              style={{
                backgroundColor: isStoreInitialized
                  ? "hsl(var(--green))"
                  : status === "authenticated"
                    ? "hsl(var(--neon-green))"
                    : "hsl(var(--gray))",
              }}
            ></div>
            <div className="text-sm">State Initialization</div>
            <div className="ml-auto text-xs text-gray-400">
              {isStoreInitialized
                ? "Complete"
                : status === "authenticated"
                  ? "In progress..."
                  : "Waiting..."}
            </div>
          </div>

          <div className="flex items-center mb-4">
            <div
              className={`h-3 w-3 rounded-full mr-3 ${isStoreInitialized && isInitialLoad ? "animate-pulse" : ""}`}
              style={{
                backgroundColor: !isInitialLoad
                  ? "hsl(var(--green))"
                  : isStoreInitialized
                    ? "hsl(var(--neon-green))"
                    : "hsl(var(--gray))",
              }}
            ></div>
            <div className="text-sm">Loading Data</div>
            <div className="ml-auto text-xs text-gray-400">
              {!isInitialLoad
                ? "Complete"
                : isStoreInitialized
                  ? "In progress..."
                  : "Waiting..."}
            </div>
          </div>

          <div className="flex items-center">
            <div
              className={`h-3 w-3 rounded-full mr-3 ${!isInitialLoad ? "animate-pulse" : ""}`}
              style={{
                backgroundColor: !isInitialLoad
                  ? "hsl(var(--neon-green))"
                  : "hsl(var(--gray))",
              }}
            ></div>
            <div className="text-sm">Rendering Dashboard</div>
            <div className="ml-auto text-xs text-gray-400">
              {!isInitialLoad ? "In progress..." : "Waiting..."}
            </div>
          </div>
        </div>

        {/* Loading skeleton UI */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="p-4 border rounded-md"
            style={{
              borderColor: "hsl(var(--electric-blue))",
              backgroundColor: "rgba(0, 0, 0, 0.2)",
            }}
          >
            <div
              className="animate-pulse h-4 w-1/2 rounded mb-4"
              style={{ backgroundColor: "rgba(45, 145, 255, 0.2)" }}
            ></div>
            <div className="space-y-2">
              <div
                className="animate-pulse h-3 w-full rounded"
                style={{ backgroundColor: "rgba(45, 145, 255, 0.1)" }}
              ></div>
              <div
                className="animate-pulse h-3 w-3/4 rounded"
                style={{ backgroundColor: "rgba(45, 145, 255, 0.1)" }}
              ></div>
            </div>
          </div>

          <div
            className="p-4 border rounded-md"
            style={{
              borderColor: "hsl(var(--electric-blue))",
              backgroundColor: "rgba(0, 0, 0, 0.2)",
            }}
          >
            <div
              className="animate-pulse h-4 w-1/2 rounded mb-4"
              style={{ backgroundColor: "rgba(45, 145, 255, 0.2)" }}
            ></div>
            <div className="space-y-2">
              <div
                className="animate-pulse h-3 w-full rounded"
                style={{ backgroundColor: "rgba(45, 145, 255, 0.1)" }}
              ></div>
              <div
                className="animate-pulse h-3 w-3/4 rounded"
                style={{ backgroundColor: "rgba(45, 145, 255, 0.1)" }}
              ></div>
            </div>
          </div>

          <div
            className="col-span-1 md:col-span-2 p-4 border rounded-md"
            style={{
              borderColor: "hsl(var(--neon-green))",
              backgroundColor: "rgba(0, 0, 0, 0.2)",
            }}
          >
            <div
              className="animate-pulse h-4 w-1/4 rounded mb-4"
              style={{ backgroundColor: "rgba(0, 255, 135, 0.2)" }}
            ></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div
                    className="animate-pulse h-6 w-6 rounded-full flex-shrink-0"
                    style={{ backgroundColor: "rgba(0, 255, 135, 0.15)" }}
                  ></div>
                  <div
                    className="animate-pulse h-3 w-full rounded"
                    style={{ backgroundColor: "rgba(0, 255, 135, 0.1)" }}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
