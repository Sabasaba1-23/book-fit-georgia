import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller identity
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    if (!userId) {
      return new Response(JSON.stringify({ error: "No user ID in token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body for confirmation
    const body = await req.json().catch(() => ({}));
    if (body.confirmation !== "DELETE") {
      return new Response(
        JSON.stringify({ error: "Confirmation required. Send { confirmation: 'DELETE' }" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for deletion (bypasses RLS)
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Get partner profile IDs owned by this user
    const { data: partnerProfiles } = await admin
      .from("partner_profiles")
      .select("id")
      .eq("user_id", userId);
    const partnerIds = (partnerProfiles || []).map((p: { id: string }) => p.id);

    // 2. Get all booking IDs for this user
    const { data: userBookings } = await admin
      .from("bookings")
      .select("id")
      .eq("user_id", userId);
    const userBookingIds = (userBookings || []).map((b: { id: string }) => b.id);

    // 3. Get all booking IDs for partner's listings
    let partnerBookingIds: string[] = [];
    if (partnerIds.length > 0) {
      const { data: partnerListings } = await admin
        .from("training_listings")
        .select("id")
        .in("partner_id", partnerIds);
      const listingIds = (partnerListings || []).map((l: { id: string }) => l.id);

      if (listingIds.length > 0) {
        const { data: pBookings } = await admin
          .from("bookings")
          .select("id")
          .in("listing_id", listingIds);
        partnerBookingIds = (pBookings || []).map((b: { id: string }) => b.id);
      }
    }

    const allBookingIds = [...new Set([...userBookingIds, ...partnerBookingIds])];

    // 4. Delete dependent rows in correct order

    // Completion requests (depends on bookings)
    if (allBookingIds.length > 0) {
      await admin.from("completion_requests").delete().in("booking_id", allBookingIds);
    }

    // Session issues (depends on bookings)
    if (allBookingIds.length > 0) {
      await admin.from("session_issues").delete().in("booking_id", allBookingIds);
    }

    // Reviews (depends on bookings)
    if (allBookingIds.length > 0) {
      await admin.from("reviews").delete().in("booking_id", allBookingIds);
    }
    // Also delete reviews created by this user on other bookings
    await admin.from("reviews").delete().eq("reviewer_id", userId);

    // Messages sent by user
    await admin.from("messages").delete().eq("sender_id", userId);

    // Conversation participants
    await admin.from("conversation_participants").delete().eq("user_id", userId);

    // Clean up empty threads (threads with no participants left)
    // We skip this as it's not critical and threads are lightweight

    // Bookmarks
    await admin.from("bookmarks").delete().eq("user_id", userId);

    // User interests
    await admin.from("user_interests").delete().eq("user_id", userId);

    // Bookings (user's own)
    if (userBookingIds.length > 0) {
      await admin.from("bookings").delete().in("id", userBookingIds);
    }

    // Partner-owned data
    if (partnerIds.length > 0) {
      // Delete bookings on partner's listings (that weren't already deleted)
      if (partnerBookingIds.length > 0) {
        await admin.from("bookings").delete().in("id", partnerBookingIds);
      }

      // Partner documents
      await admin.from("partner_documents").delete().in("partner_id", partnerIds);

      // Partner verifications
      await admin.from("partner_verifications").delete().in("partner_id", partnerIds);

      // Conversation threads linked to partner's listings
      const { data: partnerListingsAll } = await admin
        .from("training_listings")
        .select("id")
        .in("partner_id", partnerIds);
      const allListingIds = (partnerListingsAll || []).map((l: { id: string }) => l.id);
      if (allListingIds.length > 0) {
        // Get threads linked to these listings
        const { data: linkedThreads } = await admin
          .from("conversation_threads")
          .select("id")
          .in("listing_id", allListingIds);
        const threadIds = (linkedThreads || []).map((t: { id: string }) => t.id);
        if (threadIds.length > 0) {
          await admin.from("messages").delete().in("thread_id", threadIds);
          await admin.from("conversation_participants").delete().in("thread_id", threadIds);
          await admin.from("conversation_threads").delete().in("id", threadIds);
        }
      }

      // Training listings
      await admin.from("training_listings").delete().in("partner_id", partnerIds);

      // Training packages
      await admin.from("training_packages").delete().in("partner_id", partnerIds);

      // Partner profiles
      await admin.from("partner_profiles").delete().in("id", partnerIds);
    }

    // User roles
    await admin.from("user_roles").delete().eq("user_id", userId);

    // Profile
    await admin.from("profiles").delete().eq("user_id", userId);

    // 5. Delete storage files
    // Avatars
    const { data: avatarFiles } = await admin.storage
      .from("avatars")
      .list(userId);
    if (avatarFiles && avatarFiles.length > 0) {
      const paths = avatarFiles.map((f: { name: string }) => `${userId}/${f.name}`);
      await admin.storage.from("avatars").remove(paths);
    }

    // Partner documents storage
    if (partnerIds.length > 0) {
      for (const pid of partnerIds) {
        const { data: docFiles } = await admin.storage
          .from("partner-documents")
          .list(pid);
        if (docFiles && docFiles.length > 0) {
          const paths = docFiles.map((f: { name: string }) => `${pid}/${f.name}`);
          await admin.storage.from("partner-documents").remove(paths);
        }

        // Listing images
        const { data: imgFiles } = await admin.storage
          .from("listing-images")
          .list(pid);
        if (imgFiles && imgFiles.length > 0) {
          const paths = imgFiles.map((f: { name: string }) => `${pid}/${f.name}`);
          await admin.storage.from("listing-images").remove(paths);
        }
      }
    }

    // 6. Delete the auth user
    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error("Failed to delete auth user:", deleteAuthError);
      return new Response(
        JSON.stringify({
          error: "Account data deleted but failed to remove auth account. Please contact support.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Account permanently deleted" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Delete account error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
