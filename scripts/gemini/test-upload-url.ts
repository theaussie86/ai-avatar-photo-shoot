
import { GoogleGenAI } from "@google/genai";
import { config } from "dotenv";
import path from "path";
import fs from "fs";

// Load environment variables
config({ path: path.resolve(process.cwd(), ".env.local") });

async function testResumableUpload() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API Key found in .env.local");
    return;
  }

  // We need to use fetch directly because the SDK might abstract the URL away
  // 1. Initiate Resumable Upload
  const startUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
  
  const metadata = {
    file: {
        display_name: "test_large_file.txt"
    }
  };

  const startResponse = await fetch(startUrl, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": "10",
      "X-Goog-Upload-Header-Content-Type": "text/plain",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(metadata)
  });

  const uploadUrl = startResponse.headers.get("x-goog-upload-url");
  const status = startResponse.status;

  console.log("Start Status:", status);
  console.log("Upload URL:", uploadUrl);

  if (!uploadUrl) {
    console.error("Failed to get upload URL");
    console.error(await startResponse.text());
    return;
  }

  // 2. Simulate Client-Side Upload (NO API KEY)
  // We use the uploadUrl directly. It should contain the session ID but NOT the API key in a visible param?
  // Wait, the documentation says the uploadUrl usually INCLUDES the key or signature.
  // Let's check if the URL contains the key.
  
  if (uploadUrl.includes(apiKey)) {
      console.warn("WARNING: The upload URL contains the API Key! This is NOT safe for client-side usage.");
  } else {
      console.log("SUCCESS: The upload URL does NOT contain the API Key.");
  }

  // 3. Try to upload to it
  console.log("Attempting upload to signed URL...");
  const putResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
          "Content-Length": "10",
          "X-Goog-Upload-Offset": "0",
          "X-Goog-Upload-Command": "upload, finalize"
      },
      body: "helloworld" // 10 bytes
  });

  console.log("Upload Status:", putResponse.status);
  const result = await putResponse.json();
  console.log("Upload Result:", result);
}

testResumableUpload();
