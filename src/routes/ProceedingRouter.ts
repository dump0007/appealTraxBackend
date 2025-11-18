import { Router } from 'express';
import { ProceedingComponent } from '../components';

const router: Router = Router();

router.get('/', ProceedingComponent.findAll);
router.get('/fir/:firId', ProceedingComponent.findByFIR);
router.post('/', ProceedingComponent.create);
router.get('/:id', ProceedingComponent.findOne);
router.delete('/:id', ProceedingComponent.remove);

export default router;


