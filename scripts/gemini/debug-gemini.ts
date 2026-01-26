import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY environment variable is not set.");
        process.exit(1);
    }

    console.log("✅ API Key found.");
    const client = new GoogleGenAI({ apiKey });

    // Test Model Name
    const modelName = "gemini-2.5-flash"; 
    console.log(`📡 Testing model connection: ${modelName}`);

    // CONFIG
    const imageConfig = {
        aspectRatio: "1:1",
    };

    try {
        // 1. Simple text test to check model availability generally
        console.log("\n--- TEST 1: Simple Text Generation ---");
        const textResult = await client.models.generateContent({
            model: modelName,
            contents: [{ role: 'user', parts: [{ text: "Hello, are you online?" }] }],
        });
        console.log("✅ Text Generation Success:", textResult.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (e: any) {
        console.error("❌ Text Generation Failed:", e.message);
        if (e.response) console.error("Response:", JSON.stringify(e.response, null, 2));
        if (e.body) console.error("Body:", JSON.stringify(e.body, null, 2));
    }

    // 2. Image Generation Test (Simulated)
    console.log("\n--- TEST 2: Image Generation (Simulated) ---");
    try {
        const result = await client.models.generateContent({
             model: "gemini-2.5-flash-image",
             contents: [{ role: 'user', parts: [{ text: "Generate a futuristic cyberpunk city." }] }],
             config: {
                 responseModalities: ["IMAGE"],
                 // @ts-ignore
                 imageConfig: imageConfig
             }
        });
        
        console.log("✅ Image Generation Success!");
        const inlineData = result?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (inlineData?.data) {
            console.log("📸 Image Data Received (Base64)");
            const outputPath = path.join(process.cwd(), "scripts", "gemini","output", "output-simulated.png");
            fs.writeFileSync(outputPath, Buffer.from(inlineData.data, "base64"));
            console.log(`💾 Saved to ${outputPath}`);
        }
    } catch (e: any) {
        console.error("❌ Image Generation Failed:", e.message);
    }

    // 3. File Upload & Reference Test
    console.log("\n--- TEST 3: File Upload & Reference Generation ---");
    
    // Use real test image
    const imagePath = path.join(process.cwd(), "scripts", "gemini", "upload-test-image.png");
    if (!fs.existsSync(imagePath)) {
        console.error(`❌ Test image not found at ${imagePath}`);
        process.exit(1);
    }
    const buffer = fs.readFileSync(imagePath);
    const mimeType = "image/png";

    let uploadedFile;
    try {
        console.log("⬆️ Uploading reference image...");
        const uploadResult = await client.files.upload({
            file: new Blob([buffer], { type: mimeType }), 
            config: { mimeType: mimeType }
        });
        
        uploadedFile = uploadResult;
        console.log("✅ Upload Success:", uploadedFile.uri);
        console.log("Wait 5s for processing...");
        await new Promise(r => setTimeout(r, 5000));

    } catch (e: any) {
        console.error("❌ Upload Failed:", e.message);
        process.exit(1);
    }

    try {
        console.log("🎨 Reference Generation...");
        
        const parts = [
            { text: "Generate a portrait using this reference." },
            { 
                fileData: { 
                    mimeType: uploadedFile.mimeType, 
                    fileUri: uploadedFile.uri 
                } 
            }
        ];

        const result = await client.models.generateContent({
             model: "gemini-2.5-flash-image",
             contents: [{ role: 'user', parts: parts }],
             config: {
                 responseModalities: ["IMAGE"],
                 // @ts-ignore
                 imageConfig: imageConfig
             }
        });
        
        console.log("✅ Reference Generation Success!");
        const inlineData = result?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (inlineData?.data) {
            console.log("📸 Image Data Received");
            const outputPath = path.join(process.cwd(), "scripts","gemini","output", "output-reference.png");
            fs.writeFileSync(outputPath, Buffer.from(inlineData.data, "base64"));
            console.log(`💾 Saved to ${outputPath}`);
        }
        
    } catch (e: any) {
        console.error("❌ Reference Generation Failed:", e.message);
        if (e.response) {
             console.error("API Error Response:", JSON.stringify(e.response, null, 2));
        }
    }

    // 4. Test with Gemini 3 Pro
    console.log("\n--- TEST 4: Gemini 3 Pro Reference Generation ---");
    const model3Name = "gemini-3-pro-image-preview";
    console.log(`📡 Testing model: ${model3Name}`);

    try {
        console.log("🎨 Reference Generation (Gemini 3)...");
        const parts = [
            { text: "Generate a portrait using this reference." },
            { 
                fileData: { 
                    mimeType: uploadedFile.mimeType, 
                    fileUri: uploadedFile.uri 
                } 
            }
        ];

        const result = await client.models.generateContent({
             model: model3Name,
             contents: [{ role: 'user', parts: parts }],
             config: {
                 responseModalities: ["IMAGE"],
                 // @ts-ignore
                 imageConfig: imageConfig
             }
        });
        
        console.log("✅ Gemini 3 Reference Generation Success!");
        const inlineData = result?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (inlineData?.data) {
            console.log("📸 Image Data Received");
            const outputPath = path.join(process.cwd(), "scripts", "gemini", "output", "output-gemini3.png");
            fs.writeFileSync(outputPath, Buffer.from(inlineData.data, "base64"));
            console.log(`💾 Saved to ${outputPath}`);
        }
        
    } catch (e: any) {
        console.error("❌ Gemini 3 Reference Generation Failed:", e.message);
        if (e.response) {
             console.error("Status:", e.response.status);
             console.error("StatusText:", e.response.statusText);
        }
    }

    // 5. Vision Test
    console.log("\n--- TEST 5: Vision Capability (Describe Image) ---");
    try {
        const visionResult = await client.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: [{ 
                role: 'user', 
                parts: [
                    { text: "Describe this image." },
                    { fileData: { mimeType: uploadedFile.mimeType, fileUri: uploadedFile.uri } }
                ] 
            }],
        });
        console.log("✅ Vision Description Success:", visionResult?.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (e: any) {
        console.error("❌ Vision Description Failed:", e.message);
    }
}

main();
