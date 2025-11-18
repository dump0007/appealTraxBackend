"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const components_1 = require("../components");
const router = (0, express_1.Router)();
router.get('/', components_1.WritComponent.findAll);
router.post('/', components_1.WritComponent.create);
router.get('/:id', components_1.WritComponent.findOne);
router.delete('/:id', components_1.WritComponent.remove);
exports.default = router;
//# sourceMappingURL=WritRouter.js.map