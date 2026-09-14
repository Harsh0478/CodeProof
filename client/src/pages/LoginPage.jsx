import { SignIn } from '@clerk/react';
import { dark } from '@clerk/ui/themes';
import { useTheme } from '../context/ThemeContext';

export default function LoginPage() {
  const { theme } = useTheme();
  return (
    <div className="min-h-screen bg-[#0b1326] p-4">
      <div className="mx-auto grid min-h-[calc(100vh-32px)] max-w-6xl overflow-hidden rounded-[30px] bg-white shadow-2xl lg:grid-cols-[1.1fr_.9fr]">
        <div className="hidden bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,.45),transparent_35%),linear-gradient(145deg,#0b1326,#131f3b)] p-12 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300">&lt;/&gt;</div>
              <div className="text-xl font-extrabold text-white">Code<span className="text-emerald-300">Proof</span></div>
            </div>
            <h1 className="mt-20 max-w-lg text-5xl font-black leading-tight text-white">Prove your migration, not just your translation.</h1>
            <p className="mt-6 max-w-lg text-slate-300">AI translation is reviewed, compiled, executed and compared against the original program’s behavior.</p>
          </div>
          <div className="text-sm text-slate-400">Secure sign-in powered by Clerk.</div>
        </div>
        <div className="flex items-center justify-center bg-white p-6 dark:bg-[#0f172a] sm:p-10">
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/signup"
            fallbackRedirectUrl="/dashboard"
            appearance={{
              theme: theme === 'dark' ? dark : undefined,
              variables: {
                colorPrimary: '#7c3aed',
                colorBackground: theme === 'dark' ? '#0f172a' : '#ffffff',
              },
              elements: {
                card: 'shadow-none border-0 w-full',
                rootBox: 'w-full max-w-md',
                headerTitle: 'text-slate-950 dark:text-white',
                headerSubtitle: 'text-slate-500 dark:text-slate-400',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
