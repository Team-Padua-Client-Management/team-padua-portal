import fetch from "node-fetch";

async function run() {
  const res = await fetch("http://localhost:3000/api/admin/members/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  // Instead of testing update, let's just use the supabase client to get a profile's columns.
}
run();
