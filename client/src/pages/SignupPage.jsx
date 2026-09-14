import { SignUp } from '@clerk/react';
import { dark } from '@clerk/ui/themes';
import { useTheme } from '../context/ThemeContext';

export default function SignupPage() {
  const { theme } = useTheme();
  return (
    <div className="min-h-screen bg-[#0b1326] p-4">
      <div className="mx-auto flex min-h-[calc(100vh-32px)] max-w-5xl items-center justify-center rounded-[30px] bg-white p-5 shadow-2xl dark:bg-[#0f172a] sm:p-10">
        <SignUp
          routing="path"
          path="/signup"
          signInUrl="/login"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            theme: theme === 'dark' ? dark : undefined,
            variables: {
              colorPrimary: '#7c3aed',
              colorBackground: theme === 'dark' ? '#0f172a' : '#ffffff',
            },
            elements: {
              card: 'shadow-none border-0',
              headerTitle: 'text-slate-950 dark:text-white',
              headerSubtitle: 'text-slate-500 dark:text-slate-400',
            },
          }}
        />
      </div>
    </div>
  );
}
