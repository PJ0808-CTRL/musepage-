import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { success: false, message: "RESEND_API_KEY is missing." },
        { status: 500 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, message: "Supabase environment variables are missing." },
        { status: 500 }
      );
    }

    // ── AUTH ──────────────────────────────────────────────────────────────────

    const authorization = request.headers.get("authorization");

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Authentication token is missing." },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice("Bearer ".length).trim();

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: "Your login session could not be verified." },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { success: false, message: "This account does not have an email address." },
        { status: 400 }
      );
    }

    // ── PROFILE ───────────────────────────────────────────────────────────────

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      // Non-critical — don't block login flow
      console.error("LOGIN EMAIL PROFILE ERROR:", profileError);
      return NextResponse.json(
        { success: false, message: "Profile not found." },
        { status: 404 }
      );
    }

    // ── RATE-LIMIT: max 1 login email per 24 hours ────────────────────────────

    const { data: site } = await supabase
      .from("sites")
      .select("id, slug, last_login_email_sent_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (site?.last_login_email_sent_at) {
      const lastSent = new Date(site.last_login_email_sent_at).getTime();
      const hoursSince = (Date.now() - lastSent) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        return NextResponse.json({
          success: true,
          skipped: true,
          reason: "Login email already sent within the last 24 hours.",
        });
      }
    }

    // ── PREPARE VARIABLES ─────────────────────────────────────────────────────

    const displayName =
      profile.display_name?.trim() ||
      profile.username?.trim() ||
      "there";

    const username = profile.username?.trim() || "";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";
    const dashboardUrl = siteUrl ? `${siteUrl}/dashboard` : "https://musepage-production.vercel.app/dashboard";
    const pageUrl = username ? `https://musepage.app/${username}` : "";

    const safeDisplayName = escapeHtml(displayName);
    const safeUsername = escapeHtml(username);
    const safePageUrl = escapeHtml(pageUrl);
    const safeDashboardUrl = escapeHtml(dashboardUrl);

    // ── SEND EMAIL ────────────────────────────────────────────────────────────

    const { data, error } = await resend.emails.send({
      from: "MusePage <onboarding@resend.dev>",
      to: [user.email],
      subject: `Good to have you back, ${displayName} ✦`,
      html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome back to MusePage</title>
</head>
<body style="margin:0;padding:0;background:#F0EBE2;font-family:Arial,Helvetica,sans-serif;color:#241f1a;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#F0EBE2;padding:40px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">

<!-- LOGO -->
<tr><td style="padding:0 0 24px 0;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
    <td style="width:38px;height:38px;border-radius:10px;background:#EDE0CC;color:#9B7442;text-align:center;vertical-align:middle;font-family:Georgia,serif;font-size:18px;font-weight:bold;">M</td>
    <td style="padding-left:10px;color:#211d18;font-size:17px;font-weight:700;">MusePage</td>
  </tr></table>
</td></tr>

<!-- MAIN CARD -->
<tr><td>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FAF7F2;border:1px solid #DDD3C5;border-radius:24px;overflow:hidden;">

  <!-- GOLD TOP BAR -->
  <tr><td style="height:6px;background:#9B7442;"></td></tr>

  <!-- HEADER -->
  <tr><td style="padding:44px 44px 0 44px;">
    <div style="display:inline-block;padding:6px 14px;border:1px solid #CAD5C3;border-radius:999px;background:#E8EEE5;color:#667D61;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">Welcome back</div>
    <h1 style="margin:20px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:36px;line-height:1.12;font-weight:400;letter-spacing:-0.03em;color:#1E1A16;">Good to have you<br>back, ${safeDisplayName}.</h1>
    <p style="margin:18px 0 0;font-size:15px;line-height:1.75;color:#7A7168;">Your MusePage is right where you left it — ready for whatever you're building next.</p>
  </td></tr>

  ${pageUrl ? `
  <!-- PAGE CARD -->
  <tr><td style="padding:28px 44px 0 44px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F5EEE4;border:1px solid #DED0BC;border-radius:16px;"><tr><td style="padding:20px 22px;">
      <div style="color:#A09484;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;">Your MusePage</div>
      <div style="margin-top:8px;font-family:Georgia,serif;font-size:20px;color:#3C352D;">@${safeUsername}</div>
      <div style="margin-top:6px;color:#9A8F82;font-size:12px;word-break:break-all;">${safePageUrl}</div>
    </td></tr></table>
  </td></tr>
  ` : ""}

  <!-- TIPS -->
  <tr><td style="padding:32px 44px 0 44px;">
    <div style="color:#9B7442;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:20px;">While you're here</div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:16px;"><tr>
      <td width="40" valign="top"><div style="width:32px;height:32px;border-radius:9px;background:#EDE0CC;text-align:center;line-height:32px;font-size:16px;">📊</div></td>
      <td valign="top" style="padding-left:14px;"><div style="font-size:14px;font-weight:700;color:#2E2920;margin-bottom:4px;">Check your analytics</div><div style="font-size:13px;color:#8A8074;line-height:1.6;">See who's been visiting your page, what they clicked, and where they came from.</div></td>
    </tr></table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:16px;"><tr>
      <td width="40" valign="top"><div style="width:32px;height:32px;border-radius:9px;background:#E4EADF;text-align:center;line-height:32px;font-size:16px;">✏️</div></td>
      <td valign="top" style="padding-left:14px;"><div style="font-size:14px;font-weight:700;color:#2E2920;margin-bottom:4px;">Update your content</div><div style="font-size:13px;color:#8A8074;line-height:1.6;">Add a new link, update your bio, or swap your preset to keep things fresh.</div></td>
    </tr></table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
      <td width="40" valign="top"><div style="width:32px;height:32px;border-radius:9px;background:#E0E8F0;text-align:center;line-height:32px;font-size:16px;">🔗</div></td>
      <td valign="top" style="padding-left:14px;"><div style="font-size:14px;font-weight:700;color:#2E2920;margin-bottom:4px;">Share your page</div><div style="font-size:13px;color:#8A8074;line-height:1.6;">Add your MusePage link to your Instagram bio, Twitter, email signature and everywhere you show up.</div></td>
    </tr></table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding:32px 44px 0 44px;">
    <a href="${safeDashboardUrl}" style="display:inline-block;padding:15px 28px;border-radius:12px;background:#9B7442;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Go to your dashboard &rarr;</a>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="padding:32px 44px 40px 44px;">
    <div style="border-top:1px solid #E3DBD0;padding-top:24px;">
      <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#7A7168;font-style:italic;">Keep building something worth arriving at.</p>
      <p style="margin:10px 0 0;font-size:12px;color:#A09484;">— The MusePage team</p>
    </div>
  </td></tr>

</table>
</td></tr>

<!-- BOTTOM NOTE -->
<tr><td style="padding:18px 0 0;text-align:center;color:#B0A89A;font-size:11px;line-height:1.6;">
  You received this because you just signed in to your MusePage account.<br>
  If this wasn't you, please secure your account immediately.
</td></tr>

</table>
</td></tr></table>
</body>
</html>`,
    });

    if (error) {
      console.error("LOGIN EMAIL RESEND ERROR:", error);
      return NextResponse.json(
        { success: false, error },
        { status: 500 }
      );
    }

    // ── UPDATE RATE-LIMIT TIMESTAMP ───────────────────────────────────────────

    if (site) {
      await supabase
        .from("sites")
        .update({ last_login_email_sent_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("LOGIN EMAIL ROUTE ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unknown login email error.",
      },
      { status: 500 }
    );
  }
}
