class JottoGame {
  constructor() {
    this.playerOneWord = null
    this.playerTwoWord = null
    this.playerOneHistory = []
    this.playerTwoHistory = []
    this.playerOneTurn = true
    this.gameFinished = false
  }

  status() {
    if (this.playerOneWord === null || this.playerTwoWord === null) {
      return 'setup'
    } else if (!this.gameFinished) {
      return this.playerOneTurn ? 1 : 2
    } else {
      return 'finished'
    }
  }

  setWord(word, player) {
    if (player === 1) {
      this.playerOneWord = word
    } else {
      this.playerTwoWord = word
    }
  }

  playerOneGuessWord(word) {
    if (word === this.playerTwoWord) {
      this.gameFinished = true
    }
    let count = 0
    for (const char of word) {
      if (this.playerTwoWord.includes(char)) {
        ++count
      }
    }
    this.playerOneHistory.push({ guess: word, count })
    this.playerOneTurn = false
  }

  playerTwoGuessWord(word) {
    if (word === this.playerOneWord) {
      this.gameFinished = true
    }
    let count = 0
    for (const char of word) {
      if (this.playerOneWord.includes(char)) {
        ++count
      }
    }
    this.playerTwoHistory.push({ guess: word, count })
    this.playerOneTurn = true
  }
}

module.exports.JottoGame = JottoGame
