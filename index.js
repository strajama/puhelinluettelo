require('dotenv').config()
const express = require('express')
const app = express()
const Person = require('./models/person')

app.use(express.json())

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}

app.use(requestLogger)

var morgan = require('morgan')
// morgan('tiny')
morgan.token('body', function (req, res) { return JSON.stringify(req.body) })
// app.use(morgan('tiny'))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))
const cors = require('cors')

app.use(cors())

app.use(express.static('dist'))

  app.get('/api/persons', (request, response) => {
    Person.find({}).then(persons => {
      response.json(persons)
    })
  })

  app.get('/info', (request, response) => {   
    response.send(`<p>Phonebook has info for ${persons.length} people</p>
    <p>${new Date()}</p>`)
  } )

  app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
  })

  app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id).then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
  })

  const updatePerson = (request, response, next) => {
    const body = request.body
  
    const person = {
      name: body.name,
      number: body.number,
    }
    Person.findByIdAndUpdate(request.params.id, person, { new: true, runValidators: true, context: 'query'  })
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
  }

  app.post('/api/persons', (request, response, next) => {
    const body = request.body
    // if (!body.name) {
    //   return response.status(400).json({ 
    //     error: 'name missing' 
    //   })
    // }
    // if (!body.number) {
    //   return response.status(400).json({ 
    //     error: 'number missing' 
    //   })
    // }
    Person.findOne({ name: body.name }).then(existingPerson => {
      if (existingPerson) {
        updatePerson(request, response, next)
      } else {
        const person = new Person({
          name: body.name,
          number: body.number,
        })
  
        person.save().then(savedPerson => { 
          response.json(savedPerson)
        })
        .catch(error => next(error))
      }

    }) 
  })

  app.put('/api/persons/:id', (request, response, next) => {
updatePerson(request, response, next)
  }  )

  const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
  }
  
  app.use(unknownEndpoint)

  const errorHandler = (error, request, response, next) => {
    console.error(error.message)
  
    if (error.name === 'CastError') {
      return response.status(400).send({ error: 'malformatted id' })
    }  else if (error.name === 'ValidationError') {
      return response.status(400).json({ error: error.message })
    }
    next(error)
  }
  
  // tämä tulee kaikkien muiden middlewarejen ja routejen rekisteröinnin jälkeen!
  app.use(errorHandler)

  const PORT = process.env.PORT
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })