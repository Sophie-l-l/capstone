const axios = require("axios");

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

export const updateBKT = async (payload: BKTUpdatePayload): Promise<BKTUpdateResponse> => {
  const response = await axios.post("http://localhost:8000/bkt/update", payload);
  return response.data;
};
