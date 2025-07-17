import BasicRoutingInterface from "./routing-interface.js";
import routingMixin from "./routing-mixin.js";
const RoutingMixin = (superclass) => {
  return routingMixin(superclass);
};
//exporting BasicRoutingInterface for backward compatibility - don't break consumer imports
export { RoutingMixin, BasicRoutingInterface };
