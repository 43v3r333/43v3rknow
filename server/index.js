import express from 'express';
import cors from 'cors';
import analyseRouter from './routes/analyse.js';
import githubRouter from './routes/github.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/analyse', analyseRouter);
app.use('/api/github', githubRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});