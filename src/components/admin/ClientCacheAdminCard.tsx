"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { adminApi, configApi } from "@/lib/api";
import { applyClientCacheVersion } from "@/lib/client-cache-sync";
import { formatDate } from "@/lib/utils";

export function ClientCacheAdminCard() {
  const queryClient = useQueryClient();
  const [version, setVersion] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalidating, setInvalidating] = useState(false);

  const loadVersion = useCallback(async () => {
    try {
      const data = await configApi.getClientCacheVersion();
      setVersion(data.version);
      setUpdatedAt(data.updatedAt);
    } catch {
      toast.error("Could not load client cache version");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVersion();
  }, [loadVersion]);

  const handleInvalidate = async () => {
    try {
      setInvalidating(true);
      const data = await adminApi.invalidateClientCache();
      setVersion(data.version);
      setUpdatedAt(data.updatedAt);
      applyClientCacheVersion(queryClient, data.version);
      toast.success("Client cache cleared for all users");
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to clear client cache";
      toast.error(message);
    } finally {
      setInvalidating(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-card">
      <CardHeader className="border-b border-border/60 px-5 py-4">
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Client cache
        </CardTitle>
        <CardDescription>
          Force all signed-in users to refresh cached dashboard data on their
          next visit or within about 60 seconds.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading cache version…
            </span>
          ) : (
            <>
              <p>
                Current version:{" "}
                <span className="font-medium text-foreground">{version}</span>
              </p>
              {updatedAt ? (
                <p>Last updated: {formatDate(updatedAt)}</p>
              ) : null}
            </>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => void handleInvalidate()}
          disabled={loading || invalidating}
        >
          {invalidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Clearing…
            </>
          ) : (
            "Clear client cache"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
