# 04 – Phasenplan

Status: [ ] nicht begonnen · [~] in Arbeit · [x] validiert · [!] blockiert. Keine neue Phase gilt vor erfolgreichen Lint-, Test- und Build-Prüfungen als abgeschlossen.

| Phase                            | Status | Stand                                                                                                                                       |
| -------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 Foundation                     | [x]    | Bestehende grüne Grundlage laut Auftraggeber; kein Neuaufbau                                                                                |
| 1 Core Angular / Academy Pre-n8n | [~]    | Schema 2 und Checklisten-Frontend implementiert; nach den aktuellen Supabase-Anpassungen lokaler Qualitätslauf erneut erforderlich             |
| 2 n8n + echte KI                 | [ ]    | Nächster fachlicher Auftrag, auf Basis des vorhandenen Join-Issue-Collector-Projekts                                                        |
| 3 Supabase                       | [~]    | Bestandsmigrationen gezogen; Custom-Schema-Migration, Data-API-Adapter und RLS vorbereitet; `db push`, Remote-Exposed-Schema und Runtime-Werte stehen noch aus         |
| 4 Figma / Styling / Responsive   | [ ]    | Finales Design, Responsive-Optimierung und Loading-Animation                                                                                |
| 5 Hardening / Abgabe             | [ ]    | Reale Impressumsdaten, Cross-Browser-/Accessibility-Abschlussprüfung und finale Checks                                                      |

Zunächst die aktuellen Tests und den Browserflow in einer Umgebung mit funktionierendem Bundler ausführen. Die Agent-Umgebung wird dafür nicht durch Architekturänderungen umgangen. Danach Schema 2 mit dem echten n8n-Workflow integrieren und die Quota-Auslegung klären. Supabase ist code- und migrationsseitig vorbereitet; die Bestandsmigrationen liegen lokal. Offen sind der Push der neuen `code_a_cuisine`-Migration, das Exponieren des Schemas in der Remote Data API und die lokale/deploymentseitige Runtime-Konfiguration.
