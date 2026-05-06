
import fetch from 'node-fetch';

async function test() {
    const uf = "SP";
    const municipio = "São Paulo";
    const cityId = "3550308";
    const cnaeCode = "5611201";

    console.log("Testing CNPJ API with Name...");
    const params = new URLSearchParams();
    params.set("uf", uf);
    params.set("municipio", municipio.toUpperCase());
    params.set("cnae", cnaeCode);
    
    let url = `https://publica.cnpj.ws/cnpjs?${params.toString()}`;
    console.log("URL:", url);
    
    try {
        const res = await fetch(url, { headers: { "Accept": "application/json" } });
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Results count:", (Array.isArray(data) ? data.length : (data.data?.length || 0)));
    } catch (e) {}

    console.log("\nTesting OSM Overpass with Accents...");
    const overpassQuery = `
[out:json][timeout:30];
area[name="${municipio}"][admin_level=8]->.searchArea;
(
  node["amenity"="restaurant"](area.searchArea);
);
out center 10;
`.trim();

    try {
        const osmRes = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: `data=${encodeURIComponent(overpassQuery)}`
        });
        const osmData = await osmRes.json();
        console.log("OSM Elements count (with accents):", osmData.elements?.length);
    } catch (e) {}
}

test();
