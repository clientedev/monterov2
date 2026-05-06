
import fetch from 'node-fetch';

async function test() {
    const uf = "SP";
    const municipio = "SAO PAULO";
    const cnae = "5611201";

    console.log("Testing Speedio API...");
    const url = `https://api-publica.speedio.com.br/buscarcnpj?curso=1&cnae=${cnae}&uf=${uf}&municipio=${encodeURIComponent(municipio)}`;
    console.log("URL:", url);
    
    try {
        const res = await fetch(url);
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Data:", JSON.stringify(data).substring(0, 500));
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
