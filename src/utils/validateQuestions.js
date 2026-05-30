function validateQuestion(q) {
  return (
    q &&
    typeof q.question === "string" &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    typeof q.correctIndex === "number"
  );
}

module.exports = validateQuestion;