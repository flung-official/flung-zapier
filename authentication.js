const { API } = require('./api');

module.exports = {
  type: 'custom',
  fields: [
    {
      key: 'api_key',
      label: 'API Key',
      type: 'password',
      required: true,
      helpText: 'Make one in Flung, under Settings, [API keys](https://app.flung.dev/settings). It starts with `flung_sk_`.',
    },
  ],
  test: { url: `${API}/v1/me` },
  connectionLabel: '{{email}} {{workspaceId}}',
};
