const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.thecreativeart.shop/api/v1';

class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  // Get stored tokens
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminAccessToken') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    throw new ApiError('Network connection failed.', 'NETWORK_ERROR', 0);
  }

  const status = response.status;
  let resBody;
  try {
    resBody = await response.json();
  } catch (err) {
    resBody = {};
  }

  // Handle 401 Auth error: attempt token rotation
  if (status === 401 && typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem('adminRefreshToken');
    if (refreshToken && !options._retry) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });

          const refreshData = await refreshResponse.json();
          if (refreshData.success && refreshData.data.accessToken) {
            const nextToken = refreshData.data.accessToken;
            localStorage.setItem('adminAccessToken', nextToken);
            localStorage.setItem('adminRefreshToken', refreshData.data.refreshToken);
            isRefreshing = false;
            onRefreshed(nextToken);

            // Retry the current request that initiated the refresh
            options.headers = {
              ...options.headers,
              'Authorization': `Bearer ${nextToken}`
            };
            options._retry = true;
            return request(path, options);
          } else {
            // Refresh token invalid/expired, log out
            localStorage.removeItem('adminAccessToken');
            localStorage.removeItem('adminRefreshToken');
            localStorage.removeItem('adminUser');
            isRefreshing = false;
            window.location.href = '/login';
            throw new ApiError('Session expired. Please log in again.', 'UNAUTHORIZED', 401);
          }
        } catch (refreshErr) {
          isRefreshing = false;
          localStorage.removeItem('adminAccessToken');
          localStorage.removeItem('adminRefreshToken');
          localStorage.removeItem('adminUser');
          window.location.href = '/login';
          throw refreshErr;
        }
      } else {
        // Queue retry requests while token is refreshing
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            options.headers = {
              ...options.headers,
              'Authorization': `Bearer ${newToken}`
            };
            options._retry = true;
            resolve(request(path, options));
          });
        });
      }
    }
  }

  if (!resBody.success) {
    const errorMsg = resBody.error?.message || 'An error occurred.';
    const errorCode = resBody.error?.code || 'UNKNOWN_ERROR';
    throw new ApiError(errorMsg, errorCode, status);
  }

  return resBody.data;
}

const apiClient = {
  get: (path, options = {}) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options = {}) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options = {}) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options = {}) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options = {}) => request(path, { ...options, method: 'DELETE' })
};

export default apiClient;
export { ApiError };
