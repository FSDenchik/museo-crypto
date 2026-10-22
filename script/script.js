// Секции
const startEl = document.querySelector('.start');
const manualEl = document.querySelector('.manual');
const questionEl = document.querySelector('.question');
const mainEl = document.querySelector('.main');
const preloaderEl = document.querySelector('.preloader');

function hidePreloader() {
    if (!preloaderEl || preloaderEl.classList.contains('is-hidden')) {
        return;
    }

    let fallbackTimer;
    const finishHiding = () => {
        preloaderEl.removeEventListener('transitionend', handleFadeEnd);
        window.clearTimeout(fallbackTimer);
        preloaderEl.classList.remove('is-hiding');
        preloaderEl.classList.add('is-hidden');
    };

    const handleFadeEnd = (event) => {
        if (event.target === preloaderEl && event.propertyName === 'opacity') {
            finishHiding();
        }
    };

    preloaderEl.addEventListener('transitionend', handleFadeEnd);
    preloaderEl.classList.add('is-hiding');
    fallbackTimer = window.setTimeout(finishHiding, 700);
}

window.setTimeout(hidePreloader, 3000);
// Блоки + кнопки
const questionOneEl = document.querySelector('[data-question="1"]')
const answerEl = document.querySelector('.answer');
const answerTitleEl = document.querySelector('.answer__title');
const answerTextEl = document.querySelector('.answer__text');
const answerCounterEl = document.querySelector('.answer__text-counter');
const answerImageEl = document.querySelector('.answer__img');

function setThemeImage(imageElement, darkSrc, lightSrc, darkSrcset = '', lightSrcset = '') {
    if (!imageElement) return;
    const isLightTheme = mainEl.classList.contains('light');
    const src = isLightTheme ? lightSrc : darkSrc;
    const srcset = isLightTheme ? lightSrcset : darkSrcset;
    if (src) imageElement.src = src;
    if (srcset) imageElement.srcset = srcset;
    else imageElement.removeAttribute('srcset');
}

function syncThemeImages() {
    const isLightTheme = mainEl.classList.contains('light');
    document.querySelectorAll('[data-dark-src]').forEach(function (imageElement) {
        const src = isLightTheme ? imageElement.dataset.lightSrc : imageElement.dataset.darkSrc;
        const srcset = isLightTheme ? imageElement.dataset.lightSrcset : imageElement.dataset.darkSrcset;
        if (src) imageElement.src = src;
        if (srcset) imageElement.srcset = srcset;
        else imageElement.removeAttribute('srcset');
    });
}

function updateAnswerFeedback(score, title) {
    const scoreAbs = Math.abs(Number(score) || 0);
    const scoreWord = scoreAbs % 10 === 1 && scoreAbs % 100 !== 11
        ? 'БАЛЛ'
        : scoreAbs % 10 >= 2 && scoreAbs % 10 <= 4 && (scoreAbs % 100 < 10 || scoreAbs % 100 >= 20)
            ? 'БАЛЛА'
            : 'БАЛЛОВ';
    answerCounterEl.textContent = `+ ${score} ${scoreWord}`;
    const imagesByTitle = {
        'Осторожно': ['dangerous.png', 'dangerous-light.png'],
        'Может быть опасно': ['mb-dangerous.png', 'mb-dangerous-light.png'],
        'БРАВО': ['good.png', 'good-light.png'],
        'Есть риски': ['shield.png', 'shield-light.png'],
        'Надёжный пароль': ['good.png', 'good-light.png']
    };
    const image = imagesByTitle[title] ||
        (score === 0 ? ['dangerous.png', 'dangerous-light.png'] : score >= 2 ? ['good.png', 'good-light.png'] : ['shield.png', 'shield-light.png']);
    setThemeImage(answerImageEl, `images/answer/${image[0]}`, `images/answer/${image[1]}`);
}
const questionSecondEl = document.querySelector('[data-question="2"]')
const questionThreeEl = document.querySelector('[data-question="3"]')
const questionFourEl = document.querySelector('[data-question="4"]')
const questionFiveEl = document.querySelector('[data-question="5"]')
const questionSixEl = document.querySelector('[data-question="6"]')
const questionSevenEl = document.querySelector('[data-question="7"]')
const questionEightEl = document.querySelector('[data-question="8"]')
const questionNineEl = document.querySelector('[data-question="9"]')

const accordeonListEl = document.querySelector('.accordeon__list');
// Кнопки
const startBtnEl = document.querySelector('.start__btn#start');
const startBtnDesktopEl = document.querySelector('.start__desktop-btn#start');
const museumBtnEl = document.querySelector('.start__btn#musey');
const headerMuseumBtnEl = document.querySelector('.header__container-btn');
const manualStartBtnEl = document.querySelector('.manual__btn');
const checkBtns = document.querySelectorAll('.question__check');
const answerBtn = document.querySelector('.answer__btn');
const accordeonBtn = document.querySelector('.accordeon__btn');
const questionHelpBtn = document.querySelector('.question__help');
const questionSixDialogBtn = document.querySelector('.question__btn-dialog');
const themeBtnEl = document.querySelector('.header__btn-theme');
const headerLogoMobileEl = document.querySelector('.header__logo-mobile');
const headerDesktopNumberEl = document.querySelector('.header-desktop__number');
const headerDesktopImageEl = document.querySelector('.header-desktop__image');
const headerDesktopTextEl = document.querySelector('.header-desktop__text');
const themeIconLightEl = themeBtnEl ? themeBtnEl.querySelector('.header__btn-icon--light') : null;
const themeIconDarkEl = themeBtnEl ? themeBtnEl.querySelector('.header__btn-icon:not(.header__btn-icon--light)') : null;
const MAX_SCORE = 22;
let totalScore = 0;
const resultEl = document.querySelector('.result');
const profileEl = document.querySelector('.profile');
const checkListEl = document.querySelector('.check-list');
const qrEl = document.querySelector('.qr');
const resultNumberEl = document.querySelector('.result__number-color');
const resultTextEl = document.querySelector('.result__text');
const profileDesktopTitleEl = document.querySelector('.profile__title-desktop');
const resultDescEl = document.querySelector('.result__desc');
const resultPercentEls = document.querySelectorAll('.result__procent');
const resultNextBtn = document.querySelector('.result__btn--color');
const resultRetryBtn = document.querySelector('.result__wrap-btn .result__btn:not(.result__btn--color)');
const profileRetryBtn = document.querySelector('.profile__btn--retry');
const profileNextBtn = document.querySelector('.profile__btn--next');
const checklistNextBtns = document.querySelectorAll('.check-list__btn');
const CURRENT_ATTEMPT_KEY = 'museo-crypto-current-attempt';
const ATTEMPT_HISTORY_KEY = 'museo-crypto-attempts';
const PENDING_UPLOAD_KEY = 'museo-crypto-pending-uploads';
let questionScores = {};
let questionAnswers = {};
let attemptStartedAt = new Date().toISOString();
let attemptSaved = false;
let latestResults = null;
let resetQuestionSix = function () {};
let uploadInProgress = false;

const radioScores = {
    1: { q1_1: 1, q1_2: 2, q1_3: 0 },
    2: { q2_1: 0, q2_2: 0, q2_3: 2, q2_4: 1 },
    4: { q4_1: 0, q4_2: 1, q4_3: 2, q4_4: 1 },
    5: { q5_1: 0, q5_2: 1, q5_3: 2, q5_4: 1 },
    7: { q7_1: 0, q7_2: 1, q7_3: 2, q7_4: 0 },
    8: { q8_1: 2, q8_2: 0, q8_3: 1, q8_4: 1 },
    9: { q9_1: 0, q9_2: 1, q9_3: 2, q9_4: 1 }
};

function updateScoreUI() {
    const scoreText = `${totalScore}/${MAX_SCORE}`;
    document.querySelectorAll('.progress-bar__score').forEach((scoreEl) => {
        scoreEl.textContent = scoreText;
    });
    if (headerDesktopTextEl) {
        headerDesktopTextEl.textContent = `${totalScore} из ${MAX_SCORE} баллов`;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        // The quiz remains usable when storage is blocked by the browser.
    }
}

function readStorage(key, fallback) {
    try {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : fallback;
    } catch (error) {
        return fallback;
    }
}

function persistCurrentAttempt() {
    writeStorage(CURRENT_ATTEMPT_KEY, {
        startedAt: attemptStartedAt,
        updatedAt: new Date().toISOString(),
        scores: questionScores,
        answers: questionAnswers
    });
}

function addQuestionScore(questionItem, score, answer) {
    if (!questionItem || questionItem.dataset.scored === 'true') {
        return;
    }

    const questionNumber = questionItem.getAttribute('data-question');
    const normalizedScore = Number(score) || 0;
    questionItem.dataset.scored = 'true';
    questionScores[questionNumber] = normalizedScore;
    questionAnswers[questionNumber] = answer || null;
    totalScore += normalizedScore;
    persistCurrentAttempt();
    updateScoreUI();
}

function showSection(section) {
    [questionEl, resultEl, profileEl, checkListEl, qrEl].forEach(function (item) {
        if (item) item.classList.remove('is-active');
    });
    section.classList.add('is-active');
    syncHeaderLogo(section);
    window.scrollTo(0, 0);
}

function renderResults() {
    latestResults = window.CryptoQuizResults.calculateResults(questionScores);
    resultNumberEl.textContent = totalScore;
    resultTextEl.textContent = latestResults.profile.title;
    profileDesktopTitleEl.textContent = latestResults.profile.title;
    resultDescEl.textContent = latestResults.profile.description;
    resultPercentEls.forEach(function (container) {
        container.replaceChildren();
    });

    latestResults.categories.forEach(function (category) {
        const item = document.createElement('div');
        item.className = 'result__procent-item';

        const header = document.createElement('div');
        header.className = 'result__procent-head';
        header.innerHTML = `<span>${category.label}</span><span>${category.percent}%</span>`;

        const track = document.createElement('div');
        track.className = 'result__procent-track';
        track.setAttribute('role', 'progressbar');
        track.setAttribute('aria-label', category.label);
        track.setAttribute('aria-valuemin', '0');
        track.setAttribute('aria-valuemax', '100');
        track.setAttribute('aria-valuenow', String(category.percent));

        const value = document.createElement('span');
        value.className = 'result__procent-value';
        value.style.width = `${category.percent}%`;
        track.append(value);
        item.append(header, track);
        resultPercentEls.forEach(function (container) {
            container.append(item.cloneNode(true));
        });
    });

    syncProfileImage();

    const profileTitles = document.querySelectorAll('.profile__title');
    const isBalancedElevenPointResult = totalScore === 11 &&
        latestResults.categories.length === 5 &&
        latestResults.categories.every(function (category) {
            return category.percent === 50;
        });

    profileTitles.forEach(function (title) {
        title.style.display = totalScore === 0 ||
            totalScore === MAX_SCORE ||
            isBalancedElevenPointResult ? 'none' : '';
    });
    profileTitles[0].textContent = `Сильная сторона: ${latestResults.strongest.label}`;
    profileTitles[1].textContent = `Зона внимания: ${latestResults.attention.label}`;

    const strongProfileText = isBalancedElevenPointResult
        ? 'Серьёзных пробелов не обнаружено. В этом прохождении вы уверенно справились с большинством типов цифровых рисков'
        : latestResults.strongest.strong;
    const attentionProfileText = isBalancedElevenPointResult
        ? 'Фундамент уже есть. Вы распознали часть безопасных решений, а рекомендации из игры помогут увереннее действовать в остальных ситуациях'
        : latestResults.attention.attention;

    document.querySelector('.profile__text--strong').innerHTML = strongProfileText.replace(/\n/g, '<br>');
    document.querySelector('.profile__text--attention').innerHTML = attentionProfileText.replace(/\n/g, '<br>');
}

function saveCompletedAttempt() {
    if (attemptSaved) return;

    const completedAt = new Date().toISOString();
    const completedAttempt = {
        id: createAttemptId(),
        startedAt: attemptStartedAt,
        completedAt: completedAt,
        scores: questionScores,
        answers: questionAnswers,
        result: latestResults
    };
    const storedHistory = readStorage(ATTEMPT_HISTORY_KEY, []);
    const history = Array.isArray(storedHistory) ? storedHistory : [];
    history.push(completedAttempt);
    writeStorage(ATTEMPT_HISTORY_KEY, history.slice(-20));
    writeStorage(CURRENT_ATTEMPT_KEY, completedAttempt);
    attemptSaved = true;
    uploadCompletedAttempt(completedAttempt);
}

function createAttemptId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function uploadCompletedAttempt(attempt) {
    const pending = readStorage(PENDING_UPLOAD_KEY, []);
    const queue = Array.isArray(pending) ? pending : [];
    queue.push({
        id: attempt.id,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        scores: attempt.scores
    });
    writeStorage(PENDING_UPLOAD_KEY, queue.slice(-20));
    flushPendingAttempts();
}

async function flushPendingAttempts() {
    if (uploadInProgress) return;
    uploadInProgress = true;
    try {
        let pending = readStorage(PENDING_UPLOAD_KEY, []);
        while (Array.isArray(pending) && pending.length) {
            const sentId = pending[0].id;
            const response = await fetch('/api/attempts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                keepalive: true,
                body: JSON.stringify(pending[0])
            });
            if (!response.ok) break;
            const latest = readStorage(PENDING_UPLOAD_KEY, []);
            pending = Array.isArray(latest) ? latest.filter(item => item.id !== sentId) : [];
            writeStorage(PENDING_UPLOAD_KEY, pending);
        }
    } catch (error) {
        // Retry automatically on a later page load or when the connection returns.
    } finally {
        uploadInProgress = false;
    }
}

window.addEventListener('online', flushPendingAttempts);
flushPendingAttempts();

function finishQuiz() {
    renderResults();
    saveCompletedAttempt();
    showSection(resultEl);
}

function isQuizInProgress() {
    return Boolean(questionEl && questionEl.classList.contains('is-active'));
}

// Предупреждаем во время прохождения вопросов: обновление страницы сбрасывает прогресс.
window.addEventListener('beforeunload', function (event) {
    if (!isQuizInProgress()) return;
    event.preventDefault();
    event.returnValue = 'Если вы перезагрузите сайт, весь прогресс пропадёт.';
});

function startFirstQuestion() {
    startEl.classList.remove('is-active');
    manualEl.classList.remove('is-active');
    showSection(questionEl);
    document.querySelectorAll('.question__item').forEach(function (item) {
        item.classList.remove('is-active');
    });
    showQuestion(questionOneEl);
    persistCurrentAttempt();
}

function restartQuiz() {
    totalScore = 0;
    questionScores = {};
    questionAnswers = {};
    attemptStartedAt = new Date().toISOString();
    attemptSaved = false;
    document.querySelectorAll('.question__item').forEach(function (item) {
        item.classList.remove('is-active');
        delete item.dataset.scored;
        delete item.dataset.passwordComplete;
        delete item.dataset.passwordAttempts;
        item.querySelectorAll('input').forEach(function (input) {
            input.checked = false;
            // Логин в вопросе 3 предзаполнен и нужен при повторном прохождении.
            if (!input.disabled && (input.type === 'text' || input.type === 'password')) input.value = '';
        });
        item.querySelectorAll('button').forEach(function (button) {
            button.disabled = false;
        });
    });
    resetQuestionSix();
    answerEl.classList.remove('is-active');
    writeStorage(CURRENT_ATTEMPT_KEY, {
        startedAt: attemptStartedAt,
        scores: {},
        answers: {}
    });
    updateScoreUI();
    startFirstQuestion();
}

function syncHeaderLogo(activeSection) {
    if (!headerLogoMobileEl) return;

    const finalSections = [resultEl, profileEl, checkListEl, qrEl];
    const shouldShowLogo = finalSections.includes(activeSection);
    headerLogoMobileEl.classList.toggle('is-visible', shouldShowLogo);
    headerLogoMobileEl.hidden = !shouldShowLogo;
}
function syncProfileImage() {
    if (!latestResults) return;
    const profileImages = {
        'Нужна цифровая прокачка': 1,
        'Осмотрительный пользователь': 2,
        'Уверенный пользователь': 3,
        'Киберзнаток': 4
    };
    const profileNumber = profileImages[latestResults.profile.title] || 1;
    const desktopImage = document.querySelector('.profile__source-desktop');
    if (desktopImage) {
        const themeSuffix = mainEl.classList.contains('light') ? '-light' : '';
        desktopImage.srcset = `images/profile/profile-desktop-${profileNumber}${themeSuffix}.png`;
    }
    const profileImage = document.querySelector('.profile__img');
    if (profileImage) setThemeImage(
        profileImage,
        'images/profile/profile-mobile.png',
        'images/profile/profile-mobile-light.png',
        'images/profile/profile-mobile.png 1x, images/profile/profile-mobile@2x.png 2x',
        'images/profile/profile-mobile-light.png 1x, images/profile/profile-mobile-light@2x.png 2x'
    );
}

function syncThemeIcons() {
    const isLightTheme = mainEl.classList.contains('light');
    if (headerLogoMobileEl) setThemeImage(
        headerLogoMobileEl,
        'images/logo-mobile.png',
        'images/logo-mobile-light.png',
        'images/logo-mobile.png 1x, images/logo-mobile@2x.png 2x',
        'images/logo-mobile-light.png 1x, images/logo-mobile-light@2x.png 2x'
    );
    if (themeBtnEl) themeBtnEl.classList.toggle('is-light', isLightTheme);
    if (themeIconLightEl) themeIconLightEl.setAttribute('aria-hidden', String(!isLightTheme));
    if (themeIconDarkEl) themeIconDarkEl.setAttribute('aria-hidden', String(isLightTheme));
    syncThemeImages();
    syncProfileImage();
    const activeQuestion = document.querySelector('.question__item.is-active');
    if (activeQuestion) updateDesktopProgress(activeQuestion.getAttribute('data-question'));
}

function updateDesktopProgress(questionNumber) {
    if (!headerDesktopNumberEl || !headerDesktopImageEl || !questionNumber) {
        return;
    }

    const currentQuestion = Number(questionNumber);
    const formattedQuestion = String(currentQuestion).padStart(2, '0');
    headerDesktopNumberEl.textContent = `вопрос ${formattedQuestion} из 09`;
    const themeSuffix = mainEl.classList.contains('light') ? '-light' : '';
    headerDesktopImageEl.src = `images/header-desktop/progress-${currentQuestion}${themeSuffix}.png`;
    headerDesktopImageEl.removeAttribute('srcset');
}

function showQuestion(questionItem) {
    questionItem.classList.add('is-active');
    updateDesktopProgress(questionItem.getAttribute('data-question'));
}


// Действия на кнопки
if (accordeonBtn && accordeonListEl) {
    accordeonBtn.addEventListener('click', function () {
        accordeonListEl.classList.toggle('is-active');
    });
}

if (questionHelpBtn && accordeonListEl && questionThreeEl) {
    const desktopMediaQuery = window.matchMedia('(min-width: 1440px)');
    const desktopWrap = questionThreeEl.querySelector('.question__desktop-wrap');

    questionHelpBtn.addEventListener('click', function () {
        if (!desktopMediaQuery.matches || !desktopWrap) {
            return;
        }

        const isHelpVisible = desktopWrap.classList.toggle('is-help-visible');
        accordeonListEl.classList.toggle('is-active', isHelpVisible);
    });

    desktopMediaQuery.addEventListener('change', function (event) {
        if (event.matches || !desktopWrap) {
            return;
        }

        desktopWrap.classList.remove('is-help-visible');
        accordeonListEl.classList.remove('is-active');
    });
}
themeBtnEl.addEventListener('click', function () {
    const isLightTheme = mainEl.classList.toggle('light');
    preloaderEl.classList.toggle('light', isLightTheme);
    syncThemeIcons();
});

syncThemeIcons();
syncHeaderLogo(null);
updateScoreUI();

function showManual() {
    startEl.classList.remove('is-active');
    showSection(manualEl);
}

startBtnEl.addEventListener('click', showManual);
startBtnDesktopEl.addEventListener('click', showManual);

manualStartBtnEl.addEventListener('click', startFirstQuestion);
answerBtn.addEventListener('click', function (e) {
    // Определяем вопрос, для которого сейчас показан answer.
    const activeQuestion = questionEl.querySelector('.question__item.is-active');
    if (!activeQuestion) {
        return;
    }

    const questionNumber = activeQuestion.getAttribute('data-question');
    answerEl.classList.remove('is-active');
    activeQuestion.classList.remove('is-active');

    if (questionNumber === '1') {
        showQuestion(questionSecondEl);
    } else if (questionNumber === '2') {
        showQuestion(questionThreeEl);
    } else if (questionNumber === '3') {
        showQuestion(questionFourEl);
    } else if (questionNumber === '4') {
        showQuestion(questionFiveEl);
    } else if (questionNumber === '5') {
        showQuestion(questionSixEl);
    } else if (questionNumber === '6') {
        showQuestion(questionSevenEl);
    } else if (questionNumber === '7') {
        showQuestion(questionEightEl);
    } else if (questionNumber === '8') {
        showQuestion(questionNineEl);
    } else if (questionNumber === '9') {
        finishQuiz();
    }
});

resultNextBtn.addEventListener('click', function () {
    showSection(profileEl);
});

resultRetryBtn.addEventListener('click', restartQuiz);

profileNextBtn.addEventListener('click', function () {
    showSection(checkListEl);
});

profileRetryBtn.addEventListener('click', restartQuiz);

checklistNextBtns.forEach(function (button) {
    button.addEventListener('click', function () {
        showSection(qrEl);
    });
});
// Назначаем обработчик всем кнопкам "Проверить" на странице
checkBtns.forEach((checkBtn) => checkBtn.addEventListener('click', function (e) {
    // Находим родительский блок вопроса
    const questionItem = this.closest('.question__item');
    const questionNumber = questionItem.getAttribute('data-question');
    if (answerEl.classList.contains('is-active') || this.disabled || questionItem.dataset.scored === 'true') {
        return;
    }

    // Проверка 3 вопроса
    if (questionNumber === '3') {
        if (questionItem.dataset.passwordComplete === 'true') {
            return;
        }

        const login = questionItem.querySelector('#login').value;
        const passwordInput = questionItem.querySelector('#password');
        const password = passwordInput.value;
        const errorText = questionItem.querySelector('.question__answers-text');
        const attempts = Number(questionItem.dataset.passwordAttempts || 0) + 1;
        questionItem.dataset.passwordAttempts = String(attempts);
        const errors = [];

        if (password.length < 8 || password.length > 12) {
            errors.push('Длина пароля должна быть от 8 до 12 символов.');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Добавьте хотя бы одну цифру.');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Добавьте хотя бы одну строчную латинскую букву.');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Добавьте хотя бы одну заглавную латинскую букву.');
        }
        if (password.toLowerCase().includes(login.toLowerCase())) {
            errors.push('Пароль не должен содержать логин.');
        }
        if (!/[()^?=!.*$&_-]/.test(password)) {
            errors.push('Добавьте спецсимвол из набора: ()^?=!.*$&_-.');
        }
        if (/\s/.test(password)) {
            errors.push('Пароль не должен содержать пробелы.');
        }

        const simpleParts = ['password', 'qwerty', 'asdf', 'admin', '1234', 'abcd'];
        const lowerPassword = password.toLowerCase();
        const hasSimplePart = simpleParts.some(function (part) {
            return lowerPassword.includes(part);
        });
        const hasManySameCharacters = /(.)\1{3,}/.test(password);
        const isPredictable = hasSimplePart || hasManySameCharacters;
        if (isPredictable) {
            errors.push('Пароль не должен содержать предсказуемые слова или последовательности.');
        }

        if (errors.length > 0) {
            errorText.replaceChildren(...errors.map(function (error) {
                const errorItem = document.createElement('span');
                errorItem.textContent = error;
                return errorItem;
            }));
            passwordInput.classList.add('is-error');
            return;
        }

        const passwordScore = attempts === 1 ? 2 : attempts === 2 ? 1 : 0;
        addQuestionScore(questionItem, passwordScore, { type: 'password-check', valid: true, attempts: attempts });
        questionItem.dataset.passwordComplete = 'true';
        errorText.replaceChildren();
        passwordInput.classList.remove('is-error');
        this.disabled = true;

        answerTitleEl.textContent = 'Надёжный пароль';
        answerTextEl.textContent = 'Пароль соответствует всем требованиям безопасности.';
        updateAnswerFeedback(passwordScore, answerTitleEl.textContent);
        answerEl.classList.add('is-active');
        return;
    }
    const selectedRadio = questionItem.querySelector('input[type="radio"]:checked');

    // Для остальных вопросов проверяем, выбран ли ответ
    if (!selectedRadio) {
        alert('Пожалуйста, выберите вариант ответа!');
        return;
    }

    const selectedId = selectedRadio.getAttribute('id');
    const score = radioScores[questionNumber] ? radioScores[questionNumber][selectedId] : undefined;
    if (score !== undefined) {
        addQuestionScore(questionItem, score, { id: selectedId, value: selectedRadio.value });
    }

    if (questionNumber == 1) {
        switch (selectedId) {
            case 'q1_1':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'Coffee_Free';
                answerTextEl.textContent = 'Открытая сеть может быть настоящей, но вы этого не проверили. Лучше уточнить у сотрудника название официальной сети кафе и не игнорировать предупреждения браузера или системы.';
                break;

            case 'q1_2':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'Coffee_Guest 🔒';
                answerTextEl.textContent = 'Лучший выбор из предложенных: вы убедились, что это официальная сеть кафе. Но даже в знакомой сети не отключайте обычные меры безопасности и обращайте внимание на предупреждения браузера.';
                break;

            case 'q1_3':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'FREE_WIFI_NO_SMS_100%';
                answerTextEl.textContent = 'Подозрительный вариант. Название сети не доказывает, кто её создал. Злоумышленник тоже может создать точку доступа с привлекательным названием. Лучше уточнить официальную сеть у сотрудников кафе.';
                break;

            default:
                alert('Ошибка: неизвестный ID');
        }
    }

    else if (questionNumber == 2) {
        switch (selectedId) {
            case 'q2_1':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'Осторожно';
                answerTextEl.textContent = "Даже если кажется, что флешку потерял точно кто-то из сотрудников, это не даёт гарантии, что её содержимое безопасно. Лучше не подключать незнакомые устройства к своему компьютеру, это рискованно: на флешке могут быть вредоносные программы."
                break;

            case 'q2_2':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'Есть риски';
                answerTextEl.textContent = 'Даже старый компьютер не делает неизвестную флешку безопасной. На ней могут быть вредоносные файлы или программы. Не подключайте неизвестные устройства без необходимости.';
                break;

            case 'q2_3':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'БРАВО';
                answerTextEl.textContent = 'Хороший выбор. Не подключайте неизвестную флешку самостоятельно. Ответственный специалист сможет решить, как безопасно с ней поступить.';
                break;

            case 'q2_4':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'Есть риски';
                answerTextEl.textContent = 'Вы не подвергли свой компьютер риску, но флешку может подобрать кто-то другой. На работе или учёбе лучше сообщить о находке ответственному сотруднику.';
                break;

            default:
                alert('Ошибка: неизвестный ID');
        }
    }

    else if (questionNumber == 4) {
        switch (selectedId) {
            case 'q4_1':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'Осторожно';
                answerTextEl.textContent = "QR-код — всего лишь способ передать информацию, в том числе ссылку. За ним может скрываться и поддельный сайт, поэтому относитесь к QR-кодам так же внимательно, как к обычным ссылкам."
                break;

            case 'q4_2':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'Может быть опасно';
                answerTextEl.textContent = 'Неплохая проверка, но знакомый вид адреса ещё не гарантирует безопасность: поддельные домены могут быть очень похожи на настоящие.';
                break;

            case 'q4_3':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'БРАВО';
                answerTextEl.textContent = 'Отличный выбор. Если акция настоящая, информацию о ней лучше проверить через официальный сайт или приложение организации.';
                break;

            case 'q4_4':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'Есть риски';
                answerTextEl.textContent = 'Опыт знакомого немного снижает неопределённость, но не подтверждает безопасность QR-кода. Он мог не заметить подмену или угрозу. Надёжнее проверить информацию через официальный источник.';
                break;

            default:
                alert('Ошибка: неизвестный ID');
        }
    }

    else if (questionNumber == 5) {
        switch (selectedId) {
            case 'q5_1':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'Осторожно';
                answerTextEl.textContent = "Рискованный выбор. Письмо может быть фишинговым, а ссылка — вести на поддельную страницу для кражи пароля. Не переходите по ссылке из подозрительного сообщения."
                break;

            case 'q5_2':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'Может быть опасно';
                answerTextEl.textContent = 'Неплохая проверка, но её недостаточно. Адрес отправителя может быть подделан или очень похож на настоящий. Безопаснее самостоятельно открыть официальный сайт или приложение.';
                break;

            case 'q5_3':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'БРАВО';
                answerTextEl.textContent = 'Отличное решение. Вы не используете ссылку из письма и проверяете информацию через официальный канал. Если обнаружите незнакомый вход, завершите подозрительные сеансы и защитите аккаунт.';
                break;

            case 'q5_4':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'Есть риски';
                answerTextEl.textContent = 'Вы не попались на возможный фишинг, но само предупреждение всё же стоит проверить. Самостоятельно откройте официальный сайт или приложение и убедитесь, что с аккаунтом всё в порядке.';
                break;

            default:
                alert('Ошибка: неизвестный ID');
        }
    }

    else if (questionNumber == 7) {
        switch (selectedId) {
            case 'q7_1':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'Осторожно';
                answerTextEl.textContent = "Рискованное решение. Вам может писать мошенник, выдающий себя за знакомого. Перед переводом денег свяжитесь со знакомым привычным способом и убедитесь, что просьба действительно от него."
                break;

            case 'q7_2':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'Может быть опасно';
                answerTextEl.textContent = 'Неплохая проверка, но не самая надёжная: ответ можно угадать, узнать заранее или найти в открытых источниках. Безопаснее связаться со знакомым другим привычным способом.';
                break;

            case 'q7_3':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'БРАВО';
                answerTextEl.textContent = 'Отличное решение. Проверка через другой, уже известный вам канал поможет убедиться, что сообщение действительно отправил ваш знакомый.';
                break;

            case 'q7_4':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'Есть риски';
                answerTextEl.textContent = 'Рискованное решение. Имя и фотографию легко найти в открытых источниках или получить из взломанного аккаунта. Перед переводом свяжитесь со знакомым другим привычным способом.';
                break;

            default:
                alert('Ошибка: неизвестный ID');
        }
    }

    else if (questionNumber == 8) {
        switch (selectedId) {
            case 'q8_1':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'БРАВО';
                answerTextEl.textContent = "Отличное решение. Устанавливайте приложения из доверенных источников и не отключайте защитные ограничения ради неизвестного файла"
                break;

            case 'q8_2':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'Может быть опасно';
                answerTextEl.textContent = 'Рискованный выбор. Даже друг может не знать, что файл вредоносный, а его аккаунт могли взломать. Не устанавливайте приложения из непроверенных источников';
                break;

            case 'q8_3':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'Осторожно';
                answerTextEl.textContent = 'Полезная проверка, но она не подтверждает безопасность файла. Друг тоже мог скачать вредоносное приложение и пока не заметить последствий. Лучше проверить официальный источник';
                break;

            case 'q8_4':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'Есть риски';
                answerTextEl.textContent = 'Неплохая проверка, но внешний вид сайта и адрес ссылки не гарантируют безопасность файла. Надёжнее найти приложение самостоятельно через официальный источник';
                break;

            default:
                alert('Ошибка: неизвестный ID');
        }
    }

    else if (questionNumber == 9) {
        switch (selectedId) {
            case 'q9_1':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'Осторожно';
                answerTextEl.textContent = "Рискованный выбор. После отмены поездки сервис может перестать видеть её маршрут и детали, а оплата пройдёт вне приложения. Лучше не выводить поездку за пределы сервиса"
                break;

            case 'q9_2':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'Может быть опасно';
                answerTextEl.textContent = 'Уточнить причину — неплохая идея, но убедительное объяснение не гарантирует безопасность поездки. После отмены заказа сервис может перестать отслеживать его выполнение. Лучше не отменять поездку по просьбе водителя.';
                break;

            case 'q9_3':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'БРАВО';
                answerTextEl.textContent = 'Отличное решение. Сохранение заказа в приложении оставляет информацию о поездке и позволяет использовать предусмотренные сервисом функции безопасности и поддержки';
                break;

            case 'q9_4':
                answerEl.classList.add('is-active');
                answerTitleEl.textContent = 'Есть риски';
                answerTextEl.textContent = 'Полезная мера предосторожности, но она не заменяет функции самого сервиса. Лучше не отменять оформленную через приложение поездку по просьбе водителя';
                break;

            default:
                alert('Ошибка: неизвестный ID');
        }
    }

    if (answerEl.classList.contains('is-active')) {
        updateAnswerFeedback(score, answerTitleEl.textContent);
        this.disabled = true;
    }
}));

// Интерактивный диалог в 6 вопросе
if (questionSixDialogBtn) {
    const questionSixAnswers = questionSixEl.querySelectorAll('.question__answer');
    const questionSixItems = {
        userOne: questionSixEl.querySelector('#u1 .question__text-people'),
        scammerOne: questionSixEl.querySelector('#otv-1 .question__text-security'),
        scammerTwo: questionSixEl.querySelector('#r2 .question__text-security'),
        userTwo: questionSixEl.querySelector('#u2 .question__text-people'),
        scammerThree: questionSixEl.querySelector('#otv-2 .question__text-security'),
        scammerFour: questionSixEl.querySelector('#r3 .question__text-security'),
        userThree: questionSixEl.querySelector('#u3 .question__text-people')
    };

    const roundOne = [
        {
            text: 'Нет! Что мне делать? Помогите скорее!',
            score: 0,
            response: 'Не волнуйтесь, мы успеем отменить операцию. Для этого нужно быстро подтвердить данные владельца.',
            next: 'Для подтверждения личности напишите последние четыре цифры карты и код, который сейчас придёт вам в SMS.'
        },
        {
            text: 'А какой именно банк вы представляете?',
            score: 1,
            response: 'Банк «ХХХ». Обращение зарегистрировано автоматически. Для отмены перевода нужно подтвердить, что аккаунт принадлежит вам',
            next: 'Для авторизации в системе отмены Банка «ХХХ» укажите последние 4 цифры карты и код авторизации из SMS.'
        },
        {
            text: 'Если вы сотрудник банка, зачем пишете мне в мессенджере?',
            score: 2,
            response: 'Мы используем этот канал для срочного оповещения клиентов. Звонок сейчас может занять слишком много времени, а операция будет проведена через несколько минут.',
            next: 'Мы обязаны использовать мессенджер из-за перегрузки линий. Введите 4 цифры карты и код SMS для фиксации инцидента.'
        }
    ];

    const roundTwo = [
        {
            text: 'Хорошо, сейчас пришлю.',
            score: 0,
            response: 'Отлично, код получен. Проверяю систему.'
        },
        {
            text: 'Последние четыре цифры могу назвать, но код из SMS сообщать не буду.',
            score: 1,
            response: 'Понимаем ваши опасения. Код нужен не нам — система должна убедиться, что телефон находится у владельца. Без подтверждения мы не сможем остановить перевод'
        },
        {
            text: 'А разве у банка уже нет данных моей карты? Почему я должен сообщать их вам?',
            score: 2,
            responses: [
                'В целях безопасности видна только часть номера карты. Нам нужно сверить последние цифры для отмены операции',
                'Я понимаю ваши опасения. Код нужен не мне — система должна убедиться, что телефон находится у владельца. Без подтверждения мы не сможем остановить перевод.',
                'Я понимаю ваши опасения. Код нужен не мне — система должна убедиться, что телефон находится у владельца. Без подтверждения мы не сможем остановить перевод.'
            ]
        }
    ];

    const roundThree = [
        {
            text: 'Отправить код',
            score: 0,
            result: 'Критический проигрыш. Коды подтверждения нельзя сообщать другим людям — даже тем, кто представляется сотрудником банка.'
        },
        {
            text: 'Отказать в передаче кода и продолжить выяснять детали в чате',
            score: 1,
            result: 'Частичный успех. Вы правильно сделали, что не сообщили код. Завершите разговор и самостоятельно свяжитесь с банком через официальный канал.'
        },
        {
            text: 'Прекратить переписку и самостоятельно связаться с банком через официальные контакты',
            score: 2,
            result: 'Полная победа. Не сообщайте коды и другие секретные данные. Самостоятельно свяжитесь с банком через официальное приложение, сайт или номер телефона.'
        }
    ];

    let dialogStep = 1;
    let dialogScore = 0;
    let dialogBranch = 0;
    let dialogAnswers = [];

    function showDialogItem(item) {
        item.closest('.question__dialog-item').classList.add('is-active');
    }

    // On iOS, explicitly select dynamically reused radio inputs when their labels are tapped.
    questionSixAnswers.forEach(function (label) {
        label.addEventListener('click', function () {
            label.querySelector('input').checked = true;
        });
    });

    function setAnswerOptions(options) {
        questionSixAnswers.forEach(function (label, index) {
            const input = label.querySelector('input');
            input.checked = false;
            input.value = options[index].text;
            input.setAttribute('score', options[index].score);
            // Keep the radio input; replace either old plain text or newer span markup.
            while (input.nextSibling) {
                label.removeChild(input.nextSibling);
            }
            label.appendChild(document.createTextNode(options[index].text));
        });
    }

    resetQuestionSix = function () {
        dialogStep = 1;
        dialogScore = 0;
        dialogBranch = 0;
        dialogAnswers = [];
        questionSixEl.querySelectorAll('.question__dialog-item').forEach(function (item) {
            item.classList.remove('is-active');
        });
        questionSixEl.querySelector('#r1').classList.add('is-active');
        questionSixItems.userOne.textContent = '';
        questionSixItems.scammerOne.textContent = '';
        questionSixItems.scammerTwo.textContent = '';
        questionSixItems.userTwo.textContent = '';
        questionSixItems.scammerThree.textContent = '';
        questionSixItems.scammerFour.textContent = '';
        questionSixItems.userThree.textContent = '';
        setAnswerOptions(roundOne);
        questionSixDialogBtn.disabled = false;
    };
    questionSixDialogBtn.addEventListener('click', function () {
        const selectedRadio = questionSixEl.querySelector('input[name="q6"]:checked');

        if (!selectedRadio) {
            alert('Пожалуйста, выберите вариант ответа!');
            return;
        }

        const selectedIndex = Number(selectedRadio.id.replace('q6_', '')) - 1;
        const selectedOption = dialogStep === 1
            ? roundOne[selectedIndex]
            : dialogStep === 2
                ? roundTwo[selectedIndex]
                : roundThree[selectedIndex];

        const selectedScore = Number(selectedRadio.getAttribute('score')) || 0;
        dialogScore += selectedScore;
        dialogAnswers.push({ step: dialogStep, id: selectedRadio.id, value: selectedOption.text, score: selectedScore });

        if (dialogStep === 1) {
            dialogBranch = selectedIndex;
            questionSixItems.userOne.textContent = selectedOption.text;
            questionSixItems.scammerOne.textContent = selectedOption.response;
            questionSixItems.scammerTwo.textContent = selectedOption.next;
            showDialogItem(questionSixItems.userOne);
            showDialogItem(questionSixItems.scammerOne);
            showDialogItem(questionSixItems.scammerTwo);
            setAnswerOptions(roundTwo);
            dialogStep = 2;
        } else if (dialogStep === 2) {
            questionSixItems.userTwo.textContent = selectedOption.text;
            questionSixItems.scammerThree.textContent = selectedOption.response || selectedOption.responses[dialogBranch];
            showDialogItem(questionSixItems.userTwo);
            showDialogItem(questionSixItems.scammerThree);

            // Только согласие отправить данные вызывает дополнительный
            // запрос мошенника о коде. Защитные варианты такого запроса не имеют.
            if (selectedIndex === 0) {
                questionSixItems.scammerFour.textContent = 'Код уже пришёл? Продиктуйте его, пожалуйста, у нас осталось меньше минуты.';
                showDialogItem(questionSixItems.scammerFour);
            }
            setAnswerOptions(roundThree);
            dialogStep = 3;
        } else {
            // В третьем раунде выбранное действие сразу завершает игру.
            answerTitleEl.textContent = 'Итог диалога';
            addQuestionScore(questionSixEl, dialogScore, { rounds: dialogAnswers.slice() });
            answerTextEl.textContent = selectedOption.result + ' Ваш результат: ' + dialogScore + '/6 баллов.';
            updateAnswerFeedback(dialogScore, answerTitleEl.textContent);
            answerEl.classList.add('is-active');
            questionSixDialogBtn.disabled = true;
            // После финала интерактива снова показываем общую кнопку «Продолжить».
            answerBtn.style.display = 'flex';
        }
    });
}


















