const knex = require('../db');


const QuizRepository = {
async createQuiz(data) {
const [id] = await knex('quizzes').insert(data);
return this.findById(id);
},


findById(id) {
return knex('quizzes').where({ id }).first();
},


async updateQuiz(id, data) {
await knex('quizzes').where({ id }).update(data);
return this.findById(id);
},


deleteQuiz(id) {
return knex('quizzes').where({ id }).del();
},


async listAll() {
return knex('quizzes').select('*');
},


// Perguntas e choices
async addQuestion(quiz_id, question) {
const [id] = await knex('questions').insert({ ...question, quiz_id });
return knex('questions').where({ id }).first();
},


async listQuestions(quiz_id) {
const questions = await knex('questions').where({ quiz_id }).orderBy('position');
for (const q of questions) {
q.choices = await knex('choices').where({ question_id: q.id });
}
return questions;
},

async addChoice(question_id, choice) {
const [id] = await knex('choices').insert({ ...choice, question_id });
return knex('choices').where({ id }).first();
},


// Respostas enviadas
async saveResponse(payload) {
const [id] = await knex('quiz_responses').insert(payload);
return knex('quiz_responses').where({ id }).first();
}
};


module.exports = QuizRepository;