const nock = require('nock');
const zapier = require('zapier-platform-core');

const App = require('../index');

const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

const API = 'https://api.flung.dev';
const authData = { api_key: 'test-key' };
const authed = () => nock(API, { reqheaders: { authorization: 'Bearer test-key' } });

afterEach(() => nock.cleanAll());

describe('signing in', () => {
  it('tests the key against who is calling', async () => {
    authed().get('/v1/me').reply(200, { workspaceId: 'ws_1', email: 'a@example.com' });
    const answer = await appTester(App.authentication.test, { authData });
    expect(answer.workspaceId).toBe('ws_1');
  });

  it('shows Flung\'s own words when a key is refused', async () => {
    nock(API).get('/v1/me').reply(401, { error: { code: 'unauthorized', message: 'Unknown API key.' } });
    await expect(appTester(App.authentication.test, { authData })).rejects.toThrow('Unknown API key.');
  });
});

describe('Create Post', () => {
  const perform = App.creates.post.operation.perform;

  it('publishes at once when no time is given', async () => {
    let sent;
    authed().post('/v1/posts', (body) => { sent = body; return true; }).reply(201, { id: 'post_1', status: 'publishing' });
    const answer = await appTester(perform, { authData, inputData: { content: 'Hello', accountIds: ['acct_a'] } });
    expect(answer.id).toBe('post_1');
    expect(sent).toEqual({ content: 'Hello', accountIds: ['acct_a'] });
  });

  it('schedules, and imports each file first', async () => {
    let sent;
    authed().post('/v1/media/import', { url: 'https://a.example/1.jpg' }).reply(201, { id: 'med_1' });
    authed().post('/v1/posts', (body) => { sent = body; return true; }).reply(201, { id: 'post_1', status: 'scheduled' });
    await appTester(perform, { authData, inputData: { content: 'Hello', accountIds: ['acct_a'], publishAt: '2030-01-01T09:00:00+01:00', mediaUrls: ['https://a.example/1.jpg'], shortenLinks: 'yes' } });
    expect(sent).toEqual({ content: 'Hello', accountIds: ['acct_a'], publishAt: '2030-01-01T09:00:00+01:00', mediaIds: ['med_1'], shortenLinks: true });
  });

  it('says so when a post waits for approval', async () => {
    authed().post('/v1/posts').reply(202, { id: 'apr_1', status: 'pending_approval' });
    expect((await appTester(perform, { authData, inputData: { content: 'Hello', accountIds: ['acct_a'] } })).status).toBe('pending_approval');
  });
});

describe('the accounts list', () => {
  it('names each account and its platform', async () => {
    authed().get('/v1/accounts').query({ status: 'active' }).reply(200, { data: [{ id: 'acct_a', platform: 'x', username: 'acme' }] });
    expect(await appTester(App.triggers.account_list.operation.perform, { authData })).toEqual([{ id: 'acct_a', name: 'acme (x)' }]);
  });
});

describe('Find Account', () => {
  it('matches a username without its @, whatever the case', async () => {
    authed().get('/v1/accounts').reply(200, { data: [{ id: 'acct_a', platform: 'x', username: 'Acme' }, { id: 'acct_b', platform: 'x', username: 'other' }] });
    const found = await appTester(App.searches.account.operation.perform, { authData, inputData: { query: '@acme' } });
    expect(found.map((one) => one.id)).toEqual(['acct_a']);
  });
});

describe('triggers', () => {
  const trigger = App.triggers.post_published.operation;

  it('subscribes to its events and keeps only the endpoint id', async () => {
    let sent;
    authed().post('/v1/webhook-endpoints', (body) => { sent = body; return true; }).reply(201, { id: 'whe_1', secret: 'never-kept' });
    const kept = await appTester(trigger.performSubscribe, { authData, targetUrl: 'https://hooks.zapier.com/1' });
    expect(kept).toEqual({ id: 'whe_1' });
    expect(sent).toEqual({ url: 'https://hooks.zapier.com/1', events: ['post.published', 'post.partially_published'] });
  });

  it('removes the endpoint when the Zap is turned off', async () => {
    const removed = authed().delete('/v1/webhook-endpoints/whe_1').reply(204);
    await appTester(trigger.performUnsubscribe, { authData, subscribeData: { id: 'whe_1' } });
    expect(removed.isDone()).toBe(true);
  });

  it('gives each event its own id, and keeps the post\'s', async () => {
    const [item] = await appTester(trigger.perform, { authData, cleanedRequest: { id: 'evt_1', type: 'post.published', data: { post: { id: 'post_1', content: 'Hello' } } } });
    expect(item).toMatchObject({ id: 'evt_1', event: 'post.published', post_id: 'post_1', content: 'Hello' });
  });

  it('samples from real posts', async () => {
    authed().get('/v1/posts').query({ status: 'published', limit: 3 }).reply(200, { data: [{ id: 'post_1', content: 'Hello' }], hasMore: false });
    expect(await appTester(trigger.performList, { authData })).toEqual([expect.objectContaining({ id: 'evt_post_1', post_id: 'post_1' })]);
  });

  it('reads an account event with why it needs a person', async () => {
    const [item] = await appTester(App.triggers.account_needs_attention.operation.perform, { authData, cleanedRequest: { id: 'evt_2', type: 'account.token_refresh_failed', data: { account: { id: 'acct_a' }, reason: 'Expired' } } });
    expect(item).toMatchObject({ id: 'evt_2', account_id: 'acct_a', reason: 'Expired' });
  });
});
