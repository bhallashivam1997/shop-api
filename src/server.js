const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`shop-api listening on http://localhost:${PORT}`);
});
