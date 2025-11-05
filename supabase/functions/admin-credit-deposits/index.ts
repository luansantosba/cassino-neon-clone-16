import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json().catch(() => ({}));
    const emails: string[] | undefined = body?.emails;

    if (!emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "missing_emails", message: "Provide emails array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("admin-credit-deposits start", { emails });

    const results: Array<{
      email: string;
      user_id?: string;
      deposits_found: number;
      credited: number;
      details: Array<{ deposit_id: string; tx: string; amount: number; status: string; action: string; reason?: string }>;
    }> = [];

    for (const email of emails) {
      const userResult = { email, deposits_found: 0, credited: 0, details: [] as Array<{ deposit_id: string; tx: string; amount: number; status: string; action: string; reason?: string }>, user_id: undefined as string | undefined };

      // Find user by email
      const { data: profile, error: profErr } = await supabase
        .from("profiles" as any)
        .select("id, email")
        .ilike("email" as any, email)
        .maybeSingle();

      if (profErr || !profile) {
        console.error("profile not found", email, profErr);
        results.push(userResult);
        continue;
      }

      userResult.user_id = profile.id;

      // Fetch most recent pending deposits for this user (last 3 days)
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const { data: pendingDeps, error: depErr } = await supabase
        .from("deposits" as any)
        .select("id, user_id, amount, status, transaction_id, created_at")
        .eq("user_id", profile.id)
        .eq("status", "pending")
        .gte("created_at", threeDaysAgo)
        .order("created_at", { ascending: false });

      if (depErr) {
        console.error("fetch pending deposits error", depErr);
        results.push(userResult);
        continue;
      }

      userResult.deposits_found = pendingDeps?.length || 0;

      for (const dep of pendingDeps || []) {
        // Idempotency: already processed?
        const { data: alreadyProcessed } = await supabase
          .from("deposit_processing_log" as any)
          .select("deposit_id")
          .eq("deposit_id", dep.id)
          .maybeSingle();

        if (alreadyProcessed) {
          userResult.details.push({
            deposit_id: dep.id,
            tx: dep.transaction_id,
            amount: Number(dep.amount),
            status: "pending",
            action: "skip",
            reason: "already_processed",
          });
          continue;
        }

        // 1) Mark as confirmed
        const { error: updateErr } = await supabase
          .from("deposits" as any)
          .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
          .eq("id", dep.id);

        if (updateErr) {
          console.error("update to confirmed error", dep.id, updateErr);
          userResult.details.push({
            deposit_id: dep.id,
            tx: dep.transaction_id,
            amount: Number(dep.amount),
            status: "pending",
            action: "error",
            reason: "update_failed",
          });
          continue;
        }

        // 2) Process centrally (credit + bonuses)
        const { error: processError } = await supabase.functions.invoke("process-deposit", {
          body: { user_id: dep.user_id, amount: dep.amount },
        });

        if (processError) {
          console.error("process-deposit error", dep.id, processError);
          userResult.details.push({
            deposit_id: dep.id,
            tx: dep.transaction_id,
            amount: Number(dep.amount),
            status: "confirmed",
            action: "process_error",
            reason: "process_failed",
          });
          continue;
        }

        // 3) Log as processed
        const { error: logErr } = await supabase
          .from("deposit_processing_log" as any)
          .insert({ deposit_id: dep.id });
        if (logErr) {
          console.error("log insert error", dep.id, logErr);
        }

        userResult.credited += 1;
        userResult.details.push({
          deposit_id: dep.id,
          tx: dep.transaction_id,
          amount: Number(dep.amount),
          status: "confirmed",
          action: "credited",
        });
      }

      results.push(userResult);
    }

    return new Response(
      JSON.stringify({ ok: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("admin-credit-deposits error", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});