import { Router } from 'express';
import { ProceedingComponent } from '../components';

const router: Router = Router();

router.get('/', ProceedingComponent.findAll);
router.get('/fir/:firId', ProceedingComponent.findByFIR);
router.get('/fir/:firId/draft', ProceedingComponent.findDraftByFIR);
router.get('/motion-metrics', ProceedingComponent.motionMetrics);
router.get('/affidavit-metrics', ProceedingComponent.affidavitMetrics);
router.post('/', ProceedingComponent.create);
router.get('/:id', ProceedingComponent.findOne);
router.put('/:id', ProceedingComponent.update);
router.delete('/:id', ProceedingComponent.remove);

export default router;


