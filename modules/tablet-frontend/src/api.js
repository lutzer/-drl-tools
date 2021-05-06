import config from './config'

const fetchAnswers = async function () {
  return fetch(config.apiAddress)
}

export { fetchAnswers }
