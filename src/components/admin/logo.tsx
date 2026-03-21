"use client";

import Image from "next/image";
import Link from "next/link";

export function VisonAdminLogo({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Link href="/overview" className="inline-flex items-center justify-center">
        <Image src="/icon.svg" alt="Vison Admin" width={40} height={40} priority />
      </Link>
    );
  }

  return (
    <Link href="/overview" className="inline-flex items-center gap-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-2 shadow-[0_16px_30px_rgba(16,196,105,0.12)] backdrop-blur">
        <Image src="/icon.svg" alt="Vison Admin" width={30} height={30} priority />
      </div>
      <div>
        <div className="block dark:hidden">
          <Image src="/logo.svg" alt="Vison" width={108} height={30} priority />
        </div>
        <div className="hidden dark:block">
          <Image src="/logo_dark.svg" alt="Vison" width={108} height={30} priority />
        </div>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-dim)]">
          Admin Mission Control
        </p>
      </div>
    </Link>
  );
}
