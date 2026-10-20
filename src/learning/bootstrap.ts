import { auth, getToken, postEvents } from "../api/progressClient";
import { EVENTS_KEY, eventStore } from "./events";
import {
  bindExistingSession,
  createEventSync,
  releaseSyncOwner,
  userIdFromToken,
  type EventSync,
} from "./sync";

let sync: EventSync | null = null;

/** Liga o log de eventos: importa o progresso antigo, sincroniza abas e envia ao servidor. */
export function startLearning(): void {
  if (sync) return;
  const store = eventStore();
  store.migrateLegacy();
  // Token de antes do recurso de "dono": liga já, antes do primeiro envio.
  bindExistingSession(store, getToken());

  // Outra aba gravou eventos: relê o armazenamento.
  window.addEventListener("storage", (e) => {
    if (e.key === EVENTS_KEY) store.invalidate();
  });

  // Sessão vencida (refresh recusado): trata como saída.
  auth().subscribe((change) => {
    if (change === "expired") releaseSyncOwner(store);
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

/**
 * Sair: tenta enviar o que é da conta (até 3 s), encerra a sessão e desliga o
 * cursor da conta, para o uso anônimo seguinte não subir para ela.
 */
export async function handleLogout(): Promise<void> {
  if (sync) {
    await Promise.race([sync.flush(), new Promise((r) => setTimeout(r, 3000))]);
  }
  auth().logout();
  releaseSyncOwner(eventStore());
}
