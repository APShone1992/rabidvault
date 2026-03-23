const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export async function getComics() {
  const url = `${SUPABASE_URL}/functions/v1/comicvine-proxy?endpoint=/issues/&limit=20`;

  console.log("API CALL:", url); // debug

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    console.error("API ERROR:", text);
    throw new Error("Failed to fetch comics");
  }

  const data = await res.json();

  return (data.results || []).map(c => ({
    id: c.id,
    title: c.name || c.volume?.name || "Untitled",
    issue: c.issue_number,
    cover_url: (c.image?.medium_url || "").replace("http://", "https://")
  }));
}
