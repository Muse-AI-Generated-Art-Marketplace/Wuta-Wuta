import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import i18next from './i18n';
import { i18nMiddleware } from './middleware/i18n.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// i18n Middleware (multi-language support)
app.use(i18nMiddleware);

// Test route with i18n
app.get('/', (req, res) => {
  res.json({ message: i18next.t('welcome') });
});

// Error handling middleware
app.use((req, res) => {
  res.status(404).json({ error: i18next.t('errors.not_found') });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
