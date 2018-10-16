;(function($, window, document, undefined) {

  'use strict';

  $.quiz = function(el, options) {
    var base = this;

    // Access to jQuery version of element
    base.$el = $(el);

    // Add a reverse reference to the DOM object
    base.$el.data('quiz', base);

    base.options = $.extend($.quiz.defaultOptions, options);

    var questions = base.options.questions,
      numQuestions = questions.length,
      startScreen = base.options.startScreen,
      startButton = base.options.startButton,
      homeButton = base.options.homeButton,
      resultsScreen = base.options.resultsScreen,
      gameOverScreen = base.options.gameOverScreen,
      nextButtonText = base.options.nextButtonText,
      finishButtonText = base.options.finishButtonText,
      restartButtonText = base.options.restartButtonText,
      currentQuestion = 1,
      score = 0,
      answerLocked = false;

    base.methods = {
      init: function() {
        base.methods.setup();

        $(document).on('click', startButton, function(e) {
          e.preventDefault();
          base.methods.start();
        });

        $(document).on('click', homeButton, function(e) {
          e.preventDefault();
          base.methods.home();
        });

        $(document).on('click', '.answers a', function(e) {
          e.preventDefault();
          base.methods.answerQuestion(this);
        });

        $(document).on('click', '#quiz-next-btn', function(e) {
          e.preventDefault();
          base.methods.nextQuestion();
        });

        $(document).on('click', '#quiz-finish-btn', function(e) {
          e.preventDefault();
          base.methods.finish();
        });

        $(document).on('click', '#quiz-restart-btn, #quiz-retry-btn', function(e) {
          e.preventDefault();
          base.methods.restart();
        });
      },
      setup: function() {
        var quizHtml = '';

        if (base.options.counter) {
          quizHtml += '<div id="quiz-counter"></div>';
        }

        quizHtml += '<div id="questions">';
        $.each(questions, function(i, question) {
          quizHtml += '<div class="question-container">';
          quizHtml += '<p class="question">' + question.q + '</p>';
          quizHtml += '<ul class="answers">';
          $.each(question.options, function(index, answer) {
            quizHtml += '<li><a href="#" data-index="' + index + '">' + answer + '</a></li>';
          });
          quizHtml += '</ul>';
          quizHtml += '</div>';
        });
        quizHtml += '</div>';

        // if results screen not in DOM, add it
        if ($(resultsScreen).length === 0) {
          quizHtml += '<div id="' + resultsScreen.substr(1) + '">';
          quizHtml += '<p id="quiz-results"></p>';
          quizHtml += '</div>';
        }

        quizHtml += '<div id="quiz-controls">';
        quizHtml += '<p id="quiz-response"></p>';
        quizHtml += '<div id="quiz-buttons">';
        quizHtml += '<a href="#" id="quiz-next-btn">' + nextButtonText + '</a>';
        quizHtml += '<a href="#" id="quiz-finish-btn">' + finishButtonText + '</a>';
        quizHtml += '<a href="#" id="quiz-restart-btn">' + restartButtonText + '</a>';
        quizHtml += '</div>';
        quizHtml += '</div>';

        base.$el.append(quizHtml).addClass('quiz-container quiz-start-state');

        $('#quiz-counter').hide();
        $('.question-container').hide();
        $(gameOverScreen).hide();
        $(resultsScreen).hide();
        $('#quiz-controls').hide();
      },
      start: function() {
        base.$el.removeClass('quiz-start-state').addClass('quiz-questions-state');
        $(startScreen).hide();
        $('#quiz-controls').hide();
        $('#quiz-finish-btn').hide();
        $('#quiz-restart-btn').hide();
        $('#questions').show();
        $('#quiz-counter').show();
        $('.question-container:first-child').show().addClass('active-question');
        base.methods.updateCounter();
      },
      answerQuestion: function(answerEl) {
        if (answerLocked) {
          return;
        }
        answerLocked = true;

        var $answerEl = $(answerEl),
          response = '',
          selected = $answerEl.data('index'),
          currentQuestionIndex = currentQuestion - 1,
          correct = questions[currentQuestionIndex].correctIndex;

        if (selected === correct) {
          $answerEl.addClass('correct');
          response = questions[currentQuestionIndex].correctResponse;
          score++;
        } else {
          $answerEl.addClass('incorrect');
          response = questions[currentQuestionIndex].incorrectResponse;
          if (!base.options.allowIncorrect) {
            base.methods.gameOver(response);
            return;
          }
        }

        $('#quiz-response').html(response);
        $('#quiz-controls').fadeIn();

        if (typeof base.options.answerCallback === 'function') {
          base.options.answerCallback(currentQuestion, selected, questions[currentQuestionIndex]);
        }
      },
      nextQuestion: function() {
        answerLocked = false;

        $('.active-question')
          .hide()
          .removeClass('active-question')
          .next('.question-container')
          .show()
          .addClass('active-question');

        $('#quiz-controls').hide();

        // check to see if we are at the last question
        if (++currentQuestion === numQuestions) {
          $('#quiz-next-btn').hide();
          $('#quiz-finish-btn').show();
        }

        base.methods.updateCounter();

        if (typeof base.options.nextCallback === 'function') {
          base.options.nextCallback();
        }
      },
      gameOver: function(response) {
        // if gameover screen not in DOM, add it
        if ($(gameOverScreen).length === 0) {
          var quizHtml = '';
          quizHtml += '<div id="' + gameOverScreen.substr(1) + '">';
          quizHtml += '<p id="quiz-gameover-response"></p>';
          quizHtml += '<p><a href="#" id="quiz-retry-btn">' + restartButtonText + '</a></p>';
          quizHtml += '</div>';
          base.$el.append(quizHtml);
        }
        $('#quiz-gameover-response').html(response);
        $('#quiz-counter').hide();
        $('#questions').hide();
        $('#quiz-finish-btn').hide();
        $(gameOverScreen).show();
      },
      finish: function() {
        base.$el.removeClass('quiz-questions-state').addClass('quiz-results-state');
        $('.active-question').hide().removeClass('active-question');
        $('#quiz-counter').hide();
        $('#quiz-response').hide();
        $('#quiz-finish-btn').hide();
        $('#quiz-next-btn').hide();
        $('#quiz-restart-btn').show();
        $(resultsScreen).show();
        var resultsStr = base.options.resultsFormat.replace('%score', score).replace('%total', numQuestions);
        $('#quiz-results').html(resultsStr);

        if (typeof base.options.finishCallback === 'function') {
          base.options.finishCallback();
        }
      },
      restart: function() {
        base.methods.reset();
        base.$el.addClass('quiz-questions-state');
        $('#questions').show();
        $('#quiz-counter').show();
        $('.question-container:first-child').show().addClass('active-question');
        base.methods.updateCounter();
      },
      reset: function() {
        answerLocked = false;
        currentQuestion = 1;
        score = 0;
        $('.answers a').removeClass('correct incorrect');
        base.$el.removeClass().addClass('quiz-container');
        $('#quiz-restart-btn').hide();
        $(gameOverScreen).hide();
        $(resultsScreen).hide();
        $('#quiz-controls').hide();
        $('#quiz-response').show();
        $('#quiz-next-btn').show();
        $('#quiz-counter').hide();
        $('.active-question').hide().removeClass('active-question');
      },
      home: function() {
        base.methods.reset();
        base.$el.addClass('quiz-start-state');
        $(startScreen).show();

        if (typeof base.options.homeCallback === 'function') {
          base.options.homeCallback();
        }
      },
      updateCounter: function() {
        var countStr = base.options.counterFormat.replace('%current', currentQuestion).replace('%total', numQuestions);
        $('#quiz-counter').html(countStr);
      }
    };

    base.methods.init();
  };

  $.quiz.defaultOptions = {
    allowIncorrect: true,
    counter: true,
    counterFormat: '%current/%total',
    startScreen: '#quiz-start-screen',
    startButton: '#quiz-start-btn',
    homeButton: '#quiz-home-btn',
    resultsScreen: '#quiz-results-screen',
    resultsFormat: 'You got %score out of %total correct!',
    gameOverScreen: '#quiz-gameover-screen',
    nextButtonText: 'Next',
    finishButtonText: 'Finish',
    restartButtonText: 'Restart'
  };

  $.fn.quiz = function(options) {
    return this.each(function() {
      new $.quiz(this, options);
    });
  };
}(jQuery, window, document));





  $('#quiz').quiz({
    //resultsScreen: '#results-screen',
    //counter: false,
    //homeButton: '#custom-home',
    counterFormat: 'Question %current of %total',
    questions: [
      {
        'q': 'What is the birth rate in Japan in 2017?',
        'options': [
          '4.7',
          '7.7',
          '11.7',
          '13.7'
        ],
        'correctIndex': 1,
        'correctResponse': 'Correct!',
        'incorrectResponse': 'Incorrect.'
      },
      {
        'q': 'What percentage of the population in Japan is elderly?',
        'options': [
          '15.63',
          '19.79',
          '23.64',
          '27.87'
        ],
        'correctIndex': 3,
        'correctResponse': 'Correct!',
        'incorrectResponse': 'Incorrect.'
      },
      {
        'q': 'Which of the following does not cause low birth rate in Japan?',
        'options': [
          'Economics',
          'Work Culture',
          'Immigration',
          'Game Industry'
        ],
        'correctIndex': 2,
        'correctResponse': 'Correct!',
        'incorrectResponse': 'Incorrect.'
      },
      {
        'q': 'Which word means overwork that leads to death?',
        'options': [
          'Karoshi',
          'Konkatsu'
        ],
        'correctIndex': 0,
        'correctResponse': 'Correct!',
        'incorrectResponse': 'Incorrect.'
      },
      {
        'q': 'Which of the following is not one of the initiatives Japan has taken?',
        'options': [
          'Ease the economic cost',
          'Forbid abortion',
          'Improve the employment environment',
          'Enhance childcare services'
        ],
        'correctIndex': 1,
        'correctResponse': 'Correct!',
        'incorrectResponse': 'Incorrect.'
      }
    ]
  });
