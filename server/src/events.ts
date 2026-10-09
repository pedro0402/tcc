import { z } from "zod";

// Esquema dos eventos de aprendizagem. Espelha src/learning/events.ts no cliente.
// Campos desconhecidos são rejeitados (strict) para o servidor não guardar o que
// não conhece. Cada evento é validado sozinho: um evento ruim não derruba o lote.

const text = z.string().min(1).max(80);

export const eventSchema = z
  .object({
    id: text,
    ts: z.string().datetime(),
    approach: z.enum(["ativa", "pbl", "jogo", "gamificacao", "pjbl", "colaborativa"]),
    naps: z.enum(["viewing", "responding", "changing", "constructing", "presenting"]).optional(),
    kind: z.enum([
      "prediction",
      "quiz",
      "operation",
      "problem",
      "game-level",
      "milestone",
      "self-explanation",
      "share",
    ]),
    activityId: text,
    concept: text.optional(),
    structure: z.enum(["stack", "linkedList"]).optional(),
    variant: z.enum(["simples", "dupla", "circular"]).optional(),
    operation: text.optional(),
    correct: z.boolean().optional(),
    confidence: z.number().int().min(0).max(2).optional(),
    hintsUsed: z.number().int().min(0).max(100).optional(),
    attempts: z.number().int().min(0).max(1000).optional(),
    misconception: text.optional(),
    stage: z.enum(["observar", "prever", "fazer", "desafio"]).optional(),
    pair: z.boolean().optional(),
  })
  .strict();

export type EventInput = z.infer<typeof eventSchema>;

/** O corpo precisa ser { events: [...] } com no máximo 100 itens. */
export const eventsBodySchema = z.object({
  events: z.array(z.unknown()).min(1).max(100),
});
