/**
 * Compatibility exports for the current ComfyUI frontend type package.
 *
 * The upstream package exposes many LiteGraph symbols as module-local declarations.
 * rgthree still imports them from @comfyorg/frontend, so we provide a wide
 * compatibility surface here while the codebase is aligned with the newer API.
 */
declare module "@comfyorg/frontend" {
  export type CanvasMouseEvent = MouseEvent;
  export type CanvasPointerEvent = MouseEvent;
  export type CanvasPointerExtensions = Record<string, any>;
  export type ConnectByTypeOptions = any;
  export type ISlotType = any;
  export type LinkDirection = number;
  export type LinkId = number;
  export type LGraphEventMode = number;
  export type NodeId = number | string;
  export type NodeProperty = any;
  export type Point = [number, number] | number[];
  export type Positionable = Record<string, any>;
  export type SerialisedLLinkArray = [LinkId, NodeId, number, NodeId, number, ISlotType];
  export type Size = [number, number] | number[];
  export type Subgraph = any;
  export type SubgraphNode = any;
  export type TWidgetType = string;
  export type Vector2 = Point;
  export type WidgetTypeMap = Record<string, any>;
  export type InputSpec = any;

  export interface IContextMenuValue<T = any> {
    content?: string;
    value?: T;
    [key: string]: any;
  }
  export interface IContextMenuOptions<TValue = any, TExtra = any> {
    callback?: any;
    [key: string]: any;
  }
  export interface IWidgetOptions<TValues = unknown> {
    values?: TValues;
    [key: string]: any;
  }
  export interface IBaseWidget<TValue = any, TType extends string = string, TOptions extends IWidgetOptions = IWidgetOptions> {
    [key: string]: any;
  }
  export interface IWidget extends IBaseWidget {
    [key: string]: any;
  }
  export interface IButtonWidget extends IBaseWidget {
    [key: string]: any;
  }
  export interface IComboWidget extends IBaseWidget {
    [key: string]: any;
  }
  export interface ICustomWidget extends IBaseWidget {
    [key: string]: any;
  }
  export interface IStringWidget extends IBaseWidget {
    [key: string]: any;
  }
  export interface INodeSlot {
    [key: string]: any;
  }
  export interface INodeInputSlot extends INodeSlot {
    [key: string]: any;
  }
  export interface INodeOutputSlot extends INodeSlot {
    [key: string]: any;
  }
  export interface IFoundSlot {
    [key: string]: any;
  }
  export interface ISerialisedNode {
    [key: string]: any;
  }
  export interface ISerialisedGraph {
    [key: string]: any;
  }
  export class LLink {
    [key: string]: any;
    constructor(...args: any[]);
  }
  export class LGraphNode {
    static type: any;
    static title: any;
    static category: any;
    static nodeType: any;
    [key: string]: any;
    widgets: IWidget[];
    comfyClass: string;
    isVirtualNode: boolean;
    serialize_widgets: boolean;
    _collapsed_width: number;
    properties: Record<string, any>;
    constructor(...args: any[]);
    onConstructed(): boolean | void;
    onNodeCreated(...args: any[]): any;
    onAdded(graph: LGraph): void;
    onRemoved(): void;
    configure(info: any): void;
    onSerialize(serialised: any): void;
    onPropertyChanged(property: string, value: any, prevValue?: any): boolean | void;
    onConnectionsChange(type: number, slotIndex: number, isConnected: boolean, linkInfo: any, ioSlot: any): void;
    onConnectInput(...args: any[]): any;
    onConnectOutput(...args: any[]): any;
    onExecuted(...args: any[]): any;
    onExecute(...args: any[]): any;
    onDragOver(...args: any[]): any;
    onDragDrop(...args: any[]): any;
    onMouseDown(...args: any[]): any;
    onMouseMove(...args: any[]): any;
    onMouseUp(...args: any[]): any;
    onMouseEnter(...args: any[]): any;
    onMouseLeave(...args: any[]): any;
    onKeyDown(...args: any[]): any;
    onKeyUp(...args: any[]): any;
    onShowCustomPanelInfo(...args: any[]): any;
    onDblClick(...args: any[]): any;
    onDrawForeground(...args: any[]): any;
    onDrawBackground(...args: any[]): any;
    inResizeCorner(...args: any[]): any;
    draw(...args: any[]): any;
    connectByType(...args: any[]): any;
    connectByTypeOutput(...args: any[]): any;
    getExtraMenuOptions(canvas: LGraphCanvas, options: any[]): any[] | void;
    getSlotMenuOptions(slot: any): any[] | void;
    addInput(...args: any[]): any;
    addOutput(...args: any[]): any;
    addWidget(...args: any[]): any;
    removeInput(...args: any[]): any;
    removeOutput(...args: any[]): any;
    connect(...args: any[]): any;
    disconnectInput(...args: any[]): any;
    disconnectOutput(...args: any[]): any;
    findInputSlotByType(...args: any[]): any;
    findOutputSlotByType(...args: any[]): any;
    computeSize(...args: any[]): Size;
    setDirtyCanvas(...args: any[]): any;
    setSize(...args: any[]): any;
    clone(...args: any[]): any;
    collapse(...args: any[]): any;
    expand(...args: any[]): any;
    getHelp(...args: any[]): any;
  }
  export class LGraphCanvas {
    static node_colors: Record<string, any>;
    static link_type_colors: Record<string, any>;
    static active_canvas: LGraphCanvas;
    static onGroupAdd: (...args: any[]) => any;
    static onShowPropertyEditor: (...args: any[]) => any;
    [key: string]: any;
    constructor(...args: any[]);
  }
  export class LGraphGroup {
    [key: string]: any;
    constructor(...args: any[]);
  }
  export class LGraph {
    [key: string]: any;
    constructor(...args: any[]);
  }
  export class ContextMenu<TValue = unknown> {
    [key: string]: any;
    constructor(...args: any[]);
  }
  export class ComfyApp {
    [key: string]: any;
    constructor(...args: any[]);
  }

  export const LiteGraph: any;
  export interface LGraphNodeConstructor {
    prototype: LGraphNode;
    type?: any;
    title?: any;
    nodeType: any;
    comfyClass: string;
    [key: string]: any;
    new (...args: any[]): LGraphNode;
  }

// Global aliases for rgthree source files that use these names without importing them.
declare global {
  type ISerialisedNode = import("@comfyorg/frontend").ISerialisedNode;
  type ISerialisedGraph = import("@comfyorg/frontend").ISerialisedGraph;
  type IContextMenuValue<T = any> = import("@comfyorg/frontend").IContextMenuValue<T>;
  type IContextMenuOptions<TValue = any, TExtra = any> = import("@comfyorg/frontend").IContextMenuOptions<TValue, TExtra>;
  type LGraphNodeConstructor = import("@comfyorg/frontend").LGraphNodeConstructor;
  type LGraphNode = import("@comfyorg/frontend").LGraphNode;
  type LGraphCanvas = import("@comfyorg/frontend").LGraphCanvas;
  type LGraph = import("@comfyorg/frontend").LGraph;
  type LGraphGroup = import("@comfyorg/frontend").LGraphGroup;
  type LLink = import("@comfyorg/frontend").LLink;
  type IBaseWidget<TValue = any, TType extends string = string, TOptions extends import("@comfyorg/frontend").IWidgetOptions = import("@comfyorg/frontend").IWidgetOptions> = import("@comfyorg/frontend").IBaseWidget<TValue, TType, TOptions>;
  type IWidgetOptions<TValues = unknown> = import("@comfyorg/frontend").IWidgetOptions<TValues>;
}

}
