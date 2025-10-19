"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBKT = void 0;
const axios = require("axios");
const updateBKT = async (payload) => {
    const response = await axios.post("http://localhost:8000/bkt/update", payload);
    return response.data;
};
exports.updateBKT = updateBKT;
//# sourceMappingURL=bkt.service.js.map