const logger = require('debug')('Importer')
const axios = require('axios')
const mysql = require('mysql2/promise')
require('dotenv').config()

// we are going to fetch data and insert into mysql to use with cubejs analytics
// TODO: validate enviroments variable

const insertQuery = `
insert into opportunities(
  internal_id,
  objective,
  type,
  organizations,
  locations,
  remote,
  deadline,
  created,
  status,
  compensation,
  skills
) VALUES ?;
`

async function insertDataIntoMySQL () {
  return mysql.createConnection(process.env.MYSQL_URL)
}

async function processData (connection) {
  let nextUrl = `${process.env.TORRE_URL}?size=${process.env.TORRE_URL_SIZE}`
  while (nextUrl) {
    try {
      logger(nextUrl)
      const response = await axios.post(nextUrl, {}, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response || !response.data) {
        // Nothing to do
        logger('No data found')
        nextUrl = null
        continue
      }

      const infoData = response.data
      // we are going going to build next page url from offset, total
      logger(infoData.results.length)

      // we need to process the data and insert into mysql
      const nData = infoData.results.map(r => {
        return [
          r.id,
          r.objective,
          r.type,
          JSON.stringify(r.organizations),
          JSON.stringify(r.locations),
          r.remote,
          new Date(r.deadline),
          new Date(r.created),
          r.status,
          JSON.stringify(r.compensation),
          JSON.stringify(r.skills)
        ]
      })
      await connection.query(insertQuery, [nData])

      if (infoData.offset >= infoData.total) {
        nextUrl = null
      } else {
        const offset = (infoData.offset || 0) + parseInt(process.env.TORRE_URL_SIZE)
        nextUrl = `${process.env.TORRE_URL}?size=${process.env.TORRE_URL_SIZE}&offset=${offset}`
      }
    } catch (error) {
      logger(`An error processing ingo ${nextUrl}: \r ${error}`)
      nextUrl = null
    }
  }
  logger('all data fetched')
  connection.end()
}

logger('Start Process importer')
insertDataIntoMySQL()
  .then(connection => processData(connection))
  .then(() => logger('All importedd'))
  .catch((e) => logger(`unexpected error ${e}`))
