# 1. Problem Code-Bereich
```
declare global {
  var __CODE_A_CUISINE_CONFIG__: RuntimeConfig | undefined;
}
```

# Beschreibung zu der "var" deklaration
Das war stand da, nciht um eine neue Variable anzulegen. Es war im prinzip eine TypeScript-Deklaration über einen globalen Wert, 
den die "runtime-config.js" bereits VOR Angular in das globale Objekt geschrieben hat.

Angular startete erst danach. TypeScript kannte dabei diese "var" property aber nciht automatisch, deshalb wurde dem Compiler gesagt
"Dieses globale Objekt existiert zur Laufzeit, auch wenn es nicht im TypeScript-Modul definiert wurde."

# Zum Unterschied zwischen "var" und dieser globalen deklaration
Das "var" vermeidet man(mir eingeschlossen) fast immer durch ein paar recht unschöne Eigenschaften wie den:
- Function-Scope, statt Block-Scope 
    - ist recht fehleranfällig, da seperate unabhängige Blöcke im blödesten Fall mit einander, in der Codeausführung, kollidieren können,
    wenn die variable bereits in einem anderen Block verwendet wird und vllt ursprünglich nur dafür gelten sollte
    - das "var" operiert funktionsweit und nicht allein nur in dem Block in dem es sich befindet 
    - kurz gefasst besteht die Gefahr vom "Hoisting" und Mehrfachdeklarationen

# Warum war "var" drin?
An der Stelle war es kein "ausgeführter" Code..
Da es in einem "declare" lag, wurde zur Laufzeit im Prinzip nichts erzeugt, es sagte dem TypeScript nur etwas über die Form des globalen Scopes.

Es war hier als Property des globalen Objekts zu verstehen/gedacht.

Als Beispiel:
```
var test = 1
```
passte zum Model
```
globalThis.test
```
während 
```
let test = 1
const test2 = 2
```
nicht dieselbe Art einer globalen Objekt-Property darstellen

## Weiterführend:
```
declare global {
  let __CODE_A_CUISINE_CONFIG__: RuntimeConfig | undefined;
}
```

...wäre hier jedoch auch keine saubere Antwort gewesen, da es zwar das "var" aus dem Code entfernt hätte, 
aber semantisch wäre es weniger passend zu dem gewesen, was meine "runtime-config.js" macht.

Deshalb die aktuelle Lösung mit:
```
type RuntimeGlobal = typeof globalThis & {
  __CODE_A_CUISINE_CONFIG__?: RuntimeConfig;
};

const runtime = (globalThis as RuntimeGlobal).__CODE_A_CUISINE_CONFIG__;
```

Ist fürs Projekt klarer, da man direkt sieht, das auf die zusätzliche Property von "globalThis" zugegriffen wird und nicht auf eine irgendwo vordefinierte "var" Variable

# Kurze Nebenerklärung
Es ist unschwer zu erkennen, dass ich durchaus sehr viel mit KI arbeite, dagegen kann ich leider und möchte nicht widersprechen. Jedoch nutze ich es privat für größere Sachen die meiste Zeit mehr als Zeitersparnis. Es dient in dem Punkt vielleicht nicht unbedingt nur als "Tool", sondern in mancher Hinsicht auch als "Sparing-Partner", wenn ich das so betiteln kann? Es soll auf keinen Fall das eigene Denken ersetzen, ist jedoch aus Zeitlicher Sicht, RICHTIG..., eingesetzt ein unglaublich riesiger Hebel.

Das Prinzip dahinter ist mir durchaus bekannt und auch... durch eigene Erfahrungen, bezüglich mancher privater Projekte im Laufe des letzten Jahres... "schmerzlich" vor augen geführt worden. Jedoch bin ich über jeden Ratschlag und Tipp eurer Seits dankbar und muss dazu erwähnen, das euer KI-Modul ebenfalls einen riesigen Impact in Verständnis und Handhabung des ganzen hatte und hat.. 

Möchte es vielleicht doch kurz sagen, auch wenn es hier gerade wenig zu suchen hat schätze ich.. ich habe dank euch jedoch bereits den Berufswechsel in die IT geschafft...
Ich arbeite seit Mai in einem Unternehmen bei uns in der Nähe und arbeite dort als "Programmierer" an einer Versandplatform für multiple Versanddienstleister anbindungen... iwrd auch bereits Produktiv verwendet.. 

Stack technisch läuft aktuell alles über PHP, MySQL und bisher Vanilla-JS, wobei ich demnächst einen größeren umbau auf Node.js und React vorhabe udn aktuell noch plane.
Habs durch persönliche Projekte arg lieben gelernt, also Node und React... nicht PHP. 

Die Arbeit an diesem Projekt erfolgt (Datenschutzrechtlich in sicherer art und weise) in einiger Zusammenarbeit mit KI, Agenten etc. Und gerade hier hatte ich am anfang noch viel zu rudern, da der Berufswechsel noch vor eurem KI-Modul kam, wenn ich das gerade richtig im Kopf habe... 
Mittlerweile hat man jedoch schon viel dazulernen können und hat sein Zeug, mittlerweile sogar sehr gut, im Griff und ich muss sagen ich freu mich unglaublich darüber.
Kommt auch viel positives Feedback.. an der Kommunikation muss ich jedoch noch arg üben..

Bitte versteht mich nicht falsch.. das soll in keiner weise eine Rechtfertigung oder ein Gegenargument in IRGENDeiner Form sein... ganz im Gegenteil...
Das und vieles weiteres dieses Jahr ist dank euch entstanden.. durch eure Academy, durch das Wissen das ihr wirklich ultra verständlich vermitteln könnt.
Ich glaube dass das alles nicht möglich gewesen wäre und auch nicht so schnell und stabil vorallem, wenn es euch nicht gegeben hätte..

Ich bin euch wirklich dankbar für den ganzen Kurs.. mehr als dankbar... ihr habt ein weiteres komplettes Leben in eine wirklich positive Richtung gelenkt.. verändert...
Das soll bitte auch nicht als geschleime verstanden werden.. hatte einfach schon länger irgendwie mal das Bedürfnis.. danke zu sagen..

--- 

Naja, genug Geschwaffelt und um vielleicht mal wieder aufs eigentliche Thema zu kommen.

Wieso war es jz so chaotisch bei Code-a-Cuisine?.. Da ich leider aktuell sehr im .. "zeitdruck" stecke, zumindest gedanklich... es passiert gerade wieder viel auf arbeit.. ziehe jz die kommenden Monate um und habe zeitgleich mit dem berufswechsel jemanden kennengelernt.
Es soll keine ausrede für den "Mist" sein, jedoch war ich am Anfang in erster Linie mehr auf das Figma design fokussiert und bin mit der, doch sehr blauäugigen, Art und Weis "Zuerst funktionsweise, geht fix über chat, dann grob figma drüber, und optimierung hinter her" an die Sache heran gegangen und möchte mich an dieser Stelle einmal dafür entschuldigen.. 
Ich hatte anfangs alles gründlich ausführlich mit chat durchgesprochen.. mit einen "Phasenaufbauplan" mit ihm erstellt und überlegt, danach mit dem ng als vollständigen Fahrplan, die CLI von Codex durchlaufen lassen und prinzipiell "funktionell" wars dann den meisten stellen.. mein Fehler war hierbei unter anderem das ich mir den Code teil danach so gut wie garnicht mehr angeschaut habe.. da nach einem: "schau mal drüber ob das nach der und der vorgabe passt" und einer von chat generierten Nachricht: "Jup passt" (vereinfacht gesagt)
Ich hatte anfangs alles gründlich ausführlich mit chat durchgesprochen.. mit einen "Phasenaufbauplan" mit ihm erstellt und überlegt, danach mit dem Promptsystem als vollständigen Fahrplan, die CLI von Codex durchlaufen lassen und prinzipiell "funktionell" wares dann, an den meisten stellen.. mein Fehler war hierbei unter anderem das ich mir den Code danach nur zu kleinen Teilen nochmal angeschaut habe.. da nach einem: "schau mal drüber ob das nach der und der vorgabe passt" und einer von chat generierten Nachricht: "Jup passt" (vereinfacht gesagt)
leider doch der Gedanke aufkam "wird schon passen", wenn er das nach meinen Vorgaben so ab nickt. 

Ich versteh in .. 80-90% der Fälle was in meinem Code wann und wo passiert und wenn ich es nicht versteh, dann informiere ich mich... schon alleine aus Eigeninteresse, es macht halt einfach unglaublich spaß...
Jedoch kann man einen Code eben nur schwer verstehen, wenn man sich wieder auf der Technik ausruht und schnell huschi huschi machen "möchte" oder macht, weil man sich einredet das man "muss"..

Ja.. in erster Linie von meiner Seite aus ein wirklich großes Entschuldigung...
Habe mich wieder verleiten lassen, aber defintiv wieder aus dem Spaß gelernt...
Es war euch gegenüber nicht fair.. und wie Rene schon so schön gemeint hat.. man hätte es so nicht präsentieren können... da gebe ich ihm in allen Punkten recht..

Meine Hoffnung ist das der Text nicht zu lange ist (ist er wahrscheinlich o.o) bzw auch nicht zu unpassend oder unprofessionell, jedoch wollte ich es einfach kurz loswerden.. 
Mir brannt vor allem dieses "Danke" schon länger auf der Seele.. und gerade auch die "Entschuldigung" zu dem Mist, was ich hier vorher abgegeben habe.. 

# Abschluss
Zum Schluss noch einmal danke für das ausführliche und vor allem konkrete Feedback. 
Gerade die zweite Runde hat mir tatsächlich einen tieferen Einblick gegeben, bzw ein besseres Verständnis gebracht, warum bestimmte Entscheidungen in Angular, TypeScript und n8n sinnvoller sind als eben gewisse andere.

Ich habe versucht, die angesprochenen Punkte diesmal nicht einfach nur „wegzufixen“, sondern wirklich nachzuvollziehen und entsprechend sauber umzusetzen. Falls euch beim erneuten Review noch etwas auffällt, nehme ich das genauso gerne mit.

Danke für die Ausbildung.. für euer Feedback immer im allgemeinen... und dafür, wie viel sich dadurch bei mir im letzten Jahr beruflich und privat mittlerweile verändert hat.
Ich gebe mir bei den nächsten Projekte wieder bewusster und mehr mühe.. das ist sicher..