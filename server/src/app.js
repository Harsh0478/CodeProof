import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { clerkMiddleware } from '@clerk/express';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/error.js';
import auth from './routes/auth.js';
import languages from './routes/languages.js';
import dashboard from './routes/dashboard.js';
import translations from './routes/translations.js';
import verification from './routes/verification.js';
import testCases from './routes/testCases.js';
import samples from './routes/samples.js';

const app=express();
app.set('trust proxy',1);
app.use(helmet({crossOriginResourcePolicy:false}));
app.use(cors({origin:env.frontendUrl,credentials:true}));
app.use(express.json({limit:'100kb'}));
app.use(express.urlencoded({extended:false,limit:'50kb'}));
app.use(pinoHttp({logger}));
app.use(clerkMiddleware());
app.use('/api/auth',auth);
app.use('/api/translations',rateLimit({windowMs:60*1000,max:20,standardHeaders:true,legacyHeaders:false}),translations);
app.use('/api/verification',rateLimit({windowMs:60*1000,max:40,standardHeaders:true,legacyHeaders:false}),verification);
app.use('/api/languages',languages);
app.use('/api/dashboard',dashboard);
app.use('/api/test-cases',testCases);
app.use('/api/samples',samples);
app.get('/api/health',(req,res)=>res.json({success:true,status:'ok',time:new Date().toISOString(),services:{groq:Boolean(env.groqKey),gemini:Boolean(env.geminiKey),execution:env.executionMode,judge0:env.executionMode==='judge0' ? Boolean(env.judge0Url) : undefined}}));
app.use((req,res)=>res.status(404).json({success:false,error:{code:'NOT_FOUND',message:'Route not found.'}}));
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(()=>app.listen(env.port,()=>logger.info({port:env.port},'CodeProof API started'))).catch(err=>{logger.error(err,'MongoDB connection failed');process.exit(1);});
}
export default app;
