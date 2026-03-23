import { useEffect, useState } from "react";
import { getComics } from "../lib/api";

export default function Home() {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getComics()
      .then((data) => {
        console.log("COMICS:", data);
        setComics(data);
      })
      .catch((err) => {
        console.error("LOAD ERROR:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading comics...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Latest Comics</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "20px",
        }}
      >
        {comics.map((comic) => (
          <div key={comic.id}>
            <img
              src={comic.cover_url}
              alt={comic.title}
              style={{ width: "100%" }}
            />
            <h3>{comic.title}</h3>
            <p>Issue #{comic.issue}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
