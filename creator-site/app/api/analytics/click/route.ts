import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables"
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const siteId = body.siteId;
    const linkId = body.linkId;
    const platform = body.platform;

    console.log("ANALYTICS REQUEST:", {
      siteId,
      linkId,
      platform,
    });

    if (!siteId) {
      return NextResponse.json(
        { error: "Missing siteId" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getAdminClient();

    if (platform) {
      const allowedPlatforms = [
        "instagram",
        "youtube",
        "x",
      ];

      if (!allowedPlatforms.includes(platform)) {
        return NextResponse.json(
          {
            error: "Invalid social platform",
          },
          { status: 400 }
        );
      }

      const { data, error } =
        await supabaseAdmin
          .from("social_clicks")
          .insert({
            site_id: siteId,
            platform: platform,
          })
          .select()
          .single();

      if (error) {
        console.error(
          "SOCIAL CLICK INSERT ERROR:",
          error
        );

        return NextResponse.json(
          {
            error: error.message,
            details: error.details,
            hint: error.hint,
          },
          { status: 500 }
        );
      }

      console.log(
        "SOCIAL CLICK RECORDED:",
        data
      );

      return NextResponse.json({
        success: true,
        type: "social",
        data,
      });
    }

    if (!linkId) {
      return NextResponse.json(
        { error: "Missing linkId" },
        { status: 400 }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("link_clicks")
        .insert({
          site_id: siteId,
          link_id: linkId,
        })
        .select()
        .single();

    if (error) {
      console.error(
        "LINK CLICK INSERT ERROR:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    console.log(
      "LINK CLICK RECORDED:",
      data
    );

    return NextResponse.json({
      success: true,
      type: "link",
      data,
    });
  } catch (error) {
    console.error(
      "ANALYTICS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Analytics request failed",
      },
      { status: 500 }
    );
  }
}
