const CACHE_NAME = "lughati-digital-v2";

const STATIC_ASSETS = [
  "/",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(
              (name) =>
                name !== CACHE_NAME
            )
            .map((name) =>
              caches.delete(name)
            )
        );
      }),

      self.clients.claim(),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  /*
    لا نتدخل في:
    - API
    - ملفات Next.js الداخلية
    - طلبات التطوير
  */
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/")
  ) {
    return;
  }

  /*
    صفحات الموقع:
    Network First

    نحاول الشبكة أولًا.
    إذا فشلت نحاول الكاش.
    وإذا لم يوجد شيء في الكاش
    نعيد Response صالحًا بدل undefined.
  */
  event.respondWith(
    (async () => {
      try {
        const networkResponse =
          await fetch(request);

        return networkResponse;
      } catch (error) {
        const cachedResponse =
          await caches.match(request);

        if (cachedResponse) {
          return cachedResponse;
        }

        /*
          إذا كان الطلب انتقالًا إلى صفحة،
          نحاول الصفحة الرئيسية المخزنة.
        */
        if (
          request.mode === "navigate"
        ) {
          const homePage =
            await caches.match("/");

          if (homePage) {
            return homePage;
          }
        }

        /*
          مهم جدًا:
          يجب دائمًا إرجاع Response.
        */
        return new Response(
          "تعذر تحميل الصفحة حاليًا. تحقق من اتصال الإنترنت ثم حاول مرة أخرى.",
          {
            status: 503,
            statusText:
              "Service Unavailable",
            headers: {
              "Content-Type":
                "text/plain; charset=utf-8",
            },
          }
        );
      }
    })()
  );
});