import { Form } from 'react-router';
import { RoleNav } from '~/components/RoleNav';
import type { Route } from './+types/onboarding';

export function meta(_: Route.MetaArgs) {
  return [{ title: "You're Set — LeaderFactor" }];
}

export default function Onboarding(_: Route.ComponentProps) {
  return (
    <main className="min-h-screen">
      <RoleNav />

      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#1A2744] text-white text-2xl mb-8">
          ✓
        </div>

        <p className="text-sm uppercase tracking-widest text-stone-500 mb-4">■ YOU'RE ALL SET</p>
        <h1 className="text-4xl font-serif font-bold mb-4">
          Your practice is <em>locked in.</em>
        </h1>
        <p className="text-stone-600 mb-4 leading-relaxed">
          Every week you'll get a short check-in email, where you'll report whether you practiced your habit as planned, partially as planned, or not at all.
        </p>
        <p className="text-stone-600 mb-4 leading-relaxed">
          Weeks you miss show up as open dots in your history, just to give you data on your progress.
        </p>
        <p className="text-stone-600 mb-10 leading-relaxed">
          Your manager sees a summary every two weeks to allow them to support you in your practice.
        </p>

        <div className="bg-white border border-stone-200 rounded-lg p-6 text-left mb-10">
          <p className="text-sm uppercase tracking-widest text-stone-400 mb-3">■ WHAT HAPPENS NEXT</p>
          <ul className="space-y-3 text-sm text-stone-600">
            <li className="flex gap-3">
              <span className="text-[#4A6CF7] font-bold shrink-0">1</span>
              <span>You'll receive a weekly check-in email every Monday morning.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#4A6CF7] font-bold shrink-0">2</span>
              <span>One tap to log how it went. You can add a note if you want — no pressure.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#4A6CF7] font-bold shrink-0">3</span>
              <span>After each check-in, you'll see your full dot-chart history — the honest picture of your practice.</span>
            </li>
          </ul>
        </div>

        <Form method="post" action="/commitment">
          <input type="hidden" name="_action" value="reset" />
          <button
            type="submit"
            className="text-sm text-stone-400 hover:text-stone-600 underline transition-colors"
          >
            Change my practice focus
          </button>
        </Form>
      </div>
    </main>
  );
}
