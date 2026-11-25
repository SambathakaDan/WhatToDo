// api.js (C): the one place that talks to the server.
// Every call goes to /api/..., which A's FastAPI routes answer.

async function api(method, path, body) {
  const res = await fetch("/api" + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (res.status === 204) return null; // delete routes answer with nothing

  if (!res.ok) {
    let message = "Request failed (" + res.status + ")";
    try {
      const data = await res.json();
      if (typeof data.detail === "string") {
        message = data.detail; // 404 from A's routes, e.g. "Task not found"
      } else if (Array.isArray(data.detail) && data.detail[0]) {
        message = data.detail[0].msg; // 422 validation error from FastAPI
      }
    } catch (e) {
      // body was not JSON, keep the generic message
    }
    throw new Error(message);
  }

  return res.json();
}