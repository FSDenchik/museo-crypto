
const dialogArr = [
  'Здравствуйте! Служба безопасности банка. Мы&nbsp;обнаружили подозрительную попытку перевода с&nbsp;вашей карты на&nbsp;14&nbsp;900&nbsp;₽. Вы&nbsp;совершали эту операцию?'
]

const dialog = document.querySelector('.dialog-list')

function dialogRender() {
  dialog.innerHTML = ''
  dialogArr.forEach(item => {
    const li = document.createElement('li')
    li.innerHTML = item
    dialog.append(li)
  })
}
dialogRender()

const questionsArr = [
  'Для подтверждения личности напишите последние четыре цифры карты и&nbsp;код, который сейчас придёт вам в&nbsp;SMS.'
]

function nextQuestion() {
  if (questionsArr.length != 0) {
    dialogArr.push(questionsArr.shift())
    dialogRender()
  }
}

const answersArr = [
  [
    'Нет! Что мне делать? Помогите скорее!',
    'А&nbsp;какой именно банк вы&nbsp;представляете?',
    'Если вы&nbsp;сотрудник банка, зачем пишете мне в&nbsp;мессенджере?'
  ],
  [
    'Хорошо, сейчас пришлю.',
    'Последние четыре цифры могу назвать, но&nbsp;код из&nbsp;SMS сообщать не&nbsp;буду.',
    'А&nbsp;разве у&nbsp;банка уже нет данных моей карты? Почему я&nbsp;должен сообщать их&nbsp;вам?'
  ]
]

const answers = document.querySelector('.answers-list')

function answersRender() {
  if (answersArr.length != 0) {
    let nextAnswers = answersArr.shift()
    answers.innerHTML = ''

    nextAnswers.forEach(item => {
      const button = document.createElement('button')
      button.innerHTML = item
      answers.append(button)
    })

    nextAnswers = []
  } else {
    console.log('GAME OVER')
  }
}
answersRender()

function chooseAnswerHandler(event) {

  const item = event.target.textContent
  dialogArr.push(item)
  dialogRender()
  answers.innerHTML = ''

  setTimeout(() => {
    nextQuestion()
  }, 1500)

  setTimeout(() => {
    answersRender()
  }, 2500)

}

answers.addEventListener('click', chooseAnswerHandler)

