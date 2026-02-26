---
title: APIs
---

Bienvenue dans la section APIs.

## [Pelo API](pelo-api/pelo-api)

### Endpoints disponibles

- **Health**: [Health check](pelo-api/check-the-health-status-of-the-api) - `GET /health`

### Comment utiliser la documentation ?

1. **Explorez les endpoints**: Cliquez sur les liens dans la sidebar pour voir les détails de chaque endpoint.
2. **Testez les requêtes**: Utilisez l'interface interactive pour envoyer des requêtes directement depuis la documentation.
3. **Consultez les schémas**: Les schémas des données sont également disponibles pour chaque endpoint.

### Exemple de requête

Voici un exemple de requête pour obtenir les alertes trafic :

```bash
curl -X GET "https://api.dotshell.eu/pelo/v1/traffic/alerts" \
  -H "Content-Type: application/json"
```

### Prochaines étapes

- Explorez les autres sections de la documentation pour en savoir plus sur nos libraries et outils.
