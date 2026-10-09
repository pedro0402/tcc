import { getToken, postEvents } from "../api/progressClient";
import { EVENTS_KEY, eventStore } from "./events";
import { createEventSync, userIdFromToken, type EventSync } from "./sync";

let sync: EventSync | null = null;

/** Liga o log de eventos: importa o progresso antigo, sincroniza abas e envia ao servidor. */
export function startLearning(): void {
  if (sync) return;
  const store = eventStore();
  store.migrateLegacy();

  // Outra aba gravou eventos: relê o armazenamento.
  window.addEventListener("storage", (e) => {
    if (e.key === EVENTS_KEY) store.invalidate();
  });

  sync = createEventSync({ store, send: postEvents });
  sync.start();
}

/**
 * Chamar depois de um login bem-sucedido. Liga o envio à conta que entrou:
 * o histórico que já estava no navegador não sobe para ela, só o que vier depois.
 */
export function handleLogin(): void {
  const userId = userIdFromToken(getToken());
  if (userId) eventStore().bindSyncOwner(userId);
  void sync?.flush();
}
