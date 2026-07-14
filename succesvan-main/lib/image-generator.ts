/**
 * DALL-E Image Generator for Blog Content
 *
 * Generates relevant, high-quality images for blog sections using OpenAI DALL-E
 * ✅ Van preference:
 * - If the scene involves vans, prefer Mercedes Sprinter or Ford Transit (no logos/text)
 * ✅ London Visual Style:
 * - UK/London streets, architecture, lighting, and realistic commercial photography vibe
 */

import { getOpenAI } from "./openai";
type GeneratedBlogImageResult = {
  url: string;
  buffer: Buffer;
  revisedPrompt: string;
};


const IS_PRODUCTION = process.env.NODE_ENV === "production";
// ============================================================================
// IMAGE CONTEXT RULES
// ============================================================================

const IMAGE_RULES = {
  preferredVans: [
    "a modern Mercedes Sprinter-style cargo van (generic, no logos, no badges)",
    "a modern Ford Transit-style cargo van (generic, no logos, no badges)",
  ],

  globalMustNots: [
    "no text",
    "no letters",
    "no logos",
    "no watermarks",
    "no readable licence plates",
    "no visible brand marks on vehicles",
    "no signage with readable text",
  ],

  londonVisualStyle: `
LONDON VISUAL STYLE (IMPORTANT):
- The environment should feel like London / United Kingdom
- Use realistic London street atmosphere: brick buildings, modern UK architecture, narrow streets, industrial areas, business parks
- Subtle UK urban details: wet pavement, cloudy sky, soft diffused daylight, realistic street perspective
- Photorealistic commercial photography look, like a real UK fleet rental website header
- Avoid iconic copyrighted landmarks (do NOT use Big Ben, Tower Bridge, London Eye)
- Keep it modern, clean, professional, premium business vibe
`.trim(),
};

const VEHICLE_STATIC_RULE = `
VEHICLE BEHAVIOR (CRITICAL):
- the van must be completely stationary
- parked on the side of the street
- engine off, no movement
- wheels aligned straight (no turning motion)
- no motion blur on vehicle
- doors may be open (rear or side)
`;

const NO_MOTION_BLUR_RULE = `
MOTION CONTROL:
- no motion blur anywhere in the image
- movement must be frozen in time (fast shutter effect)
- humans can be mid-action but sharply captured
- vehicles must never appear in motion
`;

const SHARPNESS_RULE = `
IMAGE QUALITY (CRITICAL):
- ultra sharp focus on primary subjects
- no motion blur
- no gaussian blur
- no depth blur that hides details
- textures must be crisp (brick, asphalt, fabric, cardboard)
- 4K DSLR realism, high detail retention
`;

const REALISM_IMPERFECTIONS = `
REAL-WORLD IMPERFECTIONS:
- slightly tilted horizon (handheld feel)
- partial subject cut-off at frame edges
- uneven lighting (cloud diffusion)
- small clutter: leaves, bins, parked cars, cables
- not everything perfectly aligned
`;

const MOMENT_RULE = `
MOMENT CAPTURE RULE:
- scene must feel like it was captured mid-action
- at least one human doing something (lifting, walking, turning, unloading)
- no eye contact with camera
- no posing
- action is more important than composition
`;

const UK_ENVIRONMENT_BOOST = `
UK STREET REALISM BOOST:
- semi-detached houses or terraced homes
- narrow residential streets
- cars parked tightly on both sides
- subtle wear: pavement cracks, curb marks
- bins, fences, small front gardens
- realistic UK color tones (muted reds, browns, greys)
`;

/**
 * Quick heuristic: does this heading/topic likely need a van in the image?
 */
function isVanRelated(
  topic: string,
  headingText: string,
  userDescription?: string,
) {
  const t = `${topic} ${headingText} ${userDescription || ""}`.toLowerCase();

  const keywords = [
    "van",
    "van hire",
    "rental",
    "rent a van",
    "cargo",
    "delivery",
    "moving",
    "removal",
    "fleet",
    "courier",
    "logistics",
    "transport",
    "b2b",
    "commercial vehicle",
    "business van",
    "london",
    "uk",
    "ulez",
  ];

  return keywords.some((k) => t.includes(k));
}

async function getSceneIntentAI(
  topic: string,
  heading: string,
): Promise<string> {
  const client = getOpenAI();

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.7,
    max_tokens: 120,
    messages: [
      {
        role: "system",
        content: `
You are a visual scene planner for realistic blog images.

Your job:
Convert a blog heading into a REAL-LIFE photographic scenario.

Rules:
- Output must be a real-world scene (not abstract)
- Must involve human activity when possible
- Must be visually clear and concrete
- Must match the meaning of the heading (not just keywords)
- Must fit London / UK environment
- Keep it short (2–3 lines max)
- No explanations, only scene description
`,
      },
      {
        role: "user",
        content: `
Topic: ${topic}
Heading: ${heading}

What real-life scene best represents this heading?
`,
      },
    ],
  });

  return (
    completion.choices[0].message.content?.trim() ||
    "A realistic everyday moment related to the topic in a London street environment."
  );
}

/**
 * Generate an image for a blog heading using DALL-E
 */
export async function generateBlogImage(
  topic: string,
  headingText: string,
  userDescription?: string,
): Promise<GeneratedBlogImageResult> {
  console.log(`🎨 [Image Generator] Generating image for: ${headingText}`);

  let imagePrompt: string;



  // If user provided a description, use it (but add London + van preference if relevant)
  if (userDescription && userDescription.trim()) {
    const vanRelated = isVanRelated(topic, headingText, userDescription);

    imagePrompt = `
${userDescription.trim()}

${IMAGE_RULES.londonVisualStyle}

${vanRelated ? `If a van is visible, prefer: ${IMAGE_RULES.preferredVans.join(" OR ")}.` : ""}

Hard rules: ${IMAGE_RULES.globalMustNots.join(", ")}.
`.trim();

    console.log(`   Using user description + London style`);
  } else {
    console.log(`   Generating optimized OPENAI prompt...`);
    imagePrompt = await generateImagePrompt(topic, headingText);
  }

  console.log(`   Creating image with OPENAI...`);

  const client = getOpenAI();
  const response = IS_PRODUCTION
    ? await client.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json",
    })
    : await client.images.generate({
      model: "gpt-image-1.5",
      prompt: imagePrompt,
      n: 1,
      size: "1536x1024",
      quality: "high",
    });

  if (!response || !response.data || response.data.length === 0) {
    throw new Error("Failed to generate image - no data returned");
  }

  const imageItem = response.data[0];

  let imageBuffer: Buffer;
  let imageUrl: string;

  if (imageItem.b64_json) {
    imageBuffer = Buffer.from(imageItem.b64_json, "base64");
    imageUrl = `data:image/png;base64,${imageItem.b64_json}`;
  } else if (imageItem.url) {
    console.log("   - OpenAI returned URL instead of base64, downloading image...");

    const imageResponse = await fetch(imageItem.url);

    if (!imageResponse.ok) {
      throw new Error(
        `Failed to download OpenAI image URL: ${imageResponse.status}`,
      );
    }

    imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    imageUrl = imageItem.url;
  } else {
    console.log("OpenAI image response item:", imageItem);
    throw new Error("Failed to generate image - no image data or URL returned");
  }

  const revisedPrompt = imageItem.revised_prompt || imagePrompt;

  console.log(`✅ [Image Generator] Image created successfully`);
  console.log(`   - Buffer size: ${imageBuffer.length}`);

  return {
    url: imageUrl,
    buffer: imageBuffer,
    revisedPrompt,
  };
}

/**
 * Use GPT to create an optimized DALL-E prompt
 */
async function generateImagePrompt(
  topic: string,
  headingText: string,
): Promise<string> {
  const vanRelated = isVanRelated(topic, headingText);

  // Production: keep it fast. No extra GPT prompt-planning calls.
  if (IS_PRODUCTION) {
    return `
Photorealistic documentary-style image for a UK van hire blog.

Topic: ${topic}
Heading: ${headingText}

Scene:
A realistic London / UK street moment showing human activity related to "${headingText}". The scene should feel naturally captured, not staged. At least one person is doing a practical action such as lifting, carrying, walking, checking items, loading, unloading, organizing boxes, or preparing for a move.

${IMAGE_RULES.londonVisualStyle}
${VEHICLE_STATIC_RULE}
${NO_MOTION_BLUR_RULE}
${UK_ENVIRONMENT_BOOST}
${MOMENT_RULE}
${REALISM_IMPERFECTIONS}
${SHARPNESS_RULE}

${vanRelated ? `If a van is present: ${IMAGE_RULES.preferredVans.join(" OR ")}` : ""}

ABSOLUTE RULES:
${IMAGE_RULES.globalMustNots.join(", ")}

STYLE:
- photorealistic
- documentary photography
- realistic UK commercial website image
- NOT cinematic
- NOT staged
- NOT advertising
`.trim();
  }

  // Development: full original AI prompt planning.
  const sceneIntent = await getSceneIntentAI(topic, headingText);

  const systemPrompt = `
You are AI Photo Director v3 — documentary realism engine.

You simulate real-world accidental photography captured by a handheld camera.

=====================
🎥 SCENE PRINCIPLE
=====================
- The scene is NOT designed
- It is captured accidentally in real life
- Something is happening mid-movement or just finished happening
- Humans are NOT posing
- Vehicles are NOT presented for advertising

=====================
📷 CAMERA BEHAVIOR
=====================
- handheld instability
- imperfect framing
- off-center composition
- shallow focus with natural falloff
- exposure slightly inconsistent (real camera behavior)

=====================
🌍 ENVIRONMENT RULE
=====================
London urban realism:
- wet asphalt reflections
- overcast sky diffusion
- industrial + residential mix
- natural UK street density
- no landmarks

=====================
🚐 VEHICLE RULE (STRICT)
=====================
ONLY ALLOWED VEHICLES:
- Mercedes Sprinter (white or black only)
- Ford Transit (white or black only)

ABSOLUTE RULES:
- NO logos
- NO decals
- NO branding
- NO stickers
- NO typography on vehicle
- NO readable or semi-readable text anywhere
- NO fleet design language

Vehicles must look like:
"anonymous rental fleet vehicles captured in real traffic"

=====================
🚫 VISUAL PROHIBITION
=====================
- no CGI
- no illustration
- no stock photography aesthetic
- no advertising composition
- no centered hero shots
- no product showcase framing

=====================
🧠 OUTPUT RULE
=====================
Return ONLY one continuous photorealistic image description.
No formatting, no bullet points.
`;

  const userPrompt = `
You are capturing a real moment in London.

Topic: ${topic}
Heading: ${headingText}
Scene meaning:
${sceneIntent}

Do not design a scene.
Instead imagine:
- what just happened 1 second before this frame
- what is imperfect in the frame
- what is partially out of frame
`;

  const client2 = getOpenAI();

  const completion = await client2.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 220,
  });

  const prompt =
    completion.choices[0].message.content?.trim() ||
    `Photorealistic commercial photo scene representing "${headingText}" related to "${topic}", London UK street atmosphere, wide composition with negative space, natural diffused daylight, ultra-detailed, sharp focus, no text, no logos, no watermarks.`;

  return `
${prompt}

${IMAGE_RULES.londonVisualStyle}
${VEHICLE_STATIC_RULE}

${NO_MOTION_BLUR_RULE}

${UK_ENVIRONMENT_BOOST}

${MOMENT_RULE}

${REALISM_IMPERFECTIONS}

${SHARPNESS_RULE}

${vanRelated ? `If a van is present: ${IMAGE_RULES.preferredVans.join(" OR ")}` : ""}

ABSOLUTE RULES:
${IMAGE_RULES.globalMustNots.join(", ")}

STYLE:
- photorealistic
- documentary photography
- NOT cinematic
- NOT staged
- NOT advertising
`;
}
/**
 * Generate a placeholder image URL (for testing without DALL-E costs)
 */
export function generatePlaceholderImage(
  headingText: string,
  width: number = 1200,
  height: number = 600,
): string {
  const text = encodeURIComponent(headingText.substring(0, 50));
  return `https://placehold.co/${width}x${height}/fe9a00/fff?text=${text}`;
}

/**
 * Batch generate images for multiple headings
 */
export async function generateBatchImages(
  topic: string,
  headings: Array<{ id: string; text: string; level: number }>,
  descriptions?: Record<string, string>,
): Promise<Array<{ headingId: string; url: string; error?: string }>> {
  console.log(
    `🎨 [Image Generator] Batch generating ${headings.length} images`,
  );

  const results: Array<{ headingId: string; url: string; error?: string }> = [];

  for (const heading of headings) {
    // Only generate for H1 and H2
    if (heading.level > 2) {
      console.log(`   ⏭️ Skipping ${heading.text} (H${heading.level})`);
      continue;
    }

    try {
      const description = descriptions?.[heading.id];
      const imageData = await generateBlogImage(
        topic,
        heading.text,
        description,
      );

      results.push({
        headingId: heading.id,
        url: imageData.url,
      });

      console.log(`   ✅ Generated image for: ${heading.text}`);

      // Rate limiting: wait 1 second between requests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.log(
        `   ❌ Failed to generate image for ${heading.text}:`,
        message,
      );

      results.push({
        headingId: heading.id,
        url: "",
        error: message,
      });
    }
  }

  console.log(
    `✅ [Image Generator] Batch complete: ${results.filter((r) => !r.error).length
    }/${headings.length} succeeded`,
  );

  return results;
}
