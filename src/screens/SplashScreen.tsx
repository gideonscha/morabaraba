export function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="display-font text-5xl text-gold tracking-wider">MORABARABA</div>
      <div className="text-cream/70 text-sm mt-2 uppercase tracking-widest">African Strategy</div>
      <div className="mt-10 flex gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
        <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse [animation-delay:150ms]" />
        <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse [animation-delay:300ms]" />
      </div>
    </div>
  );
}
