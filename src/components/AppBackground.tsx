export function AppBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 h-screen overflow-hidden"
    >
      <div className="app-background-image absolute inset-0" />
      <div className="app-background-tone absolute inset-0" />
      <div className="app-background-vignette absolute inset-0" />
    </div>
  );
}
