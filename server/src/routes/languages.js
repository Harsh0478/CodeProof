import { Router } from 'express'; import { languages,pairs } from '../controllers/languagesController.js'; const r=Router(); r.get('/',languages); r.get('/pairs',pairs); export default r;
