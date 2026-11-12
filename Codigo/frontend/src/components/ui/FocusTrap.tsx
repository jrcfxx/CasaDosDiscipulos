import type { ComponentType, ReactNode } from "react";
import type { Options } from "focus-trap";
import { FocusTrap as FocusTrapOriginal } from "focus-trap-react";

/**
 * focus-trap-react tipado para React 18.
 * Os tipos publicados pela biblioteca não batem com @types/react 18; em vez de
 * `as any` em cada modal, a conversão fica concentrada aqui com as props usadas.
 */
export interface FocusTrapProps {
  active?: boolean;
  paused?: boolean;
  focusTrapOptions?: Options;
  children: ReactNode;
}

const FocusTrap = FocusTrapOriginal as unknown as ComponentType<FocusTrapProps>;

export default FocusTrap;
