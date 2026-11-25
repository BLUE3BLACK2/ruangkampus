"use client";

import { useSyncExternalStore } from "react";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  initialized: boolean;
}

type Listener = () => void;

let state: AuthState = {
  user: null,
  initialized: false,
};

const listeners = new Set<Listener>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

function getServerSnapshot(): AuthState {
  return {
    user: null,
    initialized: false,
  };
}

export function setAuth(user: User) {
  state = {
    user,
    initialized: true,
  };

  emitChange();
}

export function clearAuth() {
  state = {
    user: null,
    initialized: true,
  };

  emitChange();
}

export function setAuthInitialized() {
  state = {
    ...state,
    initialized: true,
  };

  emitChange();
}

export function useAuthStore<T>(
  selector: (state: AuthState) => T
): T {
  const currentState = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return selector(currentState);
}