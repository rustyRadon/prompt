import { PromptLoader } from "./PromptLoader";

export class PromptBuilder {

    static build(userType: string) {

        const basePrompt =
            PromptLoader.loadPrompt(
                "core/base-companion.xml"
            );

        const creativePrompt =
            PromptLoader.loadPrompt(
                `creatives/${userType}.xml`
            );

        return `
${basePrompt}

${creativePrompt}
        `;
    }
}