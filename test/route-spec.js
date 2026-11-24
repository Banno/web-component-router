import {Page, Route} from '../lib/page.js';
import {vi, expect} from 'vitest';

describe('Route', () => {
  let page;

  beforeEach(() => {
    page = new Page();
  });

  /**
   * @param {string} path
   * @param {string} url
   * @param {Object=} options
   * @return {Object|null} params when matched, null otherwise
   */
  function match(path, url, options) {
    const route = new Route(path, options, page);
    const params = {};
    return route.match(url, params) ? params : null;
  }

  describe('static paths', () => {
    it('matches an identical path', () => {
      expect(match('/foo/bar', '/foo/bar')).toEqual({});
    });

    it('does not match a different path', () => {
      expect(match('/foo/bar', '/foo/baz')).toBeNull();
    });

    it('does not match a longer path', () => {
      expect(match('/foo', '/foo/bar')).toBeNull();
    });

    it('matches the root path', () => {
      expect(match('/', '/')).toEqual({});
    });
  });

  describe('named parameters', () => {
    it('extracts a single parameter', () => {
      expect(match('/B/:bData', '/B/somedata')).toEqual({bData: 'somedata'});
    });

    it('extracts multiple parameters', () => {
      expect(match('/a/:one/b/:two', '/a/1/b/2')).toEqual({one: '1', two: '2'});
    });

    it('does not match across path segments', () => {
      expect(match('/B/:bData', '/B/some/data')).toBeNull();
    });

    it('requires a value for a required parameter', () => {
      expect(match('/B/:bData', '/B/')).toBeNull();
    });
  });

  describe('custom regular expression parameters', () => {
    it('matches a value that satisfies the expression', () => {
      expect(match('/users/:userId([0-9]{1,6})', '/users/123')).toEqual({userId: '123'});
    });

    it('rejects a value that does not satisfy the expression', () => {
      expect(match('/users/:userId([0-9]{1,6})', '/users/abc')).toBeNull();
      expect(match('/users/:userId([0-9]{1,6})', '/users/1234567')).toBeNull();
    });

    it('supports an escaped hyphen in a character class', () => {
      const path = '/account/:accountId([a-fA-F0-9\\-]{36})/documents/:docId';
      const id = '01234567-89ab-cdef-0123-456789abcdef';
      expect(match(path, `/account/${id}/documents/d1`)).toEqual({accountId: id, docId: 'd1'});
      expect(match(path, '/account/not-an-id/documents/d1')).toBeNull();
    });

    it('throws a descriptive error for an unescaped leading hyphen in a character class', () => {
      expect(() => new Route('/account/:accountId([-a-fA-F0-9]{36})', undefined, page))
        .toThrowError(/Invalid route path "\/account\/:accountId\(\[-a-fA-F0-9\]\{36\}\)".*must be escaped/);
    });

    it('supports alternation', () => {
      expect(match('/pay/:mode(bill|person|edit)', '/pay/bill')).toEqual({mode: 'bill'});
      expect(match('/pay/:mode(bill|person|edit)', '/pay/other')).toBeNull();
    });
  });

  describe('optional parameters', () => {
    const path = '/pay/:mode(bill|person|edit)?/:billOrPaymentId([a-fA-F0-9\\-]{36})?';
    const id = '01234567-89ab-cdef-0123-456789abcdef';

    it('matches when all optional values are present', () => {
      expect(match(path, `/pay/edit/${id}`)).toEqual({mode: 'edit', billOrPaymentId: id});
    });

    it('matches when optional values are omitted', () => {
      const params = match(path, '/pay');
      expect(params).not.toBeNull();
      expect(params.mode).toBeUndefined();
      expect(params.billOrPaymentId).toBeUndefined();
    });

    it('matches when only the first optional value is present', () => {
      const params = match(path, '/pay/bill');
      expect(params).not.toBeNull();
      expect(params.mode).toBe('bill');
      expect(params.billOrPaymentId).toBeUndefined();
    });

    it('supports a trailing optional parameter', () => {
      expect(match('/account/:accountId?', '/account/5')).toEqual({accountId: '5'});
      expect(match('/account/:accountId?', '/account')).not.toBeNull();
    });
  });

  describe('wildcards', () => {
    it('"*" matches any path', () => {
      expect(match('*', '/')).not.toBeNull();
      expect(match('*', '/foo')).not.toBeNull();
      expect(match('*', '/foo/bar/baz')).not.toBeNull();
    });

    it('"*" exposes the matched path as params[0]', () => {
      expect(match('*', '/foo/bar')).toEqual({0: '/foo/bar'});
    });

    it('a repeating named parameter matches multiple segments', () => {
      expect(match('/files/:path*', '/files/a/b/c')).not.toBeNull();
      expect(match('/files/:path*', '/files')).not.toBeNull();
    });
  });

  describe('case sensitivity', () => {
    it('is case insensitive by default', () => {
      expect(match('/foo/:id', '/FOO/abc')).toEqual({id: 'abc'});
    });

    it('preserves the case of parameter values', () => {
      expect(match('/foo/:id', '/foo/AbC')).toEqual({id: 'AbC'});
    });

    it('is case sensitive when the sensitive option is set', () => {
      expect(match('/foo/:id', '/FOO/abc', {sensitive: true})).toBeNull();
      expect(match('/foo/:id', '/foo/abc', {sensitive: true})).toEqual({id: 'abc'});
    });
  });

  describe('trailing slashes', () => {
    it('ignores a trailing slash on the url by default', () => {
      expect(match('/foo', '/foo/')).toEqual({});
      expect(match('/foo/:id', '/foo/abc/')).toEqual({id: 'abc'});
    });

    it('does not match a url without the trailing slash when the route has one', () => {
      expect(match('/foo/', '/foo')).toBeNull();
    });

    it('requires an exact trailing slash match when the page is strict', () => {
      page.strict(true);
      expect(match('/foo', '/foo/')).toBeNull();
      expect(match('/foo', '/foo')).toEqual({});
      expect(match('/foo/', '/foo/')).toEqual({});
    });

    it('requires an exact trailing slash match when the strict option is set', () => {
      expect(match('/foo', '/foo/', {strict: true})).toBeNull();
    });
  });

  describe('query strings', () => {
    it('ignores the query string when matching', () => {
      expect(match('/B/:bData', '/B/x?y=1&z=2')).toEqual({bData: 'x'});
    });

    it('does not match query string content as part of a parameter', () => {
      expect(match('/B/:bData', '/B/x?y=/1')).toEqual({bData: 'x'});
    });
  });

  describe('URL decoding', () => {
    it('decodes percent-encoded characters in parameter values', () => {
      expect(match('/B/:bData', '/B/a%20b')).toEqual({bData: 'a b'});
    });

    it('decodes non-ASCII characters', () => {
      expect(match('/B/:bData', '/B/%C3%A9')).toEqual({bData: '\u00e9'});
    });

    it('treats an encoded slash as part of a single parameter value', () => {
      expect(match('/B/:bData', '/B/a%2Fb')).toEqual({bData: 'a/b'});
    });

    it('decodes parameter values exactly once', () => {
      expect(match('/B/:bData', '/B/a%2520b')).toEqual({bData: 'a%20b'});
    });

    it('converts "+" in parameter values to a space', () => {
      expect(match('/B/:bData', '/B/a+b')).toEqual({bData: 'a b'});
    });

    it('leaves parameter values encoded when decodeURLComponents is disabled', () => {
      page._decodeURLComponents = false;
      expect(match('/B/:bData', '/B/a%20b')).toEqual({bData: 'a%20b'});
    });
  });

  describe('params merging', () => {
    it('does not overwrite an existing param with undefined', () => {
      const route = new Route('/pay/:mode?', undefined, page);
      const params = {mode: 'existing'};
      expect(route.match('/pay', params)).toBe(true);
      expect(params.mode).toBe('existing');
    });

    it('overwrites an existing param when a value is matched', () => {
      const route = new Route('/pay/:mode?', undefined, page);
      const params = {mode: 'existing'};
      expect(route.match('/pay/new', params)).toBe(true);
      expect(params.mode).toBe('new');
    });

    it('sets an unmatched optional param to undefined when not already present', () => {
      const route = new Route('/pay/:mode?', undefined, page);
      const params = {};
      expect(route.match('/pay', params)).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(params, 'mode')).toBe(true);
      expect(params.mode).toBeUndefined();
    });
  });

  describe('middleware(fn)', () => {
    it('invokes fn and sets ctx.routePath on a match', () => {
      const route = new Route('/B/:bData', undefined, page);
      const fn = vi.fn();
      const next = vi.fn();
      const ctx = {path: '/B/x', params: {}};
      route.middleware(fn)(ctx, next);
      expect(fn).toHaveBeenCalledWith(ctx, next);
      expect(ctx.routePath).toBe('/B/:bData');
      expect(ctx.params).toEqual({bData: 'x'});
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next without invoking fn on a miss', () => {
      const route = new Route('/B/:bData', undefined, page);
      const fn = vi.fn();
      const next = vi.fn();
      const ctx = {path: '/other', params: {}};
      route.middleware(fn)(ctx, next);
      expect(fn).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(ctx.routePath).toBeUndefined();
    });
  });
});
