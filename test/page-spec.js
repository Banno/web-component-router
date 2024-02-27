import { Context, Page } from '../lib/page.js';

function JSCompiler_renameProperty(propName, instance) {
  return propName;
}

describe('Page', () => {
  let page;

  beforeEach(() => {
    page = new Page();
    spyOn(History.prototype, 'pushState').and.callFake(() => {});
    spyOn(Context.prototype, 'pushState').and.callFake(() => {});
  });

  const dispatchPropertyName = JSCompiler_renameProperty('dispatch', Page.prototype);
  const unhandledPropertyName = JSCompiler_renameProperty('unhandled', Page.prototype);

  describe('show(path, state, dispatch = true, push = true)', () => {
    const path = '/';
    const state = {};
    const dispatch = true;
    const push = false;
    beforeEach(() => {
      spyOn(page, dispatchPropertyName).and.callFake(async () => {});
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
        expect(page.dispatch).toHaveBeenCalledWith(jasmine.any(Context), prev);
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
      // add entry callback to handle context to ensure that the `unhandled` callback doesn't do a full page reload
      page.callbacks.push((ctx, next) => { ctx.handled = true; next(); });
    });
    describe('when push === true and ctx.path === page.current', () => {
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
  });
});
