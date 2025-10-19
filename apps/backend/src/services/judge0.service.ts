const axios = require("axios");

const JUDGE0 = process.env.JUDGE0_API_URL!;
const KEY = process.env.JUDGE0_API_KEY!;

export async function runCode(source_code: string, language_id: number, input: string) {
  try {
    const response = await axios.post(
      `${JUDGE0}/submissions?base64_encoded=false&wait=true`,
      { 
        source_code, 
        language_id, 
        stdin: input,
        cpu_time_limit: 5,
        wall_time_limit: 10,
        memory_limit: 262144 // 256MB in KB
      },
      { 
        headers: { 
          "X-RapidAPI-Key": KEY, 
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          "Content-Type": "application/json"
        },
        timeout: 30000 // 30 second timeout
      }
    );

    return response.data;
  } catch (error: any) {
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
