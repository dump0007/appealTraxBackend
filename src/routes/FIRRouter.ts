import { Router } from 'express';
import { FIRComponent } from '../components';

const router: Router = Router();

router.get('/', FIRComponent.findAll);
router.get('/search', FIRComponent.search);
router.get('/dash', FIRComponent.dashboard);
router.get('/graph', FIRComponent.cityGraph);

router.post('/', FIRComponent.create);

router.get('/:id', FIRComponent.findOne);
router.put('/:id', FIRComponent.update);
router.delete('/:id', FIRComponent.remove);

export default router;


