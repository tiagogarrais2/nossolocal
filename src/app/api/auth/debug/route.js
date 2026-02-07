import GoogleProvider from "next-auth/providers/google";

export async function GET(req) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const nextauthUrl = process.env.NEXTAUTH_URL;
    const nodeEnv = process.env.NODE_ENV;

    const diagnostics = {
      environment: nodeEnv,
      nextauth_url: nextauthUrl,
      callback_url: `${nextauthUrl}/api/auth/callback/google`,
      google_client_id: clientId ? "✅ SET" : "❌ MISSING",
      google_client_secret: clientSecret ? "✅ SET" : "❌ MISSING",
      nextauth_secret: process.env.NEXTAUTH_SECRET ? "✅ SET" : "❌ MISSING",
    };

    // Tentar validar as credenciais do Google
    let googleStatus = "⏳ Checking...";
    if (clientId && clientSecret) {
      try {
        // Tentativa simples de verificação
        const response = await fetch("https://oauth2.googleapis.com/tokeninfo", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
          }),
        });

        if (response.ok) {
          googleStatus = "✅ Valid Google credentials";
        } else {
          const error = await response.json();
          googleStatus = `❌ Invalid: ${error.error_description || error.error}`;
        }
      } catch (error) {
        googleStatus = `❌ Connection error: ${error.message}`;
      }
    }

    diagnostics.google_status = googleStatus;

    return Response.json(
      {
        message: "NextAuth OAuth Diagnostics",
        ...diagnostics,
        instructions: [
          "1. Verify NEXTAUTH_URL is correct for your environment",
          "2. Go to Google Cloud Console",
          "3. Check OAuth 2.0 Client ID settings",
          `4. Ensure redirect URI includes: ${nextauthUrl}/api/auth/callback/google`,
          "5. Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct",
          "6. Check if API rates or quotas are exceeded",
        ],
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      {
        error: "Diagnostics failed",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
