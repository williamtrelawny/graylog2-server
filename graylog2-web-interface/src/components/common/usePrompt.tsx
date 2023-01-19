import { unstable_usePrompt } from 'react-router-dom';

/**
 * Prompts the user with an Alert before they leave the current screen.
 *
 * @param  message
 * @param  when
 */
const usePrompt = (message: string, when: boolean = true) => unstable_usePrompt({ when, message });

export default usePrompt;
