"use client";

import { useState } from "react";
import type { AxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { contactApi } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const ENTERPRISE_INDUSTRY_OPTIONS = [
  "Education",
  "Training",
  "Placement",
  "Corporate",
  "EdTech",
  "Other",
] as const;

type ContactSalesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ContactSalesDialog({
  open,
  onOpenChange,
}: ContactSalesDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [industry, setIndustry] = useState<string>(
    ENTERPRISE_INDUSTRY_OPTIONS[0],
  );
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setPhone("");
    setEmail("");
    setOrganizationName("");
    setIndustry(ENTERPRISE_INDUSTRY_OPTIONS[0]);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await contactApi.submitEnterpriseSales({
        name,
        phone,
        email,
        organizationName,
        industry,
      });
      toast.success("Message sent", {
        description: "Our team will reach out shortly.",
      });
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      const ax = err as AxiosError<{ message?: string }>;
      const msg =
        ax.response?.data?.message ||
        (err instanceof Error ? err.message : null) ||
        "Could not send message. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact sales</DialogTitle>
          <DialogDescription>
            Share your details and we will get back to you about Enterprise.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-sales-name">Name</Label>
            <Input
              id="contact-sales-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-sales-phone">Phone</Label>
            <Input
              id="contact-sales-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
              placeholder="+91 …"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-sales-email">Email</Label>
            <Input
              id="contact-sales-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-sales-org">Organization name</Label>
            <Input
              id="contact-sales-org"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              required
              autoComplete="organization"
              placeholder="Company or institution"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-sales-industry">Industry</Label>
            <select
              id="contact-sales-industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {ENTERPRISE_INDUSTRY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="min-w-[120px]">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
