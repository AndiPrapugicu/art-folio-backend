const { createServer } = require('@vercel/node');
const { createNestApplication } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');

module.exports = async (req, res) => {
  const app = await createNestApplication(AppModule);
  await app.init();
  const server = createServer(app.getHttpAdapter().getInstance());
  server(req, res);
};
