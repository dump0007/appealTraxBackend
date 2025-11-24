"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const components_1 = require("../components");
const router = (0, express_1.Router)();
router.get('/', components_1.ProceedingComponent.findAll);
router.get('/fir/:firId', components_1.ProceedingComponent.findByFIR);
router.get('/fir/:firId/draft', components_1.ProceedingComponent.findDraftByFIR);
router.post('/', components_1.ProceedingComponent.create);
router.get('/:id', components_1.ProceedingComponent.findOne);
router.delete('/:id', components_1.ProceedingComponent.remove);
exports.default = router;
//# sourceMappingURL=ProceedingRouter.js.map