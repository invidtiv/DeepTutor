"use client";

import { useParams } from "next/navigation";

export default function LearningBookPage() {
  const params = useParams<{ bookId: string }>();

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">Learning: {params.bookId}</h1>
      <p className="text-[var(--muted-foreground)] mt-2">Coming soon...</p>
    </div>
  );
}
