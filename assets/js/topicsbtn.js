document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById("topics-toggle");
  const sidebar = document.querySelector(".side-nav");

  if (!btn || !sidebar) return;

  btn.addEventListener("click", function() {
    sidebar.classList.toggle("active");
  });
});
