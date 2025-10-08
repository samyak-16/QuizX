import { inngest } from '../../Config/inngest.js';
import { Quiz } from '../../Models/quiz.model.js';
import { cleanTempFile } from '../../Utils/cleanTempFile.js';
import { extractText } from '../../Utils/parsePdf.js';
import { cleanText } from '../../Utils/cleanText.js';
import {
  generateQuiz,
  generateTranscript,
} from '../../Services/ai.services.js';
import { downloadYoutubeMp3 } from '../../Utils/downloadYoutubeMp3.js';

const onCreateQuiz = inngest.createFunction(
  {
    id: 'on-quiz-create',
    retries: 2,
  },
  { event: 'quiz/create' },
  async ({ event, step }) => {
    const { quizId } = event.data;
    try {
      // Pipeline starts

      const quiz = await step.run('get-quiz-document-object', async () => {
        const quizDoc = await Quiz.findById(quizId);
        quizDoc.status = 'processing';
        await quizDoc.save();
        return quizDoc;
      });

      if (quiz.sourceType === 'pdf') {
        //Pipeline For pdf
        const rawText = await step.run('extract-text-from-pdf', async () => {
          return await extractText(quiz.pdfPath);
        });
        const cleanText = await step.run('clean-rawText', async () => {
          return await cleanText(rawText);
        });
        //Call LLM to generate quiz
        const quizQuestions = await step.run('generate-quiz', async () => {
          return await generateQuiz({
            text: cleanText,
            difficulty: quiz.difficulty,
          });
        });

        await step.run('save-quizQuestions-to-db', async () => {
          await Quiz.findByIdAndUpdate(quizId, {
            questions: quizQuestions,
            generatedAt: Date.now(),
            status: 'completed',
          });
        });

        await step.run('clean-temp-pdf', async () => {
          await cleanTempFile(quiz.pdfPath);
        });
      } else {
        //Pipeline For youtubeVideo
        const { filePath } = await step.run(
          'download-youtube-audio-mp3',
          async () => {
            return await downloadYoutubeMp3(quiz.youtubeUrl);
          }
        );
        await step.run('update-youtubeMp3Path-and-status-to-db', async () => {
          await Quiz.findByIdAndUpdate(quizId, {
            youtubeMp3Path: filePath,
            status: 'processing',
          });
        });
        const rawText = await step.run('generate-transcribe', async () => {
          return await generateTranscript(filePath);
        });
        const cleanText = await step.run('clean-rawText', async () => {
          return await cleanText(rawText);
        });
        //Call LLM to generate quiz
        const quizQuestions = await step.run('generate-quiz', async () => {
          return await generateQuiz({
            text: cleanText,
            difficulty: quiz.difficulty,
          });
        });

        await step.run('save-quizQuestions-to-db', async () => {
          await Quiz.findByIdAndUpdate(quizId, {
            questions: quizQuestions,
            generatedAt: Date.now(),
            status: 'completed',
          });
        });

        await step.run('clean-temp-pdf', async () => {
          await cleanTempFile(filePath);
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error in running the pipeline : ', error.message);

      const quiz = await Quiz.findByIdAndUpdate(quizId, { status: 'failed' });

      try {
        if (quiz.sourceType === 'pdf') {
          if (quiz.pdfPath) {
            await cleanTempFile(quiz.pdfPath);
          }
        } else {
          if (quiz.youtubeMp3Path) {
            await cleanTempFile(quiz.youtubeMp3Path);
          }
        }
      } catch (cleanupError) {
        console.error('Failed to clean temp file:', cleanupError.message);
      }
    }
  }
);

export { onCreateQuiz };
