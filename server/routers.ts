import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { createGeneration, listGenerations, listSavedGenerations } from "./db";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

const kindSchema = z.enum(["image", "text", "email", "campaign", "code"]);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  generation: router({
    list: protectedProcedure.query(({ ctx }) => listGenerations(ctx.user.id)),
    saved: protectedProcedure.query(({ ctx }) => listSavedGenerations(ctx.user.id)),
    create: protectedProcedure.input(z.object({ kind: kindSchema, idea: z.string().min(1), format: z.string().optional(), tone: z.string().optional(), language: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const prompt = `Create a ${input.kind} for this idea: ${input.idea}. Format: ${input.format ?? "editorial"}. Tone: ${input.tone ?? "considered"}. Language if relevant: ${input.language ?? "n/a"}.`;
      if (input.kind === "image") {
        const [result, variation] = await Promise.all([
          generateImage({ prompt: `Rich natural colour editorial beauty campaign image. ${input.idea}. Style: ${input.tone ?? "Editorial"}. Fashion magazine quality, diverse young adult subject, luminous skin, nuanced colour palette, natural light, no text.` }),
          generateImage({ prompt: `Second colour variation of a premium beauty editorial. ${input.idea}. Style: ${input.tone ?? "Editorial"}. Change the composition and styling while keeping the same creative direction, rich natural colour, fashion magazine quality, no text.` }),
        ]);
        await createGeneration({ userId: ctx.user.id, kind: input.kind, title: input.idea.slice(0, 255), prompt, imageUrl: result.url, variationUrl: variation.url, content: null, isSaved: 0 });
        return { kind: input.kind, content: "Two colour editorial images generated.", imageUrl: result.url, variationUrl: variation.url };
      }
      const response = await invokeLLM({ messages: [
        { role: "system", content: "You are Versa, an editorial creative director. Return concise, high-quality output with a distinct point of view. Adapt output natively to the requested format. Never mention being an AI." },
        { role: "user", content: prompt },
      ] });
      const content = response.choices?.[0]?.message?.content;
      const finalContent = typeof content === "string" ? content : "Your Versa output is ready to refine.";
      await createGeneration({ userId: ctx.user.id, kind: input.kind, title: input.idea.slice(0, 255), prompt, content: finalContent, imageUrl: null, isSaved: 0 });
      return { kind: input.kind, content: finalContent };
    }),
  }),
});

export type AppRouter = typeof appRouter;
