# code2logs README

This is a hacky VSCode extension to see application logs and metrics directly in VSCode.

## Setup

The extension only works with a Grafana running on http://localhost:3000 together with the https://github.com/svennergr/grafana-vscodescenes-app.

### Grafana settings

1. Install https://github.com/svennergr/grafana-vscodescenes-app as a plugin of your local Grafana instance.
2. Since the instance is rendered inside an `iframe`, Grafana needs some configuration entries:
   
```
[security]
allow_embedding = true
cookie_samesite = none
cookie_secure = true
```

3. Create the needed Loki and Prometheus datasources pointing to the databases that store logs and metrics.

### Repository settings you want to see logs for

To view application logs and metrics, repositories need to have configuration files (TODO: get a good default here). 
For Loki and Mimir, I used this configuration inside the `/pkg` directory of Loki. Save the following as a `.labels.json` file in the Loki repositories `/pkg` directory:

```json
[
  {
    "label": "service_name",
    "value": "${workspaceName}/${filepath:replace(/.*\\/?pkg\\/(.*?)\\/.+$/g, '$1')}",
    "operator": "="
  },
  {
    "label": "cluster",
    "values": ["dev-us-central-0", "dev-us-east-0", "dev-eu-west-2"],
    "operator": "=",
    "type": "oneOf"
  },
  {
    "value": "caller=${filename}",
    "operator": "|=",
    "type": "filter"
  }
]
```