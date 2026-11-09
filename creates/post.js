const { call } = require('../api');

const SAMPLE = { id: 'post_sample', status: 'scheduled', content: 'Our autumn range is here.', publishAt: '2026-12-01T09:00:00.000Z' };
const OUTPUT = [
  { key: 'id', label: 'Post ID' },
  { key: 'status', label: 'Status' },
  { key: 'content', label: 'Text' },
  { key: 'publishAt', label: 'Publish Time', type: 'datetime' },
];

const create = {
  key: 'post',
  noun: 'Post',
  display: { label: 'Create Post', description: 'Publishes now or schedules a post on your connected accounts.' },
  operation: {
    inputFields: [
      { key: 'accountIds', label: 'Accounts', required: true, list: true, dynamic: 'account_list.id.name', altersDynamicFields: false },
      { key: 'content', label: 'Text', type: 'text', required: true },
      { key: 'publishAt', label: 'Publish Time', type: 'datetime', required: false, helpText: 'Leave empty to publish at once.' },
      { key: 'mediaUrls', label: 'Media URLs', list: true, required: false, helpText: 'Public https addresses of images or videos.' },
      { key: 'shortenLinks', label: 'Shorten Links', type: 'boolean', required: false, default: 'no', helpText: 'Swaps each address in the text for a Flung short link.' },
    ],
    perform: async (z, bundle) => {
      const { accountIds, content, publishAt, mediaUrls = [], shortenLinks } = bundle.inputData;
      const mediaIds = [];
      for (const url of mediaUrls) mediaIds.push((await call(z, 'POST', '/v1/media/import', { body: { url } })).id);
      return call(z, 'POST', '/v1/posts', {
        body: {
          content,
          accountIds,
          ...(publishAt ? { publishAt } : {}),
          ...(mediaIds.length > 0 ? { mediaIds } : {}),
          ...(shortenLinks === true || shortenLinks === 'true' || shortenLinks === 'yes' ? { shortenLinks: true } : {}),
        },
      });
    },
    sample: SAMPLE,
    outputFields: OUTPUT,
  },
};

const cancel = {
  key: 'cancel_post',
  noun: 'Post',
  display: { label: 'Cancel Post', description: 'Stops a post that has not started publishing.' },
  operation: {
    inputFields: [{ key: 'postId', label: 'Post ID', required: true }],
    perform: (z, bundle) => call(z, 'POST', `/v1/posts/${encodeURIComponent(bundle.inputData.postId)}/cancel`),
    sample: { ...SAMPLE, status: 'cancelled' },
    outputFields: OUTPUT,
  },
};

module.exports = { cancel, create };
