export default function BackgroundFX() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl animate-float-slow" />
      <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent-2/15 blur-3xl animate-float-slower" />
      <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-imposter/10 blur-3xl animate-float-slow" />
    </div>
  );
}
