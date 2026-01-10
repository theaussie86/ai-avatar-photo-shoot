
import { GoogleGenAI } from "@google/genai";
import * as fs from "fs/promises";
import path from "path";

const TEST_FILES = [
    { name: "upload-test-image.png", mimeType: "image/png" },
    { name: "upload-test-image-2.jpg", mimeType: "image/jpeg" }
];

async function main() {
    console.log("🚀 Starting Gemini Files API Test for Multiple Files...");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY environment variable is not set.");
        process.exit(1);
    }

    const client = new GoogleGenAI({ apiKey });

    for (const testFile of TEST_FILES) {
        console.log(`\n==================================================`);
        console.log(`📂 TESTING FILE: ${testFile.name}`);
        console.log(`==================================================`);

        const imagePath = path.join(process.cwd(), "scripts","gemini", testFile.name);
        let buffer: Buffer;
        try {
            buffer = await fs.readFile(imagePath);
        } catch (e) {
            console.error(`❌ Could not read file ${imagePath}:`, e);
            continue;
        }

        const testDisplayName = `test-${testFile.name.split('.')[0]}-${Date.now()}`;
        let uploadedFile: any;

        try {
            // 1. UPLOAD
            console.log("\n--- 1. UPLOAD ---");
            const uploadResult = await client.files.upload({
                file: new Blob([new Uint8Array(buffer)], { type: testFile.mimeType }),
                config: { 
                    mimeType: testFile.mimeType,
                    displayName: testDisplayName
                }
            });
            
            uploadedFile = uploadResult;
            console.log("✅ Uploaded:", uploadedFile.name);
            console.log("   URI:", uploadedFile.uri);
            console.log("   State:", uploadedFile.state);

        } catch (e: any) {
            console.error(`❌ Upload Failed for ${testFile.name}:`, e);
            continue;
        }

        try {
            // 2. GET (metadata)
            console.log("\n--- 2. GET FILE METADATA ---");
            const fileId = uploadedFile.name; 
            
            let fileState = uploadedFile.state;
            let attempts = 0;
            while (fileState === "PROCESSING" && attempts < 10) {
                console.log(`   Waiting for processing... (${attempts+1}/10)`);
                await new Promise(r => setTimeout(r, 2000));
                const getResult = await client.files.get({ name: fileId });
                fileState = getResult.state;
                console.log("   Current State:", fileState);
                attempts++;
            }

            if (fileState !== "ACTIVE") {
                 console.error("❌ File not active after wait. State:", fileState);
            } else {
                 console.log("✅ File is ACTIVE.");
            }

        } catch (e: any) {
            console.error("❌ Get Failed:", e);
        }
        
        try {
            // 3. LIST
            console.log("\n--- 3. LIST FILES ---");
            const listResult = await client.files.list({});
            console.log(`✅ Found ${listResult.page?.length ?? 0} files.`);
            
            const found = listResult.page?.find((f: any) => f.name === uploadedFile.name);
            if (found) {
                console.log("✅ Verified uploaded file exists in list.");
            } else {
                console.warn("⚠️ Uploaded file NOT found in list.");
            }

        } catch(e: any) {
            console.error("❌ List Failed:", e);
        }

        try {
            // 4. DELETE
            console.log("\n--- 4. DELETE ---");
            await client.files.delete({ name: uploadedFile.name });
            console.log("✅ Delete command sent.");
            
            // Verify deletion
            try {
                await client.files.get({ name: uploadedFile.name });
                console.error("❌ File still exists after delete!");
            } catch (e: any) {
                console.log("✅ Verified file is gone (Get returned error as expected).");
            }

        } catch(e: any) {
            console.error("❌ Delete Failed:", e);
        }
    }

    // 5. LIST ALL FILES
    console.log("\n--- 5. LIST ALL FILES ---");
    const listResult = await client.files.list({});
    console.log(`✅ Found ${listResult.page?.length ?? 0} files.`);

    console.log("\n🚀 All tests completed!");
}

main();
