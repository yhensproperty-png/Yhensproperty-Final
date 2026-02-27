import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const { data: property } = await supabase
    .from("properties")
    .select("title, description, images, type, listing_type, city, slug")
    .eq("slug", slug)
    .maybeSingle();

  const siteUrl = "https://yhensproperty.com";

  const ogImage = property?.images?.[0] ?? `${siteUrl}/Image/Hero_Villa.png`;
  const pageUrl = property ? `${siteUrl}/property/${property.slug}` : siteUrl;

  const rawTitle = property
    ? `${property.title} | Yhen's Property`
    : "Yhen's Property - Premium Real Estate";

  const rawDesc = property?.description
    ? property.description.slice(0, 200)
    : property
    ? `${property.type} for ${property.listing_type === "rent" ? "Rent" : "Sale"} in ${property.city ?? ""} - Yhen's Property`
    : "Boutique Philippine real estate agency offering luxury properties for sale and rent.";

  const esc = (s: string) =>
    s
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const ogTitle = esc(rawTitle);
  const ogDesc = esc(rawDesc);
  const ogImageUrl = esc(ogImage);
  const ogPageUrl = esc(pageUrl);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${ogTitle}</title>
  <meta property="og:url" content="${ogPageUrl}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${ogTitle}" />
  <meta property="og:description" content="${ogDesc}" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:image:secure_url" content="${ogImageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${ogTitle}" />
  <meta property="og:site_name" content="Yhen's Property" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${ogTitle}" />
  <meta name="twitter:description" content="${ogDesc}" />
  <meta name="twitter:image" content="${ogImageUrl}" />
  <link rel="canonical" href="${ogPageUrl}" />
  <meta http-equiv="refresh" content="0; url=${ogPageUrl}" />
</head>
<body>
  <script>window.location.replace("${pageUrl}");</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate",
      ...corsHeaders,
    },
  });
});
