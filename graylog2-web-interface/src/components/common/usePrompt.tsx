import { useCallback, useEffect } from 'react';
import { unstable_useBlocker as useBlocker } from 'react-router-dom';

/**
 * Prompts the user with an Alert before they leave the current screen.
 *
 * @param  message
 * @param  when
 */
const usePrompt = (message: string, when: boolean = true) => {
  // eslint-disable-next-line no-alert
  const blocker = useBlocker(when);

  const prompt = useCallback(() => window.confirm(message), [message]);

  useEffect(() => {
    if (blocker.state === 'blocked' && !when) {
      blocker.reset();
    }

    if (blocker.state === 'blocked' && when) {
      if (prompt()) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker, prompt, when]);
};

export default usePrompt;
