"use client";

import { useSyncExternalStore } from "react";

import {
  clearAllStoredRoadmapProgress,
  clearLegacyUnscopedRoadmapProgress,
} from "@/lib/roadmap/prerequisites";
import { createClientIfConfigured } from "@/lib/supabase/client";

type AuthSnapshot = {
  userId: string | null;
  ready: boolean;
};

const SERVER_SNAPSHOT: AuthSnapshot = {
  userId: null,
  ready: false,
};

let snapshot: AuthSnapshot = {
  userId: null,
  ready: false,
};

const listeners = new Set<() => void>();
let authSubscribed = false;
let unsubscribeAuth: (() => void) | null = null;

function emitChange() {
  listeners.forEach((listener) => listener());
}

function ensureAuthSubscription() {
  if (authSubscribed || typeof window === "undefined") {
    return;
  }

  const supabase = createClientIfConfigured();

  if (!supabase) {
    snapshot = { userId: null, ready: true };
    authSubscribed = true;
    emitChange();
    return;
  }

  authSubscribed = true;

  void supabase.auth.getSession().then(({ data }) => {
    clearLegacyUnscopedRoadmapProgress();

    snapshot = {
      userId: data.session?.user.id ?? null,
      ready: true,
    };
    emitChange();
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      clearAllStoredRoadmapProgress();
    } else {
      clearLegacyUnscopedRoadmapProgress();
    }

    snapshot = {
      userId: session?.user.id ?? null,
      ready: true,
    };
    emitChange();
  });

  unsubscribeAuth = () => {
    subscription.unsubscribe();
    authSubscribed = false;
    unsubscribeAuth = null;
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  ensureAuthSubscription();

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0 && unsubscribeAuth) {
      unsubscribeAuth();
    }
  };
}

function getSnapshot(): AuthSnapshot {
  return snapshot;
}

function getServerSnapshot(): AuthSnapshot {
  return SERVER_SNAPSHOT;
}

export function useAuthSession() {
  const auth = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    userId: auth.userId,
    ready: auth.ready,
    isAuthenticated: Boolean(auth.userId),
  };
}
