import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { writeFileSync } from "fs";

const BASE_URL = "https://www.imdb.com/title/";

async function scrapeMovie(imdbId) {
  const url = `${BASE_URL}${imdbId}/`;
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  // --- Titre
  const title = $('[data-testid="hero__primary-text"]').first().text().trim();

  // --- Année
  const year = parseInt($('ul.ipc-inline-list li a[href*="/releaseinfo"]').first().text().trim(), 10);

  // --- Durée (convertir en minutes)
  const durationText = $('ul.ipc-inline-list li').last().text().trim();
  const duration = parseDuration(durationText);

  // --- Synopsis
  const synopsis = $('[data-testid="plot-xl"]').text().trim()
                || $('[data-testid="plot-l"]').text().trim()
                || $('[data-testid="plot-xs_to_m"]').text().trim();

  return { title, year, duration, synopsis };
}

// Convertir "1h 51m" → 111 minutes
function parseDuration(str) {
  let minutes = 0;
  const hMatch = str.match(/(\d+)h/);
  const mMatch = str.match(/(\d+)m/);
  if (hMatch) minutes += parseInt(hMatch[1], 10) * 60;
  if (mMatch) minutes += parseInt(mMatch[1], 10);
  return minutes;
}

async function main() {
  const ids = ["tt0117571", "tt0133093", "tt0468569"]; // scream, matrix, dark knight
  const results = [];

  for (const id of ids) {
    console.log(`Scraping ${id}...`);
    const data = await scrapeMovie(id);
    results.push(data);
  }

  // Écriture dans un fichier JSON
  writeFileSync("movies.json", JSON.stringify(results, null, 4), "utf-8");
  console.log("✅ Fichier movies.json généré !");
}

main();
