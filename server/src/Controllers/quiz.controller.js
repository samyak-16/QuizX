import { Quiz } from '../Models/quiz.model.js';
import { ApiError } from '../utils/api-error.js';
import { validateYouTubeUrlWithMeta } from '../Utils/validateYoutube.js';
import { inngest } from '../Config/inngest.js';
import { ApiResponse } from '../Utils/api-response.js';
import { validateMongooseObjectId } from '../Utils/validateMongooseObjectId.js';

const createQuiz = async (req, res) => {
  const {
    title = '',
    sourceType = '',
    youtubeUrl = '',
    difficulty = '',
  } = req.body || {};

  const file = req.file; // pdf-file from multer
  const user = req.user; // user from authMiddleware
  //Initial Validation starts here
  if (!title || sourceType || !difficulty) {
    return res
      .status(400)
      .json(new ApiError(400, 'All necessary fileds are  required'));
  }
  if (!file && !youtubeUrl) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          'Atleast one sourceType be uploaded i.e youtuberl or pdf'
        )
      );
  }

  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    return res
      .status(400)
      .json(
        new ApiError(400, 'difficulty can only include  easy||medium|||hard')
      );
  }
  if (!['pdf', 'youtube'].includes(sourceType)) {
    return res
      .status(400)
      .json(new ApiError(400, 'sourceType can only include pdf||youtube'));
  }
  if (sourceType === 'youtube') {
    if (!youtubeUrl) {
      return res
        .status(400)
        .json(
          new ApiError(400, 'youtubeUrl is required for sourceType : "youtube"')
        );
    }
  }

  //Validate Youtube video (a req is sent to yt-server)

  const result = await validateYouTubeUrlWithMeta(youtubeUrl);

  if (!result.valid) {
    return res.status(400).json(new ApiError(400, result.error));
  }
  const videoMetadata = result.metadata; // Send in Response

  //Initial Validation ends here

  try {
    const quiz = new Quiz({
      title,
      sourceType,
      youtubeUrl: sourceType === 'youtube' ? youtubeUrl : undefined,
      pdfUrl: sourceType === 'youtube' ? youtubeUrl : undefined,
      pdfPath: file.path,
      generatedBy: user._id,
      difficulty,
    });

    await quiz.save();

    //Invoke inngest event
    await inngest.send({
      name: 'quiz/create',
      data: { quizId: quiz._id.toString() },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { videoMetadata, quiz },
          'Wait until you quiz is fully processed by AI, Keep pooling '
        )
      );
  } catch (error) {
    console.error('❌ Internal Server Error in createQuiz : ', error.message);
    return res
      .status(500)
      .json(new ApiError(500, 'Internal Server Error at createQuiz'));
  }
};
const submitQuiz = async (req, res) => {
  //Subbmition object :
  // POST / api / quiz / submit;
  // {
  //   quizId: '671f9c0b3b7a4d2a4c8e8b11',
  //   answers: [
  //     { questionId: '671f9c0b3b7a4d2a4c8e8b20', userAnswer: 'Option A' },
  //     { questionId: '671f9c0b3b7a4d2a4c8e8b21', userAnswer: 'Option C' },
  //     // ...
  //   ],
  // };

  const { quizId = '', answers = [] } = req.body || {};

  if (!quizId || !answers || !Array.isArray(answers)) {
    return res
      .status(400)
      .json(new ApiError(400, 'quizId and answers[] are required'));
  }

  if (!validateMongooseObjectId(quizId)) {
    return res
      .status(400)
      .json(new ApiError(400, 'quizId should be valid mongoose object id '));
  }

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json(new ApiError(404, 'Quiz not found'));
    }

    let score = 0;

    // Compare each user answer
    const results = quiz.questions.map((q) => {
      const userAns = answers.find(
        (a) => a.questionId.toString() === q._id.toString()
      );

      const isCorrect = userAns && userAns.userAnswer === q.correctAnswer;
      if (isCorrect) score++;

      return {
        questionId: q._id,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        userAnswer: userAns ? userAns.userAnswer : null,
        isCorrect,
        explanation: q.explanation || null,
      };
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          quizId,
          score,
          total: quiz.questions.length,
          results, // each question with correctness info
        },
        'Quiz submitted successfully'
      )
    );
  } catch (error) {
    console.error('Internal Server Error at submitQuiz', error.message);
    res
      .status(500)
      .json(new ApiError(500, 'Internal Server Error at submitQuiz '));
  }

  //Api Response Object  :
  //   {
  //   "success": true,
  //   "message": "Quiz submitted successfully",
  //   "data": {
  //     "quizId": "671f9c0b3b7a4d2a4c8e8b11",
  //     "score": 7,
  //     "total": 10,
  //     "results": [
  //       {
  //         "questionId": "671f9c0b3b7a4d2a4c8e8b20",
  //         "questionText": "What is 2+2?",
  //         "options": ["2", "3", "4", "5"],
  //         "correctAnswer": "4",
  //         "userAnswer": "4",
  //         "isCorrect": true
  //       },
  //       {
  //         "questionId": "671f9c0b3b7a4d2a4c8e8b21",
  //         "questionText": "Who discovered gravity?",
  //         "options": ["Einstein", "Newton", "Tesla", "Edison"],
  //         "correctAnswer": "Newton",
  //         "userAnswer": "Einstein",
  //         "isCorrect": false,
  //         "explanation": "Isaac Newton discovered gravity."
  //       }
  //     ]
  //   }
  // }
};
const getQuizById = async (req, res) => {
  const { quizId = '' } = req.params || {};
  if (!quizId) {
    return res
      .status(400)
      .json(new ApiError(400, 'quizId is required in params '));
  }
  if (!validateMongooseObjectId(quizId)) {
    return res
      .status(400)
      .json(new ApiError(400, 'quizId must be valid mongoose  object Id'));
  }
  try {
    const quiz = await Quiz.findById(quizId).populate(
      'generatedBy',
      'name email'
    );
    if (!quiz) {
      return res.status(404).json(new ApiError(404, 'Quiz not found '));
    }

    // Remove correct answers and explanations before sending to user
    const sanitizedQuestions = quiz.questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      // don't include correctAnswer or explanation
    }));

    const safeQuiz = {
      _id: quiz._id,
      title: quiz.title,
      sourceType: quiz.sourceType,
      youtubeUrl: quiz.youtubeUrl,
      pdfUrl: quiz.pdfUrl,
      difficulty: quiz.difficulty,
      totalQuestions: quiz.totalQuestions,
      generatedBy: quiz.generatedBy,
      createdAt: quiz.createdAt,
      questions: sanitizedQuestions,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, { safeQuiz }, 'Quiz Fetched Successfully'));
  } catch (error) {
    console.error('Internal Server Error at getQuizById : ', error.message);
    return res
      .status(500)
      .json(new ApiError(500, 'Internal Server Error at getQuizById'));
  }
};
const getAllUsersQuiz = async (req, res) => {};

export { createQuiz, submitQuiz, getAllUsersQuiz, getQuizById };
