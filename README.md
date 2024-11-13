# AI-Developer-Task

Ten skrypt Node.js automatycznie pobiera treść artykułu z podanego URL, przesyła ją do API OpenAI (ChatGPT) w celu przekształcenia jej na czysty HTML zgodnie z określonymi wytycznymi, a następnie zapisuje wygenerowany kod HTML do pliku `artykul.html`.

## **Instrukcja Działania Kodu**

### **1. Konfiguracja Środowiska**

```javascript
require("dotenv").config();
const fs = require("fs").promises;
const axios = require("axios");
```

- **dotenv**: Ładuje zmienne środowiskowe z pliku `.env`, umożliwiając dostęp do klucza API OpenAI poprzez `process.env.OPENAI_API_KEY`.
- **fs**: Umożliwia operacje na systemie plików, takie jak zapisywanie plików.
- **axios**: Służy do wykonywania żądań HTTP, używany zarówno do pobierania artykułu, jak i komunikacji z API OpenAI.

### **2. Funkcja `fetchArticleFromURL`**

```javascript
async function fetchArticleFromURL(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error(`Błąd podczas pobierania artykułu z URL: ${error.message}`);
  }
}
```

- **Cel**: Pobiera treść artykułu z podanego URL.
- **Działanie**: Wykonuje żądanie GET do URL i zwraca dane odpowiedzi. W przypadku błędu rzuca wyjątek z odpowiednim komunikatem.

### **3. Funkcja `generateHTMLContent`**

```javascript
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
      }
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
      console.error("Błąd odpowiedzi serwera:", error.response.status);
      console.error("Dane odpowiedzi:", error.response.data);
    } else if (error.request) {
      console.error("Brak odpowiedzi od serwera:", error.request);
    } else {
      console.error("Błąd:", error.message);
    }
    throw new Error(`Błąd podczas komunikacji z OpenAI: ${error.message}`);
  }
}
```

- **Cel**: Przesyła treść artykułu do API OpenAI w celu wygenerowania czystego HTML zgodnie z określonymi wytycznymi.
- **Działanie**:
  1. Sprawdza, czy klucz API OpenAI jest dostępny.
  2. Tworzy prompt zawierający instrukcje dla modelu GPT-4 oraz treść artykułu.
  3. Wysyła żądanie POST do API OpenAI z odpowiednimi nagłówkami i danymi.
  4. Odbiera odpowiedź, usuwa ewentualne znaczniki kodu Markdown (```html) i zwraca czysty HTML.
  5. Obsługuje błędy związane z odpowiedzią serwera lub brakiem odpowiedzi.

### **4. Funkcja `saveHTMLToFile`**

```javascript
async function saveHTMLToFile(htmlContent, filename) {
  try {
    await fs.writeFile(filename, htmlContent, "utf-8");
  } catch (error) {
    throw new Error(`Błąd podczas zapisu pliku: ${error.message}`);
  }
}
```

- **Cel**: Zapisuje wygenerowany kod HTML do określonego pliku.
- **Działanie**: Używa modułu `fs` do zapisu zawartości HTML do pliku o podanej nazwie. W przypadku błędu rzuca wyjątek z odpowiednim komunikatem.

### **5. Główna Funkcja `main`**

```javascript
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
```

- **Cel**: Koordynuje cały proces od pobrania artykułu, poprzez generowanie HTML, aż do zapisu pliku.
- **Działanie**:
  1. Definiuje URL artykułu do pobrania.
  2. Wywołuje funkcję `fetchArticleFromURL` w celu pobrania treści artykułu.
  3. Przekazuje pobraną treść do funkcji `generateHTMLContent`, aby wygenerować HTML za pomocą OpenAI.
  4. Zapisuje wygenerowany HTML do pliku `artykul.html` za pomocą funkcji `saveHTMLToFile`.
  5. Obsługuje ewentualne błędy na każdym etapie procesu i wyświetla odpowiednie komunikaty.

## **Instrukcje Jak Uruchomić Skrypt**

### **1. Wymagania Wstępne**

- **Node.js**: Upewnij się, że Node.js jest zainstalowany na Twoim komputerze. Możesz pobrać go z [oficjalnej strony Node.js](https://nodejs.org/).

- **Git**: Jeśli jeszcze nie masz zainstalowanego Git, pobierz go ze [strony oficjalnej Git](https://git-scm.com/downloads) i zainstaluj.

### **2. Klonowanie Repozytorium**

Jeśli jeszcze nie sklonowałeś repozytorium, wykonaj poniższe kroki:

```bash
git clone https://github.com/twoja-nazwa-uzytkownika/AI-Developer-Task.git
cd AI-Developer-Task
```

Zastąp `twoja-nazwa-uzytkownika` odpowiednią nazwą użytkownika na GitHub oraz `AI-Developer-Task` nazwą Twojego repozytorium.

### **3. Instalacja Zależności**

W katalogu projektu uruchom następujące polecenie, aby zainstalować wszystkie niezbędne zależności:

```bash
npm install
```

To polecenie zainstaluje moduły wymienione w pliku `package.json`, takie jak `dotenv` i `axios`.

### **4. Konfiguracja Pliku `.env`**

Utwórz plik `.env` w głównym katalogu projektu i dodaj do niego swój klucz API OpenAI:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

Zastąp `your_openai_api_key_here` swoim rzeczywistym kluczem API dostarczonym przez OpenAI. Upewnij się, że plik `.env` jest poprawnie skonfigurowany, ponieważ jest kluczowy dla działania skryptu.

### **5. Uruchomienie Skryptu**

Po zainstalowaniu zależności i skonfigurowaniu pliku `.env`, możesz uruchomić skrypt za pomocą poniższego polecenia:

```bash
node app.js
```

### **6. Wynik**

Po uruchomieniu skryptu:

1. Skrypt pobierze artykuł z określonego URL.
2. Prześle treść artykułu do API OpenAI w celu wygenerowania czystego HTML.
3. Zapisze wygenerowany kod HTML do pliku `artykul.html` w głównym katalogu projektu.

W konsoli zobaczysz komunikaty informujące o postępie operacji:

```
Pobieranie artykułu...
Artykuł pobrany.
Generowanie HTML za pomocą OpenAI...
HTML wygenerowany.
Zapisywanie HTML do pliku...
Plik artykul.html został zapisany.
```

### **7. Dodatkowe Uwagi**

- **Bezpieczeństwo**: Upewnij się, że plik `.env` jest wymieniony w `.gitignore`, aby nie został przypadkowo dodany do repozytorium Git. Plik `.env` zawiera wrażliwe dane, takie jak klucze API.

- **Sprawdzanie Błędów**: Jeśli skrypt napotka problemy, takie jak brak klucza API lub błąd komunikacji z OpenAI, odpowiednie komunikaty błędów zostaną wyświetlone w konsoli.

- **Aktualizacja Treści**: Możesz zmienić URL artykułu w funkcji `main`, aby pobierać i przekształcać różne artykuły.

## **Podsumowanie**

Ten skrypt automatyzuje proces przekształcania treści artykułu na czysty HTML, korzystając z mocy sztucznej inteligencji dostarczanej przez OpenAI. Dzięki temu możesz szybko generować dobrze sformatowane pliki HTML bez konieczności ręcznego kodowania. Upewnij się, że plik `.env` zawiera prawidłowy klucz API OpenAI, aby skrypt działał poprawnie.
