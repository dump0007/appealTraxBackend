"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const components_1 = require("../components");
const router = (0, express_1.Router)();
router.get('/', components_1.PartyComponent.findAll);
router.post('/', components_1.PartyComponent.create);
router.get('/:id', components_1.PartyComponent.findOne);
router.delete('/:id', components_1.PartyComponent.remove);
exports.default = router;
//# sourceMappingURL=PartyRouter.js.map