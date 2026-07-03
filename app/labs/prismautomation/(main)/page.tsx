import { Suspense } from 'react';
import ResumeBuilder from '@/components/ResumeBuilder';

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-background text-foreground">
      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center text-gray-500">Loading Application...</div>}>
        <ResumeBuilder />
      </Suspense>
    </main>
  );
}
