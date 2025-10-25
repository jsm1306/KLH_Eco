import fetch from "node-fetch";

const baseURL = "http://localhost:4000/api";

async function addClub(name, description) {
  const res = await fetch(`${baseURL}/clubs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
  const data = await res.json();
  console.log("Club Created:", data);
  return data.clubid; // return clubId for events
}

async function addEvent(clubId, title, start, end) {
  const res = await fetch(`${baseURL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      description: title + " Description",
      startDate: start,
      endDate: end,
      organizingClub: clubId,
    }),
  });
  const data = await res.json();
  console.log("Event Created:", data);
}

async function test() {
  const clubId = await addClub("Tech Club", "Tech Events");
  await addEvent(clubId, "Tech Fest", "2025-11-05T10:00:00.000Z", "2025-11-06T17:00:00.000Z");
}

test();
