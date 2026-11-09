const { version: platformVersion } = require('zapier-platform-core');

const { version } = require('./package.json');
const { addApiKey, handleErrors } = require('./api');
const authentication = require('./authentication');
const posts = require('./creates/post');
const findAccount = require('./searches/account');
const accounts = require('./triggers/accounts');
const events = require('./triggers/events');

const byKey = (...items) => Object.fromEntries(items.map((item) => [item.key, item]));
const { nameOf: _nameOf, ...accountList } = accounts;

module.exports = {
  version,
  platformVersion,
  authentication,
  beforeRequest: [addApiKey],
  afterResponse: [handleErrors],
  triggers: byKey(accountList, events.postPublished, events.postFailed, events.accountNeedsAttention, events.inboxItem),
  creates: byKey(posts.create, posts.cancel),
  searches: byKey(findAccount),
};
