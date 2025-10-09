import { NonRetriableError } from 'inngest';
import { User } from '../../Models/user.model.js';
import { inngest } from '../../Config/inngest.js';
import { sendMail } from '../../Utils/sendMail.js';

const onUserSignUp = inngest.createFunction(
  {
    id: 'on-user-signup',
    retries: 2,
  },
  { event: 'user/signup' },
  async ({ event, step }) => {
    try {
      const { email } = event.data;
      const user = await step.run('get-user-email', async () => {
        const userObject = await User.findOne({ email });
        if (!userObject) {
          throw new NonRetriableError('User no longer exists in our databases');
        }
        return userObject;
      });

      await step.run('send-welcome-email', async () => {
        const subject = 'Welcome to the app';
        const message = `Hi
        \n \n
        Thanks for signing up .  We are glad to have you onboard .
        `;
        await sendMail(user.email, subject, message);
      });
      return { success: true };
    } catch (error) {
      console.error('❌ Erro running step : ', error.message);
      return { success: false };
    }
  }
);

export { onUserSignUp };
