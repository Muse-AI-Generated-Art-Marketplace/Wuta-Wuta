import { Request, Response, NextFunction } from 'express';
import i18next from '../i18n';

export const i18nMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const lang = req.headers['accept-language']?.split(',')[0] || 'en';
  i18next.changeLanguage(lang);
  next();
};
Add i18n middleware
