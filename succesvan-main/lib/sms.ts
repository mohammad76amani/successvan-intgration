const SMS_WORKS_JWT = process.env.NEXT_PUBLIC_SMSWORKS_JWT;
const SMS_WORKS_SENDER = process.env.NEXT_PUBLIC_SMSWORKS_SENDER || "InfoText";

export async function sendSMS(to: string, message: string) {
  if (!SMS_WORKS_JWT) {
    throw new Error("Missing NEXT_PUBLIC_SMSWORKS_JWT");
  }

  // Remove + and spaces from phone number for E.164 format
  const destination = to.replace(/[+\s]/g, "");

  try {
    const res = await fetch("https://api.thesmsworks.co.uk/v1/message/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: SMS_WORKS_JWT,
      },
      body: JSON.stringify({
        sender: SMS_WORKS_SENDER,
        destination,
        content: message,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.log("SMS API Error:", res.status, JSON.stringify(data));
      throw new Error(`SMS Works error ${res.status}: ${JSON.stringify(data)}`);
    }

    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.log("SMS Error:", message);
    console.log(`[FALLBACK] SMS to ${to}: ${message}`);
    throw error;
  }
}
