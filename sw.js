/* Service worker de Bolsillo de Enfermería.
   Para publicar una versión nueva, cambiá el número de VERSION. */
var VERSION = "enfermeria-v2";
var SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "maskable-512.png", "apple-touch-icon.png"];
var FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  /* Tipos de letra: primero la copia guardada; si no hay, internet y se guarda. */
  if (FONT_HOSTS.indexOf(url.hostname) > -1) {
    e.respondWith(
      caches.open(VERSION).then(function (c) {
        return c.match(req).then(function (hit) {
          if (hit) return hit;
          return fetch(req).then(function (res) { c.put(req, res.clone()); return res; });
        });
      }).catch(function () { return new Response("", { status: 504 }); })
    );
    return;
  }

  if (url.origin !== location.origin) return;

  /* La app: se muestra lo guardado y se actualiza en segundo plano. */
  e.respondWith(
    caches.open(VERSION).then(function (c) {
      return c.match(req, { ignoreSearch: true }).then(function (hit) {
        var net = fetch(req).then(function (res) {
          if (res && res.ok) c.put(req, res.clone());
          return res;
        }).catch(function () { return hit || (req.mode === "navigate" ? c.match("index.html") : undefined); });
        return hit || net;
      });
    })
  );
});
