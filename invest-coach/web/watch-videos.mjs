#!/usr/bin/env node
// Watch the two YouTube videos via Gemini and extract agent-team patterns.

import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_VIDEO_MODEL || 'gemini-2.5-flash';
if (!KEY) { console.error('Missing GEMINI_API_KEY'); process.exit(1); }

const URLS = [
  'https://www.youtube.com/watch?v=yLXLHnD4fco',
  'https://www.youtube.com/watch?v=vDVSGVpB2vc',
];

const PROMPT = `You just watched a YouTube video about building Claude / AI agent teams (sub-agents, multi-agent systems, automation).

Extract ONLY the actionable patterns the speaker recommends. Skip personality, sponsor reads, ads, and intro fluff.

Output in this exact format, no preamble:

## TL;DR
Two sentences — what the video is teaching and the core architecture pattern shown.

## Agent roster shown
List every named agent role the speaker uses, with a one-line job description for each.

## Orchestration / handoff pattern
How are agents spawned? Who calls whom? Is there a master/meta agent? How is context passed between them?

## File structure / where agents live
Folder paths, file naming, frontmatter conventions, tool restrictions.

## Tool choices per agent
Which tools each agent type gets (Read, Write, Edit, Bash, WebFetch, etc.) and the speaker's reasoning.

## Autonomy & guardrails
What runs unattended vs what requires human approval. Any logging, cost-control, or safety patterns.

## Specific prompting tricks
Phrases, structural tricks, or system-prompt patterns the speaker says make agents work better.

## What I would steal for an invest-coach agent team
3-5 bullets of the most transferable ideas.`;

const ai = new GoogleGenAI({ apiKey: KEY });

for (const url of URLS) {
  console.log('\n\n===========================================');
  console.log('VIDEO:', url);
  console.log('===========================================\n');
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        { fileData: { fileUri: url, mimeType: 'video/mp4' } },
        { text: PROMPT },
      ],
    });
    console.log((response.text ?? '(empty)').trim());
  } catch (e) {
    console.error('ERROR:', e?.message || e);
  }
}
