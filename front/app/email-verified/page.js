"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import toast from "../utils/toast";
import { resendVerificationEmail } from "../services/authService";
import { useLanguage } from "../context/LanguageContext";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSwitcher from "../components/LanguageSwitcher";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";

const STATUS_CONTENT = {
  success: {
    icon: CheckCircleIcon,
    tone: "emerald",
    titleKey: "auth.emailVerifiedSuccessTitle",
    descKey: "auth.emailVerifiedSuccessDesc",
    canResend: false,
  },
  already: {
    icon: CheckCircleIcon,
    tone: "sky",
    titleKey: "auth.emailVerifiedAlreadyTitle",
    descKey: "auth.emailVerifiedAlreadyDesc",
    canResend: false,
  },
  expired: {
    icon: ClockIcon,
    tone: "amber",
    titleKey: "auth.emailVerifiedExpiredTitle",
    descKey: "auth.emailVerifiedExpiredDesc",
    canResend: true,
  },
  invalid: {
    icon: ExclamationTriangleIcon,
    tone: "red",
    titleKey: "auth.emailVerifiedInvalidTitle",
    descKey: "auth.emailVerifiedInvalidDesc",
    canResend: true,
  },
};

const TONE_CLASSES = {
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  red: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
};

function EmailVerifiedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, isRtl } = useLanguage();

  const status = searchParams.get("status");
  const content = STATUS_CONTENT[status] || STATUS_CONTENT.invalid;
  const StatusIcon = content.icon;

  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState("");

  const handleResend = async (event) => {
    event.preventDefault();
    setResendError("");
    setResent(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setResendError(t("auth.emailVerifiedResendInvalidEmail"));
      return;
    }

    setResending(true);

    try {
      await resendVerificationEmail(email);
      setResent(true);
      toast.success(t("auth.emailVerifiedResendSuccess"));
    } catch (error) {
      if (error?.status === 429) {
        setResendError(t("auth.emailVerifiedResendRateLimited"));
      } else {
        setResendError(t("auth.emailVerifiedResendError"));
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-12 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full mx-auto flex items-center justify-between gap-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeftIcon className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
          {t("auth.backToLogin")}
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-md w-full mx-auto my-12">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mb-5 ${TONE_CLASSES[content.tone]}`}
          >
            <StatusIcon className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            {t(content.titleKey)}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            {t(content.descKey)}
          </p>

          {!content.canResend && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => router.push("/login")}
              >
                {t("auth.signInBtn")}
              </Button>
            </div>
          )}

          {content.canResend && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                {t("auth.emailVerifiedResendHeading")}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 mb-4 leading-relaxed">
                {t("auth.emailVerifiedResendDesc")}
              </p>

              {resent ? (
                <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
                  {t("auth.emailVerifiedResendSuccess")}
                </div>
              ) : (
                <form onSubmit={handleResend} className="space-y-4" noValidate>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      {t("auth.emailLabel")}
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                      placeholder={t("auth.emailPlaceholder")}
                      required
                    />
                  </div>

                  {resendError && (
                    <p className="text-xs text-red-600 dark:text-red-400">{resendError}</p>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={resending}
                    className="w-full"
                  >
                    {resending
                      ? t("auth.emailVerifiedResending")
                      : t("auth.emailVerifiedResendBtn")}
                  </Button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>

      <div className="text-center text-xs text-slate-400 dark:text-slate-500">
        © {new Date().getFullYear()} EduSpace · CSFT Tunisie
      </div>
    </div>
  );
}

export default function EmailVerifiedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <EmailVerifiedContent />
    </Suspense>
  );
}
