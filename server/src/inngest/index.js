// import { sendEmail } from "./functions/sendEmail.js";
import { onUserSignUp } from './functions/on-signup.js';
import { onCreateQuiz } from './functions/onQuizCreate.js';

const inngestFunctions = [onCreateQuiz, onUserSignUp];
export { inngestFunctions };
