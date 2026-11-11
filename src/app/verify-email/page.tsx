'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
function Verify() {
  const params = useSearchParams();
  const [state, setState] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function verify() {
    setBusy(true);
    try {
      const response = await fetch('/api/auth/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: params.get('token') }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setDone(true); setState('Email verified. You can now log in.');
    } catch (e) { setState(e instanceof Error ? e.message : 'Could not verify email. Try again.'); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#f6f6f8] px-6 py-10"><section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-sm"><h1 className="text-3xl font-semibold">Verify your email</h1><p className="my-5">Confirm your email to use your Fluentive demo account. Use synthetic test data only.</p>{state && <p role="status" className="my-5">{state}</p>}{!done && <button disabled={busy || !params.get('token')} onClick={verify} className="rounded-xl bg-[#840A36] px-6 py-3 text-white disabled:opacity-50">{busy ? 'Verifying...' : 'Verify email'}</button>}<Link className="mt-6 block underline" href="/login">Go to login</Link></section></main>;
}
export default function Page() { return <Suspense fallback={<p>Loading...</p>}><Verify /></Suspense>; }
