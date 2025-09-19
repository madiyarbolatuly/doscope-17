// api/folders.ts
import axios from "axios";

export const createFolderApi = async (
  token: string,
  payload: { name: string; parent_id: number | null }
) => {
  const { data } = await axios.post(
    "http://77.245.107.136:8000/v2/api/v2/folders/",   // ← EXACT swagger path
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
  return data;
};
