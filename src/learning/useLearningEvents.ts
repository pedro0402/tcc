import { useSyncExternalStore } from "react";
import { getEvents, subscribeEvents, type LearningEvent } from "./events";

/** Lista de eventos que se atualiza sozinha quando algo é registrado. */
export function useLearningEvents(): readonly LearningEvent[] {
  return useSyncExternalStore(subscribeEvents, getEvents, getEvents);
}
