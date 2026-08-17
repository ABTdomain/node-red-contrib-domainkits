module.exports = function (RED) {
	const BASE_URL = 'https://premium-api.domainkits.com/api/v1';
	const COMMON = ['keyword', 'tld', 'position', 'length', 'type', 'no_number', 'no_hyphen', 'sort', 'limit', 'offset'];
	const RESOURCES = {
		nrds: [...COMMON, 'exclude', 'days_range', 'reg_date', 'period', 'has_sale'],
		'nrds-live': [...COMMON, 'exclude', 'days_range'],
		expired: [...COMMON, 'exclude', 'status', 'age_range', 'hold', 'auction_date'],
		aged: [...COMMON, 'exclude', 'age_range', 'has_sale'],
		active: [...COMMON, 'status'],
		deleted: [...COMMON, 'exclude', 'age_range', 'hold'],
		market: [...COMMON, 'exclude', 'platform'],
	};

	function DomainKitsSearchNode(config) {
		RED.nodes.createNode(this, config);
		const node = this;
		node.api = RED.nodes.getNode(config.api);

		node.on('input', async function (msg, send, done) {
			const apiKey = node.api && node.api.credentials && node.api.credentials.apiKey;
			if (!apiKey) {
				node.status({ fill: 'red', shape: 'ring', text: 'missing credentials' });
				done(new Error('DomainKits API credentials are not configured'));
				return;
			}

			const override = msg.query && typeof msg.query === 'object' ? msg.query : {};
			const resource = override.resource || msg.resource || config.resource || 'nrds';
			const allowed = RESOURCES[resource];
			if (!allowed) {
				done(new Error(`Unknown resource: ${resource}`));
				return;
			}

			const query = new URLSearchParams();
			for (const key of allowed) {
				const value = override[key] !== undefined ? override[key] : config[key];
				if (value === undefined || value === null || value === '' || value === false) continue;
				query.set(key, String(value));
			}

			node.status({ fill: 'blue', shape: 'dot', text: `searching ${resource}` });
			try {
				const response = await fetch(`${BASE_URL}/search/${resource}?${query.toString()}`, {
					headers: {
						Authorization: `Bearer ${apiKey}`,
						Accept: 'application/json',
						'User-Agent': 'node-red-contrib-domainkits/0.1.0',
					},
				});
				const body = await response.json();
				if (!response.ok || body.success === false) {
					const message = body.error || `Request failed with status ${response.status}`;
					node.status({ fill: 'red', shape: 'ring', text: `error ${response.status}` });
					done(new Error(message));
					return;
				}
				msg.payload = body.data || [];
				msg.total = body.total || 0;
				msg.resource = resource;
				node.status({ fill: 'green', shape: 'dot', text: `${resource}: ${msg.payload.length} of ${msg.total}` });
				send(msg);
				done();
			} catch (error) {
				node.status({ fill: 'red', shape: 'ring', text: 'request failed' });
				done(error);
			}
		});
	}

	RED.nodes.registerType('domainkits-search', DomainKitsSearchNode);
};
