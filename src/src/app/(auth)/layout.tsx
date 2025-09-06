export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
      <div className="w-full max-w-md mx-4">{children}</div>
    </div>
  );
}
