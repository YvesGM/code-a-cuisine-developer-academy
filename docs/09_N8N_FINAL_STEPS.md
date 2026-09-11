# 09 – n8n: finale manuelle Schritte

Die Workflow-Logik wird ab jetzt ausschließlich in n8n fertiggestellt. Danach werden die finalen Exporte unter `n8n/workflows/` ersetzt.

## 1. Credentials kontrollieren

In n8n müssen folgende Credentials fehlerfrei verbunden sein:

- `Code-a-Cuisine Firebase Service Account` für Firebase RTDB Read/Write,
- `Supabase account` für Quota-RPCs und `workflow_runs`,
- Gemini / Google AI Credential am Node `Generate 3 Recipes with Gemini`,
- `SMTP account` für technische Fehlerbenachrichtigungen.

Keine Private Keys, Database Secrets oder SMTP-Passwörter in Workflow-Code, Angular oder Git hardcoden.

## 2. Error Workflow verknüpfen

Zuerst `Code-a-Cuisine - Error Notification` öffnen und veröffentlichen.

Danach bei diesen Workflows jeweils unter **Workflow Settings → Error workflow** auswählen:

- `Code-a-Cuisine - Recipe Generation`
- `Code-a-Cuisine - Recipe Library`
- `Code-a-Cuisine - Quota Status`

Als Error Workflow jeweils `Code-a-Cuisine - Error Notification` setzen.

## 3. Node-Notes und Quota-Error-Logging geprüft

Alle aktuell exportierten Nodes besitzen aussagekräftige englische Notes.

Der Node `Log Quota Status Error` verwendet im Export die gültige n8n-Expression:

```text
={{ {
  request_id: null,
  client_ip: $('Extract & Validate Client IP').item.json.clientIp,
  status: 'failed',
  stage: 'quota_status',
  error_code: 'quota_backend_error',
  error_message: 'Quota status RPC failed.',
  metadata: {}
} }}
```

Der Error-Ausgang von `Get Daily Recipe Quota` ist:

```text
Get Daily Recipe Quota
Error
→ Log Quota Status Error
→ Email Quota Status Error
→ Respond Quota Status Error
```

## 4. Webhook-Pfade und doppelte Versionen prüfen

Es darf jeweils nur eine veröffentlichte Workflow-Version pro Methode/Pfad existieren:

- `POST /webhook/code-a-cuisine-generate`
- `GET /webhook/code-a-cuisine-library`
- `GET /webhook/code-a-cuisine-quota`

Alte importierte Versionen mit denselben Webhook-Pfaden deaktivieren oder löschen.

## 5. Publish-Reihenfolge

1. Error Notification
2. Quota Status
3. Recipe Library
4. Recipe Generation

Anschließend in allen veröffentlichten Workflows kontrollieren, dass kein Node ein rotes Credential-/Konfigurationssymbol zeigt.

## 6. Supabase-Infrastruktur prüfen

Im Schema `code_a_cuisine` müssen die Quota-/Audit-Objekte der Migration vorhanden sein:

- `generation_quota_claims`
- `workflow_runs`
- Claim-/Complete-/Release-/Status-RPCs

Die frühere Supabase-Recipe-Tabelle ist nicht mehr der Persistenzowner; Recipes liegen in Firebase.

## 7. Firebase prüfen

Die produktive Realtime Database muss die Code-a-Cuisine-DB sein. Nach erfolgreicher Generierung werden Records unter folgendem Pfad erwartet:

```text
/code-a-cuisine/recipes/<recipe-id>
```

Angular benötigt keinen Firebase-Key. Read und Write erfolgen ausschließlich serverseitig über n8n.

## 8. Quota-Endpoint testen

Production URL aufrufen:

```text
https://schnief.app.n8n.cloud/webhook/code-a-cuisine-quota
```

Erwartet wird JSON mit Tageskey, IP-/Globalverbrauch, Restkontingent und `generationAllowed`.

Im n8n Execution Log prüfen, ob die tatsächliche Client-IP korrekt aus den Proxy-Headern abgeleitet wird.

## 9. Generation genau einmal real testen

Beispielrequest an den Production Webhook:

```json
{
  "schemaVersion": 2,
  "clientRequestId": "cac-manual-smoke-001",
  "ingredients": [
    { "id": "pasta", "name": "Pasta", "amount": 200, "unit": "g" },
    { "id": "tomato", "name": "Tomaten", "amount": 200, "unit": "g" },
    { "id": "spinach", "name": "Spinat", "amount": 100, "unit": "g" }
  ],
  "preferences": {
    "difficulty": "quick",
    "cuisine": "italian",
    "diet": "vegetarian"
  },
  "servings": 2,
  "cookCount": 1
}
```

Erwartet:

- HTTP 200,
- `schemaVersion: 2`,
- exakt 3 Recipes,
- `persisted: true`,
- drei neue Firebase-Records,
- erfolgreicher `workflow_runs`-Eintrag,
- Quota-Claim `completed`.

Wegen `3 Rezepte pro IP/Tag` verbraucht dieser Test bereits das komplette Tageskontingent dieser IP.

## 10. Library testen

Nach dem Generate-Test:

```text
GET /webhook/code-a-cuisine-library?page=1
```

muss die drei gespeicherten Recipes liefern.

Danach eine zurückgegebene Recipe-ID testen:

```text
GET /webhook/code-a-cuisine-library?id=<recipe-id>
```

Der Payload muss der vollständigen Recipe-Detailstruktur entsprechen.

## 11. Quota-Fehler testen

Ein weiterer gültiger Generation-Request von derselben IP am selben Tag muss vor Gemini mit HTTP 429 stoppen.

Dabei prüfen:

- kein zweiter KI-Aufruf,
- verständlicher Fehlervertrag,
- Quota-/Audit-Eintrag vorhanden.

Wenn für weitere Smoke-Tests ein Reset nötig ist, nur den heutigen eigenen Test-Claim kontrolliert in Supabase zurücksetzen; keine Quota-Logik im Workflow umgehen.

## 12. Fehlerworkflow testen

Vor der finalen Abgabe mindestens einen kontrollierten technischen Fehler in einer Testkopie auslösen und prüfen:

- `workflow_runs` erhält den Fehler,
- SMTP-Mail kommt an,
- Error Notification Workflow wird tatsächlich ausgeführt.

Danach Teständerung wieder zurücknehmen.

## 13. Finale Exporte ins Repository

Nach allen manuellen n8n-Änderungen jeden der vier Workflows neu exportieren und die Dateien unter `n8n/workflows/` ersetzen.

Vor dem Commit nach Secrets suchen. Insbesondere dürfen NICHT enthalten sein:

- Firebase Private Key / Service-Account-JSON,
- Firebase Database Secret,
- SMTP-Passwort,
- Supabase Service Role / Secret,
- Gemini API-Key,
- sonstige hardcodierte Tokens.

n8n-Credential-Referenzen/-Namen sind keine entschlüsselten Secrets. Wenn die Academy portable Exporte erwartet, können instanzspezifische Credential-IDs vor Abgabe entfernt werden; die Secrets selbst bleiben immer in n8n.
