# 03 – Datenverträge

Verbindliche Quelle: src/app/core/models.ts. Zentrale Regeln: config.ts und response-validation.ts.

## Versionierung

Der Pre-n8n-Vertrag verwendet **schemaVersion: 2**. Neue Pflichtfelder, die veränderte Nutrition-Struktur und exakt drei Rezepte sind inkompatibel zu Schema 1. Alte Responses werden ausdrücklich abgelehnt, nicht migriert oder still ergänzt. Es gibt noch keine persistierte Produktionshistorie zu migrieren.

## Vollständiger Request

```json
{
  "schemaVersion": 2,
  "clientRequestId": "unique-request-id",
  "ingredients": [{ "id": "ingredient-123", "name": "Pasta", "amount": 120, "unit": "g" }],
  "servings": 2,
  "cookCount": 1,
  "preferences": { "difficulty": "quick", "cuisine": "italian", "diet": "none" }
}
```

createRequest kopiert Eingaben und erzeugt standardmäßig eine UUID. Jede Generierung/Retry erhält eine neue ID. Ingredient-IDs sind eindeutig und nichtleer; Mengen endlich und positiv. servings ist ganzzahlig 1–12, Default 2; cookCount ganzzahlig 1–3, Default 1.

## Response

Envelope: schemaVersion = 2, clientRequestId exakt aus dem Request, recipes mit **exakt drei** vollständigen Recipe-Objekten. Jedes Recipe enthält:

- id und title: nichtleer und im Satz eindeutig; Titelvergleich ignoriert äußere Leerzeichen und Groß-/Kleinschreibung.
- cuisine, difficulty und diet: bekannte Keys und identisch zu den ausgewählten Preferences.
- servings und cookCount: exakt passend zum Request.
- cookingTimeMinutes: endlich, positiv und innerhalb der Difficulty-Metadaten.
- rank: positive Ganzzahl; kleinere Ränge zuerst, bei Gleichstand ID.
- ingredients, additionalIngredients, nutrition und directions gemäß folgenden Strukturen.

### Zutaten

```json
{
  "ingredients": [
    { "sourceIngredientId": "ingredient-123", "name": "Pasta", "amount": 20, "unit": "g" }
  ],
  "additionalIngredients": [{ "name": "Salz", "amount": 1, "unit": "g" }]
}
```

Mengen sind Gesamtmengen des Rezepts. User-Zutaten referenzieren ausschließlich Eingabe-IDs. Name und Einheit bleiben identisch, Menge ist endlich, positiv und höchstens der Vorrat. Doppelte Referenzen innerhalb eines Rezepts sind ungültig.

Coverage = Anzahl eindeutiger verwendeter User-IDs / Anzahl eingegebener IDs >= 0.70. Zusätzliche Zutaten zählen nicht mit. Der Mock verwendet 100 % der IDs.

additionalIngredients ist ein erforderliches Array mit 0–3 Einträgen. Namen sind nichtleer, Mengen endlich/positiv und Einheiten bekannt. sourceIngredientId ist dort vollständig verboten, einschließlich null. Der Mock verwendet je nach Variante keine zusätzliche Zutat, Wasser oder Öl. Eine große Basiszutaten-Datenbank oder semantische Klassifikation wird nicht implementiert.

### Portionsskalierung

Der Mock verwendet amount × servings / LIMITS.servings.max. Bei zwei Portionen aus 120 g Vorrat sind es 20 g Gesamtmenge, bei vier Portionen 40 g, bei zwölf 120 g. Die gleichmäßige technische Vorratsaufteilung ist reproduzierbar und überschreitet nie vorhandene Mengen, aber keine fachliche Aussage über eine ausreichende Mahlzeit. Zusätzliche Demo-Mengen skalieren linear pro Portion.

### Nutrition

```json
{
  "perServing": {
    "energyKcal": 400,
    "protein": { "grams": 20, "percent": 20 },
    "carbs": { "grams": 50, "percent": 50 },
    "fat": { "grams": 13.333333333333334, "percent": 30 }
  },
  "total": {
    "energyKcal": 800,
    "protein": { "grams": 40, "percent": 20 },
    "carbs": { "grams": 100, "percent": 50 },
    "fat": { "grams": 26.666666666666668, "percent": 30 }
  }
}
```

NutritionValues wird für beide Bezugsgrößen verwendet, MacroNutrient für alle Makros. Alle Zahlen sind endlich und nichtnegativ; Prozent liegt in 0–100. total.energyKcal und total.*.grams müssen dem jeweiligen perServing-Wert × servings entsprechen. Prozentanteile bleiben gleich. Relative Rundungstoleranz: 1e-6.

Die Demo-Prozentwerte bezeichnen Energieanteile der Makronährstoffe, keine Tagesbedarfswerte. Reale Nutrition-Quelle und deren Berechnung werden mit n8n abgestimmt. Der Validator prüft Struktur und Skalierung, nicht die wissenschaftliche Richtigkeit oder Lebensmitteleignung.

### Directions

```json
[
  {
    "step": 1,
    "title": "Zutaten vorbereiten",
    "instruction": "Zutaten prüfen.",
    "assignedCooks": [1],
    "parallelGroup": "vorbereitung"
  },
  {
    "step": 2,
    "title": "Geräte vorbereiten",
    "instruction": "Arbeitsbereich vorbereiten.",
    "assignedCooks": [2],
    "parallelGroup": "vorbereitung"
  },
  {
    "step": 3,
    "title": "Zubereiten",
    "instruction": "Vorbereitete Komponenten verarbeiten.",
    "assignedCooks": [1],
    "waitingTimeMinutes": 5
  }
]
```

Beispiel für cookCount = 2. Pflichtliste, step lückenlos 1..N in Arrayreihenfolge, title/instruction nichtleer. assignedCooks ist nichtleer, enthält eindeutige ganzzahlige IDs innerhalb 1..cookCount. Optionale Wartezeit ist endlich, nichtnegativ und höchstens die Gesamtkochzeit.

Optionale parallelGroup ist ein nichtleerer String. Gleich benannte Schritte müssen zusammenhängend sein und mindestens zwei Schritte umfassen. Ein Helfer darf innerhalb einer Parallelgruppe nicht gleichzeitig mehreren Schritten zugeordnet sein. Gruppen können nacheinander stehen; keine Workflow-Engine und kein impliziter Scheduler.

## Difficulty und Semantik

quick: 0 < Minuten <= 20; medium: 20 <= Minuten <= 45; complex: Minuten >= 45. Die Grenzwerte 20 und 45 sind bewusst inklusive. Der Mock verwendet 15–17, 30–32 oder 50–52 Minuten.

Unbekannte IDs werden weiterhin nie akzeptiert. Freitextanweisungen, tatsächliche Diätverträglichkeit und die semantische Eignung zusätzlicher Basiszutaten müssen später n8n/AI prüfen. Kein ungültiger Response gelangt in FlowState oder Repository.


## Supabase-Persistenzvertrag

Die öffentliche Library persistiert jedes validierte `Recipe` in `code_a_cuisine.recipes`. Normalisierte Spalten (`id`, `title`, `cuisine`, `difficulty`, `diet`, `cooking_time_minutes`, `servings`, `cook_count`, `rank`) ermöglichen Filterung und Pagination; `payload jsonb` enthält den vollständigen Schema-2-Recipe-Datensatz. Die Migration prüft zentrale Keys und die Übereinstimmung zwischen Filterspalten und Payload.

Angular nutzt ausschließlich Project URL und Publishable Key aus der nicht versionierten Runtime-Konfiguration; die Werte werden nicht in TypeScript oder `.env` committed. Das Repository liest `payload` erneut durch `validateStoredRecipe`; Daten aus der Datenbank werden nicht blind als `Recipe` gecastet. Secret-/Service-Role-Keys sind ausschließlich für spätere serverseitige Komponenten wie n8n vorgesehen und gehören nie ins Frontend.
