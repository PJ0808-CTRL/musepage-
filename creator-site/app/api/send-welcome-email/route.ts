import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

type WelcomeEmailBody = {
  displayName?: string;
  username?: string;
  pageUrl?: string;
  template?: string;
};

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
        {
          success: false,
          message: "RESEND_API_KEY is missing.",
        },
        {
          status: 500,
        }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Supabase environment variables are missing.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * --------------------------------------------------
     * GET THE USER'S ACCESS TOKEN
     * --------------------------------------------------
     */

    const authorization =
      request.headers.get("authorization");

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication token is missing.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken =
      authorization.slice("Bearer ".length).trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication token is missing.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * --------------------------------------------------
     * IMPORTANT FIX
     * --------------------------------------------------
     *
     * This Supabase client carries the user's JWT on
     * EVERY database request.
     *
     * Therefore auth.uid() works inside RLS policies.
     */

    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },

        global: {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        },
      }
    );

    /*
     * --------------------------------------------------
     * VERIFY USER
     * --------------------------------------------------
     */

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(
      accessToken
    );

    if (
      userError ||
      !user
    ) {
      console.error(
        "WELCOME EMAIL AUTH ERROR:",
        userError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Your login session could not be verified.",
        },
        {
          status: 401,
        }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This account does not have an email address.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * LOAD PROFILE
     * --------------------------------------------------
     */

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(
        "id, username, display_name, welcome_email_sent_at"
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();

    if (profileError) {
      console.error(
        "WELCOME EMAIL PROFILE ERROR:",
        profileError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Could not check welcome email status.",
          details:
            profileError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your MusePage profile could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * --------------------------------------------------
     * DUPLICATE PROTECTION
     * --------------------------------------------------
     */

    if (
      profile.welcome_email_sent_at
    ) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason:
          "Welcome email has already been sent.",
        sentAt:
          profile.welcome_email_sent_at,
      });
    }

    /*
     * --------------------------------------------------
     * ONBOARDING DATA
     * --------------------------------------------------
     */

    const body =
      (await request.json()) as WelcomeEmailBody;

    const displayName =
      body.displayName?.trim() ||
      profile.display_name?.trim() ||
      profile.username?.trim() ||
      "there";

    const username =
      body.username?.trim() ||
      profile.username?.trim() ||
      "";

    const pageUrl =
      body.pageUrl?.trim() ||
      "";

    const template =
      body.template?.trim() ||
      "MusePage";

    const safeDisplayName =
      escapeHtml(displayName);

    const safeUsername =
      escapeHtml(username);

    const safePageUrl =
      escapeHtml(pageUrl);

    const safeTemplate =
      escapeHtml(template);

    /*
     * --------------------------------------------------
     * URLS
     * --------------------------------------------------
     */

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(
        /\/$/,
        ""
      );

    let dashboardUrl =
      siteUrl
        ? `${siteUrl}/dashboard`
        : "";

    if (
      !dashboardUrl &&
      pageUrl
    ) {
      try {
        dashboardUrl =
          `${new URL(pageUrl).origin}/dashboard`;
      } catch {
        dashboardUrl = "";
      }
    }

    const safeDashboardUrl =
      dashboardUrl
        ? escapeHtml(
            dashboardUrl
          )
        : "";

    /*
     * --------------------------------------------------
     * SEND WELCOME EMAIL
     * --------------------------------------------------
     */

    const {
      data,
      error,
    } = await resend.emails.send({
      from:
        "MusePage <onboarding@resend.dev>",

      /*
       * Recipient is taken from authenticated
       * Supabase user — never from browser input.
       */
      to: [user.email],

      subject:
        `Welcome to MusePage, ${displayName}`,

      html: `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to MusePage</title>
</head>
<body style="margin:0;padding:0;background:#F0EBE2;font-family:Arial,Helvetica,sans-serif;color:#241f1a;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#F0EBE2;padding:40px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
<tr><td style="padding:0 0 24px 0;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
    <td style="width:38px;height:38px;border-radius:10px;background:#EDE0CC;color:#9B7442;text-align:center;vertical-align:middle;font-family:Georgia,serif;font-size:18px;font-weight:bold;">M</td>
    <td style="padding-left:10px;color:#211d18;font-size:17px;font-weight:700;">MusePage</td>
  </tr></table>
</td></tr>
<tr><td>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FAF7F2;border:1px solid #DDD3C5;border-radius:24px;overflow:hidden;">
  <tr><td style="height:6px;background:#9B7442;"></td></tr>
  <tr><td style="padding:44px 44px 0 44px;">
    <div style="display:inline-block;padding:6px 14px;border:1px solid #DBC8AA;border-radius:999px;background:#F1E6D5;color:#8B6536;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">Welcome to MusePage</div>
    <h1 style="margin:20px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:36px;line-height:1.12;font-weight:400;letter-spacing:-0.03em;color:#1E1A16;">Your corner of the internet<br>has begun, ${safeDisplayName}.</h1>
    <p style="margin:18px 0 0;font-size:15px;line-height:1.75;color:#7A7168;">Your <strong style="color:#443c34;">${safeTemplate}</strong> page is live and ready to be made unmistakably yours.</p>
  </td></tr>
  ${
    pageUrl
      ? `<tr><td style="padding:28px 44px 0 44px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F5EEE4;border:1px solid #DED0BC;border-radius:16px;"><tr><td style="padding:20px 22px;">
      <div style="color:#A09484;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;">Your MusePage</div>
      <div style="margin-top:8px;font-family:Georgia,serif;font-size:20px;color:#3C352D;">@${safeUsername}</div>
      <div style="margin-top:6px;color:#9A8F82;font-size:12px;word-break:break-all;">${safePageUrl}</div>
    </td></tr></table>
  </td></tr>`
      : ''
  }
  <tr><td style="padding:32px 44px 0 44px;">
    <div style="color:#9B7442;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:20px;">What's on your MusePage</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:16px;"><tr>
      <td width="40" valign="top"><div style="width:32px;height:32px;border-radius:9px;background:#EDE0CC;text-align:center;line-height:32px;font-size:16px;">🎨</div></td>
      <td valign="top" style="padding-left:14px;"><div style="font-size:14px;font-weight:700;color:#2E2920;margin-bottom:4px;">Luxury Presets</div><div style="font-size:13px;color:#8A8074;line-height:1.6;">Atelier, Noir, Sage, Oxblood and Midnight — five refined visual directions ready in one click.</div></td>
    </tr></table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:16px;"><tr>
      <td width="40" valign="top"><div style="width:32px;height:32px;border-radius:9px;background:#E4EADF;text-align:center;line-height:32px;font-size:16px;">📊</div></td>
      <td valign="top" style="padding-left:14px;"><div style="font-size:14px;font-weight:700;color:#2E2920;margin-bottom:4px;">Live Analytics</div><div style="font-size:13px;color:#8A8074;line-height:1.6;">Understand your visitors, clicks, CTR and traffic sources — all in real time from your dashboard.</div></td>
    </tr></table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:16px;"><tr>
      <td width="40" valign="top"><div style="width:32px;height:32px;border-radius:9px;background:#E8DDD9;text-align:center;line-height:32px;font-size:16px;">🔍</div></td>
      <td valign="top" style="padding-left:14px;"><div style="font-size:14px;font-weight:700;color:#2E2920;margin-bottom:4px;">SEO Controls</div><div style="font-size:13px;color:#8A8074;line-height:1.6;">Own how your page appears on Google and social media with full control over titles and descriptions.</div></td>
    </tr></table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
      <td width="40" valign="top"><div style="width:32px;height:32px;border-radius:9px;background:#E0E8F0;text-align:center;line-height:32px;font-size:16px;">✏️</div></td>
      <td valign="top" style="padding-left:14px;"><div style="font-size:14px;font-weight:700;color:#2E2920;margin-bottom:4px;">No-Code Editing</div><div style="font-size:13px;color:#8A8074;line-height:1.6;">Add links, images, videos, Spotify embeds and more — all by dragging and typing, no code needed.</div></td>
    </tr></table>
  </td></tr>
  ${
    dashboardUrl
      ? `<tr><td style="padding:32px 44px 0 44px;"><a href="${safeDashboardUrl}" style="display:inline-block;padding:15px 28px;border-radius:12px;background:#9B7442;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Open your dashboard &rarr;</a></td></tr>`
      : ''
  }
  <tr><td style="padding:32px 44px 40px 44px;">
    <div style="border-top:1px solid #E3DBD0;padding-top:24px;">
      <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#7A7168;font-style:italic;">Build it. Shape it. Make it yours.</p>
      <p style="margin:10px 0 0;font-size:12px;color:#A09484;">— The MusePage team</p>
    </div>
  </td></tr>
</table>
</td></tr>
<tr><td style="padding:18px 0 0;text-align:center;color:#B0A89A;font-size:11px;line-height:1.6;">You received this because this email was used to create a MusePage account.</td></tr>
</table>
</td></tr></table>
</body>
</html>
      `,
    });

    if (error) {
      console.error(
        "WELCOME EMAIL RESEND ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * --------------------------------------------------
     * MARK THE EMAIL AS SENT
     * --------------------------------------------------
     *
     * THIS update now runs through the authenticated
     * Supabase client carrying the user's access token.
     *
     * Therefore your policy:
     *
     * auth.uid() = id
     *
     * can succeed.
     */

    const sentAt =
      new Date().toISOString();

    const {
      data: updatedProfile,
      error: updateError,
    } = await supabase
      .from("profiles")
      .update({
        welcome_email_sent_at:
          sentAt,
      })
      .eq(
        "id",
        user.id
      )
      .select(
        "id, welcome_email_sent_at"
      )
      .single();

    if (updateError) {
      console.error(
        "WELCOME EMAIL TIMESTAMP UPDATE ERROR:",
        updateError
      );

      /*
       * Important:
       * Resend has already accepted the message.
       *
       * Returning a failure here is useful during
       * development because otherwise we would silently
       * allow duplicate emails again.
       */
      return NextResponse.json(
        {
          success: false,
          emailSent: true,
          message:
            "Email was sent, but duplicate protection could not be saved.",
          updateError:
            updateError.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      skipped: false,

      data,

      welcomeEmailSentAt:
        updatedProfile.welcome_email_sent_at,
    });
  } catch (error) {
    console.error(
      "WELCOME EMAIL ROUTE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unknown welcome email error.",
      },
      {
        status: 500,
      }
    );
  }
}