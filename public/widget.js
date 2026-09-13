/**
 * ويدجت تقييمات t1yyemat — يُلصق في أي صفحة متجر.
 *
 * الاستخدام البسيط (يظهر تلقائيًا فوق الفوتر مباشرة، بدون أي حاجة لـ div):
 *   <script src="https://<دومين-مشروعك>/widget.js" defer></script>
 *
 * أو لو تبي تتحكم بمكانه بالضبط، حط الـ div بنفسك بأي مكان بالصفحة:
 *   <div data-t1yyemat-reviews></div>
 *   <script src="https://<دومين-مشروعك>/widget.js" defer></script>
 *
 * خيارات (على نفس الـ div اليدوي):
 *   data-limit="10"              أقصى عدد تقييمات (افتراضي 20)
 *   data-product="اسم المنتج"    اعرض تقييمات منتج معيّن بس
 */
(function () {
  "use strict";

  var WIDGET_CSS =
    ".t1y-widget{font-family:Tahoma,Arial,sans-serif;direction:rtl;text-align:right;color:#0f172a;}" +
    ".t1y-summary{font-size:14px;color:#475569;margin:0 0 12px;}" +
    ".t1y-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px;}" +
    ".t1y-item{border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;background:#fff;}" +
    ".t1y-item-head{display:flex;justify-content:space-between;align-items:center;gap:8px;}" +
    ".t1y-name{font-weight:700;}" +
    ".t1y-stars{color:#fbbf24;direction:ltr;unicode-bidi:bidi-override;white-space:nowrap;}" +
    ".t1y-stars-empty{color:#cbd5e1;}" +
    ".t1y-product{font-size:12px;color:#64748b;margin-top:2px;}" +
    ".t1y-comment{margin:8px 0 0;line-height:1.6;font-size:14px;}" +
    ".t1y-loading,.t1y-empty{color:#94a3b8;font-size:14px;margin:0;}" +
    ".t1y-title{font-size:20px;font-weight:800;margin:0 0 16px;}";

  function getApiOrigin() {
    var el = document.currentScript;
    if (el && el.src) {
      try {
        return new URL(el.src).origin;
      } catch {
        // fall through
      }
    }
    return "";
  }

  var API_ORIGIN = getApiOrigin();

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function starsHtml(rating) {
    var full = "★".repeat(rating);
    var empty = "☆".repeat(5 - rating);
    return (
      '<span class="t1y-stars">' +
      full +
      '<span class="t1y-stars-empty">' +
      empty +
      "</span></span>"
    );
  }

  function renderReviews(mount, reviews) {
    if (!reviews.length) {
      mount.innerHTML = '<p class="t1y-empty">ما فيه تقييمات معتمدة بعد.</p>';
      return;
    }

    var rated = reviews.filter(function (r) {
      return r.rating != null;
    });
    var avg =
      rated.length > 0
        ? rated.reduce(function (sum, r) {
            return sum + r.rating;
          }, 0) / rated.length
        : null;

    var html = "";
    if (avg != null) {
      html +=
        '<p class="t1y-summary">متوسط التقييم ' +
        avg.toFixed(1) +
        " من 5 — " +
        reviews.length +
        (reviews.length === 1 ? " تقييم" : " تقييمات") +
        "</p>";
    }

    html += '<ul class="t1y-list">';
    reviews.forEach(function (r) {
      html += '<li class="t1y-item">';
      html +=
        '<div class="t1y-item-head"><span class="t1y-name">' +
        escapeHtml(r.customerName || "") +
        "</span>";
      if (r.rating != null) html += starsHtml(r.rating);
      html += "</div>";
      if (r.productName) {
        html +=
          '<div class="t1y-product">' + escapeHtml(r.productName) + "</div>";
      }
      if (r.comment) {
        html += '<p class="t1y-comment">' + escapeHtml(r.comment) + "</p>";
      }
      html += "</li>";
    });
    html += "</ul>";

    mount.innerHTML = html;
  }

  function initWidget(container, options) {
    options = options || {};

    if (!API_ORIGIN) {
      container.innerHTML = '<p class="t1y-empty">تعذر تحميل التقييمات.</p>';
      return;
    }

    var limit = container.getAttribute("data-limit") || "20";
    var product = container.getAttribute("data-product") || "";

    var host = container.attachShadow
      ? container.attachShadow({ mode: "open" })
      : container;

    var style = document.createElement("style");
    style.textContent = WIDGET_CSS;

    var wrapper = document.createElement("div");
    wrapper.className = "t1y-widget";
    wrapper.dir = "rtl";

    if (options.showTitle) {
      var title = document.createElement("h2");
      title.className = "t1y-title";
      title.textContent = "آراء عملائنا";
      wrapper.appendChild(title);
    }

    var mount = document.createElement("div");
    mount.innerHTML = '<p class="t1y-loading">جارٍ تحميل التقييمات...</p>';
    wrapper.appendChild(mount);

    host.appendChild(style);
    host.appendChild(wrapper);

    var url = API_ORIGIN + "/api/reviews?limit=" + encodeURIComponent(limit);
    if (product) url += "&product=" + encodeURIComponent(product);

    fetch(url)
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        renderReviews(mount, data.reviews || []);
      })
      .catch(function () {
        mount.innerHTML = '<p class="t1y-empty">تعذر تحميل التقييمات.</p>';
      });
  }

  function findFooter() {
    return document.querySelector(
      "footer, [role='contentinfo'], #footer, .footer"
    );
  }

  function boot() {
    var containers = document.querySelectorAll("[data-t1yyemat-reviews]");

    if (containers.length > 0) {
      for (var i = 0; i < containers.length; i++) {
        initWidget(containers[i]);
      }
      return;
    }

    // ما فيه أي div محدد يدويًا — نحط الويدجت تلقائيًا فوق الفوتر مباشرة
    // (أو بآخر الصفحة لو ما لقينا فوتر واضح)، بمسافة حوله عشان ما يلزق
    // بالفوتر أو بالمحتوى اللي قبله.
    var container = document.createElement("div");
    container.style.margin = "48px auto";
    container.style.maxWidth = "800px";
    container.style.padding = "0 16px";
    container.style.boxSizing = "border-box";

    var footer = findFooter();
    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(container, footer);
    } else {
      document.body.appendChild(container);
    }

    initWidget(container, { showTitle: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
