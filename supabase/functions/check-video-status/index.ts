import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KLING_API_KEY = Deno.env.get("KLING_API_KEY");
    if (!KLING_API_KEY) {
      return new Response(JSON.stringify({ error: "KLING_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { task_id } = await req.json();

    if (!task_id) {
      return new Response(JSON.stringify({ error: "task_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(`https://api.piapi.ai/api/v1/task/${task_id}`, {
      method: "GET",
      headers: {
        "x-api-key": KLING_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Kling status error:", response.status, errorText);
      return new Response(JSON.stringify({ error: `Kling error: ${response.status}` }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const taskData = data.data;

    const result: Record<string, unknown> = {
      status: taskData?.status,
      task_id,
    };

    // Extract video URL when completed
    if (taskData?.status === "Completed" && taskData?.output?.works) {
      const work = taskData.output.works[0];
      result.video_url = work?.resource?.resource;
      result.cover_url = work?.resource?.cover;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("check-video-status error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
