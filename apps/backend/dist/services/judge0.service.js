"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCode = runCode;
const axios = require("axios");
const JUDGE0 = process.env.JUDGE0_API_URL;
const KEY = process.env.JUDGE0_API_KEY;
function toBase64(str) {
    return Buffer.from(str, "utf-8").toString("base64");
}
function fromBase64(str) {
    if (!str)
        return null;
    try {
        return Buffer.from(str, "base64").toString("utf-8");
    }
    catch {
        return str;
    }
}
async function runCode(source_code, language_id, input) {
    try {
        const response = await axios.post(`${JUDGE0}/submissions?base64_encoded=true&wait=true`, {
            source_code: toBase64(source_code),
            language_id,
            stdin: toBase64(input),
            cpu_time_limit: 5,
            wall_time_limit: 10,
            memory_limit: 262144 // 256MB in KB
        }, {
            headers: {
                "X-RapidAPI-Key": KEY,
                "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
                "Content-Type": "application/json"
            },
            timeout: 30000 // 30 second timeout
        });
        // Decode base64 outputs from Judge0
        const data = response.data;
        return {
            ...data,
            stdout: fromBase64(data.stdout),
            stderr: fromBase64(data.stderr),
            compile_output: fromBase64(data.compile_output),
            message: fromBase64(data.message)
        };
    }
    catch (error) {
        console.error("Judge0 API error:", error.response?.data || error.message);
        // Return a standardized error response
        return {
            status: { id: 11, description: "Runtime Error" },
            status_id: 11,
            stdout: null,
            stderr: error.response?.data?.message || "Code execution failed",
            time: null,
            memory: null,
            compile_output: null
        };
    }
}
//# sourceMappingURL=judge0.service.js.map