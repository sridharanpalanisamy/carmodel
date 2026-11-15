"use client";

import { useEffect } from "react";

export default function DirectoryPage() {
  useEffect(() => {
    window.location.replace("/carmodel/models/#az-archive");
  }, []);
  return <main style={{minHeight:"60vh",display:"grid",placeItems:"center",padding:"32px",textAlign:"center"}}>
    <p>The A–Z Ford directory is now part of the central vehicle dashboard. Opening it… <a href="/carmodel/models/#az-archive">Continue to the dashboard</a>.</p>
  </main>;
}
