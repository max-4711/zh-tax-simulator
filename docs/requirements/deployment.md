# Anforderungen an Bereitstellung und Betrieb

## DEPLOY-001: GitHub Pages

Die Anwendung wird primär als statische Website auf GitHub Pages veröffentlicht. Die Veröffentlichung erfolgt über GitHub Actions aus dem Branch `main`. GitHub Pages muss im Repository auf **GitHub Actions** als Quelle eingestellt sein.

## DEPLOY-002: Unterverzeichnis

Die öffentliche Basis-URL lautet `https://max-4711.github.io/zh-tax-simulator/`. Alle erzeugten Ressourcenpfade und internen Links müssen mit dem Unterverzeichnis `/zh-tax-simulator/` kompatibel sein.

## DEPLOY-003: Docker

Die Anwendung kann zusätzlich als Docker-Container betrieben werden. Der Container enthält lediglich den gebauten statischen Webauftritt und einen Webserver; er enthält kein eigenes Anwendungs-Backend.

## DEPLOY-004: ARM-Linux

Das Container-Image unterstützt Linux auf ARM64 und AMD64. Damit ist der Betrieb auf einem ARM64-basierten Raspberry Pi und auf üblichen AMD64-Systemen möglich. Der Build verwendet plattformübergreifende Basis-Images und führt den statischen Website-Build auf der Architektur des Build-Systems aus. Dadurch ist für den Cross-Build keine Prozessoremulation erforderlich.

## DEPLOY-005: Lokale Entwicklung

Die Entwicklung kann mit Node.js oder über Docker erfolgen. Docker kann auch über die verfügbare WSL-Umgebung verwendet werden. Node.js und Docker müssen nicht gleichzeitig auf dem Host installiert sein.
