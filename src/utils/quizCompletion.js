import { generateAndSaveReview } from "../services/geminiService.js";
import StorageService from "../services/storageService.js";

const handleQuizCompletion = async (completedQuiz, user, navigate) => {
  try {
    await StorageService.saveQuiz(completedQuiz);

    const updatedQuizzes = await StorageService.getQuizzes(user.id);

    await generateAndSaveReview(user, updatedQuizzes);

    navigate("/overview");
  } catch {
    navigate("/overview?error=review_fail");
  }
};

export default handleQuizCompletion;
