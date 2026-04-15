const BASE_URL = "https://pokeapi.co/api/v2";
const PAGE_SIZE = 20;
let currentPage = 0;
let totalCount = 0;

async function fetchPokemonList(offset, limit) {
  const res = await fetch(`${BASE_URL}/pokemon?offset=${offset}&limit=${limit}`);
  return res.json();
}

async function fetchPokemonDetail(nameOrId) {
  const res = await fetch(`${BASE_URL}/pokemon/${nameOrId}`);
  if (!res.ok) throw new Error("Not found");
  return res.json();
}

function getPokemonId(url) {
  return parseInt(url.split("/").filter(Boolean).pop());
}

function getFavorites() {
  try { return JSON.parse(localStorage.getItem("pokedex-favorites") || "[]"); }
  catch { return []; }
}

function toggleFavorite(id) {
  const favs = getFavorites();
  const i = favs.indexOf(id);
  if (i >= 0) favs.splice(i, 1); else favs.push(id);
  localStorage.setItem("pokedex-favorites", JSON.stringify(favs));
  return favs;
}

function typeColor(type) {
  const colors = {
    normal:"#A8A77A",fire:"#EE8130",water:"#6390F0",electric:"#F7D02C",
    grass:"#7AC74C",ice:"#96D9D6",fighting:"#C22E28",poison:"#A33EA1",
    ground:"#E2BF65",flying:"#A98FF3",psychic:"#F95587",bug:"#A6B91A",
    rock:"#B6A136",ghost:"#735797",dragon:"#6F35FC",dark:"#705746",
    steel:"#B7B7CE",fairy:"#D685AD"
  };
  return colors[type] || "#777";
}

function createCard(p) {
  const isFav = getFavorites().includes(p.id);
  const img = p.sprites.other["official-artwork"].front_default;
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <button class="fav-btn ${isFav ? "active" : ""}" data-id="${p.id}">♥️</button>
    <img src="${img}" alt="${p.name}" loading="lazy">
    <p class="poke-id">#${String(p.id).padStart(3,"0")}</p>
    <h3>${p.name}</h3>
    <div class="types">${p.types.map(t =>
      `<span class="type-badge" style="background:${typeColor(t.type.name)}">${t.type.name}</span>`
    ).join("")}</div>
  `;
  card.addEventListener("click", () => showModal(p));
  card.querySelector(".fav-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavorite(p.id);
    e.target.classList.toggle("active");
  });
  return card;
}

function showModal(p) {
  const img = p.sprites.other["official-artwork"].front_default;
  const modal = document.getElementById("modal");
  const statLabels = {hp:"HP",attack:"ATK",defense:"DEF","special-attack":"SpA","special-defense":"SpD",speed:"SPD"};
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeModal()"></div>
    <div class="modal-content">
      <button class="close-btn" onclick="closeModal()">✕</button>
      <div class="modal-img"><img src="${img}" alt="${p.name}"></div>
      <p class="poke-id">#${String(p.id).padStart(3,"0")}</p>
      <h2>${p.name}</h2>
      <div class="types">${p.types.map(t =>
        `<span class="type-badge" style="background:${typeColor(t.type.name)}">${t.type.name}</span>`
      ).join("")}</div>
      <div class="info-row">
        <div><small>Height</small><strong>${p.height/10}m</strong></div>
        <div><small>Weight</small><strong>${p.weight/10}kg</strong></div>
        <div><small>Ability</small><strong>${p.abilities[0]?.ability.name.replace("-"," ")}</strong></div>
      </div>
      <h4>Base Stats</h4>
      <div class="stats">${p.stats.map(s => `
        <div class="stat-row">
          <span class="stat-label">${statLabels[s.stat.name]||s.stat.name}</span>
          <span class="stat-val">${s.base_stat}</span>
          <div class="stat-bar"><div style="width:${(s.base_stat/255)*100}%"></div></div>
        </div>
      `).join("")}</div>
    </div>
  `;
  modal.style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

async function loadPage(page) {
  const grid = document.getElementById("grid");
  grid.innerHTML = '<p class="loading">Loading...</p>';
  try {
    const data = await fetchPokemonList(page * PAGE_SIZE, PAGE_SIZE);
    totalCount = data.count;
    const details = await Promise.all(
      data.results.map(p => fetchPokemonDetail(getPokemonId(p.url)))
    );
    grid.innerHTML = "";
    details.forEach(p => grid.appendChild(createCard(p)));
    document.getElementById("page-info").textContent =
      `Page ${page + 1} of ${Math.ceil(totalCount / PAGE_SIZE)}`;
    document.getElementById("prev-btn").disabled = page === 0;
    document.getElementById("next-btn").disabled = page >= Math.ceil(totalCount / PAGE_SIZE) - 1;
  } catch {
    grid.innerHTML = '<p class="loading">Failed to load. Try again.</p>';
  }
}

async function handleSearch(e) {
  e.preventDefault();
  const q = document.getElementById("search-input").value.trim().toLowerCase();
  if (!q) { loadPage(currentPage); return; }
  const grid = document.getElementById("grid");
  grid.innerHTML = '<p class="loading">Searching...</p>';
  try {
    const p = await fetchPokemonDetail(q);
    grid.innerHTML = "";
    grid.appendChild(createCard(p));
  } catch {
    grid.innerHTML = `<p class="loading">No Pokémon found for "${q}"</p>`;
  }
}

document.getElementById("search-form").addEventListener("submit", handleSearch);
document.getElementById("prev-btn").addEventListener("click", () => { currentPage = Math.max(0, currentPage - 1); loadPage(currentPage); });
document.getElementById("next-btn").addEventListener("click", () => { currentPage++; loadPage(currentPage); });

loadPage(0);