import pg from 'pg'

export function getDBClient(production) {
  return new pg.Client({
    user: 'postgres',
    host: production ? 'localhost' : '10.0.1.100',
    database: production ? 'fmning' : 'test',
    password: process.env.DATABASE_PASSWORD,
    port: 5432,
  })
}