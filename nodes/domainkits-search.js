module.exports = function (RED) {
	const BASE_URL = 'https://premium-api.domainkits.com/api/v1';
	const COMMON = [
		'query', 'tld', 'position', 'length_min', 'length_max',
		'has_number', 'all_number', 'all_alpha', 'has_hyphen',
		'exclude_query', 'sort', 'limit', 'offset',
	];
	const RESOURCES = {
		nrds: [...COMMON, 'create_date_start', 'create_date_end', 'period_min', 'period_max', 'has_sale'],
		'nrds-live': [...COMMON, 'create_date_start', 'create_date_end'],
		expired: [...COMMON, 'status', 'age_min', 'age_max', 'found_date_start', 'found_date_end', 'auction_date_start', 'auction_date_end', 'has_hold'],
		aged: [...COMMON, 'age_min', 'age_max', 'has_sale'],
		active: [...COMMON, 'has_sale'],
		deleted: [...COMMON, 'age_min', 'age_max', 'found_date_start', 'found_date_end', 'has_hold'],
		market: [...COMMON, 'platform', 'listed_days_min', 'listed_days_max', 'has_sale'],
	};
	const COMPOSITION = ['has_number', 'all_number', 'all_alpha', 'has_hyphen'];

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

			if (config.composition && !COMPOSITION.some((k) => override[k] !== undefined)) {
				const [key, value] = config.composition.split('=');
				if (allowed.includes(key)) query.set(key, value);
			}

			node.status({ fill: 'blue', shape: 'dot', text: `searching ${resource}` });
			try {
				const response = await fetch(`${BASE_URL}/search/${resource}?${query.toString()}`, {
					headers: {
						Authorization: `Bearer ${apiKey}`,
						Accept: 'application/json',
						'User-Agent': 'node-red-contrib-domainkits/0.3.8',
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
