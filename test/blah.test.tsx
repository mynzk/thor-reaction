import { createSignal, useReaction } from '../src';
import { act, renderHook } from '@testing-library/react-hooks';

describe('blah', () => {
  describe('createSignal', () => {
    describe('useReaction', () => {
      it('should update the state', () => {
        const [state, setState] = createSignal('off');
        const { result, rerender } = renderHook(() =>
          useReaction(() => state())
        );
        expect(result.current).toBe('off');
        act(() => {
          setState('on');
        });
        rerender();
        expect(result.current).toBe('on');
      });
    });
  });
});
