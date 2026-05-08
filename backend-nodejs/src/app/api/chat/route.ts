import { NextRequest, NextResponse } from 'next/server';

eimport { PromptBuilder } from "@/core/ai/engine/PromptBuilder";

export async function POST(req: Request) {

    const body = await req.json();

    const finalPrompt =
        PromptBuilder.build(body.userType);

    // send to model

    return Response.json({
        success: true
    });
}