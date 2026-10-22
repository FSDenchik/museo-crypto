(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.CryptoQuizResults = api;
    }
}(typeof window !== 'undefined' ? window : globalThis, function () {
    const QUESTION_MAX_SCORES = {
        1: 2,
        2: 2,
        3: 2,
        4: 2,
        5: 2,
        6: 6,
        7: 2,
        8: 2,
        9: 2
    };

    const RESULT_CATEGORIES = [
        { id: 'phishing', label: 'Фишинг', questions: [4, 5] },
        { id: 'banking', label: 'Банковские операции', questions: [6, 7] },
        { id: 'passwords', label: 'Пароли', questions: [3] },
        { id: 'applications', label: 'Приложения', questions: [2, 8, 9] },
        { id: 'wifi', label: 'Публичный Wi-Fi', questions: [1] }
    ];

    const DIAGNOSTIC_TOPICS = [
        {
            id: 'passwords',
            label: 'Пароли',
            questions: [3],
            strong: 'Вы хорошо защищаете свои аккаунты: умеете выбирать надёжные пароли и замечаете ситуации, в которых данные для входа могут оказаться под угрозой',
            attention: 'Уделите чуть больше внимания защите аккаунтов. Используйте длинные и уникальные пароли, а где возможно — дополнительную защиту входа'
        },
        {
            id: 'phishing',
            label: 'Фишинг',
            questions: [4, 5],
            strong: 'Вас непросто поймать на цифровую уловку: вы внимательно относитесь к подозрительным письмам, ссылкам и QR-кодам и умеете перепроверять информацию',
            attention: 'Не спешите доверять неожиданным сообщениям и ссылкам. Даже убедительное сообщение может оказаться подделкой — важную информацию лучше проверить через официальный источник'
        },
        {
            id: 'wifi',
            label: 'Wi-Fi',
            questions: [1],
            strong: 'Вы внимательно выбираете сети для подключения и понимаете, что знакомое название Wi-Fi ещё не гарантирует его безопасность',
            attention: 'Будьте внимательнее с незнакомыми Wi-Fi-сетями. Перед подключением лучше убедиться, что вы выбрали официальную сеть, которой действительно доверяете'
        },
        {
            id: 'privacy',
            label: 'Приватность',
            questions: [9],
            strong: 'Вы бережно относитесь к личной информации: замечаете лишние запросы данных и стараетесь делиться только тем, что действительно необходимо',
            attention: 'Подумайте, какие данные вы передаёте приложениям и сервисам. Чем меньше лишней информации вы раскрываете, тем проще сохранить контроль над своей приватностью'
        },
        {
            id: 'devices',
            label: 'Устройства',
            questions: [2, 8],
            strong: 'Вы внимательно относитесь к безопасности устройств: осторожны с неизвестными файлами и носителями и не отключаете защиту без необходимости',
            attention: 'Будьте осторожнее с неизвестными файлами, приложениями и устройствами. Даже любопытная находка или рекомендация знакомого может оказаться небезопасной'
        },
        {
            id: 'finance',
            label: 'Финансы',
            questions: [6, 7],
            strong: 'Вы сохраняете осторожность, когда речь идёт о деньгах: не спешите сообщать секретные данные и умеете перепроверять подозрительные обращения',
            attention: 'В вопросах денег спешка особенно опасна. Не сообщайте коды подтверждения и другие секретные данные, а подозрительные обращения перепроверяйте через официальный канал'
        }
    ];

    const RESULT_PROFILES = [
        {
            maxScore: 8,
            title: 'Нужна цифровая прокачка',
            description: 'Цифровой мир умеет преподносить сюрпризы! Некоторые угрозы пока непросто распознать, но это можно исправить. Обратите внимание на рекомендации из игры — они помогут укрепить защищенность ваших данных.'
        },
        {
            maxScore: 14,
            title: 'Осмотрительный пользователь',
            description: 'Вы уже замечаете многие цифровые риски, но некоторые уловки всё ещё могут застать врасплох. Немного больше внимания к подозрительным сообщениям, ссылкам и запросам данных — и ваша цифровая защита станет заметно крепче'
        },
        {
            maxScore: 18,
            title: 'Уверенный пользователь',
            description: 'Вы уверенно распознаете большинство цифровых угроз и обычно выбираете безопасный вариант. Отличная база! Но схемы злоумышленников постоянно меняются, поэтому важно следить за появлением новых сценариев атак.'
        },
        {
            maxScore: 22,
            title: 'Киберзнаток',
            description: 'Отличный результат! Вы внимательно относитесь к цифровым рискам, проверяете информацию и умеете замечать подозрительные ситуации. Вас будет непросто застать врасплох — так держать!'
        }
    ];

    function toScore(value) {
        const rawScore = value && typeof value === 'object' ? value.score : value;
        const score = Number(rawScore);
        return Number.isFinite(score) ? score : 0;
    }

    function percentage(score, maximum) {
        if (!Number.isFinite(maximum) || maximum <= 0) {
            return 0;
        }
        return Math.round((score / maximum) * 100);
    }

    function calculateGroup(group, questionScores) {
        const maximum = group.questions.reduce(function (sum, question) {
            return sum + (QUESTION_MAX_SCORES[question] || 0);
        }, 0);
        const score = group.questions.reduce(function (sum, question) {
            const questionMaximum = QUESTION_MAX_SCORES[question] || 0;
            return sum + Math.min(Math.max(toScore(questionScores[question]), 0), questionMaximum);
        }, 0);

        return Object.assign({}, group, {
            score: score,
            maximum: maximum,
            percent: percentage(score, maximum)
        });
    }

    function getResultProfile(totalScore) {
        return RESULT_PROFILES.find(function (profile) {
            return totalScore <= profile.maxScore;
        }) || RESULT_PROFILES[RESULT_PROFILES.length - 1];
    }

    function calculateResults(questionScores) {
        const scores = questionScores || {};
        const maximum = Object.values(QUESTION_MAX_SCORES).reduce(function (sum, value) {
            return sum + value;
        }, 0);
        const score = Object.keys(QUESTION_MAX_SCORES).reduce(function (sum, question) {
            const questionMaximum = QUESTION_MAX_SCORES[question];
            return sum + Math.min(Math.max(toScore(scores[question]), 0), questionMaximum);
        }, 0);
        const categories = RESULT_CATEGORIES.map(function (group) {
            return calculateGroup(group, scores);
        });
        const topics = DIAGNOSTIC_TOPICS.map(function (group) {
            return calculateGroup(group, scores);
        });
        const rankedTopics = topics.slice().sort(function (a, b) {
            return b.percent - a.percent;
        });
        let strongest = rankedTopics[0];
        let attention = rankedTopics.slice().sort(function (a, b) {
            return a.percent - b.percent;
        }).find(function (topic) {
            return topic.id !== strongest.id;
        });

        const allCategoriesMaxed = categories.every(function (category) {
            return category.score === category.maximum;
        });
        const allCategoriesEmpty = categories.every(function (category) {
            return category.score === 0;
        });
        const maxTopicPercent = Math.max.apply(null, topics.map(function (topic) {
            return topic.percent;
        }));
        const minTopicPercent = Math.min.apply(null, topics.map(function (topic) {
            return topic.percent;
        }));
        const maxTopicCount = topics.filter(function (topic) {
            return topic.percent === maxTopicPercent;
        }).length;
        const minTopicCount = topics.filter(function (topic) {
            return topic.percent === minTopicPercent;
        }).length;
        const hasMassTie = maxTopicCount > 1 && minTopicCount > 1;

        if (allCategoriesMaxed) {
            strongest = Object.assign({}, strongest, {
                strong: 'Отличный баланс!\nВ этом прохождении вы уверенно справились со всеми типами ситуаций: распознали цифровые уловки, защитили свои данные, устройства и аккаунты и внимательно отнеслись к финансовой безопасности. Продолжайте в том же духе — новые схемы и угрозы появляются постоянно'
            });
            attention = Object.assign({}, attention, {
                attention: 'Что дальше?\nПроверьте себя на новых примерах и узнайте больше о современных способах защиты на выставке «Ключ к доверию»'
            });
        } else if (allCategoriesEmpty) {
            strongest = Object.assign({}, strongest, {
                strong: 'Хороший старт\nВы уже познакомились с типичными цифровыми рисками и увидели, какие решения помогают их избежать. Используйте подсказки из игры как небольшую памятку на будущее'
            });
            attention = Object.assign({}, attention, {
                attention: 'Есть куда расти!\nЦифровые угрозы не всегда легко распознать с первого раза — многие из них специально устроены так, чтобы выглядеть убедительно. Теперь вы знаете несколько признаков, на которые стоит обращать внимание'
            });
        } else if (hasMassTie) {
            strongest = Object.assign({}, strongest, {
                strong: 'Серьёзных пробелов не обнаружено. В этом прохождении вы уверенно справились с большинством типов цифровых рисков'
            });
            attention = Object.assign({}, attention, {
                attention: 'Фундамент уже есть. Вы распознали часть безопасных решений, а рекомендации из игры помогут увереннее действовать в остальных ситуациях'
            });
        }

        return {
            score: score,
            maximum: maximum,
            percent: percentage(score, maximum),
            profile: getResultProfile(score),
            categories: categories,
            topics: topics,
            strongest: strongest,
            attention: attention
        };
    }

    return {
        QUESTION_MAX_SCORES: QUESTION_MAX_SCORES,
        calculateResults: calculateResults,
        percentage: percentage,
        getResultProfile: getResultProfile
    };
}));
