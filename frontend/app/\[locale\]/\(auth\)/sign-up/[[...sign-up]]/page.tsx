import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            Join Vexa.ai
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Create your account to get started
          </p>
        </div>

        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-2xl',
            },
          }}
        />
      </div>
    </div>
  );
}
