import { Context, Page } from '../lib/page.js';
import {vi, expect} from 'vitest';

function JSCompiler_renameProperty(propName, instance) {
  return propName;
}

describe('Page', () => {
  let page;

  beforeEach(() => {
    page = new Page();
    vi.spyOn(History.prototype, 'pushState');
    vi.spyOn(Context.prototype, 'pushState');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const dispatchPropertyName = JSCompiler_renameProperty('dispatch', Page.prototype);

  describe('show(path, state, dispatch = true, push = true)', () => {
    const path = '/';
    const state = {};
    const dispatch = true;
    const push = false;
    beforeEach(() => {
      vi.spyOn(page, dispatchPropertyName);
    });
    describe('when dispatch === false', () => {
      const dispatch = false;
      it('does not call dispatch(ctx, prev)', async () => {
        await page.show(path, state, dispatch, push);
        expect(page.dispatch).not.toHaveBeenCalled();
      });
      describe('when push === true', () => {
        const push = true;
        it('calls context.pushState() synchronously', () => {
          page.show(path, state, dispatch, push);
          expect(Context.prototype.pushState).toHaveBeenCalled();
        });
      });
      describe('when push === false', () => {
        const push = false;
        it('does not call context.pushState()', async () => {
          await page.show(path, state, dispatch, push);
          expect(Context.prototype.pushState).not.toHaveBeenCalled();
        });
      });
    });
    describe('when dispatch === true', () => {
      const dispatch = true;
      it('calls dispatch(ctx, prev, push)', () => {
        const prev = page.prevContext;
        page.show(path, state, dispatch);
        expect(page.dispatch).toHaveBeenCalledWith(expect.any(Context), prev);
      });
      describe('when push === false', () => {
        const push = false;
        it('does not call context.pushState()', async () => {
          await page.show(path, state, dispatch, push);
          expect(Context.prototype.pushState).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('dispatch(ctx, prev)', () => {
    let ctx;
    let prev;
    const state = {};
    const prevState = {};
    beforeEach(() => {
      ctx = new Context('/next', {...state}, page);
      prev = new Context('/prev', {...prevState}, page);
      // add entry callback to handle context to ensure that the `unhandled` callback doesn't do a full page reload
      page.callbacks.push((ctx, next) => { ctx.handled = true; next(); });
    });
    it('calls all exit callbacks in order', async () => {
      const exitCallback1 = async (ctx, next) => {
        ctx.state['exitCallback1Called'] = true;
        expect(ctx.state['exitCallback2Called']).toBe(undefined);
        next();
      }
      const exitCallback2 = async (ctx, next) => {
        expect(prev.state['exitCallback1Called']).toBe(true);
        ctx.state['exitCallback2Called'] = true;
        next();
      }
      page.exits = [exitCallback1, exitCallback2];
      expect(prev.state['exitCallback1Called']).toBe(undefined);
      expect(prev.state['exitCallback2Called']).toBe(undefined);
      await page.dispatch(ctx, prev);
      expect(prev.state['exitCallback1Called']).toBe(true);
      expect(prev.state['exitCallback2Called']).toBe(true);
    });
    it('calls all entry callbacks in order', async () => {
      const entryCallback1 = (ctx, next) => {
        ctx.handled = true;
        ctx.state['entryCallback1Called'] = true;
        expect(ctx.state['entryCallback2Called']).toBe(undefined);
        next();
      }
      const entryCallback2 = (ctx, next) => {
        ctx.handled = true;
        expect(ctx.state['entryCallback1Called']).toBe(true);
        ctx.state['entryCallback2Called'] = true;
        next();
      }
      page.callbacks = [entryCallback1, entryCallback2];
      expect(ctx.state['entryCallback1Called']).toBe(undefined);
      expect(ctx.state['entryCallback2Called']).toBe(undefined);
      await page.dispatch(ctx, prev);
      expect(ctx.state['entryCallback1Called']).toBe(true);
      expect(ctx.state['entryCallback2Called']).toBe(true);
    });

    describe('when at least one entry callback sets ctx.handled = true', () => {
      it('does not reset ctx.handled = false', async () => {
        const entryCallback1 = (ctx, next) => {
          ctx.handled = true;
          ctx.state['entryCallback1Called'] = true;
          expect(ctx.state['entryCallback2Called']).toBe(undefined);
          next();
        }
        const entryCallback2 = (ctx, next) => {
          expect(ctx.state['entryCallback1Called']).toBe(true);
          expect(ctx.handled).toBe(true);
          ctx.state['entryCallback2Called'] = true;
          next();
        }
        page.callbacks = [entryCallback1, entryCallback2];
        expect(ctx.state['entryCallback1Called']).toBe(undefined);
        expect(ctx.state['entryCallback2Called']).toBe(undefined);
        await page.dispatch(ctx, prev);
        expect(ctx.state['entryCallback1Called']).toBe(true);
        expect(ctx.state['entryCallback2Called']).toBe(true);
      });
    });
    describe('when ctx.pushState === true and ctx.path === page.current', () => {
      const push = true;
      beforeEach(() => {
        ctx = new Context('/next', state, page, push);
        prev = new Context('/prev', prevState, page, push);
        page.current = ctx.path;
      })
      it('calls context.pushState() asynchronously between exit and entry callbacks', async () => {
        const exitCallback = (ctx, next) => {
          expect(Context.prototype.pushState).not.toHaveBeenCalled(); // not yet
          ctx.state['exitCallbackCalled'] = true;
          next();
        }
        const entryCallback = (ctx, next) => {
          expect(Context.prototype.pushState).not.toHaveBeenCalled(); // still not yet
          ctx.handled = true;
          // expect `pushState` to have been called when `handled` is changed from not true to `true`
          expect(Context.prototype.pushState).toHaveBeenCalled();
          next();
        }
        page.exits = [exitCallback];
        page.callbacks = [entryCallback];

        const dispatchPromise = page.dispatch(ctx, prev);
        expect(ctx.handled).toBe(undefined); // entry callback should not have been called yet
        await dispatchPromise;
        expect(prevState['exitCallbackCalled']).toBe(true); // exit handler should have been called
        expect(ctx.handled).toBe(true); // sanity check to ensure that the entry callback was called
      });
    });
    describe('when ctx.pushState === false', () => {
      const push = false;
      beforeEach(() => {
        ctx = new Context('/next', state, page, push);
        prev = new Context('/prev', prevState, page, push);
        page.current = ctx.path;
      })
      it('does not call context.pushState()', async () => {
        const exitCallback = (ctx, next) => {
          expect(Context.prototype.pushState).not.toHaveBeenCalled(); // not yet
          ctx.state['exitCallbackCalled'] = true;
          next();
        }
        const entryCallback = (ctx, next) => {
          ctx.handled = true;
          // expect `pushState` to have been called when `handled` is changed from not true to `true`
          expect(Context.prototype.pushState).not.toHaveBeenCalled();
          next();
        }
        page.exits = [exitCallback];
        page.callbacks = [entryCallback];

        const dispatchPromise = page.dispatch(ctx, prev);
        expect(ctx.handled).toBe(undefined); // entry callback should not have been called yet
        await dispatchPromise;
        expect(prevState['exitCallbackCalled']).toBe(true); // exit handler should have been called
        expect(ctx.handled).toBe(true); // sanity check to ensure that the entry callback was called
      });
    });
  });
});
