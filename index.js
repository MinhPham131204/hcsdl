const express = require('express')
const handlebars = require('express-handlebars');
const methodOverride = require('method-override')

const app = express()
const route = require('./routing')

const port = 3001

app.use(methodOverride('_method'))

app.use(
  express.urlencoded({
      extended: true,
  }),
);
app.use(express.json());

app.engine('.hbs', handlebars.engine({
  extname: '.hbs',
  helpers: {
    sum: (a, b) => a + b,
  },
}));
app.set('view engine', '.hbs');
app.set('views', './views')

// app.get('/', (req, res) => {
//   res.render('./product/create')
// })

route(app)

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});