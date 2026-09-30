"use strict";

const sectionLinks = [...document.querySelectorAll(".page-links a")];
const pages = [...document.querySelectorAll(".page")];
const printButton = document.querySelector(".print-button");

function markCurrent(id) {
  for (const link of sectionLinks) {
    if (link.hash === `#${id}`) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting);
    if (visible.length) markCurrent(visible[0].target.id);
  }, { rootMargin: "-18% 0px -65% 0px", threshold: 0 });
  pages.forEach((page) => observer.observe(page));
}

sectionLinks.forEach((link) => link.addEventListener("click", () => markCurrent(link.hash.slice(1))));

printButton.addEventListener("click", async () => {
  if (document.fonts) await document.fonts.ready;
  window.print();
});
