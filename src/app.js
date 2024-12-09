"use strict";
document.body.insertAdjacentHTML("beforeend", site.page);
const display_initial = {
  "home": "block",
  "design": "block",
  "operations": "block",
  "verification": "block",
  "legal": "block",
};

for (const i in display_initial) {
  document.getElementById(i).innerHTML = site[i];
}
const style = document.createElement("style");
style.textContent = site.css;
document.head.appendChild(style);
globalThis.addEventListener("hashchange", () => {
  refresh();
});
refresh();
function hide_other(one) {
  for (const i in display_initial) {
    one != i
      ? document.getElementById(i).style.display = "none"
      : document.getElementById(i).style.display = display_initial[i];
  }
}
function refresh() {
  const hash = globalThis.location.hash.substring(1) || "home";
  hash == "legal"
    ? hide_other("legal")
    : hash == "design"
    ? hide_other("design")
    : hash == "operations"
    ? hide_other("operations")
    : hash == "verification"
    ? hide_other("verification")
    : hide_other("home");
}
document.getElementById("sean_button").addEventListener("click", () => {
  for (const i in display_initial) {
    if (document.getElementById(i).style.display != "none") {
      document.getElementById(i).scrollIntoView({ behavior: "smooth" });
    }
  }
});
