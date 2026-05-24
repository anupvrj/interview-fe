"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "default" | "destructive";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "default",
  isLoading = false,
  icon,
}: ConfirmationDialogProps) {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Confirmation action failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const defaultIcon =
    variant === "destructive" ? (
      <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
        <AlertTriangle className="w-6 h-6 text-white" />
      </div>
    ) : (
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-muted text-primary shadow-card">
        <AlertTriangle className="h-6 w-6" />
      </div>
    );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={`sm:max-w-[425px] ${
          variant === "destructive"
            ? "border-red-200"
            : "border-border"
        }`}
      >
        <AlertDialogHeader>
          <div className="flex flex-col items-center text-center">
            {icon !== undefined ? icon : defaultIcon}
            <AlertDialogTitle className="text-xl font-bold mt-2">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base mt-2 text-gray-600">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-3 mt-4">
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              size="lg"
              disabled={isProcessing || isLoading}
              className="min-w-[100px]"
            >
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            asChild
          >
            <Button
              variant={variant === "destructive" ? "destructive" : "default"}
              size="lg"
              disabled={isProcessing || isLoading}
              className={
                variant === "destructive"
                  ? "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all min-w-[100px]"
                  : "bg-primary hover:bg-slate-900 text-white shadow-lg hover:shadow-xl transition-all min-w-[100px]"
              }
            >
              {isProcessing || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook for easier usage
export function useConfirmationDialog() {
  const [open, setOpen] = React.useState(false);
  const [config, setConfig] = React.useState<Omit<
    ConfirmationDialogProps,
    "open" | "onOpenChange"
  > | null>(null);

  const showDialog = React.useCallback(
    (dialogConfig: Omit<ConfirmationDialogProps, "open" | "onOpenChange">) => {
      setConfig(dialogConfig);
      setOpen(true);
    },
    []
  );

  const Dialog = React.useMemo(() => {
    if (!config) return null;
    return (
      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        {...config}
      />
    );
  }, [config, open]);

  return {
    showDialog,
    Dialog,
  };
}

