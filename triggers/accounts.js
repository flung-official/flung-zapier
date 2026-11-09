const { call } = require('../api');

const nameOf = (account) => `${account.nickname || account.displayName || account.username || account.id} (${account.platform})`;

/** The accounts dropdown of Create Post. */
module.exports = {
  key: 'account_list',
  noun: 'Account',
  display: { label: 'List Accounts', description: 'Lists the connected accounts, for choosing one.', hidden: true },
  operation: {
    perform: async (z) => (await call(z, 'GET', '/v1/accounts', { params: { status: 'active' } })).data.map((account) => ({ id: account.id, name: nameOf(account) })),
    sample: { id: 'acct_sample', name: 'Acme (linkedin)' },
  },
  nameOf,
};
