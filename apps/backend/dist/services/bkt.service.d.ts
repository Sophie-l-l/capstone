interface BKTUpdatePayload {
    userId: string;
    kcId: string;
    correct: boolean;
}
interface BKTUpdateResponse {
    userId: string;
    kcId: string;
    pKnown: number;
    updated: boolean;
}
export declare const updateBKT: (payload: BKTUpdatePayload) => Promise<BKTUpdateResponse>;
export {};
//# sourceMappingURL=bkt.service.d.ts.map