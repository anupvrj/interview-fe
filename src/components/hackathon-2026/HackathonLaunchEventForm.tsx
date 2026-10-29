"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Loader2, MessageCircle, Sparkles, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppSelect } from "@/components/ui/app-select";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { LaunchEventWelcomePromo } from "@/components/hackathon-2026/LaunchEventWelcomePromo";
import { ProfilePhoneFields } from "@/components/profile/ProfilePhoneFields";
import { LAUNCH_EVENT_FORM, HACKATHON_LAUNCH } from "@/lib/hackathon-2026-content";
import { DEFAULT_PHONE_COUNTRY_CODE } from "@/lib/phone-country-codes";
import { emailValidationMessage, normalizeEmailForStorage } from "@/lib/email-validation";
import { formatPhoneForStorage, isValidPhoneForStorage } from "@/lib/phone-utils";
import { cn } from "@/lib/utils";
import { trackLaunchRegistrationSuccessOnce } from "@/features/hackathon/analytics";
import { hackathonApi, toHackathonError } from "@/features/hackathon/api";
import { useHackathonSlug } from "@/features/hackathon/hooks";
import { HACKATHON_WHATSAPP_COMMUNITY_URL } from "@/features/hackathon/whatsapp-links";

const SUCCESS_REVEAL_MS = 2_500;
const LAUNCH_PHONE_COUNTRY = DEFAULT_PHONE_COUNTRY_CODE;

type LaunchStep = "welcome" | "attended" | "ready" | "register" | "success";
const PROGRESS_STEPS: LaunchStep[] = ["welcome", "attended", "ready", "register"];

type FormState = {
  attended: "" | "yes" | "no";
  ready: "" | "yes" | "nervous";
  name: string;
  email: string;
  profession: "" | "student" | "self_employed" | "working_professional";
  whyAttend: "" | "stay_relevant" | "expert_advice" | "practical_solutions" | "community_launch";
};

const emptyForm = (): FormState => ({
  attended: "",
  ready: "",
  name: "",
  email: "",
  profession: "",
  whyAttend: "",
});

const PRIMARY_BTN =
  "group relative isolate inline-flex h-12 w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl border border-[#3aa0ff] bg-[linear-gradient(135deg,#1273f5_0%,#1f95ff_55%,#35b1ff_100%)] px-6 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-[0_14px_36px_rgba(20,130,255,0.42),inset_0_1px_0_rgba(255,255,255,0.25)] transition hover:brightness-105 active:translate-y-0 disabled:opacity-60";

const inputClass =
  "mt-1.5 w-full min-h-11 rounded-xl border border-[#27547d]/80 bg-[#081a33]/90 px-3.5 text-[15px] text-white placeholder:text-[#6a849e] focus:border-[#3aa6ff] focus:outline-none focus:ring-2 focus:ring-[#3aa6ff]/30";

const launchSelectTriggerClass = (hasError?: boolean) =>
  cn(
    inputClass,
    "h-11 py-0 text-left font-normal shadow-none focus:ring-2",
    "!bg-[#081a33]/90 !text-white [&_svg]:text-[#9eb2ca]",
    "[&_[data-placeholder]]:text-[#6a849e]",
    hasError && inputErrorClass,
  );

const inputErrorClass =
  "border-[#ff8fab]/80 focus:border-[#ff8fab] focus:ring-[#ff8fab]/30";

type RegisterFieldErrors = {
  name?: string;
  phone?: string;
  email?: string;
  profession?: string;
  whyAttend?: string;
};

function validateRegisterFields(
  form: FormState,
  phoneCountryCode: string,
  phoneLocal: string,
): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  const name = form.name.trim();
  if (!name) errors.name = "Enter your full name.";
  else if (name.length < 2) errors.name = "Name must be at least 2 characters.";
  if (!isValidPhoneForStorage(phoneCountryCode, phoneLocal)) {
    errors.phone = "Enter a valid mobile number.";
  }
  const emailErr = emailValidationMessage(form.email);
  if (emailErr) errors.email = emailErr;
  if (!form.profession) errors.profession = "Select your profession.";
  if (!form.whyAttend) errors.whyAttend = "Select why you want to join.";
  return errors;
}

const display = { fontFamily: "var(--font-hk-display), 'Arial Black', sans-serif" };
const mono = { fontFamily: "var(--font-hk-mono), ui-monospace, monospace" };

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="block text-[14px] font-medium leading-snug text-[#dbe9f8]">{children}</span>;
}

function RadioCard({
  name,
  value,
  label,
  hint,
  checked,
  onSelect,
}: Readonly<{ name: string; value: string; label: string; hint?: string; checked: boolean; onSelect: () => void }>) {
  return (
    <label
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all",
        "focus-within:ring-2 focus-within:ring-[#3aa6ff]/60",
        checked
          ? "border-[#3aa6ff] bg-[#0d2550] shadow-[0_0_0_1px_rgba(58,166,255,0.5),0_8px_28px_rgba(30,120,255,0.25)]"
          : "border-[#27547d]/80 bg-[#081a33]/90 hover:border-[#3aa6ff]/60 hover:bg-[#0b2142]",
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onSelect} className="sr-only" />
      <span
        aria-hidden
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
          checked ? "border-[#3aa6ff]" : "border-[#4b6f96] group-hover:border-[#6fc0ff]",
        )}
      >
        <span className={cn("size-2.5 rounded-full bg-[#3aa6ff] transition-transform", checked ? "scale-100" : "scale-0")} />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold text-white">{label}</span>
        {hint ? <span className="block text-xs text-[#8fa6c2]">{hint}</span> : null}
      </span>
    </label>
  );
}

export function HackathonLaunchEventForm({
  id,
  dialogSemantics = false,
  showStepChrome = false,
  embeddedInPage = false,
  onClose,
  className,
}: Readonly<{
  id?: string;
  /** Multi-step launch modal (progress, dialog a11y). */
  dialogSemantics?: boolean;
  /** Progress bar + back nav on a standalone page (same UX as the modal). */
  showStepChrome?: boolean;
  /** Standalone /product-launch — avoid clipping native selects and dropdowns. */
  embeddedInPage?: boolean;
  onClose?: () => void;
  className?: string;
}>) {
  const slug = useHackathonSlug();
  const c = LAUNCH_EVENT_FORM;
  const [step, setStep] = useState<LaunchStep>("welcome");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [phoneLocal, setPhoneLocal] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [registerValidated, setRegisterValidated] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [successReveal, setSuccessReveal] = useState(false);
  const [alreadyHackathonParticipantOpen, setAlreadyHackathonParticipantOpen] = useState(false);

  useEffect(() => {
    if (step !== "success") {
      setSuccessReveal(false);
      return;
    }
    const id = window.setTimeout(() => setSuccessReveal(true), SUCCESS_REVEAL_MS);
    return () => window.clearTimeout(id);
  }, [step]);

  const emailFieldError =
    registerValidated || emailTouched ? fieldErrors.email ?? emailValidationMessage(form.email) : null;
  const nameFieldError = registerValidated ? fieldErrors.name : undefined;
  const phoneFieldError = registerValidated ? fieldErrors.phone : undefined;
  const professionFieldError = registerValidated ? fieldErrors.profession : undefined;
  const whyAttendFieldError = registerValidated ? fieldErrors.whyAttend : undefined;

  const patch = (partial: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...partial }));
    if (registerValidated) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        if ("name" in partial) delete next.name;
        if ("profession" in partial) delete next.profession;
        if ("whyAttend" in partial) delete next.whyAttend;
        if ("email" in partial) delete next.email;
        return next;
      });
    }
    if (error) setError(null);
  };

  const pickAnswer = <T extends string>(field: keyof Pick<FormState, "attended" | "ready">, value: T, next: LaunchStep) => {
    patch({ [field]: value } as Partial<FormState>);
    setError(null);
    window.setTimeout(() => setStep(next), 280);
  };

  const submit = async () => {
    setError(null);
    setEmailTouched(true);
    setRegisterValidated(true);
    const validation = validateRegisterFields(form, LAUNCH_PHONE_COUNTRY, phoneLocal);
    setFieldErrors(validation);
    if (Object.keys(validation).length > 0) return;

    const name = form.name.trim();
    if (!form.attended || !form.ready) {
      setError("Please answer the earlier questions.");
      return;
    }
    if (!form.profession || !form.whyAttend) return;
    const formattedPhone = formatPhoneForStorage(LAUNCH_PHONE_COUNTRY, phoneLocal);
    setBusy(true);
    try {
      await hackathonApi.submitLaunchRegistration(slug, {
        name,
        phone: formattedPhone,
        email: normalizeEmailForStorage(form.email),
        profession: form.profession,
        whyAttend: form.whyAttend,
        attended: form.attended,
        ready: form.ready,
      });
      trackLaunchRegistrationSuccessOnce({ source: embeddedInPage ? "page" : "modal", profession: form.profession });
      setStep("success");
    } catch (e) {
      const apiErr = toHackathonError(e, "Could not register. Please try again.");
      if (apiErr.code === "ALREADY_HACKATHON_PARTICIPANT") {
        setAlreadyHackathonParticipantOpen(true);
        return;
      }
      setError(apiErr.message);
    } finally {
      setBusy(false);
    }
  };

  const waUrl = HACKATHON_WHATSAPP_COMMUNITY_URL.trim();

  const stepIndex = PROGRESS_STEPS.indexOf(step as (typeof PROGRESS_STEPS)[number]);
  const progressIndex = step === "success" ? PROGRESS_STEPS.length : Math.max(0, stepIndex);

  const back: Partial<Record<LaunchStep, LaunchStep>> = {
    attended: "welcome",
    ready: "attended",
    register: "ready",
  };

  const TitleEl = dialogSemantics ? DialogTitle : "h2";
  const SubtitleEl = dialogSemantics ? DialogDescription : "p";
  const ScreenReaderHintEl = dialogSemantics ? DialogDescription : "p";

  const body = (() => {
    if (step === "success") {
      if (!successReveal) {
        return (
          <div className="flex flex-col items-center justify-center py-10 text-center" aria-live="polite" aria-busy="true">
            <Loader2 className="size-10 animate-spin text-[#3aa6ff]" aria-hidden />
            <p className="mt-4 text-sm font-medium text-[#b4c6db]" style={mono}>
              {c.successLoadingMessage}
            </p>
          </div>
        );
      }
      return (
        <div className="flex flex-col items-center px-1 text-center">
          <div
            className="hk-launch-success-check grid size-16 shrink-0 place-items-center rounded-full bg-[#0d3d2a] text-[#6ee7b7] shadow-[0_0_32px_rgba(110,231,183,0.25)] ring-4 ring-[#6ee7b7]/15"
            aria-hidden
          >
            <Check className="size-8" strokeWidth={2.5} />
          </div>
          <TitleEl className="mt-5 max-w-md text-xl font-bold text-white md:text-[1.35rem]" style={display}>
            {c.successTitle}
          </TitleEl>
          <SubtitleEl className="mt-2 max-w-md text-[15px] leading-relaxed text-[#cfdbe8] md:text-base">{c.successBody}</SubtitleEl>
          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hk-btn mt-6 inline-flex h-12 w-full max-w-md items-center justify-center gap-2 text-sm font-semibold"
            >
              <MessageCircle className="size-4" aria-hidden />
              {c.whatsappCta}
              <ExternalLink className="size-3.5 opacity-80" aria-hidden />
            </a>
          ) : null}
        </div>
      );
    }

    if (step === "welcome") {
      return (
        <>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6fc0ff]" style={mono}>
            {HACKATHON_LAUNCH.summaryLabel}
          </p>
          <TitleEl
            className="mt-3 text-[clamp(1.25rem,4.5vw,1.55rem)] font-extrabold leading-[1.15] tracking-[-0.02em]"
            style={display}
            {...(dialogSemantics ? {} : { "aria-label": c.title })}
          >
            {c.titleLines.map((line) => (
              <span
                key={line}
                className="block bg-gradient-to-br from-white via-[#e8f4ff] to-[#5eb8ff] bg-clip-text text-transparent"
              >
                {line}
              </span>
            ))}
          </TitleEl>
          <LaunchEventWelcomePromo />
          <div
            className="mt-4 rounded-2xl border border-[#3aa6ff]/45 bg-[linear-gradient(145deg,rgba(13,37,80,0.95)_0%,rgba(8,26,51,0.88)_100%)] p-4 shadow-[0_0_0_1px_rgba(58,166,255,0.12),inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-5"
            role="group"
            aria-label="Event details"
          >
            <p className="text-[15px] font-semibold leading-snug sm:text-base">
              <span className="inline-block rounded-lg border border-[#ffd56a]/40 bg-[#ffd56a]/12 px-2.5 py-1 font-extrabold tracking-[-0.01em] text-[#ffe9a8] shadow-[0_0_20px_rgba(255,213,106,0.12)]">
                {HACKATHON_LAUNCH.dateLabel}, {HACKATHON_LAUNCH.timeLabel}
              </span>
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-[#b4c6db] sm:text-[15px]">
              <span className="font-semibold text-white">Winners</span>,{" "}
              <span className="font-semibold text-white">product updates</span>, and{" "}
              <span className="font-semibold text-white">career advice from experts</span> — online on{" "}
              <span className="font-bold text-[#6fc0ff]">31 Oct</span>.
            </p>
          </div>
          <SubtitleEl className="sr-only">
            {c.subtitle}. {c.teaserBody}
          </SubtitleEl>
          <button type="button" onClick={() => setStep("attended")} className={cn(PRIMARY_BTN, "mt-6")} style={mono}>
            {c.welcomeCta} <ArrowRight className="size-4" aria-hidden />
          </button>
        </>
      );
    }

    if (step === "attended") {
      return (
        <fieldset>
          <legend className="contents">
            <TitleEl className="text-[1.3rem] font-extrabold leading-tight text-white" style={display}>
              {c.qAttended}
            </TitleEl>
          </legend>
          <ScreenReaderHintEl className="sr-only">Choose yes or no.</ScreenReaderHintEl>
          <div className="mt-5 space-y-3">
            {c.attendedOptions.map((o) => (
              <RadioCard
                key={o.value}
                name="launch-attended"
                value={o.value}
                label={o.label}
                hint={o.value === "yes" ? "Then you know how different it feels" : "Better to try one here first"}
                checked={form.attended === o.value}
                onSelect={() => pickAnswer("attended", o.value, "ready")}
              />
            ))}
          </div>
        </fieldset>
      );
    }

    if (step === "ready") {
      return (
        <fieldset>
          <legend className="contents">
            <TitleEl className="text-[1.3rem] font-extrabold leading-tight text-white" style={display}>
              {c.qReady}
            </TitleEl>
          </legend>
          <ScreenReaderHintEl className="sr-only">Choose an answer.</ScreenReaderHintEl>
          <div className="mt-5 space-y-3">
            {c.readyOptions.map((o) => (
              <RadioCard
                key={o.value}
                name="launch-ready"
                value={o.value}
                label={o.label}
                hint={o.value === "nervous" ? "That's exactly what practice is for" : undefined}
                checked={form.ready === o.value}
                onSelect={() => pickAnswer("ready", o.value, "register")}
              />
            ))}
          </div>
        </fieldset>
      );
    }

    const onRegisterSubmit = (event: FormEvent) => {
      event.preventDefault();
      void submit();
    };

    return (
      <form onSubmit={onRegisterSubmit} noValidate>
        <TitleEl className="text-[1.3rem] font-extrabold leading-tight text-white" style={display}>
          Almost there
        </TitleEl>
        <SubtitleEl className="mt-2 text-[15px] text-[#b4c6db]">
          Share your details so we can send the live link and event updates.
        </SubtitleEl>
        <div className="hk-modal-panel relative z-[1] mt-5 space-y-4 rounded-xl border p-4 sm:p-5">
          <div>
            <FieldLabel>{c.fields.name}</FieldLabel>
            <input
              className={cn(inputClass, nameFieldError && inputErrorClass)}
              autoComplete="name"
              required
              minLength={2}
              aria-invalid={nameFieldError ? true : undefined}
              aria-describedby={nameFieldError ? "launch-name-error" : undefined}
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
            {nameFieldError ? (
              <p id="launch-name-error" role="alert" className="mt-1.5 text-xs font-medium text-[#ff8fab]">
                {nameFieldError}
              </p>
            ) : null}
          </div>
          <div>
            <FieldLabel>{c.fields.phone}</FieldLabel>
            <div className="dark hk-theme">
              <ProfilePhoneFields
                countryCode={LAUNCH_PHONE_COUNTRY}
                fixedCountryCode={LAUNCH_PHONE_COUNTRY}
                hideFixedDialCode
                compact
                fullWidth
                localNumber={phoneLocal}
                savedPhone={null}
                disabled={busy}
                showSaveButton={false}
                onCountryCodeChange={() => undefined}
                onLocalNumberChange={(local) => {
                  setPhoneLocal(local);
                  if (registerValidated) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                onSave={() => undefined}
                className="mt-0"
              />
            </div>
            {phoneFieldError ? (
              <p id="launch-phone-error" role="alert" className="mt-1.5 text-xs font-medium text-[#ff8fab]">
                {phoneFieldError}
              </p>
            ) : null}
          </div>
          <div>
            <FieldLabel>{c.fields.email}</FieldLabel>
            <input
              className={cn(inputClass, emailFieldError && inputErrorClass)}
              type="email"
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              required
              aria-invalid={emailFieldError ? true : undefined}
              aria-describedby={emailFieldError ? "launch-email-error" : undefined}
              value={form.email}
              onBlur={() => setEmailTouched(true)}
              onChange={(e) => patch({ email: e.target.value })}
            />
            {emailFieldError ? (
              <p id="launch-email-error" role="alert" className="mt-1.5 text-xs font-medium text-[#ff8fab]">
                {emailFieldError}
              </p>
            ) : null}
          </div>
          <div>
            <FieldLabel>{c.fields.profession}</FieldLabel>
            <AppSelect
              id="launch-profession"
              variant="hackathon"
              allowEmpty
              emptyLabel="Select…"
              value={form.profession}
              options={c.professionOptions.map((o) => ({ value: o.value, label: o.label }))}
              className={launchSelectTriggerClass(!!professionFieldError)}
              onChange={(value) => patch({ profession: value as FormState["profession"] })}
            />
            {professionFieldError ? (
              <p id="launch-profession-error" role="alert" className="mt-1.5 text-xs font-medium text-[#ff8fab]">
                {professionFieldError}
              </p>
            ) : null}
          </div>
          <div>
            <FieldLabel>{c.fields.whyAttend}</FieldLabel>
            <AppSelect
              id="launch-why-attend"
              variant="hackathon"
              allowEmpty
              emptyLabel="Select…"
              value={form.whyAttend}
              options={c.whyAttendOptions.map((o) => ({ value: o.value, label: o.label }))}
              className={launchSelectTriggerClass(!!whyAttendFieldError)}
              onChange={(value) => patch({ whyAttend: value as FormState["whyAttend"] })}
            />
            {whyAttendFieldError ? (
              <p id="launch-why-error" role="alert" className="mt-1.5 text-xs font-medium text-[#ff8fab]">
                {whyAttendFieldError}
              </p>
            ) : null}
          </div>
        </div>
        {error ? (
          <p className="relative z-[1] mt-3 text-sm text-[#ff8fab]" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={busy} className={cn(PRIMARY_BTN, "relative z-[1] mt-5")} style={mono}>
          {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : c.submitLabel}
          {!busy ? <Sparkles className="size-4 opacity-90" aria-hidden /> : null}
        </button>
      </form>
    );
  })();

  const stepChrome = dialogSemantics || showStepChrome;

  const alreadyParticipantDialog = (
    <AlertDialog
      open={alreadyHackathonParticipantOpen}
      onOpenChange={(open) => {
        if (!open) {
          setAlreadyHackathonParticipantOpen(false);
          onClose?.();
        }
      }}
    >
      <AlertDialogContent className="hk-theme border-[#27547d]/90 bg-[#071426] text-white shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold text-white" style={display}>
            {c.alreadyHackathonParticipantTitle}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[15px] leading-relaxed text-[#b4c6db]">
            {c.alreadyHackathonParticipantBody}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            className={cn(PRIMARY_BTN, "mt-0 h-11 w-full sm:w-auto")}
            style={mono}
            onClick={() => {
              setAlreadyHackathonParticipantOpen(false);
              onClose?.();
            }}
          >
            {c.alreadyHackathonParticipantOk}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (!stepChrome) {
    return (
      <div id={id} className={className}>
        {body}
        {alreadyParticipantDialog}
      </div>
    );
  }

  const showSuccessClose = step === "success" && successReveal;
  const showModalHeader = step !== "success" || showSuccessClose;

  return (
    <div id={id} className={cn("relative", className)}>
      {showModalHeader ? (
        <div className="relative z-[3] flex items-center justify-between px-5 pt-5 sm:px-7 md:px-8">
          {step !== "success" ? (
            <div className="flex items-center gap-1.5" aria-hidden>
              {PROGRESS_STEPS.map((s, i) => (
                <span
                  key={s}
                  className={cn("h-1.5 rounded-full transition-all", i <= progressIndex ? "w-7 bg-[#3aa6ff]" : "w-4 bg-[#1b3c62]")}
                />
              ))}
            </div>
          ) : (
            <span className="min-w-0 flex-1" aria-hidden />
          )}
          {onClose ? (
            <button
              type="button"
              aria-label="Close"
              disabled={busy && step !== "success"}
              onClick={onClose}
              className="ml-auto grid size-8 shrink-0 place-items-center rounded-full text-[#8fa6c2] hover:bg-white/5 hover:text-white disabled:opacity-40"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        key={step}
        className={cn(
          "relative z-[3] px-5 pb-6 pt-4 sm:px-7 md:px-8 md:pb-8",
          embeddedInPage ? "overflow-visible" : "max-h-[calc(90svh-4rem)] overflow-y-auto",
        )}
      >
        {body}
        {back[step] && !busy ? (
          <button
            type="button"
            onClick={() => setStep(back[step]!)}
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#7189a6] hover:text-[#b4c6db]"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> Back
          </button>
        ) : null}
      </div>
      {alreadyParticipantDialog}
    </div>
  );
}
