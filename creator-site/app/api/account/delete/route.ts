import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function deleteStorageFolder(
  admin: ReturnType<typeof getAdminClient>,
  bucket: string,
  folder: string
) {
  const { data, error } = await admin.storage
    .from(bucket)
    .list(folder, {
      limit: 1000,
      offset: 0,
    });

  if (error) {
    // A missing folder/bucket should not block account deletion.
    console.warn(`STORAGE LIST WARNING (${bucket}/${folder}):`, error.message);
    return;
  }

  if (!data || data.length === 0) return;

  const files = data
    .filter((item) => item.id)
    .map((item) => `${folder}/${item.name}`);

  const folders = data
    .filter((item) => !item.id)
    .map((item) => `${folder}/${item.name}`);

  if (files.length > 0) {
    const { error: removeError } = await admin.storage
      .from(bucket)
      .remove(files);

    if (removeError) {
      throw new Error(
        `Could not remove files from ${bucket}: ${removeError.message}`
      );
    }
  }

  for (const childFolder of folders) {
    await deleteStorageFolder(admin, bucket, childFolder);
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be signed in to delete your account." },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      confirmation?: string;
      email?: string;
    };

    if (body.confirmation !== "DELETE") {
      return NextResponse.json(
        { error: 'Type "DELETE" to confirm account deletion.' },
        { status: 400 }
      );
    }

    if (
      user.email &&
      body.email?.trim().toLowerCase() !== user.email.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "The confirmation email does not match your account." },
        { status: 400 }
      );
    }

    const admin = getAdminClient();

    const { data: siteRows, error: siteLookupError } = await admin
      .from("sites")
      .select("id")
      .eq("user_id", user.id);

    if (siteLookupError) {
      throw new Error(
        `Could not load your site data: ${siteLookupError.message}`
      );
    }

    const siteIds = (siteRows || []).map((site) => site.id);

    /*
     * Delete storage first.
     *
     * Your project currently uses the "site-assets" bucket and avatar paths
     * under avatars/<user-id>/...
     *
     * The second folder is included for future/user-owned site assets that
     * may be stored under sites/<user-id>/...
     */
    await deleteStorageFolder(admin, "site-assets", `avatars/${user.id}`);
    await deleteStorageFolder(admin, "site-assets", `sites/${user.id}`);

    /*
     * Delete child rows before parent rows.
     * This avoids foreign-key issues even if CASCADE is not configured.
     */
    if (siteIds.length > 0) {
      const { error: pageViewsError } = await admin
        .from("page_views")
        .delete()
        .in("site_id", siteIds);

      if (pageViewsError) {
        throw new Error(
          `Could not delete page views: ${pageViewsError.message}`
        );
      }

      const { error: linkClicksError } = await admin
        .from("link_clicks")
        .delete()
        .in("site_id", siteIds);

      if (linkClicksError) {
        throw new Error(
          `Could not delete link clicks: ${linkClicksError.message}`
        );
      }

      const { error: socialClicksError } = await admin
        .from("social_clicks")
        .delete()
        .in("site_id", siteIds);

      if (socialClicksError) {
        throw new Error(
          `Could not delete social clicks: ${socialClicksError.message}`
        );
      }

      const { error: linksError } = await admin
        .from("links")
        .delete()
        .in("site_id", siteIds);

      if (linksError) {
        throw new Error(`Could not delete links: ${linksError.message}`);
      }

      const { error: sitesError } = await admin
        .from("sites")
        .delete()
        .eq("user_id", user.id);

      if (sitesError) {
        throw new Error(`Could not delete sites: ${sitesError.message}`);
      }
    }

    const { error: profileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (profileError) {
      throw new Error(`Could not delete profile: ${profileError.message}`);
    }

    /*
     * Delete the Supabase Auth user LAST.
     * This requires the service-role key and must only run on the server.
     */
    const { error: authDeleteError } =
      await admin.auth.admin.deleteUser(user.id);

    if (authDeleteError) {
      throw new Error(
        `Could not delete authentication account: ${authDeleteError.message}`
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("ACCOUNT DELETION ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not delete your account.",
      },
      { status: 500 }
    );
  }
}