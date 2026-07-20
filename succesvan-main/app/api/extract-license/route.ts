// import { NextRequest, NextResponse } from "next/server";
// import OpenAI from "openai";

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// interface LicenseData {
//   licenseNumber: string | null;
//   expirationDate: string | null; // ISO format YYYY-MM-DD if possible
// }

// export async function POST(req: NextRequest) {
//   try {
//     const { image, mimeType } = (await req.json()) as {
//       image: string; // base64 (no data: prefix) OR full data URL
//       mimeType?: string; // e.g. "image/jpeg" — required if image is raw base64
//     };

//     if (!image) {
//       return NextResponse.json({ error: "Missing 'image' field" }, { status: 400 });
//     }

//     const imageUrl = image.startsWith("data:")
//       ? image
//       : data:${mimeType ?? "image/jpeg"};base64,${image};

//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o",
//       response_format: { type: "json_object" },
//       messages: [
//         {
//           role: "system",
//           content:
//             "You extract data from driver's license images. " +
//             "Return ONLY a JSON object with exactly these keys: " +
//             '"licenseNumber" (string or null) and "expirationDate" (string, ISO YYYY-MM-DD, or null if unreadable). ' +
//             "Do not include any other text or commentary.",
//         },
//         {
//           role: "user",
//           content: [
//             { type: "text", text: "Extract the license number and expiration date from this image." },
//             { type: "image_url", image_url: { url: imageUrl } },
//           ],
//         },
//       ],
//     });

//     const raw = completion.choices[0]?.message?.content ?? "{}";
//     const parsed = JSON.parse(raw) as LicenseData;

//     return NextResponse.json({
//       licenseNumber: parsed.licenseNumber ?? null,
//       expirationDate: parsed.expirationDate ?? null,
//     });
//   } catch (err) {
//     console.error("License extraction failed:", err);
//     return NextResponse.json({ error: "Failed to extract license data" }, { status: 500 });
//   }
// }

export {};
