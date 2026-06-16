// Service worker simples: cache do app shell para abrir offline.
const CACHE = "nb-v1";
const SHELL = ["/", "/login", "/dashboard"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // só GET e navegação/estáticos; dados (Supabase) sempre rede.
  if (request.method !== "GET" || request.url.includes("/auth/")) return;
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy).catch(() => {}));
        return res;
      })
      .catch(() => caches.match(request).then((r) => r ?? caches.match("/"))),
  );
});
