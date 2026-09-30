# node-red-contrib-domainkits

Query the [DomainKits](https://domainkits.com) domain data API from Node-RED.

This is the official Node-RED node for the DomainKits API, published and maintained by the DomainKits team. DomainKits is built and operated by Lyalpha GmbH, with domain data and infrastructure provided by [ABTdomain](https://abtdomain.com), our domain intelligence and data aggregation platform. This repository is hosted under the ABTdomain GitHub organisation. Learn more about the relationship at [domainkits.com/about](https://domainkits.com/about).

DomainKits is one API with a shared key across every endpoint. One credential in Node-RED covers all of it. Every parameter, response field and current limit is documented in the [API reference](https://domainkits.com/dev/api-docs) and the [OpenAPI spec](https://domainkits.com/dev/openapi.yaml). This README only lists what the nodes cover.

## Install

From the Node-RED editor: Menu, Manage palette, Install, search for `node-red-contrib-domainkits`.

Or from the command line:

```bash
npm install node-red-contrib-domainkits
```

## Credentials

You need a DomainKits API key. Sign up at [domainkits.com](https://domainkits.com/pricing); API access requires a Premium or higher plan. Keys start with `dk_`.

Add the key once in the **DomainKits API** configuration node. Both nodes share it.

## Nodes

### domain search

One node, seven inventories. Pick the resource in the edit dialog; the filter fields adjust to match.

| Resource | Endpoint |
|---|---|
| Newly registered (default) | `/search/nrds` |
| Newly registered, live feed | `/search/nrds-live` |
| Expired | `/search/expired` |
| Aged | `/search/aged` |
| Active | `/search/active` |
| Deleted | `/search/deleted` |
| For sale | `/search/market` |

Configure filters in the edit dialog, or override any of them per message via `msg.query` using the REST parameter names, verbatim. `msg.query.resource` switches the resource per message.

**Output**: `msg.payload` is an array of domains; `msg.total` is the size of the full result set.

### domain lookup

One node, one operation per call:

| Operation | Endpoint |
|---|---|
| WHOIS | `/whois` |
| DNS records | `/dns` |
| IP lookup | `/ip-lookup` |
| Registrar lookup | `/registrar` |
| EPP status guide | `/status-guide` |
| TLD availability | `/tld-check` |
| Typosquat scan | `/typosquat` |
| Reverse nameserver | `/ns-reverse` |
| Domain change monitoring | `/monitor/changes` |
| CT subdomains | `/ct/subdomains` |
| CT certificates | `/ct/certs` |
| CT search | `/ct/search` |
| TLD trends | `/trends/tlds/*` |
| Keyword trends | `/trends/keywords/*` |
| Account usage | `/usage` |

Set the operation and target in the edit dialog, or per message via `msg.operation` and `msg.target`. Extra REST parameters go in `msg.query`.

The [API reference](https://domainkits.com/dev/api-docs) is the authority on every filter, field and limit.

**No PII.** Responses contain no registrant personal data.

## Example flows

**New registration watch**: Inject (daily) sets `msg.query` to `{"query":"yourbrand"}`, domain search (newly registered) returns the day's matches, a switch node routes non-empty results to a notification.

**Drop watch**: Inject (daily), domain search (expired), function filters against your list, notification.

**WHOIS enrichment**: any flow that produces a domain feeds domain lookup (WHOIS) and gets registrar, dates and nameservers back on `msg.payload`.

## Resources

- [DomainKits API reference](https://domainkits.com/dev/api-docs)
- [n8n-nodes-domainkits](https://www.npmjs.com/package/n8n-nodes-domainkits), the same API for n8n
- [@domainkits/sdk](https://www.npmjs.com/package/@domainkits/sdk), the same API for TypeScript
- [domainkits](https://pypi.org/project/domainkits/), the same API for Python
- [About DomainKits and ABTdomain](https://domainkits.com/about)
- [ABTdomain](https://abtdomain.com)

## License

[MIT](LICENSE.md)
