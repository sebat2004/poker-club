"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, CreditCard, X } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";
import { useSession } from "@/app/lib/auth-client";

const PAYMENT_FORM_URL = "https://forms.gle/4UGZHhFw7scpNVwA6";

type ProfileStatus = {
  isPaidMember: boolean;
};

export default function MembershipPaymentAlert() {
  const { data: session } = useSession();
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      setProfileStatus(null);
      setOpen(false);
      return;
    }

    let isCurrent = true;

    fetch("/api/profiles/me")
      .then((response) => {
        if (!response.ok) return null;
        return response.json() as Promise<ProfileStatus>;
      })
      .then((data) => {
        if (isCurrent) setProfileStatus(data);
      })
      .catch(() => {
        if (isCurrent) setProfileStatus(null);
      });

    return () => {
      isCurrent = false;
    };
  }, [session?.user]);

  useEffect(() => {
    if (profileStatus?.isPaidMember === false) {
      setOpen(true);
    }
  }, [profileStatus?.isPaidMember]);

  return (
    <ToastPrimitive.Provider swipeDirection="right" duration={9000}>
      <ToastPrimitive.Root
        open={open}
        onOpenChange={setOpen}
        className="fixed inset-x-3 bottom-3 z-[100] rounded-2xl border border-primary/35 bg-[#0e0e14]/95 p-4 text-foreground shadow-[0_-18px_60px_rgba(0,0,0,0.55),0_0_28px_rgba(220,68,5,0.14)] backdrop-blur-md outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4 data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-4 data-[state=closed]:fade-out-0 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[24rem] sm:rounded-xl sm:shadow-[0_18px_60px_rgba(0,0,0,0.55),0_0_28px_rgba(220,68,5,0.14)] sm:data-[state=open]:slide-in-from-right-4 sm:data-[state=closed]:slide-out-to-right-4"
      >
        <div className="flex gap-3">
          <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            <CreditCard className="size-4" strokeWidth={1.75} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <ToastPrimitive.Title className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-primary">
                Membership required
              </ToastPrimitive.Title>

              <ToastPrimitive.Close
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                aria-label="Dismiss membership notice"
              >
                <X className="size-3.5" strokeWidth={1.75} />
              </ToastPrimitive.Close>
            </div>

            <ToastPrimitive.Description className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Our records show you&rsquo;re not a member yet. Submit dues to unlock
              member tools and GTO Wizard rooms.
            </ToastPrimitive.Description>

            <ToastPrimitive.Action asChild altText="Open payment form">
              <a
                href={PAYMENT_FORM_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_18px_rgba(220,68,5,0.35)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0e14]"
              >
                Pay dues
                <ArrowUpRight className="size-3.5" strokeWidth={1.75} />
              </a>
            </ToastPrimitive.Action>
          </div>
        </div>
      </ToastPrimitive.Root>
      <ToastPrimitive.Viewport />
    </ToastPrimitive.Provider>
  );
}

export { PAYMENT_FORM_URL };
