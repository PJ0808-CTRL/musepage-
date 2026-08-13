import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST() {
  try {
    const supabase = await createClient();

    /* =========================================
       AUTH
    ========================================= */

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "You must be logged in to publish.",
        },
        {
          status: 401,
        }
      );
    }

    /* =========================================
       SITE
    ========================================= */

    const {
      data: site,
      error: siteError,
    } = await supabase
      .from("sites")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (siteError) {
      console.error(
        "PUBLISH SITE ERROR:",
        siteError
      );

      return NextResponse.json(
        {
          error: siteError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!site) {
      return NextResponse.json(
        {
          error: "Site not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* =========================================
       BLOCKS
    ========================================= */

    const {
      data: links,
      error: linksError,
    } = await supabase
      .from("links")
      .select("*")
      .eq("site_id", site.id)
      .order("position", {
        ascending: true,
      });

    if (linksError) {
      console.error(
        "PUBLISH LINKS ERROR:",
        linksError
      );

      return NextResponse.json(
        {
          error: linksError.message,
        },
        {
          status: 500,
        }
      );
    }

    /* =========================================
       FIND CURRENT VERSION
    ========================================= */

    const {
      data: latestVersion,
      error: versionError,
    } = await supabase
      .from("site_versions")
      .select("version_number")
      .eq("site_id", site.id)
      .order("version_number", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (versionError) {
      console.error(
        "VERSION LOOKUP ERROR:",
        versionError
      );

      return NextResponse.json(
        {
          error: versionError.message,
        },
        {
          status: 500,
        }
      );
    }

    const nextVersion =
      (latestVersion?.version_number || 0) + 1;

    /* =========================================
       CREATE SNAPSHOT
    ========================================= */

    const {
      data: version,
      error: insertError,
    } = await supabase
      .from("site_versions")
      .insert({
        site_id: site.id,

        version_number:
          nextVersion,

        site_data:
          site,

        links_data:
          links || [],
      })
      .select(
        "id, version_number, published_at"
      )
      .single();

    if (insertError) {
      console.error(
        "VERSION INSERT ERROR:",
        insertError
      );

      return NextResponse.json(
        {
          error: insertError.message,
        },
        {
          status: 500,
        }
      );
    }

    /* =========================================
       MARK SITE PUBLISHED
    ========================================= */

    const {
      error: publishError,
    } = await supabase
      .from("sites")
      .update({
        published: true,
      })
      .eq("id", site.id)
      .eq("user_id", user.id);

    if (publishError) {
      console.error(
        "SITE PUBLISH ERROR:",
        publishError
      );

      return NextResponse.json(
        {
          error: publishError.message,
        },
        {
          status: 500,
        }
      );
    }

    /* =========================================
       SUCCESS
    ========================================= */

    return NextResponse.json({
      success: true,

      message:
        `Published successfully — Version ${nextVersion}`,

      version:
        version.version_number,

      publishedAt:
        version.published_at,
    });
  } catch (error) {
    console.error(
      "PUBLISH API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Publishing failed.",
      },
      {
        status: 500,
      }
    );
  }
}