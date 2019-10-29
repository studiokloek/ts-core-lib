import { Screen as ScreenClass } from './screen';
import { ConcreteStage as StageClass } from './stage';
export interface StageInfo {
    position: {
        x: number;
        y: number;
    };
    scale: {
        x: number;
        y: number;
    };
    size: {
        width: number;
        height: number;
    };
}
export declare const Screen: ScreenClass;
export declare const Stage: StageClass;
export * from './constants';
export * from './resolution';
