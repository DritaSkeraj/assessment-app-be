const express = require("express");
const { check, validationResult } = require("express-validator");
const uniqid = require("uniqid");
const { getExams, writeExams, getQuestions, writeQuestions } = require("../../lib/fsUtilities");

const examsRouter = express.Router();

const examsValidation = [
    check("candidateName").exists().withMessage("candidateName required"),
    check("isCompleted").exists().withMessage("isCompleted required"),
    check("name").exists().withMessage("name required"),
    check("totalDuration").exists().withMessage("totalDuration required")
]

const answerValidation = [
    check("question").exists().withMessage("question index required"),
    check("answer").exists().withMessage("correct answer index required")
]

const examQuestions = async() =>{

    const questions = await getQuestions()
    console.log("QUESTIONS.............", questions.length);
    let randomQuestions = []
    for(let i=0; i<5; i++){
        let random = Math.floor(Math.random() * questions.length);
        randomQuestions.push(questions.splice(random, 1)[0]);
    }
    return randomQuestions;
}

examsRouter.post(
    "/start", 
    examsValidation, 
    async(req, res, next) =>{
      try{
          const validationErrors = validationResult(req);
          if(!validationErrors.isEmpty()){
              const error = new Error();
              error.httpStatusCode = 400;
              error.message = validationErrors;
              next(error)
          } else {
            const questions = await examQuestions();
            console.log("ta-ra-ra-raaaam => ", questions);
            const exams = await getExams();
            let id = uniqid();
            questions.forEach(question => {
                question.answers.forEach(answer => {
                    answer.isCorrect = ''
                })
            })
            exams.push({
                ...req.body,
                _id: id,
                examDate: new Date(),
                questions: questions
            })
            await writeExams(exams)
            res.status(201).send(id);
          }

      } catch (error) {
          console.log(error)
          next(error)
      }
})

examsRouter.post(
    "test/:examId/answer", 
    answerValidation, 
    async(req, res, next) =>{
        try{
            const validationErrors = validationResult(req);
            if(!validationErrors.isEmpty()){
                const error = new Error();
                error.httpStatusCode = 400;
                error.message = validationErrors;
                next(error)
            } else {
                const exams = await getExams()
                console.log("GET EXAMS......", exams);
                const examIndex = exams.findIndex(
                    exam => exam._id === req.params.examId
                )
                if(examIndex !== -1){
                    // When the answer is provided, 
                    // the result is kept into the exam and the score 
                    // is updated accordingly.
                    // It should not be possible to answer the 
                    // same question twice.
                    
                    //check if the answer is correct
                    let questions = await getQuestions();
                    let question = exams[examIndex].questions[req.body.question].text;
                    console.log("text of the question::::::::::::::::::::::::::: ", question);
                    let questionIndex = questions.findIndex(q => q.text === question);
                    console.log("found question::::::::", questions[questionIndex].text);
                    let correctAnswerIndex = questions[questionIndex].answers.findIndex(answer => answer.isCorrect == true);
                    let providedAnswerIndex = req.body.answer;
                    let isCorrect;
                    correctAnswerIndex === providedAnswerIndex ? isCorrect = true : isCorrect = false;
                    console.log("IS CORRECT,,,,,,,,,,,,,,,,, ", isCorrect);

                    console.log("nmufsh mi ra nfije cili exam.question.answer---------------", 
                    exams[examIndex].questions[req.body.question].answers[providedAnswerIndex])

                    if(exams[examIndex].questions[req.body.question].answers[providedAnswerIndex].isCorrect != ""){
                        exams[examIndex].questions[req.body.question].answers[providedAnswerIndex].isCorrect = isCorrect;
                        if(!exams[examIndex].score){
                            exams[examIndex].score = 20;
                        } else {
                            exams[examIndex].score += 20;
                        }
                        await writeExams(exams)
                        res.status(201).send(exams[examIndex])
                    } else if(exams[examIndex].questions[req.body.question].answers[providedAnswerIndex].isCorrect === true ||
                        exams[examIndex].questions[req.body.question].answers[providedAnswerIndex].isCorrect === false) {
                        const error = new Error();
                        error.httpStatusCode = 400;
                        next(error);
                    } else {
                        console.log("Strange");
                    }
                } else {
                    const error = new Error();
                    error.httpStatusCode = 404
                    next(error)
                }
            }
        } catch (error) {
            console.log(error)
            next(error)
        }
})

examsRouter.post("/:examId/answer", async (req, res, next) => {
    try {
      
      const exams = await getExams();
      const selectedExam = exams.find((exam) => exam._id === req.params.examId);
      if (selectedExam) {
        
        const examsWithoutSelected = exams.filter(
          (exam) => exam._id !== req.params.examId
        );
  
        if (selectedExam.questions[req.body.question].providedAnswer) {
          res.send("already answered");
        } else {

          //check if the answer is correct
          let questions = await getQuestions();
          const examIndex = exams.findIndex(exam => exam._id === req.params.examId)
          let question = exams[examIndex].questions[req.body.question].text;
          console.log("text of the question::::::::::::::::::::::::::: ", question);
          let questionIndex = questions.findIndex(q => q.text === question);
          console.log("found question::::::::", questions[questionIndex].text);
          let correctAnswerIndex = questions[questionIndex].answers.findIndex(answer => answer.isCorrect == true);
          let providedAnswerIndex = req.body.answer;
          let isCorrect;
          correctAnswerIndex === providedAnswerIndex ? isCorrect = true : isCorrect = false;
          console.log("IS CORRECT,,,,,,,,,,,,,,,,, ", isCorrect);

          //add provided answer into question
          selectedExam.questions[req.body.question].providedAnswer = isCorrect;
          //add score into exam
          let score = 0;
          if (selectedExam.score) {
            score = selectedExam.score;
          } else {
            score = 0;
          }
          
          if (
            selectedExam.questions[req.body.question].answers[req.body.answer]
              .isCorrect
          ) {
            score += 20;
          }
          //add updated exam into exams
          selectedExam.score = score;
          //count number of answered question
          let counter = 0;
          selectedExam.questions.forEach((question) => {
            if (question.providedAnswer) {
              counter++;
            }
          });
  
          //update isCompleted
          if (counter === selectedExam.questions.length) {
            selectedExam.isCompleted = true;
          }
          console.log(counter, selectedExam.questions.length);
          examsWithoutSelected.push(selectedExam);
          await writeExams(examsWithoutSelected);
          //send selected answer as response
          res
            .status(200)
            .send(isCorrect+ "," + req.body.answer +","+ correctAnswerIndex);
        }
      } else {
        const error = new Error();
        error.httpStatusCode = 404;
        next(error);
      }
    } catch (error) {
      next(error);
    }
});

// > GET /exams/{id}
// Returns the information about the exam, including the current score. 

examsRouter.get("/:examId", async (req, res, next) => {
  try {
    const exams = await getExams();
    const selectedExam = exams.find((exam) => exam._id === req.params.examId);
    if (selectedExam) {
      //remove the correct answer and return it to the user
      selectedExam.questions.forEach((question) => {
        question.answers.forEach((answer) => {
          delete answer.isCorrect;
        });
      });
      res.status(200).send(selectedExam);
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
});


module.exports = examsRouter;
