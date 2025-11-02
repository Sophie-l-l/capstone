"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBKTLocal = exports.updateBKTExternal = void 0;
const axios = require("axios");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Keep the external BKT updater (if you have an external service)
const updateBKTExternal = async (payload) => {
    const response = await axios.post("http://localhost:8000/bkt/update", payload);
    return response.data;
};
exports.updateBKTExternal = updateBKTExternal;
// Local BKT update logic (Bayesian Knowledge Tracing)
// Parameters: slip (S), guess (G), transition/learn (T)
const DEFAULT_PARAMS = { S: 0.05, G: 0.2, T: 0.1 };
const updateBKTLocal = async (userId, kcName, correct) => {
    // Find KC by name
    const kc = await prisma.knowledgeComponent.findUnique({ where: { name: kcName } });
    if (!kc)
        throw new Error(`KnowledgeComponent not found: ${kcName}`);
    // Try to find existing BKTState
    let state = await prisma.bKTState.findUnique({ where: { userId_kcId: { userId, kcId: kc.id } } });
    // Defaults if missing
    if (!state) {
        state = await prisma.bKTState.create({ data: { userId, kcId: kc.id, pKnown: 0.2, attempts: 0, corrects: 0 } });
    }
    const { S, G, T } = DEFAULT_PARAMS;
    const Pprev = state.pKnown;
    // Compute posterior based on correctness
    let posterior;
    if (correct) {
        // P(know | correct)
        const num = Pprev * (1 - S);
        const den = num + (1 - Pprev) * G;
        posterior = den === 0 ? Pprev : num / den;
    }
    else {
        // P(know | incorrect)
        const num = Pprev * S;
        const den = num + (1 - Pprev) * (1 - G);
        posterior = den === 0 ? Pprev : num / den;
    }
    // Apply learning (transition)
    const pNew = posterior + (1 - posterior) * T;
    // Update counters — build data object to satisfy Prisma's strict types
    const updateData = {
        pKnown: pNew,
        attempts: { increment: 1 },
        lastUpdated: new Date()
    };
    if (correct) {
        updateData.corrects = { increment: 1 };
    }
    const updated = await prisma.bKTState.update({
        where: { userId_kcId: { userId, kcId: kc.id } },
        data: updateData
    });
    return { userId, kcId: kc.id, pKnown: updated.pKnown, updated: true };
};
exports.updateBKTLocal = updateBKTLocal;
exports.default = { updateBKTExternal: exports.updateBKTExternal, updateBKTLocal: exports.updateBKTLocal };
//# sourceMappingURL=bkt.service.js.map