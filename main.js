const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished"
}

const Symbols = [
  'https://image.flaticon.com/icons/svg/105/105223.svg', // 黑桃
  'https://image.flaticon.com/icons/svg/105/105220.svg', // 愛心
  'https://image.flaticon.com/icons/svg/105/105212.svg', // 方塊
  'https://image.flaticon.com/icons/svg/105/105219.svg' // 梅花
]

const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    console.log(number) // Array (52)
    return number
  }
}

const view = {
  // 用index產生相對應卡片背面
  getCardElement(index) {   // 傳入0-51 (52張牌)
    // back表示背面
    // console.log('creating card', index)
    return `<div class="card back" data-index="${index}">
    </div>`
  },

  // 用index產生相對應卡片內容，原本與getCardElement合併，但為了區分正背面，把函式是拆開
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)  // 卡片的數字
    const symbol = Symbols[Math.floor(index / 13)]
    return `<p>${number}</p>
      <img src="${symbol}">
      <p>${number}</p>`
  },

  // 1,11,12,13 -> A,J,Q,K
  transformNumber(number) {
    switch (number) {
      case 1:
        return "A"
      case 11:
        return "J"
      case 12:
        return "Q"
      case 13:
        return "K"
      default:
        return number
    }
  },

  displayCards(indexes) { // indexes為0-51random array
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join("")
    console.log(document.querySelectorAll('.card')) //NodeList(52) [div.card.back, div.card.back,...]
  },

  flipCards(...cards) {  //card為node list.forEach元素
    // 加上...表示可傳入多個參數，card以list形式傳入

    cards.map(card => {
      //一、如果原本是背面
      //回傳正面: 顯示內容(需index)、移除class="back"
      // console.log(card.classList) //DOMTokenList(2) ["card", "back", value: "card back"]
      if (card.classList.contains('back')) {
        console.log('back')
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return  //return一定要加上 否則繼續往後走，回到背面炯炯
      }

      //二、如果原本是正面
      //回傳背面
      card.classList.add('back')
      card.innerHTML = null;
    })
  },

  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  },

  renderScore(score) {
    document.querySelector('.score').innerHTML = `Score: ${score}`
  },

  renderTriedTimes(times) {
    document.querySelector('.tried').innerHTML = `You've tried: ${times} times`
  },

  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      //此CSS3動畫 只有在加上.wrong的時後才會有動畫，之後再按卡牌都不會有動畫，因此動畫結束之後要拿掉.wrong
      card.addEventListener('animation', event => {
        card.classList.remove('wrong'), { once: true }
        // 教案為 event.target.classList.remove(....) 
      })
    })
  },

  //結束遊戲時的恭喜畫面
  showGameFinished() {
    const congratulation = document.createElement('div')
    congratulation.classList.add('completed')
    congratulation.innerHTML = `
    <i class="fa fa-thumbs-o-up faa-bounce animated faa-fast" style="font-size: 6em"></i>

    <div>
      <p>Complete!</p>
      <p>Score: ${model.score} </p>
      <p>You've tried: ${model.triedTimes} times</p>
    </div>`
    const header = document.querySelector('#header')
    header.before(congratulation)
  }
}



const model = {
  revealedCards: [],

  // 比較兩張牌的數字是否一樣
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },

  score: 0,
  triedTimes: 0,
}

const controller = {
  currentState: GAME_STATE.FirstCardAwaits,
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },
  //依照不同遊戲狀態，做出不同行為
  dispatchCardAction(card) {
    // 如果是正面，不做任何動作
    if (!card.classList.contains('back')) {
      return
    }
    // 剩下動作用currentState來區分
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        model.revealedCards.push(card)
        break
      case GAME_STATE.SecondCardAwaits:
        // model.triedTimes
        view.renderTriedTimes(++model.triedTimes)
        view.flipCards(card)
        model.revealedCards.push(card)  //card為node
        // 判斷配對是否成功
        console.log(model.isRevealedCardsMatched()) // 先確認功能正常
        if (model.isRevealedCardsMatched()) {
          //配對正確
          view.renderScore((model.score += 10))
          this.currentState = GAME_STATE.CardsMatched
          // view.pairCard(card) 兩張都要.pair
          // 優化前 view.pairCard(model.revealedCards[0])
          // view.pairCard(model.revealedCards[1])
          // 優化後：
          view.pairCards(...model.revealedCards)
          model.revealedCards = []

          // 若得分達260時結束遊戲
          if (model.score === 260) {
            console.log('endGame')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            return
          }

          this.currentState = GAME_STATE.FirstCardAwaits //回到起始狀態

        } else {
          //配對失敗 把牌蓋回去
          this.currentState = GAME_STATE.CardsMatchFailed
          setTimeout(this.resetCards, 1000)
          // resetCards不用加()，因為在setTimeout要傳入的是function而不是回傳值
          view.appendWrongAnimation(...model.revealedCards)
        }
        break
    }

    console.log('this.currentState', this.currentState)
    console.log('revealedCards', model.revealedCards.map((card) => card.dataset.index))
  },

  // 從setTimeout獨立出來
  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    // this.currentState = GAME_STATE.FirstCardAwaits. resetCards 在傳入setTimeout時，this.currentState 的this 會變成指向setTimeout
    controller.currentState = GAME_STATE.FirstCardAwaits
  },

}


// view.displayCards() 改用controller統一呼叫
controller.generateCards()


// card + 監聽器: 點擊後翻面
// node List - 不能用.map
console.log(document.querySelectorAll('.card')) // Node list, length: 1?!!! 可能是還沒執行controller.generateCards()

document.querySelectorAll('.card').forEach(function (card) {
  card.addEventListener('click', function (event) {
    console.log('clicked')
    console.log(card) //OK <div class="card"...> node
    // view.flipCard(card) 改成下列以controller控制
    controller.dispatchCardAction(card)
  })
});
// document.querySelector('#cards').addEventListener('click', event => {
//   console.log('clicked') //  OK
// });