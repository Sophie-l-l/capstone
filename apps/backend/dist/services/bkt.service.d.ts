export declare const updateBKTExternal: (payload: {
    userId: string;
    kcId: string;
    correct: boolean;
}) => Promise<any>;
export declare const updateBKTLocal: (userId: string, kcName: string, correct: boolean) => Promise<{
    userId: string;
    kcId: string;
    pKnown: number;
    updated: boolean;
}>;
declare const _default: {
    updateBKTExternal: (payload: {
        userId: string;
        kcId: string;
        correct: boolean;
    }) => Promise<any>;
    updateBKTLocal: (userId: string, kcName: string, correct: boolean) => Promise<{
        userId: string;
        kcId: string;
        pKnown: number;
        updated: boolean;
    }>;
};
export default _default;
//# sourceMappingURL=bkt.service.d.ts.map