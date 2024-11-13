require("dotenv").config();
const fs = require("fs").promises;
const axios = require("axios");

// 1. Funkcja do pobrania artykułu z URL
async function fetchArticleFromURL(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error(`Błąd podczas pobierania artykułu z URL: ${error.message}`);
  }
}

// 2. Zaktualizowana funkcja do wysyłania zapytania do OpenAI (ChatGPT)
async function generateHTMLContent(articleText) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Brak klucza API. Ustaw OPENAI_API_KEY w pliku .env");
  }

  const prompt = `
    Przekształć poniższy artykuł na czysty HTML zgodnie z poniższymi wytycznymi:
    1. Użyj odpowiednich tagów HTML do strukturyzacji treści (np. <h1>, <h2>, <p>).
    2. Określ miejsca, gdzie warto wstawić grafiki, oznaczając je za pomocą tagu <img> z atrybutem src="image_placeholder.jpg".
    3. Dodaj atrybut alt do każdego obrazka zawierający dokładny prompt, który możemy użyć do wygenerowania grafiki.
    4. Dodaj podpisy pod grafikami używając tagu <figcaption>.
    5. Nie używaj kodu CSS ani JavaScript. Zwrócony kod powinien zawierać wyłącznie zawartość do wstawienia bez znaczników <html>, <head> ani <body>.
    6. Upewnij się, że wstawiasz **wielokrotnie** obrazki w odpowiednich miejscach artykułu.
    
    Artykuł:
    ${articleText}

    **Uwaga:** Zwróć wyłącznie czysty kod HTML bez żadnych dodatkowych znaczników, komentarzy czy formatowania Markdown.
  `;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "Jesteś asystentem, który przekształca artykuły w czysty HTML zgodnie z określonymi wytycznymi.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data.choices && response.data.choices.length > 0) {
      let content = response.data.choices[0].message.content.trim();

      // Usuń ewentualne znaczniki ```html i ```
      content = content
        .replace(/^```html\s*/, "")
        .replace(/```\s*$/, "")
        .trim();

      return content;
    } else {
      throw new Error("Brak odpowiedzi od OpenAI");
    }
  } catch (error) {
    if (error.response) {
      // Serwer odpowiedział kodem statusu innym niż 2xx
      console.error("Błąd odpowiedzi serwera:", error.response.status);
      console.error("Dane odpowiedzi:", error.response.data);
    } else if (error.request) {
      // Żądanie zostało wysłane, ale brak odpowiedzi
      console.error("Brak odpowiedzi od serwera:", error.request);
    } else {
      // Inny błąd
      console.error("Błąd:", error.message);
    }
    throw new Error(`Błąd podczas komunikacji z OpenAI: ${error.message}`);
  }
}

// 3. Funkcja do zapisu wygenerowanego HTML do pliku
async function saveHTMLToFile(htmlContent, filename) {
  try {
    await fs.writeFile(filename, htmlContent, "utf-8");
  } catch (error) {
    throw new Error(`Błąd podczas zapisu pliku: ${error.message}`);
  }
}

// 4. Główna funkcja
async function main() {
  const url =
    "https://cdn.oxido.pl/hr/Zadanie%20dla%20JJunior%20AI%20Developera%20-%20tresc%20artykulu.txt";
  try {
    console.log("Pobieranie artykułu...");
    const articleText = await fetchArticleFromURL(url);
    console.log("Artykuł pobrany.");

    console.log("Generowanie HTML za pomocą OpenAI...");
    const generatedHTML = await generateHTMLContent(articleText);
    console.log("HTML wygenerowany.");

    console.log("Zapisywanie HTML do pliku...");
    await saveHTMLToFile(generatedHTML, "artykul.html");
    console.log("Plik artykul.html został zapisany.");
  } catch (error) {
    console.error(error.message);
  }
}

main();
