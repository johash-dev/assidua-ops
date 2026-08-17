(function () {
  const ROLES = {
    fd: { pill: "Front Desk", name: "Amaya Jayasuriya", initials: "AJ" },
    dh: { pill: "Department Head · Rivon", name: "Ruwan Bandara", initials: "RB" },
    coord: { pill: "Coordinator", name: "Sajith Perera", initials: "SP" },
    admin: { pill: "Admin", name: "Priya Fernando", initials: "PF" },
  };

  const NAV = [
    { id: "inquiries", href: "inquiries.html", label: "Inquiries", roles: ["fd", "dh", "coord", "admin"] },
    { id: "jobs", href: "jobs.html", label: "Jobs", roles: ["fd", "dh", "coord", "admin"] },
    { id: "customers", href: "customers.html", label: "Customers", roles: ["fd", "dh", "coord", "admin"] },
    { id: "technicians", href: "technicians.html", label: "Technicians", roles: ["fd", "dh", "admin"] },
    { id: "taxonomy", href: "taxonomy.html", label: "Taxonomy", roles: ["admin"] },
    { id: "staff", href: "staff-users.html", label: "Staff", roles: ["admin"] },
    { id: "reports", href: "reports.html", label: "Reports", roles: ["dh", "admin"] },
    { id: "audit", href: "audit.html", label: "Audit", roles: ["dh", "admin"] },
    { id: "settings", href: "settings.html", label: "Settings", roles: ["admin"] },
  ];

  const ACCESS = {
    inquiries: ["fd", "dh", "coord", "admin"],
    "inquiry-new": ["fd", "dh", "admin"],
    "inquiry-detail": ["fd", "dh", "coord", "admin"],
    jobs: ["fd", "dh", "coord", "admin"],
    "job-detail": ["fd", "dh", "coord", "admin"],
    customers: ["fd", "dh", "coord", "admin"],
    "customer-detail": ["fd", "dh", "coord", "admin"],
    technicians: ["fd", "dh", "admin"],
    "technician-form": ["fd", "dh", "admin"],
    taxonomy: ["admin"],
    staff: ["admin"],
    settings: ["admin"],
    reports: ["dh", "admin"],
    audit: ["dh", "admin"],
    inbox: ["fd", "dh", "coord", "admin"],
    "access-denied": ["fd", "dh", "coord", "admin"],
  };

  const ICONS = {
    bell: '<svg viewBox="0 0 24 24"><path d="M6 9a6 6 0 1 1 12 0c0 3.5 1.5 5.5 1.5 5.5H4.5S6 12.5 6 9Z"/><path d="M10 18.5a2 2 0 0 0 4 0"/></svg>',
    out: '<svg viewBox="0 0 24 24"><path d="M15.75 8.75 19.25 12l-3.5 3.25"/><path d="M19 12H10"/><path d="M12.5 5.75H8.75A2.75 2.75 0 0 0 6 8.5v7a2.75 2.75 0 0 0 2.75 2.75H12.5"/></svg>',
  };

  function currentRole() {
    const q = new URLSearchParams(location.search).get("role");
    if (q && ROLES[q]) {
      sessionStorage.setItem("ao-role", q);
      return q;
    }
    const stored = sessionStorage.getItem("ao-role");
    return stored && ROLES[stored] ? stored : "fd";
  }

  function withRole(href, role) {
    if (!href || href.startsWith("http") || href.startsWith("mailto:")) return href;
    if (href === "#" || href.startsWith("javascript:")) return href;
    const url = new URL(href, location.href);
    const file = url.pathname.split("/").pop();
    if (!file.endsWith(".html")) return href;
    if (file === "sign-in.html" || file === "tech-job.html" || file === "tech-invalid.html") {
      return file + url.hash;
    }
    url.searchParams.set("role", role);
    const job = new URLSearchParams(location.search).get("job");
    if (file === "job-detail.html" && url.searchParams.get("job") == null && job && url.hash) {
      url.searchParams.set("job", job);
    }
    return file + "?" + url.searchParams.toString() + url.hash;
  }

  function applyVisibility(role, job) {
    document.querySelectorAll("[data-show], [data-hide], [data-job]").forEach((el) => {
      if (el === document.body) return;
      let on = true;
      if (el.dataset.show) on = el.dataset.show.split(",").includes(role);
      if (el.dataset.hide && el.dataset.hide.split(",").includes(role)) on = false;
      if (el.dataset.job && !el.dataset.job.split(",").includes(job)) on = false;
      el.hidden = !on;
    });
  }

  function rewriteLinks(role) {
    document.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      a.setAttribute("href", withRole(href, role));
    });
  }

  function showDialog() {
    const id = location.hash.replace("#", "");
    document.querySelectorAll(".overlay[id^='dlg-']").forEach((el) => {
      el.hidden = el.id !== "dlg-" + id;
    });
  }

  function bootStaff() {
    const page = document.body.dataset.page;
    if (!page || page === "sign-in" || page === "tech") return;

    const role = currentRole();
    const job = new URLSearchParams(location.search).get("job") || "open";
    document.body.dataset.job = job;

    if (ACCESS[page] && !ACCESS[page].includes(role)) {
      location.replace(withRole("access-denied.html", role));
      return;
    }

    const content = document.getElementById("content");
    if (!content) return;
    const info = ROLES[role];

    const NAV_FOR = {
      "inquiry-new": "inquiries",
      "inquiry-detail": "inquiries",
      "job-detail": "jobs",
      "customer-detail": "customers",
      "technician-form": "technicians",
    };

    const navId = NAV_FOR[page] || page;
    const nav = NAV.filter((n) => n.roles.includes(role))
      .map(
        (n) =>
          `<a class="${n.id === navId ? "active" : ""}" href="${withRole(n.href, role)}">${n.label}</a>`
      )
      .join("");

    const options = Object.entries(ROLES)
      .map(([id, r]) => `<option value="${id}" ${id === role ? "selected" : ""}>${r.pill}</option>`)
      .join("");

    const shell = document.createElement("div");
    shell.innerHTML = `
      <div class="bar"></div>
      <div class="app">
        <header class="top">
          <div class="wordmark">Assidua Ops</div>
          <span class="role-pill">${info.pill}</span>
          <div class="top-spacer"></div>
          <select class="role-switch" id="role-switch" title="Switch role (mockup)">${options}
            <option value="tech">Technician link</option>
          </select>
          <a class="icon-btn" href="${withRole("inbox.html", role)}" title="Inbox" aria-label="Inbox">${ICONS.bell}<span class="badge">2</span></a>
          <div class="user"><div class="avatar">${info.initials}</div><div class="who">${info.name}</div></div>
          <a class="icon-btn" href="sign-in.html" title="Sign out" aria-label="Sign out">${ICONS.out}</a>
        </header>
        <aside class="nav">${nav}</aside>
      </div>`;
    const app = shell.querySelector(".app");
    const main = document.createElement("main");
    while (content.firstChild) main.appendChild(content.firstChild);
    content.remove();
    app.appendChild(main);
    document.body.prepend(shell.querySelector(".bar"));
    document.body.appendChild(app);

    document.getElementById("role-switch").addEventListener("change", (e) => {
      const next = e.target.value;
      if (next === "tech") {
        location.href = "tech-job.html";
        return;
      }
      sessionStorage.setItem("ao-role", next);
      const dest = ACCESS[page]?.includes(next) ? location.pathname.split("/").pop() : "inquiries.html";
      location.href = withRole(dest + location.hash, next);
    });

    applyVisibility(role, job);
    rewriteLinks(role);
    showDialog();
    window.addEventListener("hashchange", showDialog);
  }

  document.addEventListener("DOMContentLoaded", bootStaff);
})();
