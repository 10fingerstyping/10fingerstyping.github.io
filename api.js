/*
 * Společný přístup k API serveru 10fingerstyping.
 * Přihlašovací token se ukládá do localStorage a posílá se v hlavičce
 * Authorization: Bearer <token>.
 */
(function () {
  'use strict';

  var API_BASE = window.API_BASE || 'https://boulder-cargo-treasure-outdoors.trycloudflare.com/api';

  function getToken() {
    try { return localStorage.getItem('token') || ''; } catch (e) { return ''; }
  }

  function setToken(token) {
    try {
      if (token) localStorage.setItem('token', token);
      else localStorage.removeItem('token');
    } catch (e) {}
  }

  function clearAuth() {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('loggedIn');
    } catch (e) {}
  }

  function headers() {
    var out = { 'Content-Type': 'application/json' };
    var token = getToken();
    if (token) out.Authorization = 'Bearer ' + token;
    return out;
  }

  function request(path, options) {
    options = options || {};
    options.headers = Object.assign({}, headers(), options.headers || {});
    return fetch(API_BASE + path, options).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok || (body && body.ok === false)) {
          var err = new Error((body && body.error) || ('HTTP ' + res.status));
          err.status = res.status;
          err.body = body;
          throw err;
        }
        return body;
      });
    });
  }

  window.TypingAPI = {
    base: API_BASE,
    getToken: getToken,
    setToken: setToken,
    hasToken: function () { return !!getToken(); },
    clearAuth: clearAuth,
    login: function (email, password) {
      return request('/login', {
        method: 'POST',
        body: JSON.stringify({ email: email, password: password })
      });
    },
    register: function (data) {
      return request('/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    logout: function () {
      return request('/logout', { method: 'POST', body: '{}' });
    },
    getProgress: function () {
      return request('/progress', { method: 'GET' });
    },
    saveProgress: function (entry) {
      return request('/progress', {
        method: 'POST',
        body: JSON.stringify(entry)
      });
    }
  };
})();
