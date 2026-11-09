const { call } = require('../api');

module.exports = {
  key: 'account',
  noun: 'Account',
  display: { label: 'Find Account', description: 'Finds a connected account by its name, username or platform.' },
  operation: {
    inputFields: [{ key: 'query', label: 'Name, Username or Platform', required: true }],
    perform: async (z, bundle) => {
      const wanted = bundle.inputData.query.trim().replace(/^@/, '').toLowerCase();
      const { data } = await call(z, 'GET', '/v1/accounts');
      return data.filter((account) => [account.nickname, account.displayName, account.username, account.platform].some((known) => known && known.toLowerCase() === wanted));
    },
    sample: { id: 'acct_sample', platform: 'linkedin', username: 'acme', status: 'active' },
    outputFields: [
      { key: 'id', label: 'Account ID' },
      { key: 'platform', label: 'Platform' },
      { key: 'username', label: 'Username' },
      { key: 'status', label: 'Status' },
    ],
  },
};
