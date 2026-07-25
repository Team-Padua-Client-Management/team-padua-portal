import fetch from "node-fetch";

async function run() {
  const res = await fetch("http://localhost:3000/api/admin/members/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "a310bb24-f7b8-4d56-a9c1-4ebc1d563a9b", // Random UUID for testing
      full_name: "Test",
      has_client_servicing_access: true
    })
  });
  const data = await res.json();
  console.log(data);
}
run();
