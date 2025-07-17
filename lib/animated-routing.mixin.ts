import {
  type Constructor,
  type RoutingMixinInterface,
} from "./routing.mixin.js";
import animatedRouteMixin from "./animated-routing-mixin.js";

function animatedRoutingMixin<T extends Constructor<HTMLElement>>(
  Superclass: T,
  className: string,
) {
  return animatedRouteMixin(
    Superclass,
    className,
  ) as unknown as Constructor<RoutingMixinInterface> & T;
}

export default animatedRoutingMixin;
