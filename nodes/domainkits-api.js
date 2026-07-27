module.exports = function (RED) {
	function DomainKitsApiNode(config) {
		RED.nodes.createNode(this, config);
		this.name = config.name;
	}

	RED.nodes.registerType('domainkits-api', DomainKitsApiNode, {
		credentials: {
			apiKey: { type: 'password' },
		},
	});
};
