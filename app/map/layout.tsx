'use client';

import React from "react"

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
