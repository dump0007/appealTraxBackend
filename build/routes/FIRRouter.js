"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const components_1 = require("../components");
const router = (0, express_1.Router)();
router.get('/', components_1.FIRComponent.findAll);
router.get('/search', components_1.FIRComponent.search);
router.get('/dash', components_1.FIRComponent.dashboard);
router.get('/graph', components_1.FIRComponent.cityGraph);
router.post('/', components_1.FIRComponent.create);
router.get('/:id', components_1.FIRComponent.findOne);
router.delete('/:id', components_1.FIRComponent.remove);
exports.default = router;
//# sourceMappingURL=FIRRouter.js.map