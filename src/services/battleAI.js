const questions = require("../../data/questions");

// sequential question function
function getQuestions(
  topic = "ALL"
) {

  if (topic === "ALL") {
    return questions;
  }

  return questions.filter(
    (q) => q.topic === topic
  );
}

// main function
async function generateQuestion(
  topic = "ALL"
) {

  return getQuestions(topic);
}
module.exports = {
  generateQuestion,
  getRandomQuestion,
};