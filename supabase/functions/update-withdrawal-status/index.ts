import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Body = {
  id?: string;
  action?: "approve" | "reject";
  amount?: number;
  user_id?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = (await req.json()) as Body;
    const id = (body.id ?? "").toString();
    const action = body.action;
    const amount = Number(body.amount ?? 0);
    const userId = body.user_id ?? "";

    if (!id || !action) {
      return new Response(
        JSON.stringify({ error: "Missing id or action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "approve") {
      const { error } = await supabase
        .from("withdrawals")
        .update({ status: "confirmed", processed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    } else if (action === "reject") {
      if (!userId || !amount) {
        return new Response(
          JSON.stringify({ error: "Missing user_id or amount for rejection" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const { error: wError } = await supabase
        .from("withdrawals")
        .update({ status: "rejected", processed_at: new Date().toISOString() })
        .eq("id", id);
      if (wError) throw wError;

      // refund balance to user
      const { error: bError } = await supabase.rpc("add_balance", {
        user_id: userId,
        amount: amount,
      });
      if (bError) throw bError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("update-withdrawal-status error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
