module.exports = function (RED) {
	const BASE_URL = 'https://premium-api.domainkits.com/api/v1';
	const OPS = {
		whois: { path: '/whois', param: 'domain', list: false },
		dns: { path: '/dns', param: 'domain', list: false },
		safety: { path: '/safety', param: 'domain', list: false },
		'ip-lookup': { path: '/ip-lookup', param: 'query', list: false },
		registrar: { path: '/registrar', param: 'query', list: false },
		'status-guide': { path: '/status-guide', param: 'query', list: false },
		'tld-check': { path: '/tld-check', param: 'prefix', list: false },
		typosquat: { path: '/typosquat', param: 'domain', list: false },
		'ns-reverse': { path: '/ns-reverse', param: 'ns', list: true },
		'monitor-changes': { path: '/monitor/changes', param: 'query', list: true },
		'ct-subdomains': { path: '/ct/subdomains', param: 'domain', list: true },
		'ct-certs': { path: '/ct/certs', param: 'domain', list: true },
		'ct-search': { path: '/ct/search', param: 'keyword', list: true },
		'tld-trends-newly': { path: '/trends/tlds/newly', param: 'tld', list: false },
		'tld-trends-active': { path: '/trends/tlds/active', param: 'tld', list: false },
		'keyword-trends-hot': { path: '/trends/keywords/hot', param: null, list: false },
		'keyword-trends-emerging': { path: '/trends/keywords/emerging', param: null, list: false },
		'keyword-trends-prefix': { path: '/trends/keywords/prefix', param: null, list: false },
		usage: { path: '/usage', param: null, list: false },
	};

	function DomainKitsLookupNode(config) {
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

			const operation = msg.operation || config.operation || 'whois';
			const op = OPS[operation];
			if (!op) {
				done(new Error(`Unknown operation: ${operation}`));
				return;
			}

			const target = msg.target !== undefined && msg.target !== '' ? msg.target : config.target;
			const query = new URLSearchParams();
			if (op.param && target !== undefined && target !== null && target !== '') {
				query.set(op.param, String(target));
			}
			const extra = msg.query && typeof msg.query === 'object' ? msg.query : {};
			for (const [key, value] of Object.entries(extra)) {
				if (value === undefined || value === null || value === '' || value === false) continue;
				query.set(key, String(value));
			}

			node.status({ fill: 'blue', shape: 'dot', text: operation });
			try {
				const qs = query.toString();
				const response = await fetch(`${BASE_URL}${op.path}${qs ? '?' + qs : ''}`, {
					headers: {
						Authorization: `Bearer ${apiKey}`,
						Accept: 'application/json',
						'User-Agent': 'node-red-contrib-domainkits/0.3.5',
					},
				});
				const body = await response.json();
				if (!response.ok || body.success === false) {
					const message = body.error || `Request failed with status ${response.status}`;
					node.status({ fill: 'red', shape: 'ring', text: `error ${response.status}` });
					done(new Error(message));
					return;
				}
				msg.payload = body.data !== undefined && body.data !== null ? body.data : body;
				if (op.list) {
					msg.total = body.total || 0;
				}
				msg.operation = operation;
				node.status({ fill: 'green', shape: 'dot', text: `${operation} ok` });
				send(msg);
				done();
			} catch (error) {
				node.status({ fill: 'red', shape: 'ring', text: 'request failed' });
				done(error);
			}
		});
	}

	RED.nodes.registerType('domainkits-lookup', DomainKitsLookupNode);
};
