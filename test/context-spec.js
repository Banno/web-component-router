/**
 * @fileoverview Tests for Context class
 * @suppress {visibility} Tests are allowed to access private methods
 */

import { describe, it, expect } from 'vitest';
import {Context} from '../lib/page.js';

describe('Context', () => {
  describe('set handled()', () => {
    let context;
    beforeEach(() => {
      context = new Context('/test-path');
      vi.spyOn(context, 'pushState').mockImplementation(() => {});
    });
    it('sets the handled flag to true', () => {
      expect(context.handled).toBeFalsy();
      context.handled = true;
      expect(context.handled).toBe(true);
    });

    const PUSH_STATE_TEST = [{
      initial: false,
      newValue: true,
      shouldPushStateValue: true,
      shouldCallPushState: true, // this is the only case where pushState should be called
    }, {
      initial: true,
      newValue: true,
      shouldPushStateValue: false,
      shouldCallPushState: false,
    }, {
      initial: false,
      newValue: false,
      shouldPushStateValue: false,
      shouldCallPushState: false,
    }, {
      initial: true,
      newValue: false,
      shouldPushStateValue: false,
      shouldCallPushState: false,
    }];

    PUSH_STATE_TEST.forEach((testCase) => {
      describe(`when handled is ${testCase.initial}, new value is ${testCase.newValue}, and shouldPushState is ${testCase.shouldPushState}`, () => {
        beforeEach(() => {
          context.handled_ = testCase.initial;
          context.pushState_ = testCase.shouldPushState;
          expect(context.handled).toBe(testCase.initial);
        });
        it(`${testCase.shouldCallPushState ? '' : 'does not '}call pushState()`, () => {
          context.handled = testCase.newValue;
          expect(context.handled).toBe(testCase.newValue);
          if (testCase.shouldCallPushState) {
            expect(context.pushState).toHaveBeenCalled();
          } else {
            expect(context.pushState).not.toHaveBeenCalled();
          }
        });
      });
    });
  });
});
