
const check_button = document.querySelector('.check-button')
const go_button = document.querySelector('.go-button')

const ul = document.querySelector('.mismatch-list')
const message = document.querySelector('.message')


const regExpArr = [
  {
    regExp: /^.{8,12}$/,
    checkPoint: 'Длина пароля должна быть от 8 до 12 символов'
  },
  {
    regExp: /[0-9]+/,
    checkPoint: 'Пароль должен содержать хотя бы одну цифру'
  },
  {
    regExp: /[a-z]+/,
    checkPoint: 'Пароль должен содержать хотя бы одну букву латинского алфавита в нижнем регистре'
  },
  {
    regExp: /[A-Z]+/,
    checkPoint: 'Пароль должен содержать хотя бы одну букву латинского алфавита в верхнем регистре'
  },
  {
    regExp: /^(?!.*КриптоБабуля).*$/i,
    checkPoint: 'Пароль не должен содержать в себе логин'
  },
  {
    regExp: /^(?!.*login|password|username|qwerty|azerty).*$/i,
    checkPoint: 'Пароль не должен быть предсказуем'
  },
  {
    regExp: /^(?=.*[()^?=!.*$&_-]).*$/i,
    checkPoint: 'Пароль должен содержать хотя бы один спецсимвол из набора: "()^?=!.*$&_-"'
  },
  {
    regExp: /^[^\s]+$/,
    checkPoint: 'Пароль не должен содержать в себе пробел(ы)'
  }
]


function checkPassHandler() {
  const input = document.querySelector('input')
  const inputValue = input.value

  const mismatchArr = []
  ul.innerHTML = ''
  message.innerHTML = ''
  go_button.disabled = true

  for (i=0; i < regExpArr.length; i++) {
    if (!regExpArr[i].regExp.test(inputValue)) {
      mismatchArr.push(regExpArr[i].checkPoint)
    }
  }

  if (mismatchArr.length != 0) {
    mismatchArr.forEach(item => {
      const li = document.createElement('li')
      li.textContent = item
      ul.append(li)

      message.textContent = 'Необходимо соблюсти рекомендации выше, чтобы идти дальше'
    })
  } else {
    message.textContent = 'Вы справились! Можем идти дальше'
    go_button.disabled = false
  }

}

check_button.addEventListener('click', checkPassHandler)

