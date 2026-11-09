const API = 'https://api.flung.dev';

/** Adds the workspace's API key to each request. */
const addApiKey = (request, _z, bundle) => {
  if (bundle.authData.api_key) request.headers.Authorization = `Bearer ${bundle.authData.api_key}`;
  return request;
};

/** Turns Flung's error answer into words a person sees in Zapier. */
const handleErrors = (response, z) => {
  if (response.status < 400) return response;
  let error = {};
  try {
    error = JSON.parse(response.content).error || {};
  } catch {
    // Not JSON: the status below still says what happened.
  }
  throw new z.errors.Error(error.message || `Flung answered ${response.status}.`, error.code || 'request_failed', response.status);
};

const call = async (z, method, path, options = {}) => {
  const response = await z.request({ method, url: `${API}${path}`, ...options });
  return response.status === 204 ? null : response.data;
};

module.exports = { API, addApiKey, call, handleErrors };
