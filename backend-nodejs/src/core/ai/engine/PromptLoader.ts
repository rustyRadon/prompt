import fs from "fs";
import path from "path";

export class PromptLoader {

    static loadPrompt(fileName: string): string {

        const filePath = path.join(
            process.cwd(),
            "src/core/ai/prompts",
            fileName
        );

        return fs.readFileSync(filePath, "utf-8");
    }
}