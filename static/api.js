function getUserId() {
  let id = localStorage.getItem("whattodo-user-id");
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2));
    localStorage.setItem("whattodo-user-id", id);
  }
  return id;
}

async function api(method, path, body) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": getUserId()
    }
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Request failed: " + res.status);
  }
  return res.json();
}
