const pokemonContainer = document.getElementById("pokemonContainer");
const statusEl = document.getElementById("status");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const showAllBtn = document.getElementById("showAllBtn");

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

function showStatus(message) {
  statusEl.textContent = message;
}

function clearStatus() {
  statusEl.textContent = "";
}

function saveFavorites() {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

function isFavorite(name) {
  return favorites.includes(name);
}

function toggleFavorite(name) {
  if (isFavorite(name)) {
    favorites = favorites.filter(pokemon => pokemon !== name);
  } else {
    favorites.push(name);
  }
  saveFavorites();
}

function createPokemonCard(pokemon) {
  const card = document.createElement("div");
  card.classList.add("card");

  const types = pokemon.types.map(typeInfo => typeInfo.type.name).join(", ");

  card.innerHTML = `
    <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
    <h2>${pokemon.name}</h2>
    <p class="types">Type: ${types}</p>
    <button class="favorite-btn">
      ${isFavorite(pokemon.name) ? "Remove Favorite" : "Add Favorite"}
    </button>
  `;

  const favBtn = card.querySelector(".favorite-btn");
  favBtn.addEventListener("click", () => {
    toggleFavorite(pokemon.name);
    favBtn.textContent = isFavorite(pokemon.name)
      ? "Remove Favorite"
      : "Add Favorite";
  });

  return card;
}

async function fetchPokemonList() {
  showStatus("Loading Pokémon...");
  pokemonContainer.innerHTML = "";

  try {
    const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=12");

    if (!response.ok) {
      throw new Error("Failed to fetch Pokémon list.");
    }

    const data = await response.json();

    const detailPromises = data.results.map(pokemon =>
      fetch(pokemon.url).then(res => {
        if (!res.ok) {
          throw new Error("Failed to fetch Pokémon details.");
        }
        return res.json();
      })
    );

    const pokemonDetails = await Promise.all(detailPromises);

    clearStatus();

    pokemonDetails.forEach(pokemon => {
      const card = createPokemonCard(pokemon);
      pokemonContainer.appendChild(card);
    });
  } catch (error) {
    showStatus("Sorry, something went wrong while loading Pokémon.");
    console.error(error);
  }
}

async function searchPokemon() {
  const searchTerm = searchInput.value.trim().toLowerCase();

  if (!searchTerm) {
    showStatus("Please enter a Pokémon name.");
    return;
  }

  showStatus("Searching...");
  pokemonContainer.innerHTML = "";

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${searchTerm}`);

    if (!response.ok) {
      throw new Error("Pokémon not found.");
    }

    const pokemon = await response.json();
    clearStatus();
    pokemonContainer.appendChild(createPokemonCard(pokemon));
  } catch (error) {
    showStatus("No Pokémon found. Try another name.");
    console.error(error);
  }
}

searchBtn.addEventListener("click", searchPokemon);
showAllBtn.addEventListener("click", fetchPokemonList);

fetchPokemonList();