import { describe, expect, it, vi } from "vitest";
import {
  EVENTS_KEY,
  MAX_EVENTS,
  createEventStore,
  legacyToEvents,
  memoryStorage,
  type NewEvent,
} from "./events";

const base: NewEvent = {
  approach: "ativa",
  kind: "prediction",
  activityId: "stack:push",
  structure: "stack",
  operation: "push",
  correct: true,
};

const make = () => {
  let n = 0;
  const storage = memoryStorage();
  const store = createEventStore(storage, {
    now: () => new Date(Date.UTC(2026, 9, 9, 12, 0, n)),
    newId: () => `e${++n}`,
  });
  return { storage, store };
};

describe("createEventStore", () => {
  it("registra com id e data gerados e devolve o evento completo", () => {
    const { store } = make();
    const ev = store.log(base);
    expect(ev.id).toBe("e1");
    expect(ev.ts).toBe("2026-10-09T12:00:01.000Z");
    expect(store.getEvents()).toEqual([ev]);
  });

  it("respeita id e ts informados", () => {
    const { store } = make();
    const ev = store.log({ ...base, id: "meu-id", ts: "2026-01-01T00:00:00.000Z" });
    expect(ev.id).toBe("meu-id");
    expect(ev.ts).toBe("2026-01-01T00:00:00.000Z");
  });

  it("persiste e recarrega por outro armazém sobre o mesmo storage", () => {
    const { storage, store } = make();
    store.log(base);
    const outro = createEventStore(storage);
    expect(outro.getEvents()).toHaveLength(1);
  });

  it("mantém só os últimos MAX_EVENTS", () => {
    const { store } = make();
    for (let i = 0; i < MAX_EVENTS + 5; i++) store.log({ ...base, id: `x${i}` });
    const events = store.getEvents();
    expect(events).toHaveLength(MAX_EVENTS);
    expect(events[0].id).toBe("x5");
    expect(events[events.length - 1].id).toBe(`x${MAX_EVENTS + 4}`);
  });

  it("o snapshot é estável até algo mudar (exigência do React)", () => {
    const { store } = make();
    store.log(base);
    expect(store.getEvents()).toBe(store.getEvents());
    const antes = store.getEvents();
    store.log(base);
    expect(store.getEvents()).not.toBe(antes);
  });

  it("avisa os ouvintes a cada mudança e para depois de cancelar", () => {
    const { store } = make();
    const fn = vi.fn();
    const off = store.subscribe(fn);
    store.log(base);
    store.log(base);
    expect(fn).toHaveBeenCalledTimes(2);
    off();
    store.log(base);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("ignora lixo no armazenamento", () => {
    const storage = memoryStorage();
    storage.setItem(EVENTS_KEY, "{isso não é json");
    expect(createEventStore(storage).getEvents()).toEqual([]);
    storage.setItem(EVENTS_KEY, JSON.stringify([{ id: 1 }, null, "x", { id: "a", ts: "t", approach: "ativa", kind: "quiz", activityId: "q" }]));
    expect(createEventStore(storage).getEvents()).toHaveLength(1);
  });

  it("invalidate relê o armazenamento (mudança vinda de outra aba)", () => {
    const { storage, store } = make();
    store.log(base);
    storage.setItem(EVENTS_KEY, "[]");
    expect(store.getEvents()).toHaveLength(1); // ainda no cache
    store.invalidate();
    expect(store.getEvents()).toHaveLength(0);
  });

  it("continua funcionando se o armazenamento recusar a gravação", () => {
    const storage = memoryStorage();
    storage.setItem = () => {
      throw new Error("cheio");
    };
    const store = createEventStore(storage);
    expect(() => store.log(base)).not.toThrow();
    expect(store.getEvents()).toHaveLength(1);
  });
});

describe("envio ao servidor (pending / markSynced)", () => {
  it("tudo é pendente no começo; depois só o que veio após o cursor", () => {
    const { store } = make();
    const a = store.log(base);
    const b = store.log(base);
    expect(store.pending().map((e) => e.id)).toEqual([a.id, b.id]);
    store.markSynced(a.id);
    expect(store.pending().map((e) => e.id)).toEqual([b.id]);
    const c = store.log(base);
    expect(store.pending().map((e) => e.id)).toEqual([b.id, c.id]);
    store.markSynced(c.id);
    expect(store.pending()).toEqual([]);
  });

  it("cursor que saiu do teto: o que resta é tudo pendente", () => {
    const { store } = make();
    store.log({ ...base, id: "velho" });
    store.markSynced("velho");
    for (let i = 0; i < MAX_EVENTS; i++) store.log({ ...base, id: `n${i}` });
    expect(store.getEvents().some((e) => e.id === "velho")).toBe(false);
    expect(store.pending()).toHaveLength(MAX_EVENTS);
  });
});

describe("migração do progresso antigo", () => {
  const legacy = {
    completedOperations: [{ structure: "stack", operation: "push", completedAt: "2026-09-01T10:00:00.000Z" }],
    predictions: [{ structure: "linkedList", operation: "inserirInicio", isCorrect: false, answeredAt: "2026-09-01T10:00:05.000Z" }],
    quizAttempts: [{ questionId: "stack-lifo", isCorrect: true, answeredAt: "2026-09-01T09:00:00.000Z" }],
  };

  it("converte os três tipos de registro", () => {
    const evs = legacyToEvents(legacy);
    expect(evs.map((e) => e.kind).sort()).toEqual(["operation", "prediction", "quiz"]);
    const q = evs.find((e) => e.kind === "quiz")!;
    expect(q).toMatchObject({ activityId: "stack-lifo", correct: true, naps: "responding" });
    const p = evs.find((e) => e.kind === "prediction")!;
    expect(p).toMatchObject({ structure: "linkedList", operation: "inserirInicio", correct: false });
  });

  it("importa uma vez, em ordem de data, sem apagar o dado antigo", () => {
    const { storage, store } = make();
    storage.setItem("ds-visualizer-progress-v1", JSON.stringify(legacy));
    expect(store.migrateLegacy()).toBe(3);
    expect(store.getEvents().map((e) => e.kind)).toEqual(["quiz", "operation", "prediction"]);
    expect(storage.getItem("ds-visualizer-progress-v1")).not.toBeNull();
    expect(store.migrateLegacy()).toBe(0); // segunda chamada não repete
    expect(store.getEvents()).toHaveLength(3);
  });

  it("não duplica se o marcador de migração se perder", () => {
    const { storage, store } = make();
    storage.setItem("ds-visualizer-progress-v1", JSON.stringify(legacy));
    store.migrateLegacy();
    storage.removeItem("ds-visualizer-learning-migrated-v1");
    expect(store.migrateLegacy()).toBe(0);
    expect(store.getEvents()).toHaveLength(3);
  });

  it("sem dado antigo ou com dado ilegível, não quebra", () => {
    const a = make();
    expect(a.store.migrateLegacy()).toBe(0);
    const b = make();
    b.storage.setItem("ds-visualizer-progress-v1", "{quebrado");
    expect(b.store.migrateLegacy()).toBe(0);
  });

  it("estrutura desconhecida vira evento sem estrutura", () => {
    const evs = legacyToEvents({ completedOperations: [{ structure: "arvore", operation: "x", completedAt: "2026-01-01T00:00:00.000Z" }] });
    expect(evs[0].structure).toBeUndefined();
  });
});
