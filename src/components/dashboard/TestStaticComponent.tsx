"use client";

/**
 * A minimal test component with no state dependencies
 * Used to verify basic rendering works in the dashboard
 */
export default function TestStaticComponent() {
  console.log("TestStaticComponent is mounting - no state dependencies");

  return (
    <div
      style={{
        padding: "20px",
        margin: "20px",
        border: "5px solid red",
        background: "yellow",
        color: "black",
        fontWeight: "bold",
        zIndex: 9999,
        position: "relative",
      }}
    >
      <h2>TEST COMPONENT - NO STATE DEPENDENCIES</h2>
      <p>If you can see this, basic component rendering works!</p>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}
