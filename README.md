# node-red-contrib-domainkits

Query the [DomainKits](https://domainkits.com) domain data API from Node-RED.

This is the official Node-RED node for the DomainKits API, published and maintained by the DomainKits team. DomainKits is built and operated by Lyalpha GmbH, with domain data and infrastructure provided by [ABTdomain](https://abtdomain.com), our domain intelligence and data aggregation platform. This repository is hosted under the ABTdomain GitHub organisation. Learn more about the relationship at [domainkits.com/about](https://domainkits.com/about).

The lead use case is newly registered domain search: every domain registered in the last 60 days across the indexed gTLDs, refreshed daily, filterable by keyword, registration date, length, composition and more. The same two nodes also cover expired, aged, active, deleted and for-sale domain search, plus WHOIS, DNS, safety, Certificate Transparency and trend lookups.

DomainKits is one API with a shared key across every endpoint. One credential in Node-RED covers all of it.

## Install

From the Node-RED editor: Menu, Manage palette, Install, search for `node-red-contrib-domainkits`.

Or from the command line:

```bash
npm install node-red-contrib-domainkits
```

## Credentials

You need a DomainKits API key. Sign up at [domainkits.com](https://domainkits.com/pricing); API access requires a Premium or higher plan, and Premium includes a trial period. Keys start with `dk_`.

Add the key once in the **DomainKits API** configuration node. Both nodes share it.

## Nodes

### domain search

Searches seven domain inventories. Pick the resource in the edit dialog; the filter fields adjust to match.

| Resource | What it searches |
|---|---|
| Newly registered (default) | Domains registered in the last 60 days, from the zone files |
| Newly registered, live feed | Domains registered in the last 3 days, from Certificate Transparency |
| Expired | Domains in the deletion cycle: expired, redemption, pending delete |
| Aged | Domains with 5 to 20+ years of registration history |
| Active | Currently registered domains |
| Deleted | Dropped domains (requires a keyword) |
| For sale | Domains listed on marketplaces |

Typical newly registered query: keyword `shop`, TLD `com`, registration date `2026-07-10`, letters only, no hyphens.

Configure filters in the edit dialog, or override any of them per message via `msg.query`:

```json
{ "keyword": "shop", "tld": "com", "reg_date": "2026-07-10", "type": "all_alpha", "limit": 50 }
```

`length` and `age_range` accept a preset band (`5-10`), an exact value (`10`), or a range (`8-12`). `reg_date` accepts a day (`2026-07-10`), a month (`2026-07`), a year (`2026`), or a `from:to` range.

The two registration feeds read from different places, so they answer different questions. Newly registered reads the zone files and holds 60 days; it is the complete view for the generic TLDs. The live feed reads Certificate Transparency and holds 3 days: a name reaches it once a certificate is issued, which can be before the zone files carry it, so it surfaces names the zone feed cannot show yet. A live row carries `tld` in place of `tld_count`, and the endpoint runs on a smaller per-minute quota. Switch to it per message with `{ "resource": "nrds-live" }` in `msg.query`.

**Output**: `msg.payload` is an array of domains; `msg.total` is the size of the full result set. A single request returns at most 500 rows; page with `offset`.

### domain lookup

Single lookups and reports: WHOIS, DNS records, safety check, IP geolocation, registrar lookup, EPP status guide, TLD availability, typosquat scan, reverse nameserver, domain change monitoring, CT subdomains, CT certificates, CT search, TLD and keyword trends, and account usage.

Set the operation and target in the edit dialog, or per message via `msg.operation` and `msg.target`. Extra REST parameters go in `msg.query`.

## Example flows

**New registration watch**: Inject (daily) sets `msg.query` to `{"keyword":"yourbrand"}`, domain search (newly registered) returns the day's matches, a switch node routes non-empty results to a notification.

**Drop watch**: Inject (daily), domain search (expired, stage pending delete, age 20+), function filters against your list, notification.

**WHOIS enrichment**: any flow that produces a domain feeds domain lookup (WHOIS) and gets registrar, dates and nameservers back on `msg.payload`.

## Coverage

**gTLDs only** for the zone based search resources and trends. The index covers generic TLDs: `.com`, `.net`, `.org`, `.info`, `.biz`, `.xyz`, `.online`, `.site`, `.top`, `.club`, `.live`, `.app`, `.dev` and others. Country-code TLDs are not indexed: a query for `.de`, `.co` or `.us` returns an empty result set, not an error. The live feed is the exception and also carries `.ai` and `.io`.

WHOIS, DNS, safety, IP lookup and Certificate Transparency work on any domain, ccTLDs included.

**No PII.** Responses contain no personal data. WHOIS results are limited to registrar, dates, status codes and nameservers; registrant names, emails, addresses and phone numbers are not returned.

## Rate limits

Quotas follow your account and vary by plan. Every response carries `X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset`. Daily quotas reset at 00:00 UTC. Current limits: [domainkits.com/dev/api-docs](https://domainkits.com/dev/api-docs).

## Resources

- [DomainKits API reference](https://domainkits.com/dev/api-docs)
- [n8n-nodes-domainkits](https://www.npmjs.com/package/n8n-nodes-domainkits), the same API for n8n
- [@domainkits/sdk](https://www.npmjs.com/package/@domainkits/sdk), the same API for TypeScript
- [domainkits](https://pypi.org/project/domainkits/), the same API for Python
- [About DomainKits and ABTdomain](https://domainkits.com/about)
- [ABTdomain](https://abtdomain.com)

## License

[MIT](LICENSE.md)
