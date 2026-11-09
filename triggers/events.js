const { call } = require('../api');

const SAMPLE_LIMIT = 3;
const POST_SAMPLE = { id: 'evt_sample', event: 'post.published', post_id: 'post_sample', status: 'published', content: 'Our autumn range is here.', publishAt: '2026-12-01T09:00:00.000Z' };
const POST_FIELDS = [
  { key: 'id', label: 'Event ID' },
  { key: 'event', label: 'Event' },
  { key: 'post_id', label: 'Post ID' },
  { key: 'status', label: 'Status' },
  { key: 'content', label: 'Text' },
  { key: 'publishAt', label: 'Publish Time', type: 'datetime' },
];

/** Keeps a post's own id apart from the event's: Zapier reads `id` as the one thing that makes this item new. */
const fromPost = (event, post) => ({ ...post, id: event.id, event: event.type, post_id: post.id });
const fromAccount = (event, account) => ({ ...account, id: event.id, event: event.type, account_id: account.id });
const fromItem = (event, item) => ({ ...item, id: event.id, event: event.type, item_id: item.id });

const samplesOf = (rows, event, shape) => rows.slice(0, SAMPLE_LIMIT).map((row) => shape({ id: `evt_${row.id}`, type: event }, row));

const hook = ({ key, noun, label, description, events, read, list, sample, outputFields }) => ({
  key,
  noun,
  display: { label, description },
  operation: {
    type: 'hook',
    perform: (_z, bundle) => {
      const event = bundle.cleanedRequest;
      return [read(event, event.data || {})];
    },
    performList: list,
    performSubscribe: async (z, bundle) => {
      const made = await call(z, 'POST', '/v1/webhook-endpoints', { body: { url: bundle.targetUrl, events } });
      return { id: made.id };
    },
    performUnsubscribe: (z, bundle) => call(z, 'DELETE', `/v1/webhook-endpoints/${encodeURIComponent(bundle.subscribeData.id)}`),
    sample,
    outputFields,
  },
});

const postsWith = (status, event) => async (z) => samplesOf((await call(z, 'GET', '/v1/posts', { params: { status, limit: SAMPLE_LIMIT } })).data, event, fromPost);

const postPublished = hook({
  key: 'post_published',
  noun: 'Post',
  label: 'Post Published',
  description: 'Triggers when a post has gone out, on all its accounts or on some.',
  events: ['post.published', 'post.partially_published'],
  read: (event, data) => fromPost(event, data.post),
  list: postsWith('published', 'post.published'),
  sample: POST_SAMPLE,
  outputFields: POST_FIELDS,
});

const postFailed = hook({
  key: 'post_failed',
  noun: 'Post',
  label: 'Post Failed',
  description: 'Triggers when a post could not be published.',
  events: ['post.failed'],
  read: (event, data) => fromPost(event, data.post),
  list: postsWith('failed', 'post.failed'),
  sample: { ...POST_SAMPLE, event: 'post.failed', status: 'failed' },
  outputFields: POST_FIELDS,
});

const accountNeedsAttention = hook({
  key: 'account_needs_attention',
  noun: 'Account',
  label: 'Account Needs Reconnecting',
  description: 'Triggers when a connected account has stopped working or soon will.',
  events: ['account.token_refresh_failed', 'account.reconnect_required_soon'],
  read: (event, data) => ({ ...fromAccount(event, data.account), reason: data.reason, expiresAt: data.expiresAt }),
  list: async (z) => samplesOf((await call(z, 'GET', '/v1/accounts')).data, 'account.reconnect_required_soon', fromAccount),
  sample: { id: 'evt_sample', event: 'account.reconnect_required_soon', account_id: 'acct_sample', platform: 'linkedin', username: 'acme', status: 'active' },
  outputFields: [
    { key: 'id', label: 'Event ID' },
    { key: 'event', label: 'Event' },
    { key: 'account_id', label: 'Account ID' },
    { key: 'platform', label: 'Platform' },
    { key: 'username', label: 'Username' },
    { key: 'status', label: 'Status' },
  ],
});

const inboxItem = hook({
  key: 'inbox_item_received',
  noun: 'Inbox Item',
  label: 'New Inbox Item',
  description: 'Triggers when a comment or mention arrives in the Flung inbox.',
  events: ['inbox.received'],
  read: (event, data) => fromItem(event, data.item),
  list: async (z) => samplesOf((await call(z, 'GET', '/v1/inbox', { params: { limit: SAMPLE_LIMIT } })).data, 'inbox.received', fromItem),
  sample: { id: 'evt_sample', event: 'inbox.received', item_id: 'inb_sample', platform: 'instagram', text: 'Do you ship to Portugal?' },
  outputFields: [
    { key: 'id', label: 'Event ID' },
    { key: 'event', label: 'Event' },
    { key: 'item_id', label: 'Item ID' },
    { key: 'platform', label: 'Platform' },
    { key: 'text', label: 'Text' },
  ],
});

module.exports = { accountNeedsAttention, inboxItem, postFailed, postPublished };
