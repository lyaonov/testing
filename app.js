import mongoose from 'mongoose'
import {createProxyMiddleware} from 'http-proxy-middleware';
import puppeteer from 'puppeteer';


export default function appSrc(express, bodyParser, createReadStream, crypto, http) {
  const app = express();

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS, DELETE');
    next();
  });

  app.get('/login/', (req, res) => {
    res.send('itmo371283');
  });

  app.get('/code/', (req, res) => {
    const filePath = import.meta.url.substring(7);
    createReadStream(filePath).pipe(res);
  });

  app.post('/insert/', (req, res) => {
    // Извлекаем значения из тела POST-запроса
    let { login, password, URL } = req.body;

    mongoose.connect(URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const userSchema = new mongoose.Schema({
      login: String,
      password: String,
    });

    const User = mongoose.model('User', userSchema);

    // Создаем нового пользователя на основе модели "User"
    const newUser = new User({
      login,
      password,
    });


    // Сохраняем пользователя в базе данных
    newUser.save((err) => {
      if (err) {
        res.status(500).send(`{Error: ${err.message}}`);
      } else {
        res.status(200).send('User created successfully');
      }
    });
  });

  // app.get('/test', async (req, res) => {
  //   const { URL } = req.query;

  //   if (!URL) {
  //     return res.status(400).send('Specify the "URL" query parameter');
  //   }

  //   try {
  //     const browser = await puppeteer.launch({ headless: "new" });
  //     const page = await browser.newPage();
  //     await page.goto(URL);
  //     await page.click('#bt');
  //     await page.waitForSelector('#inp');
  //     const result = await page.$eval('#inp', (input) => input.value);
  //     await browser.close();

  //     res.status(200).send(result);
  //   } catch (error) {
  //     console.error('Error:', error);
  //     res.status(500).send('An error occurred');
  //   }
  // });

  app.get('/sha1/:input/', (req, res) => {
    const input = req.params.input;
    const sha1Hash = crypto.createHash('sha1').update(input).digest('hex');
    res.send(sha1Hash);
  });

  app.all('/req/', (req, res) => {
    const addr = req.query.addr || req.body.addr;
    if (!addr) {
      return res.send('Specify the "addr" parameter');
    }

    http.get(addr, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        res.send(data);
      });
    }).on('error', (err) => {
      res.send('Error: ' + err.message);
    });
  });

  app.post('/render/', (req, res) => {
    const { random2, random3 } = req.body;
    const addr = req.query.addr;

    if (!addr) {
      return res.status(400).send('Specify the "addr" query parameter');
    }

    try {
      // Read and compile the Pug template
      const templatePath = fetch(addr); // Update with your actual template path
      const compiledFunction = pug.compileFile(templatePath);

      // Render the HTML using the template and data
      const html = compiledFunction({ random2, random3 });

      res.status(200).send(html);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('An error occurred');
    }
  });

  app.get('/test/', async (req, res) => {
    const { URL } = req.query;

    if (!URL) {
      return res.status(400).send('Specify the "URL" query parameter');
    }

    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(URL);
      await page.click('#bt'); // Клик по кнопке с идентификатором 'bt'
      await page.waitForSelector('#inp');
      const result = await page.$eval('#inp', (input) => input.value); // Получение значения из поля ввода
      await browser.close();

      res.status(200).send(result);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('An error occurred');
    }
  });


  app.all('*', (req, res) => {
    res.send(fetch('http://macroslt.beget.tech/wp-json/wp/v2/posts/1'));
  });

  return app;
}
