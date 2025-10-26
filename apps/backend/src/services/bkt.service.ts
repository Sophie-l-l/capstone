const axios = require("axios");
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Keep the external BKT updater (if you have an external service)
export const updateBKTExternal = async (payload: { userId: string; kcId: string; correct: boolean }) => {
  const response = await axios.post("http://localhost:8000/bkt/update", payload);
  return response.data;
};

// Local BKT update logic (Bayesian Knowledge Tracing)
// Parameters: slip (S), guess (G), transition/learn (T)
const DEFAULT_PARAMS = { S: 0.05, G: 0.2, T: 0.1 };

export const updateBKTLocal = async (userId: string, kcName: string, correct: boolean) => {
  // Find KC by name
  const kc = await prisma.knowledgeComponent.findUnique({ where: { name: kcName } });
  if (!kc) throw new Error(`KnowledgeComponent not found: ${kcName}`);

  // Try to find existing BKTState
  let state = await prisma.bKTState.findUnique({ where: { userId_kcId: { userId, kcId: kc.id } } });

  // Defaults if missing
  if (!state) {
    state = await prisma.bKTState.create({ data: { userId, kcId: kc.id, pKnown: 0.2, attempts: 0, corrects: 0 } });
  }

  const { S, G, T } = DEFAULT_PARAMS;
  const Pprev = state.pKnown;

  // Compute posterior based on correctness
  let posterior: number;
  if (correct) {
    // P(know | correct)
    const num = Pprev * (1 - S);
    const den = num + (1 - Pprev) * G;
    posterior = den === 0 ? Pprev : num / den;
  } else {
    // P(know | incorrect)
    const num = Pprev * S;
    const den = num + (1 - Pprev) * (1 - G);
    posterior = den === 0 ? Pprev : num / den;
  }

  // Apply learning (transition)
  const pNew = posterior + (1 - posterior) * T;

  // Update counters — build data object to satisfy Prisma's strict types
  const updateData: any = {
    pKnown: pNew,
    attempts: { increment: 1 },
    lastUpdated: new Date()
  };

  if (correct) {
    updateData.corrects = { increment: 1 };
  }

  const updated = await prisma.bKTState.update({
    where: { userId_kcId: { userId, kcId: kc.id } },
    data: updateData as any
  });

  return { userId, kcId: kc.id, pKnown: updated.pKnown, updated: true };
};

export default { updateBKTExternal, updateBKTLocal };
