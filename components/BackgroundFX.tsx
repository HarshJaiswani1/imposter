export default function BackgroundFX() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 15% -10%, rgba(167, 139, 250, 0.25), transparent), " +
            "radial-gradient(ellipse 70% 50% at 90% 10%, rgba(34, 211, 238, 0.18), transparent), " +
            "radial-gradient(ellipse 60% 60% at 50% 110%, rgba(251, 113, 133, 0.12), transparent)",
        }}
      />
      <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl animate-float-slow" />
      <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent-2/15 blur-3xl animate-float-slower" />
      <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-imposter/10 blur-3xl animate-float-slow" />
    </div>
  );
}
