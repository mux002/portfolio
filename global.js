console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

//const navLinks = $$('nav a');
//let currentLink = navLinks.find(
  //(a) => a.host === location.host && a.pathname === location.pathname,
//);
//urrentLink.classList.add('current');
//if (currentLink) {
  // or if (currentLink !== undefined)
  //currentLink.classList.add('current');
//}
//currentLink?.classList.add('current');
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  // Local server
  : "/portfolio/";         // GitHub Pages repo name
let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: "contact/",    title: "Contact" },
  { url: "resume/",     title: "Resume" },
  { url: "https://github.com/mux002", title: "GitHub", external: true },
];
let nav = document.createElement('nav');
document.body.prepend(nav);
for (let p of pages) {
  let url = p.url;
  let title = p.title;
  if (!url.startsWith('http')) {
  url = BASE_PATH + url;
  }
  // Create link and add it to nav
  let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }
    if (a.host !== location.host) {
        a.target = "_blank";
    }
    nav.append(a);
}

document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select id="theme-select">
      <option value="light dark" selected>Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

const select = document.querySelector('.color-scheme select');
select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value);
  document.documentElement.style.setProperty('color-scheme', event.target.value);
  localStorage.colorScheme = event.target.value;
});
if ('colorScheme' in localStorage) {      
  select.value = localStorage.colorScheme;                           
  document.documentElement.style.setProperty('color-scheme', localStorage.colorScheme);
} 
else {
  document.documentElement.style.setProperty('color-scheme', select.value);
}
